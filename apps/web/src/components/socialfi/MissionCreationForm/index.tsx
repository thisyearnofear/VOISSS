"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { useTokenAccess } from "@voisss/shared/hooks/useTokenAccess";
import { PLATFORM_CONFIG } from "@voisss/shared/config/platform";
import EligibilityCheck from "./EligibilityCheck";
import MissionFormFields, { FormData } from "./MissionFormFields";
import MissionFormActions from "./MissionFormActions";

interface MissionCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const INITIAL_FORM_DATA: FormData = {
  title: "",
  description: "",
  difficulty: "medium",
  targetDuration: 120,
  expirationDays: PLATFORM_CONFIG.missions.defaultExpirationDays,
  locationBased: false,
};

export default function MissionCreationForm({
  onSuccess,
  onCancel,
}: MissionCreationFormProps) {
  const { address, isCreatorEligible, isCheckingEligibility } = useAuth();
  const { tier, isLoading: isLoadingVoisss } = useTokenAccess({ address });
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const queryClient = useQueryClient();

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
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create mission");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setShowAdvanced(false);
      onSuccess?.();
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (formData.targetDuration < PLATFORM_CONFIG.missions.minDuration) {
      newErrors.targetDuration = `Minimum duration is ${PLATFORM_CONFIG.missions.minDuration}s`;
    }
    if (formData.targetDuration > PLATFORM_CONFIG.missions.maxDuration) {
      newErrors.targetDuration = `Maximum duration is ${PLATFORM_CONFIG.missions.maxDuration}s`;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form:", formData);

    if (validateForm()) {
      console.log("Validation passed, creating mission...");
      createMissionMutation.mutate(formData);
    } else {
      console.log("Validation failed");
    }
  };

  const handleFieldChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Show eligibility check if still checking or eligibility not met
  const meetsVoisssRequirement = tier && tier !== "none";
  const isCheckingEligibilityStatus = isCheckingEligibility || isLoadingVoisss;
  // Either token requirement is sufficient (OR, not AND)
  const meetsAnyRequirement = isCreatorEligible || meetsVoisssRequirement;

  if (isCheckingEligibilityStatus || !meetsAnyRequirement) {
    return (
      <div className="voisss-card">
        <EligibilityCheck />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="voisss-card space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Mission</h2>

      <MissionFormFields
        formData={formData}
        errors={errors}
        onChange={handleFieldChange}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />

      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          Please fix the errors above before creating the mission.
        </div>
      )}

      <MissionFormActions
        isLoading={createMissionMutation.isPending}
        isError={createMissionMutation.isError}
        error={
          createMissionMutation.error instanceof Error
            ? createMissionMutation.error.message
            : null
        }
        onCancel={onCancel || (() => {})}
      />
    </form>
  );
}
