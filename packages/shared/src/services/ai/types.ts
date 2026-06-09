import { z } from "zod";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface InferenceConfig {
  google?: {
    apiKey: string;
    textModel?: string;
    audioModel?: string;
  };
  acpCompute?: {
    apiKey: string;
    agentId?: string;
    baseUrl?: string;
    model?: string;
  };
  venice?: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
  kilocode?: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
  routeway?: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
  fallbackOrder?: Array<keyof InferenceConfig>;
}

export interface InferenceResponse {
  text: string;
  provider: string;
  model: string;
}

export interface StudioInsights {
  title: string;
  summary: string[];
  tags: string[];
  actionItems: string[];
}

export interface HumanityCertificate {
  status: "verified-human" | "review-needed" | "uncertain";
  badge: string;
  confidence: number;
  verdict: string;
  humanSignals: string[];
  aiArtifacts: string[];
  provenanceNotes: string[];
}

export interface StudioAnalysisResult {
  insights: StudioInsights;
  humanityCertificate: HumanityCertificate;
  provider: string;
  model: string;
}

export type AnalysisStepId = "transcription" | "analysis" | "fallback";
export type AnalysisStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface AnalysisStep {
  id: AnalysisStepId;
  label: string;
  status: AnalysisStepStatus;
  provider?: string;
  model?: string;
  message?: string;
}

export interface PipelineAnalysisResult extends StudioAnalysisResult {
  transcript?: string;
  mode: "transcript-pipeline" | "audio-native-fallback";
  steps: AnalysisStep[];
}
