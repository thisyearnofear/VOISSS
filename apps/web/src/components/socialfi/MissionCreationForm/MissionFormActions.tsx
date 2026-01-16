"use client";

import React from "react";

interface MissionFormActionsProps {
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  onCancel: () => void;
}

export default function MissionFormActions({
  isLoading,
  isError,
  error,
  onCancel,
}: MissionFormActionsProps) {
  return (
    <>
      {/* Submit Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Creating..." : "Create Mission"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Error State */}
      {isError && error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </>
  );
}
