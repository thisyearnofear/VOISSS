"use client";

import React from "react";

interface MissionFormActionsProps {
  isLoading: boolean;
  isError: boolean;
  isValid: boolean; // ENHANCEMENT FIRST: Added validation state
  error: string | null;
  onCancel: () => void;
}

export default function MissionFormActions({
  isLoading,
  isError,
  isValid,
  error,
  onCancel,
}: MissionFormActionsProps) {
  return (
    <>
      {/* ENHANCEMENT FIRST: Enhanced Submit Actions with validation state */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={`flex-1 py-3 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${isValid && !isLoading
              ? "bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white hover:from-[#6B4CE6] hover:to-[#8B7AFF] hover:scale-[1.02]"
              : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
            }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Mission
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* CLEAN: Enhanced validation feedback */}
      {!isValid && !isLoading && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Complete all required fields to create your mission
        </div>
      )}

      {/* CLEAN: Error State */}
      {isError && error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </>
  );
}
