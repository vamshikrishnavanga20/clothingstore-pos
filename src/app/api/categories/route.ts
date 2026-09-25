import { NextResponse } from 'next/server';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../lib/db';
import {
  isDynamoConfigured,
  scanCategoriesFromDynamo,
  deleteCategoryFromDynamo,
} from '../../../lib/dynamodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  if (isDynamoConfigured) {
    const dCats = await scanCategoriesFromDynamo();
    if (dCats !== null && dCats.length > 0) {
      return NextResponse.json(dCats, { headers: NO_CACHE_HEADERS });
    }
  }
  const categories = getCategories();
  return NextResponse.json(categories, { headers: NO_CACHE_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, image, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const category = createCategory({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      image:
        image ||
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
      description: description || '',
    });

    return NextResponse.json({ success: true, category }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const updated = updateCategory(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, category: updated }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Category id is required' }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  let deleted = false;
  if (isDynamoConfigured) {
    try {
      const dSuccess = await deleteCategoryFromDynamo(id);
      if (dSuccess) deleted = true;
    } catch (err) {
      console.warn('DynamoDB deleteCategory error:', err);
    }
  }

  try {
    const success = deleteCategory(id);
    if (success) deleted = true;
  } catch (err) {
    console.warn('Local deleteCategory error:', err);
  }

  if (!deleted) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json({ success: true, message: 'Category removed successfully', id }, { headers: NO_CACHE_HEADERS });
}
