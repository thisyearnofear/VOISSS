"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useBaseAccount } from "../hooks/useBaseAccount";

export default function SpendPermissionPanel() {
  const {
    isConnected,
    subAccount,
    status,
    getSpendPermissions,
    hasSpendPermission,
    updateSpendAllowance,
    revokeSpendPermission,
  } = useBaseAccount();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionActive, setPermissionActive] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [allowanceInput, setAllowanceInput] = useState<string>("0.01");
  const [isUpdatingAllowance, setIsUpdatingAllowance] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const subAddress = useMemo(() => subAccount?.address ?? null, [subAccount]);

  const refreshPermissions = async () => {
    if (!getSpendPermissions || !hasSpendPermission) return;
    setLoading(true);
    setError(null);
    try {
      const [active, list] = await Promise.all([
        hasSpendPermission(),
        getSpendPermissions(),
      ]);
      setPermissionActive(active);
      setPermissions(list || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && subAddress) {
      refreshPermissions();
    } else {
      setPermissionActive(false);
      setPermissions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, subAddress]);

  const handleUpdateAllowance = async () => {
    if (!updateSpendAllowance) return;
    setIsUpdatingAllowance(true);
    setError(null);
    try {
      await updateSpendAllowance(allowanceInput);
      await refreshPermissions();
    } catch (err: any) {
      setError(err?.message || "Failed to update allowance");
    } finally {
      setIsUpdatingAllowance(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeSpendPermission) return;
    setIsRevoking(true);
    setError(null);
    try {
      await revokeSpendPermission();
      await refreshPermissions();
    } catch (err: any) {
      setError(err?.message || "Failed to revoke permission");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 mt-8 text-left">
      <h3 className="text-xl font-semibold text-white mb-3">Spend Permissions</h3>
      <p className="text-sm text-gray-400 mb-6">
        Manage auto-spend for your Sub Account on Base. Update allowance or revoke when needed.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-300 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Connection:</span>
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Sub Account:</span>
              <code className="text-blue-400 break-all">{subAddress || "—"}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">SDK Status:</span>
              <span className="text-gray-300">{status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Permission:</span>
              <span className={permissionActive ? "text-green-400" : "text-yellow-400"}>
                {permissionActive ? "Active" : "Not granted"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#333] transition"
              onClick={refreshPermissions}
              disabled={loading || !isConnected}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Allowance (ETH)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.001"
              min="0"
              value={allowanceInput}
              onChange={(e) => setAllowanceInput(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#2A2A2A] rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              placeholder="0.01"
            />
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50"
              onClick={handleUpdateAllowance}
              disabled={!isConnected || isUpdatingAllowance || !subAddress}
            >
              {isUpdatingAllowance ? "Updating..." : "Update"}
            </button>
          </div>

          <div className="mt-4">
            <button
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition disabled:opacity-50"
              onClick={handleRevoke}
              disabled={!isConnected || isRevoking || !permissionActive}
            >
              {isRevoking ? "Revoking..." : "Revoke Permission"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6">
        <details className="bg-[#121212] border border-[#2A2A2A] rounded-lg px-4 py-3">
          <summary className="cursor-pointer text-gray-300">Details</summary>
          <div className="text-xs text-gray-400 mt-2">
            {permissions.length === 0 ? (
              <p>No permissions found.</p>
            ) : (
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(permissions, null, 2)}</pre>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}