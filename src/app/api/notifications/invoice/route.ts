import { NextResponse } from 'next/server';
import { getOrderByIdOrBillingId } from '../../../../lib/db';
import { sendDigitalInvoiceNotification } from '../../../../lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, billingId, channel, recipientPhone } = body;
    const targetId = orderId || billingId;

    if (!targetId) {
      return NextResponse.json(
        { error: 'orderId or billingId is required' },
        { status: 400 }
      );
    }

    const order = getOrderByIdOrBillingId(targetId);
    if (!order) {
      return NextResponse.json(
        { error: `Invoice with ID ${targetId} not found` },
        { status: 404 }
      );
    }

    // Determine request host for public invoice link
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    const result = await sendDigitalInvoiceNotification(order, {
      channel: channel || 'whatsapp',
      recipientPhone: recipientPhone || order.customerPhone,
      appUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch digital bill' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Digital invoice dispatched via ${result.notification.provider}`,
      notification: result.notification,
      previewMessage: result.previewMessage,
      invoiceUrl: result.invoiceUrl,
    });
  } catch (error) {
    console.error('Invoice notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error while dispatching invoice' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('billingId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId or billingId is required' },
        { status: 400 }
      );
    }

    const order = getOrderByIdOrBillingId(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      billingId: order.billingId,
      customerPhone: order.customerPhone,
      notifications: order.notifications || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve notification status' },
      { status: 500 }
    );
  }
}
