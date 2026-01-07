"use client";

import React from "react";

export interface FormData {
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  targetDuration: number;
  maxParticipants: number;
  examples: string[];
  contextSuggestions: string[];
  tags: string[];
  locationBased: boolean;
  expirationDays: number;
}

interface MissionFormFieldsProps {
  formData: FormData;
  errors: Record<string, string>;
  onChange: (field: keyof FormData, value: any) => void;
  onArrayChange: (
    field: "examples" | "contextSuggestions" | "tags",
    index: number,
    value: string
  ) => void;
  onArrayAdd: (field: "examples" | "contextSuggestions" | "tags") => void;
  onArrayRemove: (field: "examples" | "contextSuggestions" | "tags", index: number) => void;
}

export default function MissionFormFields({
  formData,
  errors,
  onChange,
  onArrayChange,
  onArrayAdd,
  onArrayRemove,
}: MissionFormFieldsProps) {
  return (
    <>
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            placeholder="e.g., Web3 Street Wisdom"
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Topic</label>
          <select
            value={formData.topic}
            onChange={(e) => onChange("topic", e.target.value)}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
          >
            <option value="crypto">💰 Crypto & Web3</option>
            <option value="work">💼 Work & Career</option>
            <option value="relationships">💑 Relationships</option>
            <option value="technology">🤖 Technology</option>
            <option value="social">👥 Social Issues</option>
            <option value="local">🏘️ Local Insights</option>
            <option value="politics">🏛️ Politics</option>
            <option value="culture">🎭 Culture</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={4}
          className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
          placeholder="Describe the mission and what you're looking for..."
        />
        {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Mission Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => onChange("difficulty", e.target.value)}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Target Duration (seconds)</label>
          <input
            type="number"
            value={formData.targetDuration}
            onChange={(e) => onChange("targetDuration", parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
          />
          {errors.targetDuration && (
            <p className="text-red-400 text-sm mt-1">{errors.targetDuration}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Max Participants</label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => onChange("maxParticipants", parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
          />
          {errors.maxParticipants && (
            <p className="text-red-400 text-sm mt-1">{errors.maxParticipants}</p>
          )}
        </div>
      </div>

      {/* Location & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="locationBased"
            checked={formData.locationBased}
            onChange={(e) => onChange("locationBased", e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="locationBased" className="text-sm font-medium text-white">
            Location-based mission
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Expiration (days)</label>
          <input
            type="number"
            value={formData.expirationDays}
            onChange={(e) => onChange("expirationDays", parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
          />
        </div>
      </div>

      {/* ArrayFields Component */}
      <ArrayField
        label="Example Questions"
        items={formData.examples}
        error={errors.examples}
        onChange={(index, value) => onArrayChange("examples", index, value)}
        onAdd={() => onArrayAdd("examples")}
        onRemove={(index) => onArrayRemove("examples", index)}
        placeholder="Example question..."
      />

      <ArrayField
        label="Context Suggestions"
        items={formData.contextSuggestions}
        onChange={(index, value) => onArrayChange("contextSuggestions", index, value)}
        onAdd={() => onArrayAdd("contextSuggestions")}
        onRemove={(index) => onArrayRemove("contextSuggestions", index)}
        placeholder="e.g., taxi, coffee shop, street"
      />

      <ArrayField
        label="Tags"
        items={formData.tags}
        onChange={(index, value) => onArrayChange("tags", index, value)}
        onAdd={() => onArrayAdd("tags")}
        onRemove={(index) => onArrayRemove("tags", index)}
        placeholder="e.g., web3, interview"
      />
    </>
  );
}

// Reusable array field component
function ArrayField({
  label,
  items,
  error,
  onChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  items: string[];
  error?: string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onChange(index, e.target.value)}
              className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 text-sm text-[#7C5DFA] hover:text-[#9C88FF]"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}
