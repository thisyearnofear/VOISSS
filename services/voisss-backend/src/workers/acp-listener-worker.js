/**
 * ACP Listener Worker (Standalone — zero external deps)
 *
 * Autonomously discovers and bids on voice-related job
 * opportunities on the Virtuals Protocol marketplace.
 */

const { spawn, execFile } = require('child_process');
const { promisify } = require('util');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { dirname, join } = require('path');

const execFileAsync = promisify(execFile);

// ── Reputation Service ──────────────────────────────────────────────

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];
const REPUTATION_PATH = process.env.REPUTATION_PATH || join(process.cwd(), '.data', 'reputation.json');

const reputation = {
  profiles: new Map(),

  load() {
    try {
      if (existsSync(REPUTATION_PATH)) {
        const data = JSON.parse(readFileSync(REPUTATION_PATH, 'utf-8'));
        for (const [id, profile] of Object.entries(data)) {
          this.profiles.set(id, profile);
        }
      }
    } catch (err) {
      console.error('[Reputation] Failed to load:', err.message);
    }
  },

  save() {
    try {
      const dir = dirname(REPUTATION_PATH);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const data = {};
      for (const [id, profile] of this.profiles) data[id] = profile;
      writeFileSync(REPUTATION_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[Reputation] Failed to save:', err.message);
    }
  },

  getProfile(agentId) {
    let p = this.profiles.get(agentId);
    if (!p) {
      p = {
        agentId,
        metrics: { totalJobs: 0, completedJobs: 0, rejectedJobs: 0, totalEarningsUSDC: 0, averageRating: 0, lastJobAt: new Date().toISOString(), successRate: 0 },
        tier: 'bronze',
        history: [],
      };
      this.profiles.set(agentId, p);
    }
    return p;
  },

  recordJobEvent(agentId, event) {
    const profile = this.getProfile(agentId);
    const m = profile.metrics;
    m.totalJobs++;
    if (event.status === 'completed') { m.completedJobs++; m.totalEarningsUSDC += event.earning || 0; }
    else if (event.status === 'rejected') { m.rejectedJobs++; }
    if (event.rating && m.completedJobs > 0) {
      m.averageRating = ((m.averageRating * (m.completedJobs - 1)) + event.rating) / m.completedJobs;
    }
    m.successRate = m.totalJobs > 0 ? (m.completedJobs / m.totalJobs) * 100 : 0;
    m.lastJobAt = new Date().toISOString();

    let newTier = 'bronze';
    if (m.completedJobs > 100 && m.successRate > 95) newTier = 'platinum';
    else if (m.completedJobs > 50 && m.successRate > 90) newTier = 'gold';
    else if (m.completedJobs > 10 && m.successRate > 80) newTier = 'silver';

    if (newTier !== profile.tier) {
      const dir = TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(profile.tier) ? 'promoted' : 'demoted';
      console.log(`[Reputation] Agent ${agentId} ${dir}: ${profile.tier} -> ${newTier}`);
      profile.tier = newTier;
    }

    profile.history.push({ jobId: event.jobId, status: event.status, rating: event.rating, timestamp: m.lastJobAt });
    if (profile.history.length > 100) profile.history.shift();
    console.log(`[Reputation] ${agentId}: ${m.successRate.toFixed(1)}% success | ${profile.tier.toUpperCase()} | $${m.totalEarningsUSDC.toFixed(2)} earned`);
    this.save();
  },
};

reputation.load();

// ── ACP Listener Service ────────────────────────────────────────────

const OFFERING_IDS = {
  VOCALIZE: '019e98e8-f262-7aa9-938b-73664bae4fcd',
  INSIGHT: '019e9bb1-5f8c-76c9-8f92-685af00b8c22',
  CLONE: '019e9bb1-9e4d-7fb1-bb47-adb879d978c0',
};

const DEFAULT_KEYWORDS = [
  'voice', 'voiceover', 'narration', 'audio', 'speech', 'tts', 'text-to-speech',
  'dubbing', 'podcast', 'audiobook', 'commercial', 'script reading', 'voice acting',
  'announcement', 'greeting', 'explainer',
];

const INSIGHT_KEYWORDS = [
  'analyze', 'analysis', 'sentiment', 'emotion', 'transcript', 'humanity',
  'certificate', 'verification', 'authenticity', 'trust', 'audio review', 'voice quality',
];

const CLONE_KEYWORDS = [
  'clone', 'custom voice', 'voice model', 'license', 'exclusive', 'brand voice',
  'personalized', 'ai voice', 'voice training', 'unique voice',
];

class AcpListenerService {
  constructor(config) {
    this.config = { autoBid: false, minBudget: 0.01, maxResponseTimeMs: 30000, keywords: DEFAULT_KEYWORDS, offeringRoutes: {}, ...config };
    this.listenerProcess = null;
    this.isRunning = false;
    this.jobCache = new Map();
    this.processedJobs = new Set();
  }

  getKeywordsForOffering(offeringId) {
    if (offeringId === OFFERING_IDS.INSIGHT) return INSIGHT_KEYWORDS;
    if (offeringId === OFFERING_IDS.CLONE) return CLONE_KEYWORDS;
    return this.config.keywords;
  }

  async start() {
    if (this.isRunning) return;
    console.log(`[ACP Listener] Starting for agent ${this.config.agentId}`);
    this.isRunning = true;
    this.startEventListener();
  }

  async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.listenerProcess) { this.listenerProcess.kill('SIGTERM'); this.listenerProcess = null; }
  }

  startEventListener() {
    const args = ['@virtuals-protocol/acp-cli', 'events', 'listen', '--all', '--json'];
    this.listenerProcess = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } });
    this.listenerProcess.stdout.on('data', (data) => this.handleEventOutput(data.toString()));
    this.listenerProcess.stderr.on('data', (data) => console.error('[ACP Listener] stderr:', data.toString().trim()));
    this.listenerProcess.on('exit', (code) => {
      console.log(`[ACP Listener] Process exited with code ${code}`);
      if (this.isRunning) setTimeout(() => this.startEventListener(), 5000);
    });
  }

  async handleEventOutput(output) {
    for (const line of output.trim().split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{')) continue;
      try {
        const event = JSON.parse(trimmed);
        await this.handleEvent(event);
      } catch (error) {
        console.error('[ACP Listener] Parse error:', error.message);
      }
    }
  }

  async handleEvent(event) {
    const { type, job } = event;
    switch (type) {
      case 'job.created': await this.handleJobCreated(job); break;
      case 'job.assigned': await this.handleJobAssigned(job); break;
      case 'job.completed': await this.handleJobCompleted(job); break;
    }
  }

  async handleJobCreated(job) {
    if (this.processedJobs.has(job.id) || !this.config.offeringIds.includes(job.offeringId)) return;
    const match = this.evaluateJobMatch(job);
    if (match.score < 70 || (job.budget && job.budget.value < this.config.minBudget)) return;
    this.processedJobs.add(job.id);
    console.log(`[ACP Listener] Match found: "${job.title}" (score: ${match.score}, margin: ${match.profitMargin.toFixed(1)}%)`);
    if (this.config.autoBid) await this.submitBid(job, match);
  }

  async handleJobAssigned(job) {
    if (job.providerAgentId !== this.config.agentId && !this.processedJobs.has(job.id)) return;
    try {
      const result = await this.executeJob(job);
      await this.deliverResult(job, result);
    } catch (error) {
      console.error(`[ACP Listener] Job execution failed for ${job.id}:`, error.message);
    }
  }

  async handleJobCompleted(job) {
    if (job.providerAgentId === this.config.agentId && this.processedJobs.has(job.id)) {
      this.jobCache.delete(job.id);
      reputation.recordJobEvent(this.config.agentId, {
        jobId: job.id, status: 'completed', earning: job.budget?.value || 0,
      });
    }
  }

  evaluateJobMatch(job) {
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

  async submitBid(job, match) {
    const bidAmount = job.budget?.value || 0.05;
    try {
      const { stdout } = await execFileAsync('npx', [
        '@virtuals-protocol/acp-cli', 'provider', 'set-budget',
        '--job-id', job.id, '--amount', String(bidAmount), '--json',
      ]);
      console.log(`[ACP Listener] Bid submitted for job ${job.id}:`, stdout.trim());
    } catch (error) {
      console.error(`[ACP Listener] Bid failed for job ${job.id}:`, error.message);
    }
  }

  async executeJob(job) {
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

  getDefaultRoute(offeringId) {
    if (offeringId === OFFERING_IDS.INSIGHT) return '/api/studio-insights/stream';
    if (offeringId === OFFERING_IDS.CLONE) return '/api/agents/voice-clone';
    return '/api/agents/vocalize';
  }

  buildRequestBody(job) {
    if (job.offeringId === OFFERING_IDS.INSIGHT) {
      return { recordingId: job.requirements?.recordingId, audioUrl: job.requirements?.audioUrl };
    }
    if (job.offeringId === OFFERING_IDS.CLONE) {
      return { voiceSamples: job.requirements?.voiceSamples, usageRights: job.requirements?.usageRights };
    }
    return { text: job.requirements?.text || job.description, voiceId: job.requirements?.voiceId || '21m00Tcm4TlvDq8ikWAM', agentAddress: this.config.agentId };
  }

  async deliverResult(job, result) {
    const deliverable = result.ipfsUrl || result.recordingId || 'completed';
    try {
      const { stdout } = await execFileAsync('npx', [
        '@virtuals-protocol/acp-cli', 'provider', 'deliver',
        '--job-id', job.id, '--deliverable', deliverable, '--json',
      ]);
      console.log(`[ACP Listener] Delivered result for job ${job.id}:`, stdout.trim());
    } catch (error) {
      console.error(`[ACP Listener] Delivery failed for job ${job.id}:`, error.message);
    }
  }
}

// ── Worker Entry ────────────────────────────────────────────────────

async function startWorker() {
  const agentId = process.env.ACP_AGENT_ID;
  if (!agentId) {
    console.error('[ACP Worker] ACP_AGENT_ID not set — exiting');
    process.exit(1);
  }

  console.log('[ACP Worker] Initializing...');
  console.log(`[ACP Worker] Agent: ${agentId}`);
  console.log(`[ACP Worker] Auto-bid: ${process.env.ACP_AUTO_BID === 'true' ? 'ENABLED' : 'disabled (monitoring only)'}`);

  const listener = new AcpListenerService({
    agentId,
    offeringIds: [OFFERING_IDS.VOCALIZE, OFFERING_IDS.INSIGHT, OFFERING_IDS.CLONE],
    autoBid: process.env.ACP_AUTO_BID === 'true',
    minBudget: parseFloat(process.env.ACP_MIN_BUDGET || '0.01'),
    webhookUrl: process.env.ACP_WEBHOOK_URL || undefined,
  });

  await listener.start();

  process.on('SIGTERM', async () => { console.log('[ACP Worker] SIGTERM received'); await listener.stop(); process.exit(0); });
  process.on('SIGINT', async () => { console.log('[ACP Worker] SIGINT received'); await listener.stop(); process.exit(0); });
}

if (require.main === module) {
  startWorker().catch(err => { console.error('[ACP Worker] Fatal:', err); process.exit(1); });
}

module.exports = { startWorker, AcpListenerService };
