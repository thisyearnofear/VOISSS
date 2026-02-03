/**
 * Agent Security Service
 * Comprehensive security measures for AI agent interactions
 */

import { createHash, randomBytes } from 'crypto';

export interface SecurityThreat {
    type: 'ddos' | 'abuse' | 'fraud' | 'impersonation' | 'resource_exhaustion';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    agentId: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface AgentSecurityProfile {
    agentId: string;
    trustScore: number; // 0-100
    reputation: number; // 0-1000
    threatLevel: 'green' | 'yellow' | 'orange' | 'red';
    flags: string[];
    createdAt: number;
    lastActivity: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    suspiciousPatterns: string[];
}

export class AgentSecurityService {
    private profiles = new Map<string, AgentSecurityProfile>();
    private threats = new Map<string, SecurityThreat[]>();
    private honeypots = new Set<string>(); // Honeypot endpoints
    private blocklist = new Set<string>(); // Blocked agent IDs
    private allowlist = new Set<string>(); // Trusted agent IDs

    constructor() {
        // Initialize honeypots
        this.honeypots.add('/api/admin/secret');
        this.honeypots.add('/api/internal/debug');
        this.honeypots.add('/api/hidden/backdoor');

        // Cleanup old data periodically
        setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
    }

    /**
     * Comprehensive security check for agent requests
     */
    async securityCheck(request: {
        agentId: string;
        userAgent?: string;
        headers: Record<string, string>;
        path: string;
        method: string;
        payload?: any;
        ip?: string;
        timing?: {
            requestStart: number;
            processingTime: number;
        };
    }): Promise<{
        allowed: boolean;
        reason?: string;
        threatLevel: 'green' | 'yellow' | 'orange' | 'red';
        actions: string[];
        profile: AgentSecurityProfile;
    }> {
        const profile = this.getOrCreateProfile(request.agentId);
        const threats: SecurityThreat[] = [];
        const actions: string[] = [];

        // 1. Check blocklist
        if (this.blocklist.has(request.agentId)) {
            return {
                allowed: false,
                reason: 'Agent is blocked',
                threatLevel: 'red',
                actions: ['block'],
                profile
            };
        }

        // 2. Honeypot detection
        if (this.honeypots.has(request.path)) {
            threats.push({
                type: 'abuse',
                severity: 'high',
                description: 'Accessed honeypot endpoint',
                agentId: request.agentId,
                timestamp: Date.now(),
                metadata: { path: request.path }
            });
            actions.push('flag_suspicious', 'increase_monitoring');
        }

        // 3. Request pattern analysis
        const patternThreats = this.analyzeRequestPatterns(request, profile);
        threats.push(...patternThreats);

        // 4. Payload analysis
        if (request.payload) {
            const payloadThreats = this.analyzePayload(request.payload, request.agentId);
            threats.push(...payloadThreats);
        }

        // 5. Rate pattern analysis
        const rateThreats = this.analyzeRatePatterns(profile);
        threats.push(...rateThreats);

        // 6. User-Agent analysis
        if (request.userAgent) {
            const uaThreats = this.analyzeUserAgent(request.userAgent, request.agentId);
            threats.push(...uaThreats);
        }

        // 7. Geographic/IP analysis
        if (request.ip) {
            const ipThreats = await this.analyzeIP(request.ip, request.agentId);
            threats.push(...ipThreats);
        }

        // Update profile with threats
        this.updateProfileWithThreats(profile, threats);

        // Determine overall threat level
        const threatLevel = this.calculateThreatLevel(threats, profile);

        // Determine if request should be allowed
        const allowed = this.shouldAllowRequest(threatLevel, profile, threats);

        // Generate actions
        if (!allowed) {
            actions.push('block');
        }
        if (threatLevel === 'red') {
            actions.push('block', 'alert_admin');
        } else if (threatLevel === 'orange') {
            actions.push('increase_monitoring', 'require_additional_verification');
        } else if (threatLevel === 'yellow') {
            actions.push('log_suspicious');
        }

        // Store threats
        if (threats.length > 0) {
            this.recordThreats(request.agentId, threats);
        }

        return {
            allowed,
            reason: allowed ? undefined : this.generateBlockReason(threats),
            threatLevel,
            actions,
            profile
        };
    }

