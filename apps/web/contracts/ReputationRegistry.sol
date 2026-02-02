// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ReputationRegistry
 * @dev EIP-8004 inspired reputation system for VOISSS agents.
 * Users give feedback to agents with category-tagged scores.
 * 
 * @notice This contract manages a decentralized reputation system with spam prevention,
 * weighted scoring, and category-based aggregation.
 */
contract ReputationRegistry is Ownable, Pausable, ReentrancyGuard {
    // Constants
    uint8 public constant MAX_DECIMALS = 18;
    uint256 public constant MAX_TAG_LENGTH = 32;
    uint256 public constant MIN_FEEDBACK_INTERVAL = 1 hours; // Prevent spam
    int128 public constant MIN_VALUE = -10000; // -100.00 with 2 decimals
    int128 public constant MAX_VALUE = 10000;  // 100.00 with 2 decimals

    // Custom Errors
    error InvalidFeedback();
    error AgentCannotRateSelf();
    error FeedbackNotFound();
    error TooFrequentFeedback();
    error InvalidTag();
    error ValueOutOfRange();
    error AgentNotRegistered();
    error Unauthorized();

    // Fixed-point score with decimals (e.g., 8750 with 2 decimals = 87.50)
    struct Feedback {
        address client;        // Who gave the feedback
        int128 value;          // Score value (can be negative for penalties)
        uint8 valueDecimals;   // 0-18, e.g., 2 means value is divided by 100
        string tag1;           // Primary tag: category (e.g., "defi", "governance")
        string tag2;           // Secondary tag: quality signal (e.g., "accurate", "bullish")
        uint64 timestamp;
        bool isRevoked;
        uint256 weight;        // Feedback weight (for future reputation weighting)
    }

    struct AgentStats {
        uint256 totalFeedback;     // Total feedback count (excluding revoked)
        uint256 positiveFeedback;  // Count of positive feedback
        uint256 negativeFeedback;  // Count of negative feedback
        int256 totalScore;         // Sum of all scores (normalized to 2 decimals)
        uint64 lastUpdated;
    }

    // State variables
    mapping(address => Feedback[]) private _agentFeedback;
    mapping(address => mapping(string => int256)) public categoryScores;
    mapping(address => mapping(string => uint256)) public categoryFeedbackCount;
    mapping(address => AgentStats) public agentStats;
    
    // Spam prevention: client => agent => last feedback timestamp
    mapping(address => mapping(address => uint256)) public lastFeedbackTime;
    
    // Track feedback indices by client for easier management
    mapping(address => mapping(address => uint256[])) private _clientFeedbackIndices;

    // Optional: Integration with AgentRegistry
    address public agentRegistry;
    bool public requireRegisteredAgents;

    // Events
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

    event FeedbackUpdated(
        address indexed agentId,
        address indexed clientAddress,
        uint256 feedbackIndex,
        int128 newValue
    );

    event AgentRegistrySet(address indexed registry);

    /**
     * @notice Constructor
     * @param initialOwner Address of the contract owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set the AgentRegistry contract address
     * @param registry Address of the AgentRegistry contract
     */
    function setAgentRegistry(address registry, bool required) external onlyOwner {
        agentRegistry = registry;
        requireRegisteredAgents = required;
        emit AgentRegistrySet(registry);
    }

    /**
     * @notice Give feedback to an agent
     * @param agentId The agent being rated
     * @param value Score value (e.g., 8750 for 87.50 with 2 decimals)
     * @param valueDecimals Number of decimal places (0-18)
     * @param tag1 Primary category tag (e.g., "defi", "governance")
     * @param tag2 Secondary quality tag (e.g., "accurate", "timely", "bullish")
     * @return feedbackIndex Index of the feedback in the array
     */
    function giveFeedback(
        address agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2
    ) external whenNotPaused nonReentrant returns (uint256 feedbackIndex) {
        // Validations
        if (agentId == msg.sender) revert AgentCannotRateSelf();
        if (agentId == address(0)) revert InvalidFeedback();
        if (valueDecimals > MAX_DECIMALS) revert InvalidFeedback();
        if (value < MIN_VALUE || value > MAX_VALUE) revert ValueOutOfRange();
        
        // Validate tags
        if (bytes(tag1).length == 0 || bytes(tag1).length > MAX_TAG_LENGTH) {
            revert InvalidTag();
        }
        if (bytes(tag2).length > MAX_TAG_LENGTH) {
            revert InvalidTag();
        }

        // Check if agent is registered (if required)
        if (requireRegisteredAgents && agentRegistry != address(0)) {
            (bool success, bytes memory data) = agentRegistry.staticcall(
                abi.encodeWithSignature("isAgent(address)", agentId)
            );
            if (!success || !abi.decode(data, (bool))) {
                revert AgentNotRegistered();
            }
        }

        // Spam prevention: Check time since last feedback
        uint256 timeSinceLastFeedback = block.timestamp - lastFeedbackTime[msg.sender][agentId];
        if (lastFeedbackTime[msg.sender][agentId] != 0 && timeSinceLastFeedback < MIN_FEEDBACK_INTERVAL) {
            revert TooFrequentFeedback();
        }

        // Create feedback
        Feedback memory feedback = Feedback({
            client: msg.sender,
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            timestamp: uint64(block.timestamp),
            isRevoked: false,
            weight: 1 // Default weight, can be enhanced later
        });

        feedbackIndex = _agentFeedback[agentId].length;
        _agentFeedback[agentId].push(feedback);
        _clientFeedbackIndices[msg.sender][agentId].push(feedbackIndex);

        // Update statistics
        _updateStats(agentId, value, valueDecimals, tag1, true);
        
        lastFeedbackTime[msg.sender][agentId] = block.timestamp;

        emit NewFeedback(agentId, msg.sender, feedbackIndex, value, valueDecimals, tag1, tag2);
    }

    /**
     * @notice Update existing feedback
     * @param agentId Agent address
     * @param feedbackIndex Index of feedback to update
     * @param newValue New score value
     * @param newValueDecimals New decimals
     */
    function updateFeedback(
        address agentId,
        uint256 feedbackIndex,
        int128 newValue,
        uint8 newValueDecimals
    ) external whenNotPaused {
        if (feedbackIndex >= _agentFeedback[agentId].length) revert FeedbackNotFound();
        
        Feedback storage feedback = _agentFeedback[agentId][feedbackIndex];
        if (feedback.client != msg.sender) revert Unauthorized();
        if (feedback.isRevoked) revert InvalidFeedback();
        if (newValueDecimals > MAX_DECIMALS) revert InvalidFeedback();
        if (newValue < MIN_VALUE || newValue > MAX_VALUE) revert ValueOutOfRange();

        // Revert old score
        _updateStats(agentId, feedback.value, feedback.valueDecimals, feedback.tag1, false);

        // Update feedback
        feedback.value = newValue;
        feedback.valueDecimals = newValueDecimals;
        feedback.timestamp = uint64(block.timestamp);

        // Apply new score
        _updateStats(agentId, newValue, newValueDecimals, feedback.tag1, true);

        emit FeedbackUpdated(agentId, msg.sender, feedbackIndex, newValue);
    }

    /**
     * @notice Revoke previously given feedback
     * @param agentId Agent address
     * @param feedbackIndex Index of feedback to revoke
     */
    function revokeFeedback(address agentId, uint256 feedbackIndex) external {
        if (feedbackIndex >= _agentFeedback[agentId].length) revert FeedbackNotFound();
        
        Feedback storage feedback = _agentFeedback[agentId][feedbackIndex];
        if (feedback.client != msg.sender) revert Unauthorized();
        if (feedback.isRevoked) revert InvalidFeedback();

        feedback.isRevoked = true;

        // Update statistics
        _updateStats(agentId, feedback.value, feedback.valueDecimals, feedback.tag1, false);

        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    /**
     * @notice Pause the contract (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get all feedback for an agent
     * @param agentId Agent address
     * @return Array of feedback
     */
    function getAgentFeedback(address agentId) external view returns (Feedback[] memory) {
        return _agentFeedback[agentId];
    }

    /**
     * @notice Get active (non-revoked) feedback for an agent
     * @param agentId Agent address
     * @return Array of active feedback
     */
    function getActiveFeedback(address agentId) external view returns (Feedback[] memory) {
        Feedback[] storage allFeedback = _agentFeedback[agentId];
        
        // Count active feedback
        uint256 activeCount = 0;
        uint256 length = allFeedback.length;
        for (uint256 i = 0; i < length; i++) {
            if (!allFeedback[i].isRevoked) {
                activeCount++;
            }
        }

        // Build result
        Feedback[] memory result = new Feedback[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < activeCount; i++) {
            if (!allFeedback[i].isRevoked) {
                result[idx] = allFeedback[i];
                idx++;
            }
        }

        return result;
    }

    /**
     * @notice Get paginated feedback for an agent
     * @param agentId Agent address
     * @param offset Starting index
     * @param limit Maximum results
     * @return Array of feedback
     */
    function getFeedbackPaginated(
        address agentId,
        uint256 offset,
        uint256 limit
    ) external view returns (Feedback[] memory) {
        Feedback[] storage allFeedback = _agentFeedback[agentId];
        uint256 totalLength = allFeedback.length;
        
        uint256 end = offset + limit;
        if (end > totalLength) end = totalLength;
        if (offset >= totalLength) return new Feedback[](0);

        uint256 size = end - offset;
        Feedback[] memory result = new Feedback[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = allFeedback[offset + i];
        }

        return result;
    }

    /**
     * @notice Get feedback given by a specific client to an agent
     * @param client Client address
     * @param agentId Agent address
     * @return Array of feedback indices
     */
    function getClientFeedbackIndices(
        address client,
        address agentId
    ) external view returns (uint256[] memory) {
        return _clientFeedbackIndices[client][agentId];
    }

    /**
     * @notice Get feedback count for an agent (excluding revoked)
     * @param agentId Agent address
     * @return Total feedback count
     */
    function getFeedbackCount(address agentId) external view returns (uint256) {
        return agentStats[agentId].totalFeedback;
    }

    /**
     * @notice Get total number of feedback entries (including revoked)
     * @param agentId Agent address
     * @return Total entries
     */
    function getTotalFeedbackEntries(address agentId) external view returns (uint256) {
        return _agentFeedback[agentId].length;
    }

    /**
     * @notice Get aggregate score for agent in a specific category
     * @param agentId Agent address
     * @param category Category tag
     * @return Aggregated score (sum of all feedback values in this category)
     */
    function getCategoryScore(address agentId, string calldata category) external view returns (int256) {
        return categoryScores[agentId][category];
    }

    /**
     * @notice Get feedback count for a specific category
     * @param agentId Agent address
     * @param category Category tag
     * @return Number of feedback entries
     */
    function getCategoryFeedbackCount(address agentId, string calldata category) external view returns (uint256) {
        return categoryFeedbackCount[agentId][category];
    }

    /**
     * @notice Get average score for a category
     * @param agentId Agent address
     * @param category Category tag
     * @return Average score (normalized to 2 decimals)
     */
    function getCategoryAverageScore(
        address agentId,
        string calldata category
    ) external view returns (int256) {
        uint256 count = categoryFeedbackCount[agentId][category];
        if (count == 0) return 0;
        return categoryScores[agentId][category] / int256(count);
    }

    /**
     * @notice Calculate average reputation score for an agent
     * @param agentId Agent address
     * @return averageScore Multiplied by 100 for 2 decimal precision (e.g., 8750 = 87.50)
     * @return count Number of valid feedback entries
     */
    function getAverageReputation(address agentId) external view returns (int256 averageScore, uint256 count) {
        AgentStats storage stats = agentStats[agentId];
        count = stats.totalFeedback;
        
        if (count == 0) return (0, 0);
        
        averageScore = stats.totalScore / int256(count);
        return (averageScore, count);
    }

    /**
     * @notice Get detailed statistics for an agent
     * @param agentId Agent address
     * @return stats AgentStats struct
     */
    function getAgentStats(address agentId) external view returns (AgentStats memory) {
        return agentStats[agentId];
    }

    /**
     * @notice Get sentiment distribution for an agent
     * @param agentId Agent address
     * @return positive Count of positive feedback
     * @return negative Count of negative feedback
     * @return neutral Count of neutral feedback (value = 0)
     */
    function getSentimentDistribution(
        address agentId
    ) external view returns (uint256 positive, uint256 negative, uint256 neutral) {
        AgentStats storage stats = agentStats[agentId];
        positive = stats.positiveFeedback;
        negative = stats.negativeFeedback;
        neutral = stats.totalFeedback - positive - negative;
        return (positive, negative, neutral);
    }

    /**
     * @notice Calculate reputation score with confidence interval
     * @param agentId Agent address
     * @return score Average score
     * @return confidence Confidence level (0-100) based on feedback count
     */
    function getReputationWithConfidence(
        address agentId
    ) external view returns (int256 score, uint256 confidence) {
        AgentStats storage stats = agentStats[agentId];
        uint256 count = stats.totalFeedback;
        
        if (count == 0) return (0, 0);
        
        score = stats.totalScore / int256(count);
        
        // Simple confidence calculation: caps at 100 after 50 reviews
        if (count >= 50) {
            confidence = 100;
        } else {
            confidence = (count * 100) / 50;
        }
        
        return (score, confidence);
    }

    /**
     * @notice Check if an address has given feedback to an agent
     * @param client Client address
     * @param agentId Agent address
     * @return True if feedback exists
     */
    function hasFeedback(address client, address agentId) external view returns (bool) {
        return _clientFeedbackIndices[client][agentId].length > 0;
    }

    /**
     * @notice Get feedback by category for an agent
     * @param agentId Agent address
     * @param category Category to filter by
     * @return Array of feedback in that category
     */
    function getFeedbackByCategory(
        address agentId,
        string calldata category
    ) external view returns (Feedback[] memory) {
        Feedback[] storage allFeedback = _agentFeedback[agentId];
        
        // Count matching feedback
        uint256 count = 0;
        uint256 length = allFeedback.length;
        for (uint256 i = 0; i < length; i++) {
            if (!allFeedback[i].isRevoked && 
                keccak256(bytes(allFeedback[i].tag1)) == keccak256(bytes(category))) {
                count++;
            }
        }

        // Build result
        Feedback[] memory result = new Feedback[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < count; i++) {
            if (!allFeedback[i].isRevoked && 
                keccak256(bytes(allFeedback[i].tag1)) == keccak256(bytes(category))) {
                result[idx] = allFeedback[i];
                idx++;
            }
        }

        return result;
    }

    /**
     * @notice Get recent feedback for an agent
     * @param agentId Agent address
     * @param since Timestamp to fetch feedback after
     * @return Array of recent feedback
     */
    function getRecentFeedback(
        address agentId,
        uint64 since
    ) external view returns (Feedback[] memory) {
        Feedback[] storage allFeedback = _agentFeedback[agentId];
        
        // Count recent feedback
        uint256 count = 0;
        uint256 length = allFeedback.length;
        for (uint256 i = 0; i < length; i++) {
            if (!allFeedback[i].isRevoked && allFeedback[i].timestamp >= since) {
                count++;
            }
        }

        // Build result
        Feedback[] memory result = new Feedback[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < count; i++) {
            if (!allFeedback[i].isRevoked && allFeedback[i].timestamp >= since) {
                result[idx] = allFeedback[i];
                idx++;
            }
        }

        return result;
    }

    /**
     * @notice Get top agents by category score
     * @dev Note: For large datasets, use off-chain indexing (The Graph, etc.)
     * @param category Category to rank by
     * @param agentList List of agents to consider
     * @param limit Maximum number of results
     * @return sortedAgents Array of agent addresses sorted by score (descending)
     * @return scores Corresponding scores
     */
    function getTopAgentsByCategory(
        string calldata category,
        address[] calldata agentList,
        uint256 limit
    ) external view returns (address[] memory sortedAgents, int256[] memory scores) {
        uint256 resultSize = agentList.length < limit ? agentList.length : limit;
        
        // Copy to memory arrays for sorting
        address[] memory agents = new address[](agentList.length);
        int256[] memory agentScores = new int256[](agentList.length);

        uint256 length = agentList.length;
        for (uint256 i = 0; i < length; i++) {
            agents[i] = agentList[i];
            // Use average score for better comparison
            uint256 count = categoryFeedbackCount[agentList[i]][category];
            if (count > 0) {
                agentScores[i] = categoryScores[agentList[i]][category] / int256(count);
            } else {
                agentScores[i] = 0;
            }
        }

        // Selection sort for top-k (more efficient than full bubble sort)
        for (uint256 i = 0; i < resultSize && i < agents.length; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < agents.length; j++) {
                if (agentScores[j] > agentScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            
            if (maxIdx != i) {
                // Swap scores
                int256 tempScore = agentScores[i];
                agentScores[i] = agentScores[maxIdx];
                agentScores[maxIdx] = tempScore;
                
                // Swap agents
                address tempAgent = agents[i];
                agents[i] = agents[maxIdx];
                agents[maxIdx] = tempAgent;
            }
        }

        // Return only top results
        sortedAgents = new address[](resultSize);
        scores = new int256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            sortedAgents[i] = agents[i];
            scores[i] = agentScores[i];
        }

        return (sortedAgents, scores);
    }

    // ============ Internal Functions ============

    /**
     * @dev Update agent statistics when feedback is added or removed
     * @param agentId Agent address
     * @param value Feedback value
     * @param valueDecimals Decimal places
     * @param category Category tag
     * @param isAdding True if adding feedback, false if removing
     */
    function _updateStats(
        address agentId,
        int128 value,
        uint8 valueDecimals,
        string memory category,
        bool isAdding
    ) private {
        AgentStats storage stats = agentStats[agentId];
        
        // Normalize to 2 decimals
        int256 normalizedValue = _normalizeValue(value, valueDecimals);
        
        if (isAdding) {
            stats.totalFeedback++;
            stats.totalScore += normalizedValue;
            
            if (value > 0) {
                stats.positiveFeedback++;
            } else if (value < 0) {
                stats.negativeFeedback++;
            }
            
            // Update category scores
            if (bytes(category).length > 0) {
                categoryScores[agentId][category] += normalizedValue;
                categoryFeedbackCount[agentId][category]++;
            }
        } else {
            if (stats.totalFeedback > 0) stats.totalFeedback--;
            stats.totalScore -= normalizedValue;
            
            if (value > 0 && stats.positiveFeedback > 0) {
                stats.positiveFeedback--;
            } else if (value < 0 && stats.negativeFeedback > 0) {
                stats.negativeFeedback--;
            }
            
            // Update category scores
            if (bytes(category).length > 0) {
                categoryScores[agentId][category] -= normalizedValue;
                if (categoryFeedbackCount[agentId][category] > 0) {
                    categoryFeedbackCount[agentId][category]--;
                }
            }
        }
        
        stats.lastUpdated = uint64(block.timestamp);
    }

    /**
     * @dev Normalize value to 2 decimal places
     * @param value Original value
     * @param decimals Original decimal places
     * @return Normalized value
     */
    function _normalizeValue(int128 value, uint8 decimals) private pure returns (int256) {
        int256 normalized = int256(value);
        
        if (decimals < 2) {
            normalized *= int256(10 ** (2 - decimals));
        } else if (decimals > 2) {
            normalized /= int256(10 ** (decimals - 2));
        }
        
        return normalized;
    }
}
