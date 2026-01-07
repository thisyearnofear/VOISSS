"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
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
  topic: "crypto",
  difficulty: "medium",
  targetDuration: 120,
  maxParticipants: 50,
  examples: ["", "", ""],
  contextSuggestions: [""],
  tags: [""],
  locationBased: false,
  expirationDays: PLATFORM_CONFIG.missions.defaultExpirationDays,
};

export default function MissionCreationForm({
  onSuccess,
  onCancel,
}: MissionCreationFormProps) {
  const { address } = useAuth();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        body: JSON.stringify({
          ...data,
          examples: data.examples.filter(e => e.trim()),
          contextSuggestions: data.contextSuggestions.filter(e => e.trim()),
          tags: data.tags.filter(e => e.trim()),
        }),
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
      onSuccess?.();
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (formData.targetDuration < PLATFORM_CONFIG.missions.minDuration) {
      newErrors.targetDuration = `Minimum duration is ${PLATFORM_CONFIG.missions.minDuration}s`;
    }
    if (formData.targetDuration > PLATFORM_CONFIG.missions.maxDuration) {
      newErrors.targetDuration = `Maximum duration is ${PLATFORM_CONFIG.missions.maxDuration}s`;
    }
    if (formData.maxParticipants < 1) newErrors.maxParticipants = "At least 1 participant required";

    const validExamples = formData.examples.filter(e => e.trim());
    if (validExamples.length === 0) newErrors.examples = "At least one example question required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createMissionMutation.mutate(formData);
    }
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayFieldChange = (
    field: "examples" | "contextSuggestions" | "tags",
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayField = (field: "examples" | "contextSuggestions" | "tags") => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayField = (field: "examples" | "contextSuggestions" | "tags", index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Check eligibility first
  const eligibilityStatus = <EligibilityCheck />;
  if (eligibilityStatus?.props === null || !address) {
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
        onArrayChange={handleArrayFieldChange}
        onArrayAdd={addArrayField}
        onArrayRemove={removeArrayField}
      />

      <MissionFormActions
        isLoading={createMissionMutation.isPending}
        isError={createMissionMutation.isError}
        error={
          createMissionMutation.error instanceof Error
            ? createMissionMutation.error.message
            : null
        }
        onSubmit={handleSubmit}
        onCancel={onCancel || (() => {})}
      />
    </form>
  );
}
