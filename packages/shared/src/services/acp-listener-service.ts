/**
 * ACP Event Listener Service - Proactive Agent Discovery
 *
 * Enables VOISSS to autonomously discover and respond to voice-related job
 * opportunities on the Virtuals Protocol marketplace.
 *
 * Event Flow:
 * 1. Listen to ACP events (job.created, job.updated)
 * 2. Filter for voice/audio/narration opportunities
 * 3. Auto-evaluate job fit based on keywords and budget
 * 4. Submit competitive bids or accept fixed-price jobs
 * 5. Execute vocalize API when hired
 * 6. Deliver results and collect USDC payment
 */

import { spawn, execFile, ChildProcess } from 'child_process';

export interface AcpJob {
  id: string;
  title: string;
  description: string;
  offeringId: string;
  offeringName: string;
  clientAgentId: string;
  providerAgentId?: string; // The agent assigned to execute the job
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
  score: number; // 0-100 relevance score
  matchedKeywords: string[];
  recommendedVoiceId?: string;
  estimatedCost: number;
  profitMargin: number;
}

export interface AcpListenerConfig {
  agentId: string;
  offeringIds: string[]; // Support multiple offerings
  autoBid: boolean;
  minBudget: number; // Minimum USDC to consider
  maxResponseTimeMs: number;
  keywords: string[];
  webhookUrl?: string; // Where to send job execution requests
  offeringRoutes?: Record<string, string>; // Map offering ID to API route
}

const DEFAULT_KEYWORDS = [
  'voice',
  'voiceover',
  'narration',
  'audio',
  'speech',
  'tts',
  'text-to-speech',
  'dubbing',
  'podcast',
  'audiobook',
  'commercial',
  'script reading',
  'voice acting',
  'announcement',
  'greeting',
  'explainer',
];

export class AcpListenerService {
  private config: AcpListenerConfig;
  private listenerProcess: ChildProcess | null = null;
  private isRunning = false;
  private jobCache = new Map<string, AcpJob>();
  private processedJobs = new Set<string>();

  constructor(config: AcpListenerConfig) {
    this.config = {
      autoBid: false, // Safety: require manual approval by default
      minBudget: 0.01, // Minimum $0.01 USDC
      maxResponseTimeMs: 30000, // 30 seconds
      keywords: DEFAULT_KEYWORDS,
      offeringRoutes: {},
      ...config,
    };
  }

  /**
   * Get keywords for a specific offering
   */
  private getKeywordsForOffering(offeringId: string): string[] {
    const offering = this.config.offeringIds.find(id => id === offeringId);
    
    // VoiceInsight offering keywords
    if (offeringId === '019e9bb1-5f8c-76c9-8f92-685af00b8c22') {
      return [
        'analyze',
        'analysis',
        'sentiment',
        'emotion',
        'transcript',
        'humanity',
        'certificate',
        'verification',
        'authenticity',
        'trust',
        'audio review',
        'voice quality',
      ];
    }
    
    // VoiceClone offering keywords
    if (offeringId === '019e9bb1-9e4d-7fb1-bb47-adb879d978c0') {
      return [
        'clone',
        'custom voice',
        'voice model',
        'license',
        'exclusive',
        'brand voice',
        'personalized',
        'ai voice',
        'voice training',
        'unique voice',
      ];
    }
    
    // Default: VoiceVocalize keywords
    return this.config.keywords;
  }

  /**
   * Start listening to ACP marketplace events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('ACP Listener already running');
      return;
    }

    console.log(`[ACP Listener] Starting for agent ${this.config.agentId}`);
    console.log(`[ACP Listener] Monitoring ${this.config.offeringIds.length} offerings:`);
    this.config.offeringIds.forEach(id => console.log(`  - ${id}`));
    console.log(`[ACP Listener] Auto-bid: ${this.config.autoBid ? 'ENABLED' : 'DISABLED'}`);

    this.isRunning = true;
    this.startEventListener();
  }

  /**
   * Stop listening to events
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('[ACP Listener] Stopping...');
    this.isRunning = false;

    if (this.listenerProcess) {
      this.listenerProcess.kill('SIGTERM');
      this.listenerProcess = null;
    }
  }

  /**
   * Spawn the ACP CLI event listener process
   */
  private startEventListener(): void {
    const args = [
      '@virtuals-protocol/acp-cli',
      'events',
      'listen',
      '--all',
      '--json',
    ];

    this.listenerProcess = spawn('npx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    this.listenerProcess.stdout?.on('data', (data) => {
      this.handleEventOutput(data.toString());
    });

