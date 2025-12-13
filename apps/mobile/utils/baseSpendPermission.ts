// Wrapper for Base Account spend permission functionality
// This wrapper handles the runtime import and provides TypeScript types

// Runtime import - this works at runtime but TypeScript can't resolve it
const spendPermissionModule = require('@base-org/account/spend-permission/browser');

// Export the functions with proper types
export const requestSpendPermission = spendPermissionModule.requestSpendPermission;
export const fetchPermissions = spendPermissionModule.fetchPermissions;
export const getPermissionStatus = spendPermissionModule.getPermissionStatus;
export const getHash = spendPermissionModule.getHash;
export const fetchPermission = spendPermissionModule.fetchPermission;
export const prepareRevokeCallData = spendPermissionModule.prepareRevokeCallData;
export const prepareSpendCallData = spendPermissionModule.prepareSpendCallData;
export const requestRevoke = spendPermissionModule.requestRevoke;

// Type declarations
export interface SpendPermission {
  account: string;
  spender: string;
  token: string;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: string;
  signature?: string;
}

export interface PermissionStatus {
  isActive: boolean;
  isExpired: boolean;
  isRevoked: boolean;
}