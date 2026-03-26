/**
 * Market Intelligence Agent Service
 * 
 * Orchestrates the full flow: research via Firecrawl → synthesize content
 * → generate voice via ElevenLabs → post to mission system.
 */

import {
  MarketIntelligenceRequest,
  MarketIntelligenceRequestSchema,
  MarketIntelligenceReport,
  MARKET_INTELLIGENCE_EVENT_TYPES,
} from '../../types/market-intelligence';
import { getFirecrawlService, FirecrawlService } from './firecrawl-service';
import { getAgentEventHub, VOISSS_EVENT_TYPES } from '../agent-event-hub';
import { DatabaseService, COLLECTIONS } from '../database-service';
import { createInMemoryDatabase } from '../memory-database';

export interface MarketAgentConfig {
  firecrawlService?: FirecrawlService;
  database?: DatabaseService;
  defaultVoiceId?: string;
}

export interface GenerateVoiceOptions {
  text: string;
  voiceId?: string;
  agentAddress?: string;
}

/**
 * Market Intelligence Agent Service
 * 
 * Coordinates research, voice generation, and mission posting
 * to create comprehensive audio market intelligence reports.
 */
export class MarketAgentService {
  private firecrawlService: FirecrawlService;
  private database: DatabaseService;
  private defaultVoiceId: string;
  private eventHub = getAgentEventHub();

  constructor(config?: MarketAgentConfig) {
    this.firecrawlService = config?.firecrawlService || getFirecrawlService();
    this.database = config?.database || createInMemoryDatabase();
    this.defaultVoiceId = config?.defaultVoiceId || MARKET_INTELLIGENCE_CONFIG.DEFAULT_VOICE_ID;
  }

