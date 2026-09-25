import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Order, Product, Branch, Category, BranchId } from './types';

// Environment variables
const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

export const DYNAMO_TABLES = {
  BILLING_ORDERS: process.env.DYNAMODB_BILLING_ORDERS_TABLE || 'RomanIsland-BillingOrders',
  PRODUCTS: process.env.DYNAMODB_PRODUCTS_TABLE || 'RomanIsland-Products',
  BRANCHES: process.env.DYNAMODB_BRANCHES_TABLE || 'RomanIsland-Branches',
  CATEGORIES: process.env.DYNAMODB_CATEGORIES_TABLE || 'RomanIsland-Categories',
};

export const isDynamoConfigured = Boolean(
  accessKeyId && secretAccessKey && process.env.DYNAMODB_BILLING_ORDERS_TABLE
);

let docClient: DynamoDBDocumentClient | null = null;

if (isDynamoConfigured) {
  try {
    const rawClient = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize DynamoDB DocumentClient:', err);
  }
}

// -----------------------------------------------------------------------------
// 1. BILLING DETAILS & ORDER OPERATIONS
// -----------------------------------------------------------------------------

/**
 * Save an order/bill to DynamoDB
 * Table: RomanIsland-BillingOrders
 * Partition Key: branchId
 * Sort Key: createdAt
 * GSI 1: BillingIdIndex (PK: billingId)
 * GSI 2: CustomerPhoneIndex (PK: customerPhone, SK: createdAt)
 */
export async function saveBillingOrderToDynamo(order: Order): Promise<boolean> {
  if (!isDynamoConfigured || !docClient) return false;

  try {
    const command = new PutCommand({
      TableName: DYNAMO_TABLES.BILLING_ORDERS,
      Item: order,
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB saveBillingOrder error (falling back to local):', error);
    return false;
  }
}

/**
 * Retrieve bills for a specific branch sorted newest first
 */
export async function getBillingOrdersByBranchFromDynamo(
  branchId: BranchId,
  limit: number = 100
): Promise<Order[] | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new QueryCommand({
      TableName: DYNAMO_TABLES.BILLING_ORDERS,
      KeyConditionExpression: 'branchId = :bId',
      ExpressionAttributeValues: {
        ':bId': branchId,
      },
      ScanIndexForward: false, // Descending by createdAt
      Limit: limit,
    });
    const res = await docClient.send(command);
    return (res.Items as Order[]) || [];
  } catch (error) {
    console.warn('DynamoDB getBillingOrdersByBranch error:', error);
    return null;
  }
}

/**
 * Look up a bill by its unique sequence billingId (e.g. BILL-B1-2026-0042)
 * Uses Global Secondary Index: BillingIdIndex
 */
export async function getBillingOrderByIdFromDynamo(
  billingId: string
): Promise<Order | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new QueryCommand({
      TableName: DYNAMO_TABLES.BILLING_ORDERS,
      IndexName: 'BillingIdIndex',
      KeyConditionExpression: 'billingId = :bId',
      ExpressionAttributeValues: {
        ':bId': billingId,
      },
      Limit: 1,
    });
    const res = await docClient.send(command);
    if (res.Items && res.Items.length > 0) {
      return res.Items[0] as Order;
    }
    return null;
  } catch (error) {
    console.warn('DynamoDB getBillingOrderById error:', error);
    return null;
  }
}

/**
 * Look up bills for a specific customer phone number
 * Uses Global Secondary Index: CustomerPhoneIndex
 */
export async function getBillingOrdersByCustomerPhoneFromDynamo(
  customerPhone: string
): Promise<Order[] | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new QueryCommand({
      TableName: DYNAMO_TABLES.BILLING_ORDERS,
      IndexName: 'CustomerPhoneIndex',
      KeyConditionExpression: 'customerPhone = :cPhone',
      ExpressionAttributeValues: {
        ':cPhone': customerPhone,
      },
      ScanIndexForward: false,
    });
    const res = await docClient.send(command);
    return (res.Items as Order[]) || [];
  } catch (error) {
    console.warn('DynamoDB getBillingOrdersByCustomerPhone error:', error);
    return null;
  }
}

/**
 * Scan all billing orders across all branches for consolidated reporting
 */
export async function scanAllBillingOrdersFromDynamo(): Promise<Order[] | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new ScanCommand({
      TableName: DYNAMO_TABLES.BILLING_ORDERS,
    });
    const res = await docClient.send(command);
    return (res.Items as Order[]) || [];
  } catch (error) {
    console.warn('DynamoDB scanAllBillingOrders error:', error);
    return null;
  }
}

// -----------------------------------------------------------------------------
// 2. PRODUCT CATALOG OPERATIONS
// -----------------------------------------------------------------------------

