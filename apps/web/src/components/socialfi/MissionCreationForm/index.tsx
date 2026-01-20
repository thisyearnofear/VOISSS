"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { getTokenAccessService } from "@voisss/shared/services/token";
import { ApiResponse, isSuccessResponse, isErrorResponse } from "@voisss/shared/types/api.types";
import { PLATFORM_CONFIG } from "@voisss/shared/config/platform";
import EligibilityCheck from "./EligibilityCheck";
import MissionFormFields, { FormData } from "./MissionFormFields";
import MissionFormActions from "./MissionFormActions";

interface MissionCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// CLEAN: Constants and configuration
const INITIAL_FORM_DATA: FormData = {
  title: "",
  description: "",
  difficulty: "medium",
  targetDuration: 120,
  expirationDays: 14,
  locationBased: false,
};

const AUTO_SAVE_KEY = "voisss_mission_draft";
const VALIDATION_DEBOUNCE_MS = 500;
const AUTO_SAVE_DEBOUNCE_MS = 1000;

// PERFORMANT: Custom hook for debounced validation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// PERFORMANT: Custom hook for auto-save functionality
function useAutoSave(formData: FormData, isValid: boolean) {
  const debouncedFormData = useDebounce(formData, AUTO_SAVE_DEBOUNCE_MS);

  useEffect(() => {
    // Only auto-save if form has meaningful content
    if (debouncedFormData.title.trim() || debouncedFormData.description.trim()) {
      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
          ...debouncedFormData,
          savedAt: new Date().toISOString(),
        }));
      } catch (error) {
        console.warn("Failed to auto-save form data:", error);
      }
    }
  }, [debouncedFormData]);

  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Return saved data if it's recent (within 24 hours)
        const savedAt = new Date(parsedData.savedAt);
        const isRecent = Date.now() - savedAt.getTime() < 24 * 60 * 60 * 1000;
        if (isRecent) {
          return parsedData;
        }
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
    }
    return null;
  }, []);
}

