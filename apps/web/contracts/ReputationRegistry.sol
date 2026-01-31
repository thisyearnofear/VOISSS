// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ReputationRegistry
 * @dev EIP-8004 inspired reputation system for VOISSS agents.
 * Users give feedback to agents with category-tagged scores.
 */
contract ReputationRegistry {
    // Custom Errors
    error InvalidFeedback();
    error AgentCannotRateSelf();
    error FeedbackNotFound();

    // Fixed-point score with decimals (e.g., 8750 with 2 decimals = 87.50)
    struct Feedback {
        address client;        // Who gave the feedback
        int128 value;          // Score value (can be negative for penalties)
        uint8 valueDecimals;   // 0-18, e.g., 2 means value is divided by 100
        string tag1;           // Primary tag: category (e.g., "defi", "governance")
        string tag2;           // Secondary tag: quality signal (e.g., "accurate", "bullish")
        uint64 timestamp;
        bool isRevoked;
    }

    // agentAddress => feedback array
    mapping(address => Feedback[]) public agentFeedback;
    
    // agentAddress => category => aggregated score (for quick lookup)
    mapping(address => mapping(string => int256)) public categoryScores;
    
    // agentAddress => total feedback count
    mapping(address => uint256) public totalFeedbackCount;

    // Track if address has given feedback to agent (prevents duplicate spam)
    mapping(address => mapping(address => bool)) public hasGivenFeedback;

    event NewFeedback(
        address indexed agentId,
        address indexed clientAddress,
        uint256 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string tag1,
        string tag2
    );

    event FeedbackRevoked(
        address indexed agentId,
        address indexed clientAddress,
        uint256 feedbackIndex
    );

    /**
     * @dev Give feedback to an agent.
     * @param agentId The agent being rated
     * @param value Score value (e.g., 8750 for 87.50 with 2 decimals)
     * @param valueDecimals Number of decimal places (0-18)
     * @param tag1 Primary category tag (e.g., "defi", "governance")
     * @param tag2 Secondary quality tag (e.g., "accurate", "timely", "bullish")
     */
    function giveFeedback(
        address agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2
    ) external returns (uint256 feedbackIndex) {
        if (agentId == msg.sender) revert AgentCannotRateSelf();
        if (valueDecimals > 18) revert InvalidFeedback();

        Feedback memory feedback = Feedback({
            client: msg.sender,
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            timestamp: uint64(block.timestamp),
            isRevoked: false
        });

        feedbackIndex = agentFeedback[agentId].length;
        agentFeedback[agentId].push(feedback);
        totalFeedbackCount[agentId]++;

        // Update category aggregate score
        if (bytes(tag1).length > 0) {
            categoryScores[agentId][tag1] += int256(value);
        }

        hasGivenFeedback[msg.sender][agentId] = true;

        emit NewFeedback(agentId, msg.sender, feedbackIndex, value, valueDecimals, tag1, tag2);
    }

    /**
     * @dev Revoke previously given feedback.
     */
    function revokeFeedback(address agentId, uint256 feedbackIndex) external {
        Feedback storage feedback = agentFeedback[agentId][feedbackIndex];
        if (feedback.client != msg.sender) revert InvalidFeedback();
        if (feedback.isRevoked) revert InvalidFeedback();

        feedback.isRevoked = true;
        totalFeedbackCount[agentId]--;

        // Adjust category score
        if (bytes(feedback.tag1).length > 0) {
            categoryScores[agentId][feedback.tag1] -= int256(feedback.value);
        }

        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    /**
     * @dev Get all feedback for an agent.
     */
    function getAgentFeedback(address agentId) external view returns (Feedback[] memory) {
        return agentFeedback[agentId];
    }

    /**
     * @dev Get feedback count for an agent (excluding revoked).
     */
    function getFeedbackCount(address agentId) external view returns (uint256) {
        return totalFeedbackCount[agentId];
    }

    /**
     * @dev Get aggregate score for agent in a specific category.
     * @param agentId Agent address
     * @param category Category tag
     * @return Aggregated score (sum of all feedback values in this category)
     */
    function getCategoryScore(address agentId, string calldata category) external view returns (int256) {
        return categoryScores[agentId][category];
    }

    /**
     * @dev Calculate average reputation score for an agent.
     * @param agentId Agent address
     * @return averageScore Multiplied by 100 for 2 decimal precision (e.g., 8750 = 87.50)
     * @return count Number of valid feedback entries
     */
    function getAverageReputation(address agentId) external view returns (int256 averageScore, uint256 count) {
        Feedback[] storage feedbacks = agentFeedback[agentId];
        int256 total = 0;
        uint256 validCount = 0;

        for (uint256 i = 0; i < feedbacks.length; i++) {
            if (!feedbacks[i].isRevoked) {
                // Normalize to 2 decimals for averaging
                int256 normalized = int256(feedbacks[i].value);
                if (feedbacks[i].valueDecimals < 2) {
                    normalized *= int256(10 ** (2 - feedbacks[i].valueDecimals));
                } else if (feedbacks[i].valueDecimals > 2) {
                    normalized /= int256(10 ** (feedbacks[i].valueDecimals - 2));
                }
                total += normalized;
                validCount++;
            }
        }

        if (validCount == 0) return (0, 0);
        return (total / int256(validCount), validCount);
    }

    /**
     * @dev Check if an address has given feedback to an agent.
     */
    function hasFeedback(address client, address agent) external view returns (bool) {
        return hasGivenFeedback[client][agent];
    }

    /**
     * @dev Get top agents by category score.
     * Note: This is a simplified version. In production, use off-chain indexing (The Graph, etc.)
     * @param category Category to rank by
     * @param agentList List of agents to consider
     * @return sortedAgents Array of agent addresses sorted by score (descending)
     * @return scores Corresponding scores
     */
    function getTopAgentsByCategory(
        string calldata category,
        address[] calldata agentList
    ) external view returns (address[] memory sortedAgents, int256[] memory scores) {
        // Simple bubble sort for small lists
        address[] memory agents = new address[](agentList.length);
        int256[] memory agentScores = new int256[](agentList.length);

        for (uint256 i = 0; i < agentList.length; i++) {
            agents[i] = agentList[i];
            agentScores[i] = categoryScores[agentList[i]][category];
        }

        // Bubble sort by score descending
        for (uint256 i = 0; i < agents.length; i++) {
            for (uint256 j = i + 1; j < agents.length; j++) {
                if (agentScores[j] > agentScores[i]) {
                    // Swap scores
                    int256 tempScore = agentScores[i];
                    agentScores[i] = agentScores[j];
                    agentScores[j] = tempScore;
                    // Swap agents
                    address tempAgent = agents[i];
                    agents[i] = agents[j];
                    agents[j] = tempAgent;
                }
            }
        }

        return (agents, agentScores);
    }
}
