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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const id = searchParams.get('id');

  // 1. If DynamoDB is active, query cloud tables directly
  if (isDynamoConfigured) {
    if (id) {
      const dProd = await getProductByIdFromDynamo(id);
      if (dProd) return NextResponse.json(dProd, { headers: NO_CACHE_HEADERS });
    } else {
      const dProducts = await scanProductsFromDynamo();
      if (dProducts !== null) {
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
        return NextResponse.json(filtered, { headers: NO_CACHE_HEADERS });
      }
    }
  }

  // 2. Resilient local fallback
  if (id) {
    const prod = getProductById(id);
    if (!prod) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json(prod, { headers: NO_CACHE_HEADERS });
  }

  const products = getProducts(category, search);
  return NextResponse.json(products, { headers: NO_CACHE_HEADERS });
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
        { status: 400, headers: NO_CACHE_HEADERS }
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

    return NextResponse.json({ success: true, product }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    let updatedProduct: any = null;

    // 1. Try updating local in-memory/file DB
    const localUpdated = updateProduct(id, updates);
    if (localUpdated) {
      updatedProduct = localUpdated;
    }

    // 2. Try updating DynamoDB
    if (isDynamoConfigured) {
      let toSave = updatedProduct;
      if (!toSave) {
        const existing = await getProductByIdFromDynamo(id);
        if (existing) {
          toSave = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        } else {
          toSave = { id, ...updates, updatedAt: new Date().toISOString() };
        }
      }
      if (toSave) {
        await saveProductToDynamo(toSave).catch((err) =>
          console.warn('DynamoDB saveProduct error on update:', err)
        );
        updatedProduct = toSave;
      }
    }

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, product: updatedProduct }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  let deleted = false;

  // 1. Delete from DynamoDB cloud table if configured
  if (isDynamoConfigured) {
    try {
      const dSuccess = await deleteProductFromDynamo(id);
      if (dSuccess) deleted = true;
    } catch (err) {
      console.warn('DynamoDB deleteProduct error:', err);
    }
  }

  // 2. Delete from local / /tmp store
  try {
    const localSuccess = deleteProduct(id);
    if (localSuccess) deleted = true;
  } catch (err) {
    console.warn('Local deleteProduct error:', err);
  }

  if (!deleted) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json(
    { success: true, message: 'Product removed successfully', id },
    { headers: NO_CACHE_HEADERS }
  );
}