    /**
     * Analyze request patterns for suspicious behavior
     */
    private analyzeRequestPatterns(request: any, profile: AgentSecurityProfile): SecurityThreat[] {
        const threats: SecurityThreat[] = [];

        // Check for rapid-fire requests
        if (profile.totalRequests > 100 && profile.averageResponseTime < 50) {
            threats.push({
                type: 'ddos',
                severity: 'medium',
                description: 'Unusually fast request pattern detected',
                agentId: request.agentId,
                timestamp: Date.now()
            });
        }

        // Check for failed request patterns
        const failureRate = profile.failedRequests / Math.max(profile.totalRequests, 1);
        if (failureRate > 0.5 && profile.totalRequests > 20) {
            threats.push({
                type: 'abuse',
                severity: 'medium',
                description: 'High failure rate indicates potential abuse',
                agentId: request.agentId,
                timestamp: Date.now(),
                metadata: { failureRate }
            });
        }

        // Check for suspicious paths
        const suspiciousPaths = ['/admin', '/debug', '/test', '/internal', '/.env', '/config'];
        if (suspiciousPaths.some(path => request.path.includes(path))) {
            threats.push({
                type: 'abuse',
                severity: 'high',
                description: 'Accessing suspicious endpoints',
                agentId: request.agentId,
                timestamp: Date.now(),
                metadata: { path: request.path }
            });
        }

        return threats;
    }

    /**
     * Analyze payload for malicious content
     */
    private analyzePayload(payload: any, agentId: string): SecurityThreat[] {
        const threats: SecurityThreat[] = [];

        try {
            const payloadStr = JSON.stringify(payload).toLowerCase();

            // Check for injection attempts
            const injectionPatterns = [
                'script>', '<iframe', 'javascript:', 'eval(', 'exec(',
                'union select', 'drop table', 'delete from', 'update set',
                '../', '..\\', '/etc/passwd', '/proc/self'
            ];

            for (const pattern of injectionPatterns) {
                if (payloadStr.includes(pattern)) {
                    threats.push({
                        type: 'abuse',
                        severity: 'high',
                        description: `Potential injection attempt detected: ${pattern}`,
                        agentId,
                        timestamp: Date.now(),
                        metadata: { pattern, payload: payloadStr.substring(0, 200) }
                    });
                }
            }

            // Check for excessively large payloads
            if (payloadStr.length > 100000) { // 100KB
                threats.push({
                    type: 'resource_exhaustion',
                    severity: 'medium',
                    description: 'Excessively large payload',
                    agentId,
                    timestamp: Date.now(),
                    metadata: { size: payloadStr.length }
                });
            }

            // Check for suspicious text content
            if (payload.text) {
                const suspiciousContent = this.analyzeSuspiciousText(payload.text);
                if (suspiciousContent.length > 0) {
                    threats.push({
                        type: 'abuse',
                        severity: 'low',
                        description: 'Suspicious text content detected',
                        agentId,
                        timestamp: Date.now(),
                        metadata: { suspiciousContent }
                    });
                }
            }

        } catch (error) {
            // Malformed payload
            threats.push({
                type: 'abuse',
                severity: 'medium',
                description: 'Malformed payload structure',
                agentId,
                timestamp: Date.now()
            });
        }

        return threats;
    }

