import { NextResponse } from 'next/server';
import { returnOrder } from '../../../../lib/db';
import {
  saveBillingOrderToDynamo,
  updateProductStockInDynamo,
  isDynamoConfigured,
} from '../../../../lib/dynamodb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, billingId, reason, cashierName, returnedItems } = body;
    const targetId = orderId || billingId;

    if (!targetId) {
      return NextResponse.json(
        { error: 'orderId or billingId is required' },
        { status: 400 }
      );
    }

    const result = returnOrder(targetId, {
      reason: reason || 'Customer Return',
      cashierName,
      returnedItems,
    });

    if (!result.success || !result.order) {
      return NextResponse.json(
        { error: result.message || 'Failed to process return' },
        { status: 400 }
      );
    }

    if (isDynamoConfigured) {
      await saveBillingOrderToDynamo(result.order);
      const itemsToRestock =
        returnedItems && returnedItems.length > 0 ? returnedItems : result.order.items;
      for (const it of itemsToRestock) {
        if (it.productId && it.size) {
          await updateProductStockInDynamo(it.productId, result.order.branchId, it.size, it.quantity).catch(
            (err) => console.warn('Dynamo stock restock error:', err)
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      restockedSummary: result.restockedSummary,
      message: 'Order refunded and inventory matrix restocked successfully',
    });
  } catch (error) {
    console.error('Order return API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing return' },
      { status: 500 }
    );
  }
}
