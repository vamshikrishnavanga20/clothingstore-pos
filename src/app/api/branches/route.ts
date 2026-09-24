import { NextResponse } from 'next/server';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const branch = getBranchById(id);
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    return NextResponse.json(branch);
  }

  const branches = getBranches();
  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, city, location, phone, managerName } = body;

    if (!name || !location || !phone) {
      return NextResponse.json(
        { error: 'Branch name, location, and phone are required' },
        { status: 400 }
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

    return NextResponse.json({ success: true, branch }, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const updated = updateBranch(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, branch: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Branch id is required' },
      { status: 400 }
    );
  }

  const success = deleteBranch(id);
  if (!success) {
    return NextResponse.json(
      { error: 'Cannot delete branch. Store must maintain at least one branch.' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