    /**
     * Analyze User-Agent for legitimacy
     */
    private analyzeUserAgent(userAgent: string, agentId: string): SecurityThreat[] {
        const threats: SecurityThreat[] = [];

        // Check for missing or suspicious User-Agent
        if (!userAgent || userAgent.length < 5) {
            threats.push({
                type: 'impersonation',
                severity: 'low',
                description: 'Missing or minimal User-Agent',
                agentId,
                timestamp: Date.now(),
                metadata: { userAgent }
            });
        }

        // Check for browser User-Agent (should be agent-like)
        const browserPatterns = [
            'Mozilla/', 'Chrome/', 'Safari/', 'Firefox/', 'Edge/',
            'Opera/', 'Internet Explorer', 'MSIE'
        ];

        if (browserPatterns.some(pattern => userAgent.includes(pattern))) {
            threats.push({
                type: 'impersonation',
                severity: 'medium',
                description: 'Browser User-Agent detected (expected AI agent)',
                agentId,
                timestamp: Date.now(),
                metadata: { userAgent }
            });
        }

        // Check for known malicious User-Agents
        const maliciousPatterns = [
            'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
            'havij', 'acunetix', 'netsparker', 'appscan'
        ];

        if (maliciousPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
            threats.push({
                type: 'abuse',
                severity: 'critical',
                description: 'Known malicious User-Agent detected',
                agentId,
                timestamp: Date.now(),
                metadata: { userAgent }
            });
        }

        return threats;
    }

    /**
     * Analyze IP address for threats
     */
    private async analyzeIP(ip: string, agentId: string): Promise<SecurityThreat[]> {
        const threats: SecurityThreat[] = [];

        // Check for private/local IPs (suspicious for production)
        const privateRanges = [
            /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./,
            /^127\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/
        ];

        if (privateRanges.some(range => range.test(ip))) {
            threats.push({
                type: 'impersonation',
                severity: 'low',
                description: 'Request from private IP range',
                agentId,
                timestamp: Date.now(),
                metadata: { ip }
            });
        }

        // TODO: Integrate with IP reputation services
        // - Check against known malicious IP lists
        // - Check for VPN/proxy/Tor exit nodes
        // - Check geographic consistency

        return threats;
    }

    /**
     * Analyze text content for suspicious patterns
     */
    private analyzeSuspiciousText(text: string): string[] {
        const suspicious: string[] = [];
        const lowerText = text.toLowerCase();

        // Check for spam indicators
        const spamPatterns = [
            'buy now', 'click here', 'free money', 'get rich quick',
            'limited time', 'act now', 'guaranteed', 'no risk'
        ];

        spamPatterns.forEach(pattern => {
            if (lowerText.includes(pattern)) {
                suspicious.push(`spam_pattern:${pattern}`);
            }
        });

        // Check for excessive repetition
        const words = text.split(/\s+/);
        const wordCounts = new Map<string, number>();
        words.forEach(word => {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        });

        for (const [word, count] of wordCounts) {
            if (count > 10 && word.length > 3) {
                suspicious.push(`excessive_repetition:${word}`);
            }
        }

        return suspicious;
    }

    /**
     * Get or create security profile for agent
     */
    private getOrCreateProfile(agentId: string): AgentSecurityProfile {
        if (!this.profiles.has(agentId)) {
            this.profiles.set(agentId, {
                agentId,
                trustScore: 50, // Start neutral
                reputation: 100, // Start with basic reputation
                threatLevel: 'green',
                flags: [],
                createdAt: Date.now(),
                lastActivity: Date.now(),
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                suspiciousPatterns: []
            });
        }

        const profile = this.profiles.get(agentId)!;
        profile.lastActivity = Date.now();
        profile.totalRequests++;

        return profile;
    }

    /**
     * Update profile based on detected threats
     */
    private updateProfileWithThreats(profile: AgentSecurityProfile, threats: SecurityThreat[]) {
        threats.forEach(threat => {
            // Adjust trust score based on threat severity
            switch (threat.severity) {
                case 'critical':
                    profile.trustScore = Math.max(0, profile.trustScore - 30);
                    profile.reputation = Math.max(0, profile.reputation - 100);
                    break;
                case 'high':
                    profile.trustScore = Math.max(0, profile.trustScore - 15);
                    profile.reputation = Math.max(0, profile.reputation - 50);
                    break;
                case 'medium':
                    profile.trustScore = Math.max(0, profile.trustScore - 5);
                    profile.reputation = Math.max(0, profile.reputation - 20);
                    break;
                case 'low':
                    profile.trustScore = Math.max(0, profile.trustScore - 1);
                    profile.reputation = Math.max(0, profile.reputation - 5);
                    break;
            }

            // Add flags
            if (!profile.flags.includes(threat.type)) {
                profile.flags.push(threat.type);
            }
        });
    }

