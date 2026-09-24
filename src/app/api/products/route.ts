import { NextResponse } from 'next/server';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../lib/db';
import {
  isDynamoConfigured,
  scanProductsFromDynamo,
  getProductByIdFromDynamo,
  saveProductToDynamo,
  deleteProductFromDynamo,
} from '../../../lib/dynamodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const id = searchParams.get('id');

  // 1. If DynamoDB is active, query cloud tables directly
  if (isDynamoConfigured) {
    if (id) {
      const dProd = await getProductByIdFromDynamo(id);
      if (dProd) return NextResponse.json(dProd);
    } else {
      const dProducts = await scanProductsFromDynamo();
      if (dProducts && dProducts.length > 0) {
        let filtered = dProducts;
        if (category && category !== 'All') {
          filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
        }
        if (search && search.trim() !== '') {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
          );
        }
        return NextResponse.json(filtered);
      }
    }
  }

  // 2. Resilient local fallback
  if (id) {
    const prod = getProductById(id);
    if (!prod) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(prod);
  }

  const products = getProducts(category, search);
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      category,
      description,
      costPrice,
      sellingPrice,
      tag,
      image,
      sizes,
      inventory,
      sizePrices,
      hasVariablePricing,
      fabric,
      care,
      hasSizeChart,
      sizeChartMeasurements,
    } = body;

    if (!name || !category || !sellingPrice) {
      return NextResponse.json(
        { error: 'Name, category, and selling price are required' },
        { status: 400 }
      );
    }

    const defaultInventory = {
      'branch-1': { S: 10, M: 10, L: 10, XL: 5, XXL: 2 },
      'branch-2': { S: 10, M: 10, L: 10, XL: 5, XXL: 2 },
    };

    const product = createProduct({
      name,
      sku: sku || `SKU-${Date.now().toString().slice(-5)}`,
      category,
      description: description || '',
      costPrice: Number(costPrice) || Math.round(Number(sellingPrice) * 0.45),
      sellingPrice: Number(sellingPrice),
      tag: tag || '',
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : undefined,
      sizePrices: sizePrices || undefined,
      hasVariablePricing: Boolean(hasVariablePricing),
      fabric: fabric || undefined,
      care: care || undefined,
      hasSizeChart: Boolean(hasSizeChart),
      sizeChartMeasurements: Array.isArray(sizeChartMeasurements) ? sizeChartMeasurements : undefined,
      image:
        image ||
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
      inventory: inventory || defaultInventory,
    });

    if (isDynamoConfigured) {
      await saveProductToDynamo(product).catch((err) =>
        console.warn('DynamoDB saveProduct error on creation:', err)
      );
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const updated = updateProduct(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (isDynamoConfigured) {
      await saveProductToDynamo(updated).catch((err) =>
        console.warn('DynamoDB saveProduct error on update:', err)
      );
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }

  const success = deleteProduct(id);
  if (!success) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (isDynamoConfigured) {
    await deleteProductFromDynamo(id).catch((err) =>
      console.warn('DynamoDB deleteProduct error:', err)
    );
  }

  return NextResponse.json({ success: true });
}
