import { NextResponse } from 'next/server';
import { getCustomerByPhone, getAllCustomers, getOrCreateCustomer } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    const customer = getCustomerByPhone(cleanPhone);
    if (!customer) {
      return NextResponse.json({
        success: true,
        customer: null,
        message: 'New customer (Will be enrolled as Silver VIP upon checkout)',
      });
    }

    return NextResponse.json({
      success: true,
      customer,
      message: `${customer.name} found (${customer.tier} Tier)`,
    });
  }

  const allCustomers = getAllCustomers();
  return NextResponse.json({
    success: true,
    customers: allCustomers,
    total: allCustomers.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name } = body;

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    const customer = getOrCreateCustomer(cleanPhone, name);
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error('Customer registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing customer' },
      { status: 500 }
    );
  }
}