  /**
   * Process a market intelligence request
   */
  async processRequest(request: MarketIntelligenceRequest): Promise<MarketIntelligenceReport> {
    const startTime = Date.now();
    const reportId = this.generateId();

    // Validate request
    const parsed = MarketIntelligenceRequestSchema.safeParse(request);
    if (!parsed.success) {
      throw new Error(`Invalid request: ${parsed.error.message}`);
    }

    const { query, agentAddress, voiceId, depth, topic, publishToMission, missionId } = parsed.data;

    console.log(`[MarketAgent] Processing request: ${query} (depth: ${depth})`);

    try {
      // Stage 1: Research
      await this.publishProgress(reportId, 'searching', 10, 'Searching market data...');
      
      const research = await this.firecrawlService.research(query);
      
      await this.publishProgress(reportId, 'analyzing', 40, 'Analyzing findings...');

      // Stage 2: Synthesize content
      const summary = this.synthesizeSummary(query, research);
      const keyFindings = research.keyFindings;

      await this.publishProgress(reportId, 'synthesizing', 60, 'Generating report...');

      // Stage 3: Generate voice (optional)
      let audioUrl: string | undefined;
      let audioIpfsHash: string | undefined;

      const effectiveVoiceId = voiceId || this.defaultVoiceId;
      
      if (effectiveVoiceId) {
        await this.publishProgress(reportId, 'generating_voice', 75, 'Creating audio report...');
        
        const voiceResult = await this.generateVoice({
          text: summary,
          voiceId: effectiveVoiceId,
          agentAddress,
        });

        audioUrl = voiceResult.audioUrl;
        audioIpfsHash = voiceResult.ipfsHash;
      }

      // Stage 4: Create report
      const report: MarketIntelligenceReport = {
        id: reportId,
        query,
        topic,
        summary,
        keyFindings,
        sources: research.sources,
        audioUrl,
        audioIpfsHash,
        missionId,
        createdAt: new Date(),
        createdBy: agentAddress || 'system',
        agentGenerated: true,
        depth,
        processingTimeMs: Date.now() - startTime,
      };

      // Save report to database
      await this.database.set(COLLECTIONS.MARKET_INTELLIGENCE_REPORTS || 'market_reports', reportId, report);

      await this.publishProgress(reportId, 'completed', 100, 'Report generated successfully');

      // Publish completion event
      await this.eventHub.publish({
        type: MARKET_INTELLIGENCE_EVENT_TYPES.MARKET_REPORT_GENERATED,
        source: 'market-agent',
        data: {
          reportId,
          query,
          agentAddress,
          hasAudio: !!audioUrl,
          processingTimeMs: report.processingTimeMs,
        },
      });

      console.log(`[MarketAgent] Report ${reportId} generated in ${report.processingTimeMs}ms`);

      return report;

    } catch (error) {
      await this.publishProgress(reportId, 'failed', 0, undefined, error instanceof Error ? error.message : 'Unknown error');
      
      await this.eventHub.publish({
        type: MARKET_INTELLIGENCE_EVENT_TYPES.MARKET_RESEARCH_FAILED,
        source: 'market-agent',
        data: {
          reportId,
          query,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: { priority: 'high' },
      });

      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<MarketIntelligenceReport | null> {
    try {
      return await this.database.get<MarketIntelligenceReport>(
        COLLECTIONS.MARKET_INTELLIGENCE_REPORTS || 'market_reports',
        reportId
      );
    } catch {
      return null;
    }
  }

  /**
   * Get recent reports
   */
  async getRecentReports(limit: number = 10): Promise<MarketIntelligenceReport[]> {
    try {
      const all = await this.database.getAll<MarketIntelligenceReport>(
        COLLECTIONS.MARKET_INTELLIGENCE_REPORTS || 'market_reports'
      );
      
      return all
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Get reports by topic
   */
  async getReportsByTopic(topic: string, limit: number = 10): Promise<MarketIntelligenceReport[]> {
    const all = await this.getRecentReports(50);
    
    return all
      .filter(r => r.topic === topic || r.query.toLowerCase().includes(topic.toLowerCase()))
      .slice(0, limit);
  }

  /**
   * Search reports by query
   */
  async searchReports(query: string, limit: number = 10): Promise<MarketIntelligenceReport[]> {
    const all = await this.getRecentReports(50);
    const lowerQuery = query.toLowerCase();
    
    return all
      .filter(r => 
        r.query.toLowerCase().includes(lowerQuery) ||
        r.summary.toLowerCase().includes(lowerQuery) ||
        r.keyFindings.some(f => f.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit);
  }

  /**
   * Synthesize summary from research data
   */
  private synthesizeSummary(
    query: string,
    research: { summary: string; keyFindings: string[]; sources: any[] }
  ): string {
    const lines = [
      `Market Intelligence Report: ${query}`,
      '',
      'EXECUTIVE SUMMARY',
      '─' .repeat(40),
      research.summary,
      '',
      'KEY FINDINGS',
      '─' .repeat(40),
      ...research.keyFindings.map((finding, i) => `${i + 1}. ${finding}`),
      '',
      'SOURCES',
      '─' .repeat(40),
      ...research.sources.slice(0, 5).map((s, i) => `${i + 1}. ${s.title} - ${s.url}`),
      '',
      `Report generated ${new Date().toLocaleDateString()}`,
    ];

    return lines.join('\n');
  }

  /**
   * Generate voice for report text
   * This calls the vocalize endpoint internally
   */
  private async generateVoice(options: GenerateVoiceOptions): Promise<{
    audioUrl: string;
    ipfsHash?: string;
  }> {
    const { text, voiceId, agentAddress } = options;

    try {
      // Call the vocalize endpoint
      const vocalizeUrl = process.env.VOCALIZE_ENDPOINT || 'http://localhost:3000/api/agents/vocalize';
      
      const response = await fetch(vocalizeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(agentAddress && { 'X-Agent-Address': agentAddress }),
        },
        body: JSON.stringify({
          text,
          voiceId,
          agentAddress,
          options: {
            format: 'mp3',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(`Voice generation failed: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Voice generation failed');
      }

      return {
        audioUrl: result.data?.audioUrl,
        ipfsHash: result.data?.ipfsHash,
      };

    } catch (error) {
      console.error('[MarketAgent] Voice generation error:', error);
      // Return empty result to allow report to still be created
      return { audioUrl: undefined };
    }
  }

  /**
   * Publish progress event
   */
  private async publishProgress(
    reportId: string,
    stage: 'init' | 'searching' | 'analyzing' | 'synthesizing' | 'generating_voice' | 'publishing' | 'completed' | 'failed',
    progress: number,
    message?: string,
    error?: string
  ): Promise<void> {
    await this.eventHub.publish({
      type: MARKET_INTELLIGENCE_EVENT_TYPES.MARKET_RESEARCH_STARTED,
      source: 'market-agent',
      data: {
        reportId,
        stage,
        progress,
        message,
        error,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mri_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Singleton instance
let marketAgentService: MarketAgentService | null = null;

export function getMarketAgentService(config?: MarketAgentConfig): MarketAgentService {
  if (!marketAgentService) {
    marketAgentService = new MarketAgentService(config);
  }
  return marketAgentService;
}

export function createMarketAgentService(config?: MarketAgentConfig): MarketAgentService {
  return new MarketAgentService(config);
}
