import { NextResponse } from 'next/server';
import { getOrderByIdOrBillingId } from '../../../../lib/db';
import { getBillingOrderByIdFromDynamo, isDynamoConfigured } from '../../../../lib/dynamodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // 1. Check DynamoDB first if configured
    if (isDynamoConfigured) {
      const dynamoOrder = await getBillingOrderByIdFromDynamo(id);
      if (dynamoOrder) {
        return NextResponse.json({ success: true, order: dynamoOrder });
      }
    }

    // 2. Query in-memory/JSON DB
    const order = getOrderByIdOrBillingId(id);
    if (!order) {
      return NextResponse.json({ error: `Invoice '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve invoice' }, { status: 500 });
  }
}