    /**
     * Calculate overall threat level
     */
    private calculateThreatLevel(threats: SecurityThreat[], profile: AgentSecurityProfile): 'green' | 'yellow' | 'orange' | 'red' {
        const criticalThreats = threats.filter(t => t.severity === 'critical').length;
        const highThreats = threats.filter(t => t.severity === 'high').length;
        const mediumThreats = threats.filter(t => t.severity === 'medium').length;

        if (criticalThreats > 0 || profile.trustScore < 10) {
            return 'red';
        }
        if (highThreats > 1 || profile.trustScore < 25) {
            return 'orange';
        }
        if (highThreats > 0 || mediumThreats > 2 || profile.trustScore < 40) {
            return 'yellow';
        }
        return 'green';
    }

    /**
     * Determine if request should be allowed
     */
    private shouldAllowRequest(threatLevel: string, profile: AgentSecurityProfile, threats: SecurityThreat[]): boolean {
        // Always block critical threats
        if (threatLevel === 'red') {
            return false;
        }

        // Block if too many recent threats
        const recentThreats = this.getRecentThreats(profile.agentId, 60 * 60 * 1000); // Last hour
        if (recentThreats.length > 10) {
            return false;
        }

        // Allow everything else (with monitoring)
        return true;
    }

    /**
     * Record threats for an agent
     */
    private recordThreats(agentId: string, threats: SecurityThreat[]) {
        if (!this.threats.has(agentId)) {
            this.threats.set(agentId, []);
        }
        this.threats.get(agentId)!.push(...threats);
    }

    /**
     * Get recent threats for an agent
     */
    private getRecentThreats(agentId: string, timeWindowMs: number): SecurityThreat[] {
        const agentThreats = this.threats.get(agentId) || [];
        const cutoff = Date.now() - timeWindowMs;
        return agentThreats.filter(threat => threat.timestamp > cutoff);
    }

    /**
     * Generate block reason from threats
     */
    private generateBlockReason(threats: SecurityThreat[]): string {
        const criticalThreats = threats.filter(t => t.severity === 'critical');
        if (criticalThreats.length > 0) {
            return `Critical security threat: ${criticalThreats[0].description}`;
        }

        const highThreats = threats.filter(t => t.severity === 'high');
        if (highThreats.length > 0) {
            return `Security threat detected: ${highThreats[0].description}`;
        }

        return 'Multiple security concerns detected';
    }

    /**
     * Cleanup old data
     */
    private cleanup() {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

        // Clean old threats
        for (const [agentId, threats] of this.threats) {
            const recentThreats = threats.filter(threat => threat.timestamp > cutoff);
            if (recentThreats.length === 0) {
                this.threats.delete(agentId);
            } else {
                this.threats.set(agentId, recentThreats);
            }
        }

        // Clean inactive profiles
        for (const [agentId, profile] of this.profiles) {
            if (profile.lastActivity < cutoff) {
                this.profiles.delete(agentId);
            }
        }
    }

    /**
     * Admin functions
     */
    blockAgent(agentId: string) {
        this.blocklist.add(agentId);
    }

    unblockAgent(agentId: string) {
        this.blocklist.delete(agentId);
    }

    trustAgent(agentId: string) {
        this.allowlist.add(agentId);
        const profile = this.getOrCreateProfile(agentId);
        profile.trustScore = 100;
        profile.reputation = 1000;
    }
}

// Singleton instance
let agentSecurityService: AgentSecurityService | null = null;

export function getAgentSecurityService(): AgentSecurityService {
    if (!agentSecurityService) {
        agentSecurityService = new AgentSecurityService();
    }
    return agentSecurityService;
}