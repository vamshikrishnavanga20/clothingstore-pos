import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { BranchId } from './types';

const userPoolId = process.env.COGNITO_USER_POOL_ID || '';
const clientId = process.env.COGNITO_CLIENT_ID || '';
const region = process.env.AWS_REGION || 'ap-south-1';

export interface AuthenticatedUser {
  username: string;
  name: string;
  role: 'superadmin' | 'branch_manager' | 'cashier';
  branchId?: BranchId;
  token?: string;
  authProvider: 'aws-cognito' | 'local-cognito-simulation';
}

const isCognitoConfigured = Boolean(userPoolId && clientId);

let cognitoClient: CognitoIdentityProviderClient | null = null;
if (isCognitoConfigured) {
  cognitoClient = new CognitoIdentityProviderClient({ region });
}

export async function authenticateWithCognito(
  username: string,
  password: string
): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> {
  // 1. If AWS Cognito User Pool is configured, authenticate via InitiateAuthCommand
  if (isCognitoConfigured && cognitoClient) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);

      if (response.AuthenticationResult) {
        const idToken = response.AuthenticationResult.IdToken;

        // Determine user group/branch from custom attributes or naming
        let role: 'superadmin' | 'branch_manager' | 'cashier' = 'branch_manager';
        let branchId: BranchId | undefined = undefined;

        if (username.includes('superadmin') || username.includes('main')) {
          role = 'superadmin';
        } else if (username.includes('branch1') || username.includes('b1')) {
          role = 'branch_manager';
          branchId = 'branch-1';
        } else if (username.includes('branch2') || username.includes('b2')) {
          role = 'branch_manager';
          branchId = 'branch-2';
        } else if (username.includes('cashier_b1')) {
          role = 'cashier';
          branchId = 'branch-1';
        } else if (username.includes('cashier_b2')) {
          role = 'cashier';
          branchId = 'branch-2';
        }

        return {
          success: true,
          user: {
            username,
            name: username.toUpperCase(),
            role,
            branchId,
            token: idToken,
            authProvider: 'aws-cognito',
          },
        };
      }
    } catch (error: any) {
      console.warn('Cognito authentication failed, evaluating fallback:', error.message);
      return {
        success: false,
        message: error.message || 'Cognito authentication failed',
      };
    }
  }

  // 2. Verified Local Auth Engine (Reads credentials from .env)
  const cleanUser = username.trim().toLowerCase();

  // Passwords configured via .env
  const superadminPass = process.env.SUPERADMIN_PASSWORD || 'admin123';
  const superadminBackupPass = process.env.SUPERADMIN_BACKUP_PASSWORD || 'admin';
  const branch1Pass = process.env.BRANCH_1_PASSWORD || 'branch123';
  const branch2Pass = process.env.BRANCH_2_PASSWORD || 'branch123';
  const cashier1Pass = process.env.CASHIER_B1_PASSWORD || 'cashier123';
  const cashier2Pass = process.env.CASHIER_B2_PASSWORD || 'cashier123';

  // Superadmin (Main Branch - Full Access to all branches)
  if (
    (cleanUser === (process.env.SUPERADMIN_USERNAME || 'superadmin') && password === superadminPass) ||
    (cleanUser === 'mainadmin' && password === superadminPass) ||
    (cleanUser === (process.env.SUPERADMIN_BACKUP_USERNAME || 'admin') && password === superadminBackupPass)
  ) {
    return {
      success: true,
      user: {
        username: 'superadmin',
        name: 'Chief Executive (Main Branch Superadmin)',
        role: 'superadmin',
        authProvider: 'local-cognito-simulation',
        token: `mock-cognito-jwt-superadmin-${Date.now()}`,
      },
    };
  }

  // Branch 1 Sub-Admin (Downtown Flagship)
  if (
    (cleanUser === (process.env.BRANCH_1_USERNAME || 'branch1') || cleanUser === 'b1admin') &&
    password === branch1Pass
  ) {
    return {
      success: true,
      user: {
        username: 'branch1',
        name: 'Downtown Flagship Manager',
        role: 'branch_manager',
        branchId: 'branch-1',
        authProvider: 'local-cognito-simulation',
        token: `mock-cognito-jwt-b1-${Date.now()}`,
      },
    };
  }

  // Branch 2 Sub-Admin (Uptown Galleria)
  if (
    (cleanUser === (process.env.BRANCH_2_USERNAME || 'branch2') || cleanUser === 'b2admin') &&
    password === branch2Pass
  ) {
    return {
      success: true,
      user: {
        username: 'branch2',
        name: 'Uptown Galleria Manager',
        role: 'branch_manager',
        branchId: 'branch-2',
        authProvider: 'local-cognito-simulation',
        token: `mock-cognito-jwt-b2-${Date.now()}`,
      },
    };
  }

  // Branch 1 Cashier (Downtown POS)
  if (
    (cleanUser === (process.env.CASHIER_B1_USERNAME || 'cashier_b1') || cleanUser === 'cashier1') &&
    (password === cashier1Pass || password === branch1Pass)
  ) {
    return {
      success: true,
      user: {
        username: 'cashier_b1',
        name: 'Downtown Cashier (Desk #1)',
        role: 'cashier',
        branchId: 'branch-1',
        authProvider: 'local-cognito-simulation',
        token: `mock-cognito-jwt-cashier1-${Date.now()}`,
      },
    };
  }

  // Branch 2 Cashier (Uptown POS)
  if (
    (cleanUser === (process.env.CASHIER_B2_USERNAME || 'cashier_b2') || cleanUser === 'cashier2') &&
    (password === cashier2Pass || password === branch2Pass)
  ) {
    return {
      success: true,
      user: {
        username: 'cashier_b2',
        name: 'Uptown Cashier (Desk #2)',
        role: 'cashier',
        branchId: 'branch-2',
        authProvider: 'local-cognito-simulation',
        token: `mock-cognito-jwt-cashier2-${Date.now()}`,
      },
    };
  }

  return {
    success: false,
    message: 'Invalid credentials. Please verify your username and password.',
  };
}
