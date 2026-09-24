import { NextResponse } from 'next/server';
import { authenticateWithCognito } from '../../../lib/cognito';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithCognito(username, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message || 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authResult.user,
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Auth endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during authentication' },
      { status: 500 }
    );
  }
}