// ENHANCEMENT FIRST: Enhanced MissionCreationForm with auto-save and debounced validation
export default function MissionCreationForm({
  onSuccess,
  onCancel,
}: MissionCreationFormProps) {
  const { address } = useAuth();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [eligibilityStatus, setEligibilityStatus] = useState<{
    loading: boolean;
    eligible: boolean;
    error?: string;
  }>({ loading: true, eligible: false });
  const [hasSavedData, setHasSavedData] = useState(false);

  const queryClient = useQueryClient();
  const tokenAccessService = getTokenAccessService();

  // PERFORMANT: Debounced form data for validation
  const debouncedFormData = useDebounce(formData, VALIDATION_DEBOUNCE_MS);

  // CLEAN: Memoized validation function
  const validateForm = useCallback((data: FormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!data.title.trim()) {
      newErrors.title = "Title is required";
    } else if (data.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!data.description.trim()) {
      newErrors.description = "Description is required";
    } else if (data.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    } else if (data.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (data.targetDuration < 30) {
      newErrors.targetDuration = "Minimum duration is 30 seconds";
    } else if (data.targetDuration > 600) {
      newErrors.targetDuration = "Maximum duration is 600 seconds";
    }

    if (data.expirationDays < 1) {
      newErrors.expirationDays = "Minimum expiration is 1 day";
    } else if (data.expirationDays > 90) {
      newErrors.expirationDays = "Maximum expiration is 90 days";
    }

    return newErrors;
  }, []);

  // PERFORMANT: Debounced validation effect
  useEffect(() => {
    const newErrors = validateForm(debouncedFormData);
    setErrors(newErrors);
  }, [debouncedFormData, validateForm]);

  // CLEAN: Check eligibility on component mount and address change
  useEffect(() => {
    if (!address) {
      setEligibilityStatus({ loading: false, eligible: false, error: "Wallet not connected" });
      return;
    }

    const checkEligibility = async () => {
      try {
        setEligibilityStatus({ loading: true, eligible: false });
        const result = await tokenAccessService.validateCreatorEligibility(address);
        setEligibilityStatus({
          loading: false,
          eligible: result.eligible,
          error: result.eligible ? undefined : result.reason,
        });
      } catch (error) {
        setEligibilityStatus({
          loading: false,
          eligible: false,
          error: "Failed to check eligibility",
        });
      }
    };

    checkEligibility();
  }, [address, tokenAccessService]);

  // ENHANCEMENT FIRST: Load saved form data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        const savedAt = new Date(parsedData.savedAt);
        const isRecent = Date.now() - savedAt.getTime() < 24 * 60 * 60 * 1000;

        if (isRecent) {
          const { savedAt: _, ...savedFormData } = parsedData;
          setFormData(savedFormData);
          setHasSavedData(true);
        }
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
    }
  }, []);

  // PERFORMANT: Auto-save effect
  useEffect(() => {
    if (formData.title.trim() || formData.description.trim()) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
            ...formData,
            savedAt: new Date().toISOString(),
          }));
        } catch (error) {
          console.warn("Failed to auto-save form data:", error);
        }
      }, AUTO_SAVE_DEBOUNCE_MS);

      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  // CLEAN: Enhanced mutation with unified API response handling
  const createMissionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const response = await fetch("/api/missions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`,
        },
        body: JSON.stringify({
          ...data,
          createdBy: address,
        }),
      });

      if (!response.ok) {
        const apiResponse: ApiResponse = await response.json();
        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse: ApiResponse<{ mission: any }> = await response.json();

      if (isErrorResponse(apiResponse)) {
        throw new Error(apiResponse.error.message);
      }

      if (!isSuccessResponse(apiResponse)) {
        throw new Error("Invalid API response format");
      }

      return apiResponse.data;
    },
    onSuccess: (data) => {
      // Clear auto-saved data on successful submission
      try {
        localStorage.removeItem(AUTO_SAVE_KEY);
      } catch (error) {
        console.warn("Failed to clear auto-saved data:", error);
      }

      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setShowAdvanced(false);
      setHasSavedData(false);
      onSuccess?.();
    },
  });

  // CLEAN: Memoized form validity check
  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0 &&
      formData.title.trim() &&
      formData.description.trim();
  }, [errors, formData.title, formData.description]);

  // PERFORMANT: Optimized field change handler
  const handleFieldChange = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error immediately for better UX
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // CLEAN: Form submission handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (isFormValid) {
      createMissionMutation.mutate(formData);
    }
  }, [isFormValid, formData, createMissionMutation]);

  // CLEAN: Clear saved data handler
  const handleClearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
      setHasSavedData(false);
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      console.warn("Failed to clear saved data:", error);
    }
  }, []);

  // Show eligibility check if still checking or eligibility not met
  if (eligibilityStatus.loading || !eligibilityStatus.eligible) {
    return (
      <div className="voisss-card">
        <EligibilityCheck />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="voisss-card space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Create New Mission</h2>

        {/* ENHANCEMENT FIRST: Auto-save indicator */}
        {hasSavedData && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Draft restored
            <button
              type="button"
              onClick={handleClearSavedData}
              className="text-gray-400 hover:text-white text-xs underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <MissionFormFields
        formData={formData}
        errors={errors}
        onChange={handleFieldChange}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />

      {/* CLEAN: Enhanced error display */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm space-y-1">
          <div className="font-medium">Please fix the following errors:</div>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="text-xs">
                <span className="capitalize">{field}</span>: {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ENHANCEMENT FIRST: Form progress indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="flex-1 bg-gray-700 rounded-full h-1">
          <div
            className="bg-[#7C5DFA] h-1 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (
                (formData.title.trim() ? 25 : 0) +
                (formData.description.trim() ? 25 : 0) +
                (formData.targetDuration > 0 ? 25 : 0) +
                (isFormValid ? 25 : 0)
              ))}%`
            }}
          />
        </div>
        <span>
          {isFormValid ? "Ready to create" : "Fill required fields"}
        </span>
      </div>

      <MissionFormActions
        isLoading={createMissionMutation.isPending}
        isError={createMissionMutation.isError}
        isValid={isFormValid}
        error={
          createMissionMutation.error instanceof Error
            ? createMissionMutation.error.message
            : null
        }
        onCancel={onCancel || (() => { })}
      />
    </form>
  );
}