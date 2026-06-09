/**
 * ACP Event Listener Service - Proactive Agent Discovery
 *
 * Enables VOISSS to autonomously discover and respond to voice-related job
 * opportunities on the Virtuals Protocol marketplace.
 */

import { spawn, execFile, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { getAgentReputationService } from './agent-reputation';

const execFileAsync = promisify(execFile);

export interface AcpJob {
  id: string;
  title: string;
  description: string;
  offeringId: string;
  offeringName: string;
  clientAgentId: string;
  providerAgentId?: string;
  clientAgentName?: string;
  budget?: {
    type: 'fixed' | 'range';
    value: number;
    currency: string;
  };
  requirements: Record<string, any>;
  slaMinutes: number;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'disputed';
  createdAt: string;
  updatedAt: string;
}

export interface AcpEvent {
  type: 'job.created' | 'job.updated' | 'job.assigned' | 'job.completed';
  timestamp: string;
  job: AcpJob;
}

export interface JobMatch {
  job: AcpJob;
  score: number;
  matchedKeywords: string[];
  recommendedVoiceId?: string;
  estimatedCost: number;
  profitMargin: number;
}

export interface AcpListenerConfig {
  agentId: string;
  offeringIds: string[];
  autoBid: boolean;
  minBudget: number;
  maxResponseTimeMs: number;
  keywords: string[];
  webhookUrl?: string;
  offeringRoutes?: Record<string, string>;
}

const DEFAULT_KEYWORDS = [
  'voice', 'voiceover', 'narration', 'audio', 'speech', 'tts', 'text-to-speech',
  'dubbing', 'podcast', 'audiobook', 'commercial', 'script reading', 'voice acting',
  'announcement', 'greeting', 'explainer',
];

// Actual Marketplace Offering IDs
const OFFERING_IDS = {
  VOCALIZE: '019e98e8-f262-7aa9-938b-73664bae4fcd',
  INSIGHT: '019e9bb1-5f8c-76c9-8f92-685af00b8c22',
  CLONE: '019e9bb1-9e4d-7fb1-bb47-adb879d978c0',
};

export class AcpListenerService {
  private config: AcpListenerConfig;
  private listenerProcess: ChildProcess | null = null;
  private isRunning = false;
  private jobCache = new Map<string, AcpJob>();
  private processedJobs = new Set<string>();

  constructor(config: AcpListenerConfig) {
    this.config = {
      autoBid: false,
      minBudget: 0.01,
      maxResponseTimeMs: 30000,
      keywords: DEFAULT_KEYWORDS,
      offeringRoutes: {},
      ...config,
    };
  }

  private getKeywordsForOffering(offeringId: string): string[] {
    if (offeringId === OFFERING_IDS.INSIGHT) {
      return [
        'analyze', 'analysis', 'sentiment', 'emotion', 'transcript', 'humanity',
        'certificate', 'verification', 'authenticity', 'trust', 'audio review', 'voice quality',
      ];
    }
    
    if (offeringId === OFFERING_IDS.CLONE) {
      return [
        'clone', 'custom voice', 'voice model', 'license', 'exclusive', 'brand voice',
        'personalized', 'ai voice', 'voice training', 'unique voice',
      ];
    }
    
    return this.config.keywords;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    console.log(`[ACP Listener] Starting for agent ${this.config.agentId}`);
    this.isRunning = true;
    this.startEventListener();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.listenerProcess) {
      this.listenerProcess.kill('SIGTERM');
      this.listenerProcess = null;
    }
  }

  private startEventListener(): void {
    const args = ['@virtuals-protocol/acp-cli', 'events', 'listen', '--all', '--json'];
    this.listenerProcess = spawn('npx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    this.listenerProcess.stdout?.on('data', (data) => this.handleEventOutput(data.toString()));
    this.listenerProcess.on('exit', () => {
      if (this.isRunning) setTimeout(() => this.startEventListener(), 5000);
    });
  }

  private async handleEventOutput(output: string): Promise<void> {
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{')) continue;
      try {
        const event: AcpEvent = JSON.parse(trimmed);
        await this.handleEvent(event);
      } catch (error) {
        console.error('[ACP Listener] Failed to parse event:', error);
      }
    }
  }

  private async handleEvent(event: AcpEvent): Promise<void> {
    const { type, job } = event;
    switch (type) {
      case 'job.created': await this.handleJobCreated(job); break;
      case 'job.assigned': await this.handleJobAssigned(job); break;
      case 'job.completed': await this.handleJobCompleted(job); break;
    }
  }

  private async handleJobCreated(job: AcpJob): Promise<void> {
    if (this.processedJobs.has(job.id) || !this.config.offeringIds.includes(job.offeringId)) return;
    const match = this.evaluateJobMatch(job);
    if (match.score < 70 || (job.budget && job.budget.value < this.config.minBudget)) return;

    this.processedJobs.add(job.id);
    if (this.config.autoBid) await this.submitBid(job, match);
  }

  private async handleJobAssigned(job: AcpJob): Promise<void> {
    if (job.providerAgentId !== this.config.agentId && !this.processedJobs.has(job.id)) return;
    try {
      const result = await this.executeJob(job);
      await this.deliverResult(job, result);
    } catch (error) {
      console.error(`[ACP Listener] Job execution failed for ${job.id}:`, error);
    }
  }

  private async handleJobCompleted(job: AcpJob): Promise<void> {
    if (job.providerAgentId === this.config.agentId && this.processedJobs.has(job.id)) {
      this.jobCache.delete(job.id);

      getAgentReputationService().recordJobEvent(this.config.agentId, {
        jobId: job.id,
        status: 'completed',
        earning: job.budget?.value || 0,
      });
    }
  }

  private evaluateJobMatch(job: AcpJob): JobMatch {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const keywords = this.getKeywordsForOffering(job.offeringId);
    const matchedKeywords = keywords.filter(k => text.includes(k.toLowerCase()));

    const keywordScore = (matchedKeywords.length / 3) * 50;
    const budgetScore = job.budget ? Math.min(job.budget.value * 10, 30) : 20;
    const slaScore = job.slaMinutes >= 5 ? 20 : 10;
    const score = Math.min(keywordScore + budgetScore + slaScore, 100);

    let estimatedCost = 0.05;
    if (job.offeringId === OFFERING_IDS.INSIGHT) estimatedCost = 0.01;
    else if (job.offeringId === OFFERING_IDS.CLONE) estimatedCost = 500;

    const revenue = job.budget?.value || 0;
    const profitMargin = revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;

    return { job, score, matchedKeywords, estimatedCost, profitMargin };
  }

  private async submitBid(job: AcpJob, match: JobMatch): Promise<void> {
    const bidAmount = job.budget?.value || 0.05;
    try {
      const { stdout } = await execFileAsync('npx', [
        '@virtuals-protocol/acp-cli', 'provider', 'set-budget',
        '--job-id', job.id, '--amount', String(bidAmount), '--json',
      ]);
      console.log(`[ACP Listener] Bid submitted for job ${job.id}:`, stdout.trim());
    } catch (error) {
      console.error(`[ACP Listener] Bid failed for job ${job.id}:`, error);
    }
  }

  private async executeJob(job: AcpJob): Promise<any> {
    const endpoint = this.config.offeringRoutes?.[job.offeringId] || this.getDefaultRoute(job.offeringId);
    if (this.config.webhookUrl) {
      const response = await fetch(`${this.config.webhookUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.agentId}` },
        body: JSON.stringify(this.buildRequestBody(job)),
      });
      return await response.json();
    }
    return { success: true, recordingId: `rec_${Date.now()}` };
  }

  private getDefaultRoute(offeringId: string): string {
    if (offeringId === OFFERING_IDS.INSIGHT) return '/api/studio-insights/stream';
    if (offeringId === OFFERING_IDS.CLONE) return '/api/agents/voice-clone';
    return '/api/agents/vocalize';
  }

  private buildRequestBody(job: AcpJob): any {
    if (job.offeringId === OFFERING_IDS.INSIGHT) {
      return { recordingId: job.requirements?.recordingId, audioUrl: job.requirements?.audioUrl };
    }
    if (job.offeringId === OFFERING_IDS.CLONE) {
      return { voiceSamples: job.requirements?.voiceSamples, usageRights: job.requirements?.usageRights };
    }
    return { text: job.requirements?.text || job.description, voiceId: job.requirements?.voiceId || '21m00Tcm4TlvDq8ikWAM', agentAddress: this.config.agentId };
  }

  private async deliverResult(job: AcpJob, result: any): Promise<void> {
    const deliverable = result.ipfsUrl || result.recordingId || 'completed';
    try {
      const { stdout } = await execFileAsync('npx', [
        '@virtuals-protocol/acp-cli', 'provider', 'deliver',
        '--job-id', job.id, '--deliverable', deliverable, '--json',
      ]);
      console.log(`[ACP Listener] Delivered result for job ${job.id}:`, stdout.trim());
    } catch (error) {
      console.error(`[ACP Listener] Delivery failed for job ${job.id}:`, error);
    }
  }
}

let listenerInstance: AcpListenerService | null = null;

export function getAcpListener(config?: Partial<AcpListenerConfig>): AcpListenerService {
  if (!listenerInstance) {
    const offeringIds = [OFFERING_IDS.VOCALIZE, OFFERING_IDS.INSIGHT, OFFERING_IDS.CLONE];
    listenerInstance = new AcpListenerService({
      agentId: process.env.ACP_AGENT_ID || '',
      offeringIds,
      autoBid: process.env.ACP_AUTO_BID === 'true',
      minBudget: 0.01,
      maxResponseTimeMs: 30000,
      keywords: DEFAULT_KEYWORDS,
      ...config,
    });
  }
  return listenerInstance;
}
