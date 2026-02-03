/**
 * Agent Verification Service - Reverse CAPTCHA
 * Verifies that requests are coming from legitimate AI agents, not humans
 */

import { createHash, randomBytes } from 'crypto';

export interface AgentChallenge {
    id: string;
    challenge: string;
    expectedResponse: string;
    expiresAt: number;
    difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface AgentVerificationResult {
    isAgent: boolean;
    confidence: number; // 0-1
    reason: string;
    challengeId?: string;
}

export class AgentVerificationService {
    private challenges = new Map<string, AgentChallenge>();
    private readonly CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Generate a challenge that's easy for AI agents but hard for humans
     */
    generateChallenge(difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic'): AgentChallenge {
        const id = randomBytes(16).toString('hex');
        const challenge = this.createChallenge(difficulty);

        const challengeObj: AgentChallenge = {
            id,
            challenge: challenge.prompt,
            expectedResponse: challenge.answer,
            expiresAt: Date.now() + this.CHALLENGE_TTL,
            difficulty,
        };

        this.challenges.set(id, challengeObj);

        // Cleanup expired challenges
        this.cleanupExpiredChallenges();

        return challengeObj;
    }

    /**
     * Verify agent response to challenge
     */
    verifyChallenge(challengeId: string, response: string): AgentVerificationResult {
        const challenge = this.challenges.get(challengeId);

        if (!challenge) {
            return {
                isAgent: false,
                confidence: 0,
                reason: 'Challenge not found or expired'
            };
        }

        if (Date.now() > challenge.expiresAt) {
            this.challenges.delete(challengeId);
            return {
                isAgent: false,
                confidence: 0,
                reason: 'Challenge expired'
            };
        }

        // Check if response matches expected answer
        const isCorrect = this.compareResponses(challenge.expectedResponse, response);

        // Calculate confidence based on response speed and accuracy
        const confidence = isCorrect ? this.calculateConfidence(challenge, response) : 0;

        // Clean up used challenge
        this.challenges.delete(challengeId);

        return {
            isAgent: isCorrect && confidence > 0.7,
            confidence,
            reason: isCorrect ? 'Challenge solved correctly' : 'Incorrect response',
            challengeId
        };
    }

    /**
     * Verify agent through behavioral analysis (no challenge required)
     */
    verifyAgentBehavior(request: {
        userAgent?: string;
        headers: Record<string, string>;
        timing?: {
            requestStart: number;
            responseTime: number;
        };
        payload?: any;
    }): AgentVerificationResult {
        let confidence = 0;
        const reasons: string[] = [];

        // Check User-Agent patterns
        if (this.isAgentUserAgent(request.userAgent)) {
            confidence += 0.3;
            reasons.push('Agent-like User-Agent');
        }

        // Check for agent-specific headers
        if (request.headers['x-agent-id'] || request.headers['x-agent-version']) {
            confidence += 0.2;
            reasons.push('Agent identification headers present');
        }

        // Check request timing (agents are typically faster and more consistent)
        if (request.timing) {
            const responseTime = request.timing.responseTime;
            if (responseTime < 100) { // Very fast response
                confidence += 0.2;
                reasons.push('Consistent fast response time');
            }
        }

        // Check payload structure (agents tend to have perfect JSON formatting)
        if (request.payload && this.isPerfectlyFormatted(request.payload)) {
            confidence += 0.1;
            reasons.push('Perfect payload formatting');
        }

        // Check for human-like imperfections (agents rarely have typos)
        if (request.payload?.text && !this.hasTypos(request.payload.text)) {
            confidence += 0.1;
            reasons.push('No human-like errors in text');
        }

        return {
            isAgent: confidence > 0.6,
            confidence,
            reason: reasons.join(', ') || 'Behavioral analysis inconclusive'
        };
    }

    /**
     * Create different types of challenges
     */
    private createChallenge(difficulty: 'basic' | 'intermediate' | 'advanced'): {
        prompt: string;
        answer: string;
    } {
        switch (difficulty) {
            case 'basic':
                return this.createMathChallenge();
            case 'intermediate':
                return this.createLogicChallenge();
            case 'advanced':
                return this.createCodeChallenge();
            default:
                return this.createMathChallenge();
        }
    }

