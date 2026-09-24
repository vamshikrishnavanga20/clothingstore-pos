import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/db';
import { isDynamoConfigured, seedCatalogToDynamo, DYNAMO_TABLES } from '../../../../lib/dynamodb';

export async function POST(request: Request) {
  try {
    if (!isDynamoConfigured) {
      return NextResponse.json(
        {
          success: false,
          message: 'DynamoDB is not configured in .env (check AWS credentials and table names)',
        },
        { status: 400 }
      );
    }

    const localDb = getDatabase();
    const result = await seedCatalogToDynamo({
      products: localDb.products,
      branches: localDb.branches,
      categories: localDb.categories,
    });

    return NextResponse.json({
      success: true,
      message: 'Catalog seeded successfully into Amazon DynamoDB',
      tables: DYNAMO_TABLES,
      summary: result,
    });
  } catch (error: any) {
    console.error('Seed DynamoDB error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to seed DynamoDB' },
      { status: 500 }
    );
  }
}