export async function saveProductToDynamo(product: Product): Promise<boolean> {
  if (!isDynamoConfigured || !docClient) return false;

  try {
    const command = new PutCommand({
      TableName: DYNAMO_TABLES.PRODUCTS,
      Item: product,
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB saveProduct error:', error);
    return false;
  }
}

export async function getProductByIdFromDynamo(id: string): Promise<Product | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new GetCommand({
      TableName: DYNAMO_TABLES.PRODUCTS,
      Key: { id },
    });
    const res = await docClient.send(command);
    return (res.Item as Product) || null;
  } catch (error) {
    console.warn('DynamoDB getProductById error:', error);
    return null;
  }
}

export async function scanProductsFromDynamo(): Promise<Product[] | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new ScanCommand({
      TableName: DYNAMO_TABLES.PRODUCTS,
    });
    const res = await docClient.send(command);
    return (res.Items as Product[]) || [];
  } catch (error) {
    console.warn('DynamoDB scanProducts error:', error);
    return null;
  }
}

export async function deleteProductFromDynamo(id: string): Promise<boolean> {
  if (!isDynamoConfigured || !docClient) return false;

  try {
    const command = new DeleteCommand({
      TableName: DYNAMO_TABLES.PRODUCTS,
      Key: { id },
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB deleteProduct error:', error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 3. BRANCH & CATEGORY OPERATIONS
// -----------------------------------------------------------------------------

export async function scanBranchesFromDynamo(): Promise<Branch[] | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new ScanCommand({
      TableName: DYNAMO_TABLES.BRANCHES,
    });
    const res = await docClient.send(command);
    return (res.Items as Branch[]) || [];
  } catch (error) {
    console.warn('DynamoDB scanBranches error:', error);
    return null;
  }
}

export async function scanCategoriesFromDynamo(): Promise<Category[] | null> {
  if (!isDynamoConfigured || !docClient) return null;

  try {
    const command = new ScanCommand({
      TableName: DYNAMO_TABLES.CATEGORIES,
    });
    const res = await docClient.send(command);
    return (res.Items as Category[]) || [];
  } catch (error) {
    console.warn('DynamoDB scanCategories error:', error);
    return null;
  }
}

export async function deleteCategoryFromDynamo(id: string): Promise<boolean> {
  if (!isDynamoConfigured || !docClient) return false;

  try {
    const command = new DeleteCommand({
      TableName: DYNAMO_TABLES.CATEGORIES,
      Key: { id },
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB deleteCategory error:', error);
    return false;
  }
}

export async function deleteBranchFromDynamo(id: string): Promise<boolean> {
  if (!isDynamoConfigured || !docClient) return false;

  try {
    const command = new DeleteCommand({
      TableName: DYNAMO_TABLES.BRANCHES,
      Key: { id },
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB deleteBranch error:', error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 4. INVENTORY STOCK ADJUSTMENTS & CATALOG SEEDING
// -----------------------------------------------------------------------------

export async function updateProductStockInDynamo(
  productId: string,
  branchId: string,
  size: string,
  quantityDelta: number
): Promise<boolean> {
  if (!isDynamoConfigured || !docClient) return false;

  try {
    const prod = await getProductByIdFromDynamo(productId);
    if (!prod) return false;

    const inv = prod.inventory || {};
    const bInv = (inv as any)[branchId] || {};
    const curStock = Number(bInv[size]) || 0;
    const newStock = Math.max(0, curStock + quantityDelta);
    bInv[size] = newStock;
    (inv as any)[branchId] = bInv;

    await docClient.send(
      new UpdateCommand({
        TableName: DYNAMO_TABLES.PRODUCTS,
        Key: { id: productId },
        UpdateExpression: 'SET inventory = :inv, updatedAt = :u',
        ExpressionAttributeValues: {
          ':inv': inv,
          ':u': new Date().toISOString(),
        },
      })
    );
    return true;
  } catch (error) {
    console.warn('DynamoDB updateProductStockInDynamo error:', error);
    return false;
  }
}

export async function seedCatalogToDynamo(initialData: {
  products: Product[];
  branches: Branch[];
  categories: Category[];
}): Promise<{ productsSeeded: number; branchesSeeded: number; categoriesSeeded: number }> {
  if (!isDynamoConfigured || !docClient) {
    return { productsSeeded: 0, branchesSeeded: 0, categoriesSeeded: 0 };
  }

  let pCount = 0;
  for (const p of initialData.products) {
    const saved = await saveProductToDynamo(p);
    if (saved) pCount++;
  }

  let bCount = 0;
  for (const b of initialData.branches) {
    try {
      await docClient.send(new PutCommand({ TableName: DYNAMO_TABLES.BRANCHES, Item: b }));
      bCount++;
    } catch {}
  }

  let cCount = 0;
  for (const c of initialData.categories) {
    try {
      await docClient.send(new PutCommand({ TableName: DYNAMO_TABLES.CATEGORIES, Item: c }));
      cCount++;
    } catch {}
  }

  return { productsSeeded: pCount, branchesSeeded: bCount, categoriesSeeded: cCount };
}