    this.listenerProcess.stderr?.on('data', (data) => {
      console.error('[ACP Listener] Error:', data.toString());
    });

    this.listenerProcess.on('exit', (code) => {
      console.log(`[ACP Listener] Process exited with code ${code}`);
      if (this.isRunning) {
        console.log('[ACP Listener] Restarting in 5 seconds...');
        setTimeout(() => this.startEventListener(), 5000);
      }
    });
  }

  /**
   * Parse and handle event output from CLI
   */
  private async handleEventOutput(output: string): Promise<void> {
    const lines = output.trim().split('\n');

    for (const line of lines) {
      try {
        const event: AcpEvent = JSON.parse(line);
        await this.handleEvent(event);
      } catch (error) {
        // Skip non-JSON lines (e.g., CLI status messages)
        if (line.includes('job.created')) {
          console.log('[ACP Listener] New job detected');
        }
      }
    }
  }

  /**
   * Handle individual ACP events
   */
  private async handleEvent(event: AcpEvent): Promise<void> {
    const { type, job } = event;

    console.log(`[ACP Listener] Event: ${type} | Job: ${job.id} | ${job.title}`);

    switch (type) {
      case 'job.created':
        await this.handleJobCreated(job);
        break;

      case 'job.assigned':
        await this.handleJobAssigned(job);
        break;

      case 'job.completed':
        await this.handleJobCompleted(job);
        break;

      default:
        console.log(`[ACP Listener] Unhandled event type: ${type}`);
    }
  }

  /**
   * Evaluate and potentially bid on new jobs
   */
  private async handleJobCreated(job: AcpJob): Promise<void> {
    if (this.processedJobs.has(job.id)) {
      return; // Already evaluated
    }

    // Check if job matches any of our offerings
    if (!this.config.offeringIds.includes(job.offeringId)) {
      return;
    }

    // Evaluate job fit with offering-specific keywords
    const match = this.evaluateJobMatch(job);

    if (match.score < 70) {
      console.log(`[ACP Listener] Job ${job.id} score too low (${match.score}), skipping`);
      return;
    }

    if (job.budget && job.budget.value < this.config.minBudget) {
      console.log(`[ACP Listener] Job ${job.id} budget too low ($${job.budget.value}), skipping`);
      return;
    }

    console.log(`[ACP Listener] ✓ Job match found!`);
    console.log(`  Offering: ${job.offeringName}`);
    console.log(`  Score: ${match.score}/100`);
    console.log(`  Keywords: ${match.matchedKeywords.join(', ')}`);
    console.log(`  Budget: $${job.budget?.value || 'unknown'} USDC`);
    console.log(`  Profit margin: ${match.profitMargin}%`);

    this.processedJobs.add(job.id);
    this.jobCache.set(job.id, job);

    if (this.config.autoBid) {
      await this.submitBid(job, match);
    } else {
      console.log(`[ACP Listener] Manual approval required - job queued for review`);
      // TODO: Send notification to admin dashboard
    }
  }

  /**
   * Execute job when assigned to VOISSS
   */
  private async handleJobAssigned(job: AcpJob): Promise<void> {
    // Check if assigned to us: either providerAgentId matches, or we bid on this job
    const isAssignedToUs =
      job.providerAgentId === this.config.agentId ||
      this.processedJobs.has(job.id);

    if (!isAssignedToUs) {
      return;
    }

    console.log(`[ACP Listener] 🎯 Job assigned! Executing: ${job.id}`);

    try {
      const result = await this.executeJob(job);
      await this.deliverResult(job, result);
      console.log(`[ACP Listener] ✓ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`[ACP Listener] ✗ Job ${job.id} execution failed:`, error);
      // TODO: Handle failure, potentially dispute or retry
    }
  }

  /**
   * Track completed jobs for analytics
   */
  private async handleJobCompleted(job: AcpJob): Promise<void> {
    const isAssignedToUs =
      job.providerAgentId === this.config.agentId ||
      this.processedJobs.has(job.id);

    if (!isAssignedToUs) {
      return;
    }

    console.log(`[ACP Listener] 💰 Job ${job.id} completed - $${job.budget?.value} USDC earned`);
    this.jobCache.delete(job.id);
  }

  /**
   * Evaluate how well a job matches VOISSS capabilities
   */
  private evaluateJobMatch(job: AcpJob): JobMatch {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const keywords = this.getKeywordsForOffering(job.offeringId);
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    // Score calculation
    const keywordScore = (matchedKeywords.length / 3) * 50; // Max 50 points for keywords
    const budgetScore = job.budget ? Math.min(job.budget.value * 10, 30) : 20; // Max 30 points
    const slaScore = job.slaMinutes >= 5 ? 20 : 10; // 20 points for reasonable SLA

    const score = Math.min(keywordScore + budgetScore + slaScore, 100);

    // Estimate cost based on offering type
    let estimatedCost = 0.05; // Default: VoiceVocalize
    if (job.offeringId === '019e9bb1-5f8c-76c9-8f92-685af00b8c22') {
      estimatedCost = 0.01; // VoiceInsight: cheaper analysis
    } else if (job.offeringId === '019e9bb1-9e4d-7fb1-bb47-adb879d978c0') {
      estimatedCost = 500; // VoiceClone: high compute cost
    }

    const revenue = job.budget?.value || 0;
    const profitMargin = revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;

    return {
      job,
      score,
      matchedKeywords,
      estimatedCost,
      profitMargin,
    };
  }

  /**
   * Submit a bid for a job using ACP CLI
   */
  private async submitBid(job: AcpJob, match: JobMatch): Promise<void> {
    console.log(`[ACP Listener] Submitting bid for job ${job.id}...`);

    const bidAmount = job.budget?.value || 0.05;

    try {
      const result = await new Promise<string>((resolve, reject) => {
        execFile('npx', [
          '@virtuals-protocol/acp-cli', 'provider', 'set-budget',
          '--job-id', job.id,
          '--amount', String(bidAmount),
          '--json',
        ], { encoding: 'utf-8' }, (err, stdout, stderr) => {
          if (err) reject(err);
          else resolve(stdout);
        });
      });

      const response = JSON.parse(result);
      console.log(`[ACP Listener] ✓ Bid submitted: ${response.message || 'success'}`);
    } catch (error) {
      console.error(`[ACP Listener] ✗ Bid failed:`, error);
    }
  }

  /**
   * Execute the voice generation job
   */
  private async executeJob(job: AcpJob): Promise<any> {
    console.log(`[ACP Listener] Executing job ${job.id} for offering ${job.offeringName}`);

    // Route to offering-specific endpoint
    const endpoint = this.config.offeringRoutes?.[job.offeringId] || this.getDefaultRoute(job.offeringId);

    if (this.config.webhookUrl) {
      const response = await fetch(`${this.config.webhookUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.agentId}`,
        },
        body: JSON.stringify(this.buildRequestBody(job)),
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      return await response.json();
    }

    // Fallback: execute locally (for testing)
    return {
      success: true,
      recordingId: `rec_${Date.now()}`,
      ipfsUrl: 'ipfs://pending',
      message: 'Job queued for execution',
    };
  }

  /**
   * Get default API route for an offering
   */
  private getDefaultRoute(offeringId: string): string {
    if (offeringId === '019e9bb1-5f8c-76c9-8f92-685af00b8c22') {
      return '/api/studio-insights/stream'; // VoiceInsight
    }
    if (offeringId === '019e9bb1-9e4d-7fb1-bb47-adb879d978c0') {
      return '/api/agents/voice-clone'; // VoiceClone (TODO: implement)
    }
    return '/api/agents/vocalize'; // VoiceVocalize (default)
  }

  /**
   * Build request body based on offering type
   */
  private buildRequestBody(job: AcpJob): any {
    const offeringId = job.offeringId;

    if (offeringId === '019e9bb1-5f8c-76c9-8f92-685af00b8c22') {
      // VoiceInsight
      return {
        recordingId: job.requirements?.recordingId,
        audioUrl: job.requirements?.audioUrl,
      };
    }

    if (offeringId === '019e9bb1-9e4d-7fb1-bb47-adb879d978c0') {
      // VoiceClone
      return {
        voiceSamples: job.requirements?.voiceSamples,
        usageRights: job.requirements?.usageRights,
        durationMonths: job.requirements?.durationMonths || 12,
      };
    }

    // VoiceVocalize (default)
    const text = job.requirements?.text || job.description;
    const voiceId = job.requirements?.voiceId || this.selectVoiceForJob(job);

    return {
      text,
      voiceId,
      agentAddress: this.config.agentId,
    };
  }

  /**
   * Deliver completed job result to ACP marketplace
   */
  private async deliverResult(job: AcpJob, result: any): Promise<void> {
    console.log(`[ACP Listener] Delivering result for job ${job.id}...`);

    try {
      const deliverable = result.ipfsUrl || result.recordingId || 'completed';

      await new Promise<void>((resolve, reject) => {
        execFile('npx', [
          '@virtuals-protocol/acp-cli', 'provider', 'deliver',
          '--job-id', job.id,
          '--deliverable', deliverable,
          '--json',
        ], { encoding: 'utf-8' }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`[ACP Listener] ✓ Result delivered`);
    } catch (error) {
      console.error(`[ACP Listener] ✗ Delivery failed:`, error);
    }
  }

  /**
   * Select appropriate voice based on job requirements
   */
  private selectVoiceForJob(job: AcpJob): string {
    const text = `${job.title} ${job.description}`.toLowerCase();

    // Simple heuristic mapping
    if (text.includes('female') || text.includes('woman')) {
      return '21m00Tcm4TlvDq8ikWAM'; // Default female voice
    }
    if (text.includes('male') || text.includes('man')) {
      return 'AZnzlk1XvdvUeBnXmlld'; // Default male voice
    }
    if (text.includes('professional') || text.includes('corporate')) {
      return '21m00Tcm4TlvDq8ikWAM'; // Professional voice
    }

    // Default to first available voice
    return '21m00Tcm4TlvDq8ikWAM';
  }

  /**
   * Get listener status and statistics
   */
  getStatus(): {
    running: boolean;
    processedJobs: number;
    cachedJobs: number;
    config: AcpListenerConfig;
  } {
    return {
      running: this.isRunning,
      processedJobs: this.processedJobs.size,
      cachedJobs: this.jobCache.size,
      config: this.config,
    };
  }
}

/**
 * Create a singleton instance for easy access
 */
let listenerInstance: AcpListenerService | null = null;

export function getAcpListener(config?: Partial<AcpListenerConfig>): AcpListenerService {
  if (!listenerInstance) {
    const offeringIds = process.env.ACP_OFFERING_IDS
      ? process.env.ACP_OFFERING_IDS.split(',')
      : [
          '019e98e8-f262-7aa9-938b-73664bae4fcd', // VoiceVocalize
          '019e9bb1-5f8c-76c9-8f92-685af00b8c22', // VoiceInsight
          '019e9bb1-9e4d-7fb1-bb47-adb879d978c0', // VoiceClone
        ];

    const fullConfig: AcpListenerConfig = {
      agentId: process.env.ACP_AGENT_ID || '',
      offeringIds,
      autoBid: process.env.ACP_AUTO_BID === 'true',
      minBudget: parseFloat(process.env.ACP_MIN_BUDGET || '0.01'),
      maxResponseTimeMs: parseInt(process.env.ACP_RESPONSE_TIME_MS || '30000'),
      keywords: DEFAULT_KEYWORDS,
      webhookUrl: process.env.ACP_WEBHOOK_URL || process.env.NEXT_PUBLIC_VOISSS_API,
      offeringRoutes: {},
      ...config,
    };

    if (!fullConfig.agentId || fullConfig.offeringIds.length === 0) {
      throw new Error('ACP_LISTENER requires ACP_AGENT_ID and at least one offering ID');
    }

    listenerInstance = new AcpListenerService(fullConfig);
  }

  return listenerInstance;
}
