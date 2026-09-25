import { NextResponse } from 'next/server';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../../../lib/db';
import {
  isDynamoConfigured,
  scanBranchesFromDynamo,
  deleteBranchFromDynamo,
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
  const id = searchParams.get('id');

  if (id) {
    const branch = getBranchById(id);
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json(branch, { headers: NO_CACHE_HEADERS });
  }

  if (isDynamoConfigured) {
    const dBranches = await scanBranchesFromDynamo();
    if (dBranches !== null && dBranches.length > 0) {
      return NextResponse.json(dBranches, { headers: NO_CACHE_HEADERS });
    }
  }

  const branches = getBranches();
  return NextResponse.json(branches, { headers: NO_CACHE_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, city, location, phone, managerName } = body;

    if (!name || !location || !phone) {
      return NextResponse.json(
        { error: 'Branch name, location, and phone are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const branch = createBranch({
      name,
      code,
      city,
      location,
      phone,
      managerName,
    });

    return NextResponse.json({ success: true, branch }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Branch id is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const updated = updateBranch(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, branch: updated }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Branch id is required' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  if (isDynamoConfigured) {
    try {
      await deleteBranchFromDynamo(id);
    } catch (err) {
      console.warn('DynamoDB deleteBranch error:', err);
    }
  }

  const success = deleteBranch(id);
  if (!success) {
    return NextResponse.json(
      { error: 'Cannot delete branch. Store must maintain at least one branch.' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json({ success: true, message: 'Branch removed successfully', id }, { headers: NO_CACHE_HEADERS });
}
