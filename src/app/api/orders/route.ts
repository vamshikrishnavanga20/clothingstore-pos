import { NextResponse } from 'next/server';
import { getOrders, createOrder, returnOrder, updateOrderInvoice } from '../../../lib/db';
import {
  saveBillingOrderToDynamo,
  getBillingOrderByIdFromDynamo,
  getBillingOrdersByCustomerPhoneFromDynamo,
  updateProductStockInDynamo,
  isDynamoConfigured,
} from '../../../lib/dynamodb';
import { BranchId } from '../../../lib/types';
import { sendDigitalInvoiceNotification } from '../../../lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = (searchParams.get('branchId') as BranchId) || undefined;
  const search = searchParams.get('search')?.trim();

  // If searching by unique billingId in DynamoDB
  if (isDynamoConfigured && search && search.startsWith('BILL-')) {
    const dynamoOrder = await getBillingOrderByIdFromDynamo(search);
    if (dynamoOrder) {
      return NextResponse.json([dynamoOrder]);
    }
  }

  // If searching by customer phone in DynamoDB
  if (isDynamoConfigured && search && /^\d{10}$/.test(search)) {
    const phoneOrders = await getBillingOrdersByCustomerPhoneFromDynamo(search);
    if (phoneOrders && phoneOrders.length > 0) {
      return NextResponse.json(phoneOrders);
    }
  }

  let orders = getOrders(branchId);

  if (search && search !== '') {
    const q = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.billingId.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      branchId,
      items,
      discount,
      pointsRedeemed,
      paymentMethod,
      customerName,
      customerPhone,
      cashierName,
      source,
    } = body;

    if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'branchId and at least one item are required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    const result = createOrder({
      branchId,
      items,
      discount: Number(discount) || 0,
      pointsRedeemed: Number(pointsRedeemed) || 0,
      paymentMethod,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || 'N/A',
      cashierName: cashierName || (source === 'mobile-expo' ? 'Mobile Staff' : 'Cashier Desk'),
      source: source || 'web-pos',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to process order' },
        { status: 400 }
      );
    }

    // Mirror to Amazon DynamoDB if configured
    if (isDynamoConfigured) {
      await saveBillingOrderToDynamo(result.order);
      for (const it of result.order.items) {
        if (it.productId && it.size) {
          await updateProductStockInDynamo(it.productId, result.order.branchId, it.size, -it.quantity).catch(
            (err) => console.warn('Dynamo stock decrement error:', err)
          );
        }
      }
    }

    // Automated instant digital bill dispatch via WhatsApp / SMS
    let notificationResult = null;
    const cleanPhone = (result.order.customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      const host = request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
      try {
        notificationResult = await sendDigitalInvoiceNotification(result.order, {
          channel: 'whatsapp',
          appUrl,
        });
      } catch (notifyErr) {
        console.warn('Background invoice notification error:', notifyErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: result.order,
        notification: notificationResult?.notification || null,
        invoiceUrl: notificationResult?.invoiceUrl || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing bill' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, orderId, billingId, reason, cashierName, updates, returnedItems } = body;
    const targetId = orderId || billingId;

    if (!targetId) {
      return NextResponse.json(
        { error: 'orderId or billingId is required' },
        { status: 400 }
      );
    }

    if (action === 'return') {
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

      // Sync updated order status and restock DynamoDB inventory
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
    }

    if (action === 'edit') {
      if (!updates || typeof updates !== 'object') {
        return NextResponse.json(
          { error: 'updates payload is required for invoice edit' },
          { status: 400 }
        );
      }

      const result = updateOrderInvoice(targetId, updates);

      if (!result.success || !result.order) {
        return NextResponse.json(
          { error: result.message || 'Failed to update invoice' },
          { status: 400 }
        );
      }

      if (isDynamoConfigured) {
        await saveBillingOrderToDynamo(result.order);
      }

      return NextResponse.json({
        success: true,
        order: result.order,
        message: 'Invoice updated and stock difference adjusted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: "return", "edit"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Invoice patch error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating invoice' },
      { status: 500 }
    );
  }
}