    private createMathChallenge(): { prompt: string; answer: string } {
        const a = Math.floor(Math.random() * 100) + 1;
        const b = Math.floor(Math.random() * 100) + 1;
        const c = Math.floor(Math.random() * 10) + 1;

        const operations = [
            { prompt: `Calculate: ${a} + ${b} * ${c}`, answer: (a + b * c).toString() },
            { prompt: `Calculate: (${a} + ${b}) * ${c}`, answer: ((a + b) * c).toString() },
            { prompt: `Calculate: ${a} * ${b} - ${c}`, answer: (a * b - c).toString() },
        ];

        return operations[Math.floor(Math.random() * operations.length)];
    }

    private createLogicChallenge(): { prompt: string; answer: string } {
        const challenges = [
            {
                prompt: "Complete the sequence: 2, 4, 8, 16, ?",
                answer: "32"
            },
            {
                prompt: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops Lazzles? (yes/no)",
                answer: "yes"
            },
            {
                prompt: "What comes next: A1, B2, C3, D4, ?",
                answer: "E5"
            }
        ];

        return challenges[Math.floor(Math.random() * challenges.length)];
    }

    private createCodeChallenge(): { prompt: string; answer: string } {
        const challenges = [
            {
                prompt: "What does this JavaScript return: [1,2,3].map(x => x * 2).reduce((a,b) => a + b, 0)",
                answer: "12"
            },
            {
                prompt: "Convert to JSON: {name: 'test', value: 42}",
                answer: '{"name":"test","value":42}'
            },
            {
                prompt: "What's the output: console.log(typeof null)",
                answer: "object"
            }
        ];

        return challenges[Math.floor(Math.random() * challenges.length)];
    }

    private compareResponses(expected: string, actual: string): boolean {
        // Normalize responses for comparison
        const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
        return normalize(expected) === normalize(actual);
    }

    private calculateConfidence(challenge: AgentChallenge, response: string): number {
        let confidence = 0.8; // Base confidence for correct answer

        // Agents typically respond very quickly to computational challenges
        const responseLength = response.length;
        if (responseLength < 20 && challenge.difficulty === 'basic') {
            confidence += 0.1; // Concise response
        }

        // Perfect formatting suggests agent
        if (response.trim() === response && !response.includes('um') && !response.includes('uh')) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    private isAgentUserAgent(userAgent?: string): boolean {
        if (!userAgent) return false;

        const agentPatterns = [
            /python-requests/i,
            /curl/i,
            /axios/i,
            /fetch/i,
            /node-fetch/i,
            /httpx/i,
            /aiohttp/i,
            /agent/i,
            /bot/i,
            /claude/i,
            /gpt/i,
            /openai/i,
            /anthropic/i
        ];

        return agentPatterns.some(pattern => pattern.test(userAgent));
    }

    private isPerfectlyFormatted(payload: any): boolean {
        try {
            // Check if JSON is perfectly formatted (no extra spaces, consistent quotes)
            const stringified = JSON.stringify(payload);
            const parsed = JSON.parse(stringified);
            return JSON.stringify(parsed) === stringified;
        } catch {
            return false;
        }
    }

    private hasTypos(text: string): boolean {
        // Simple heuristic: humans often have typos, agents rarely do
        const commonTypos = [
            /teh/g, // the
            /recieve/g, // receive  
            /seperate/g, // separate
            /definately/g, // definitely
            /occured/g, // occurred
        ];

        return commonTypos.some(pattern => pattern.test(text.toLowerCase()));
    }

    private cleanupExpiredChallenges(): void {
        const now = Date.now();
        for (const [id, challenge] of this.challenges.entries()) {
            if (now > challenge.expiresAt) {
                this.challenges.delete(id);
            }
        }
    }
}

// Singleton instance
let agentVerificationService: AgentVerificationService | null = null;

export function getAgentVerificationService(): AgentVerificationService {
    if (!agentVerificationService) {
        agentVerificationService = new AgentVerificationService();
    }
    return agentVerificationService;
}