import { NextResponse } from 'next/server';
import { updateInventoryStock, getProducts } from '../../../lib/db';
import { BranchId } from '../../../lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const products = getProducts();
  const inventoryList = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    image: p.image,
    inventory: p.inventory,
  }));
  return NextResponse.json(inventoryList, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { productId, branchId, size, quantity } = body;

    if (!productId || !branchId || !size || quantity === undefined) {
      return NextResponse.json(
        { error: 'productId, branchId, size, and quantity are required' },
        { status: 400 }
      );
    }

    const cleanSize = String(size).trim();
    if (!cleanSize) {
      return NextResponse.json({ error: 'Valid size is required' }, { status: 400 });
    }

    const success = updateInventoryStock(
      productId,
      branchId as BranchId,
      cleanSize,
      Number(quantity)
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Product not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
