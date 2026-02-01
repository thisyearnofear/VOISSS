// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title AgentRegistry
 * @dev EIP-8004 inspired agent identity registry for VOISSS agent voice commentary network.
 * Agents register with metadata URI pointing to their configuration (voice, categories, pricing).
 * 
 * @notice This contract manages agent registration, profiles, and categorization with enhanced
 * security features and gas optimizations.
 */
contract AgentRegistry is Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Constants
    uint256 public constant MAX_CATEGORIES = 10;
    uint256 public constant MAX_CATEGORY_LENGTH = 32;
    uint256 public constant MAX_NAME_LENGTH = 64;
    uint256 public constant MAX_URI_LENGTH = 256;

    // Custom Errors
    error NotAgent();
    error AgentAlreadyRegistered();
    error AgentNotRegistered();
    error InvalidMetadata();
    error InvalidCategory();
    error TooManyCategories();
    error AgentBanned();
    error StringTooLong();

    struct AgentProfile {
        string metadataURI;      // IPFS or HTTPS link to agent config JSON
        string name;
        string[] categories;     // e.g., ["defi", "governance", "alpha"]
        uint256 registeredAt;
        bool isActive;
        bool x402Enabled;        // Whether agent accepts x402 payments
        bool isBanned;           // Admin can ban malicious agents
    }

    // State variables
    mapping(address => AgentProfile) public agents;
    mapping(string => EnumerableSet.AddressSet) private _agentsByCategory;
    address[] public allAgents;
    uint256 public totalAgents;
    uint256 public activeAgents;

    // Events
    event AgentRegistered(
        address indexed agentAddress,
        string name,
        string metadataURI,
        bool x402Enabled
    );

    event AgentUpdated(
        address indexed agentAddress,
        string metadataURI,
        bool isActive
    );

    event AgentDeregistered(address indexed agentAddress);

    event CategoryAdded(address indexed agentAddress, string category);
    
    event CategoryRemoved(address indexed agentAddress, string category);
    
    event X402StatusChanged(address indexed agentAddress, bool enabled);
    
    event AgentBanned(address indexed agentAddress, bool banned);

    /**
     * @dev Modifier to check if caller is a registered agent
     */
    modifier onlyAgent() {
        if (agents[msg.sender].registeredAt == 0) revert AgentNotRegistered();
        if (agents[msg.sender].isBanned) revert AgentBanned();
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register as an agent on the VOISSS network
     * @param name Agent display name
     * @param metadataURI URI to agent configuration (IPFS/HTTPS)
     * @param categories Array of category tags (e.g., ["defi", "governance"])
     * @param x402Enabled Whether agent supports x402 payments
     * @return success True if registration succeeded
     */
    function registerAgent(
        string calldata name,
        string calldata metadataURI,
        string[] calldata categories,
        bool x402Enabled
    ) external whenNotPaused returns (bool success) {
        // Validation
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) {
            revert InvalidMetadata();
        }
        if (bytes(metadataURI).length == 0 || bytes(metadataURI).length > MAX_URI_LENGTH) {
            revert InvalidMetadata();
        }
        if (agents[msg.sender].registeredAt != 0) {
            revert AgentAlreadyRegistered();
        }
        if (categories.length > MAX_CATEGORIES) {
            revert TooManyCategories();
        }

        // Validate categories
        _validateCategories(categories);

        // Create profile
        AgentProfile storage profile = agents[msg.sender];
        profile.metadataURI = metadataURI;
        profile.name = name;
        profile.registeredAt = block.timestamp;
        profile.isActive = true;
        profile.x402Enabled = x402Enabled;
        profile.isBanned = false;

        // Store categories
        uint256 length = categories.length;
        for (uint256 i = 0; i < length; i++) {
            profile.categories.push(categories[i]);
            _agentsByCategory[categories[i]].add(msg.sender);
        }

        allAgents.push(msg.sender);
        totalAgents++;
        activeAgents++;

        emit AgentRegistered(msg.sender, name, metadataURI, x402Enabled);
        return true;
    }

    /**
     * @notice Update agent metadata and active status
     * @param metadataURI New metadata URI
     * @param isActive New active status
     */
    function updateAgent(
        string calldata metadataURI,
        bool isActive
    ) external onlyAgent {
        if (bytes(metadataURI).length == 0 || bytes(metadataURI).length > MAX_URI_LENGTH) {
            revert InvalidMetadata();
        }

        AgentProfile storage profile = agents[msg.sender];
        bool wasActive = profile.isActive;
        
        profile.metadataURI = metadataURI;
        profile.isActive = isActive;

        // Update active count
        if (wasActive && !isActive) {
            activeAgents--;
        } else if (!wasActive && isActive) {
            activeAgents++;
        }

        emit AgentUpdated(msg.sender, metadataURI, isActive);
    }

    /**
     * @notice Update agent name
     * @param newName New agent name
     */
    function updateName(string calldata newName) external onlyAgent {
        if (bytes(newName).length == 0 || bytes(newName).length > MAX_NAME_LENGTH) {
            revert InvalidMetadata();
        }
        agents[msg.sender].name = newName;
    }

    /**
     * @notice Update x402 payment acceptance status
     * @param enabled Whether to accept x402 payments
     */
    function updateX402Status(bool enabled) external onlyAgent {
        agents[msg.sender].x402Enabled = enabled;
        emit X402StatusChanged(msg.sender, enabled);
    }

    /**
     * @notice Add a new category to agent's profile
     * @param category Category to add
     */
    function addCategory(string calldata category) external onlyAgent {
        AgentProfile storage profile = agents[msg.sender];
        
        if (profile.categories.length >= MAX_CATEGORIES) {
            revert TooManyCategories();
        }
        if (bytes(category).length == 0 || bytes(category).length > MAX_CATEGORY_LENGTH) {
            revert InvalidCategory();
        }

        // Check if category already exists
        uint256 length = profile.categories.length;
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(bytes(profile.categories[i])) == keccak256(bytes(category))) {
                return; // Already exists
            }
        }

        profile.categories.push(category);
        _agentsByCategory[category].add(msg.sender);

        emit CategoryAdded(msg.sender, category);
    }

    /**
     * @notice Remove a category from agent's profile
     * @param category Category to remove
     */
    function removeCategory(string calldata category) external onlyAgent {
        AgentProfile storage profile = agents[msg.sender];

        // Find and remove from profile.categories
        string[] storage cats = profile.categories;
        uint256 length = cats.length;
        bool found = false;
        
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(bytes(cats[i])) == keccak256(bytes(category))) {
                // Swap with last element and pop
                cats[i] = cats[length - 1];
                cats.pop();
                found = true;
                break;
            }
        }

        if (found) {
            // Remove from category mapping
            _agentsByCategory[category].remove(msg.sender);
            emit CategoryRemoved(msg.sender, category);
        }
    }

    /**
     * @notice Deregister from the VOISSS network
     * @dev This marks the agent as inactive but preserves the record
     */
    function deregisterAgent() external onlyAgent {
        AgentProfile storage profile = agents[msg.sender];
        
        if (profile.isActive) {
            profile.isActive = false;
            activeAgents--;
        }

        // Remove from all categories
        uint256 length = profile.categories.length;
        for (uint256 i = 0; i < length; i++) {
            _agentsByCategory[profile.categories[i]].remove(msg.sender);
        }

        emit AgentDeregistered(msg.sender);
    }

    /**
     * @notice Ban or unban an agent (admin only)
     * @param agentAddress Address of the agent
     * @param banned Whether to ban the agent
     */
    function setAgentBanStatus(address agentAddress, bool banned) external onlyOwner {
        AgentProfile storage profile = agents[agentAddress];
        if (profile.registeredAt == 0) revert AgentNotRegistered();

        bool wasBanned = profile.isBanned;
        profile.isBanned = banned;

        // Update active count if status changes
        if (!wasBanned && banned && profile.isActive) {
            activeAgents--;
        } else if (wasBanned && !banned && profile.isActive) {
            activeAgents++;
        }

        emit AgentBanned(agentAddress, banned);
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
     * @notice Get agent profile by address
     * @param agentAddress Address of the agent
     * @return Agent profile
     */
    function getAgent(address agentAddress) external view returns (AgentProfile memory) {
        return agents[agentAddress];
    }

    /**
     * @notice Check if address is a registered and active agent
     * @param addr Address to check
     * @return True if address is an active agent
     */
    function isAgent(address addr) external view returns (bool) {
        AgentProfile storage profile = agents[addr];
        return profile.registeredAt != 0 && profile.isActive && !profile.isBanned;
    }

    /**
     * @notice Get all agents in a specific category
     * @param category Category name
     * @return Array of agent addresses
     */
    function getAgentsByCategory(string calldata category) external view returns (address[] memory) {
        return _agentsByCategory[category].values();
    }

    /**
     * @notice Get active agents in a specific category
     * @param category Category name
     * @return Array of active agent addresses
     */
    function getActiveAgentsByCategory(string calldata category) external view returns (address[] memory) {
        address[] memory allCategoryAgents = _agentsByCategory[category].values();
        
        // Count active agents
        uint256 count = 0;
        uint256 length = allCategoryAgents.length;
        for (uint256 i = 0; i < length; i++) {
            if (agents[allCategoryAgents[i]].isActive && !agents[allCategoryAgents[i]].isBanned) {
                count++;
            }
        }

        // Build result
        address[] memory result = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < count; i++) {
            if (agents[allCategoryAgents[i]].isActive && !agents[allCategoryAgents[i]].isBanned) {
                result[idx] = allCategoryAgents[i];
                idx++;
            }
        }
        
        return result;
    }

    /**
     * @notice Get paginated list of all agents
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of agent addresses
     */
    function getAllAgents(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 end = offset + limit;
        uint256 totalLength = allAgents.length;
        
        if (end > totalLength) end = totalLength;
        if (offset >= totalLength) return new address[](0);

        uint256 size = end - offset;
        address[] memory result = new address[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = allAgents[offset + i];
        }
        
        return result;
    }

    /**
     * @notice Get paginated list of active agents
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of active agent addresses
     */
    function getActiveAgents(uint256 offset, uint256 limit) external view returns (address[] memory) {
        // Count active agents up to offset + limit
        uint256 count = 0;
        uint256 skipped = 0;
        uint256 totalLength = allAgents.length;
        
        address[] memory temp = new address[](limit);
        
        for (uint256 i = 0; i < totalLength && count < limit; i++) {
            AgentProfile storage profile = agents[allAgents[i]];
            if (profile.isActive && !profile.isBanned) {
                if (skipped >= offset) {
                    temp[count] = allAgents[i];
                    count++;
                } else {
                    skipped++;
                }
            }
        }

        // Create result array with actual size
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }

    /**
     * @notice Get agents that support x402 payments (paginated)
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of x402-enabled agent addresses
     */
    function getX402Agents(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 count = 0;
        uint256 skipped = 0;
        uint256 totalLength = allAgents.length;
        
        address[] memory temp = new address[](limit);
        
        for (uint256 i = 0; i < totalLength && count < limit; i++) {
            AgentProfile storage profile = agents[allAgents[i]];
            if (profile.x402Enabled && profile.isActive && !profile.isBanned) {
                if (skipped >= offset) {
                    temp[count] = allAgents[i];
                    count++;
                } else {
                    skipped++;
                }
            }
        }

        // Create result array with actual size
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }

    /**
     * @notice Get agents registered within a time range
     * @param startTime Start of time range (inclusive)
     * @param endTime End of time range (inclusive)
     * @return Array of agent addresses
     */
    function getAgentsByTimeRange(
        uint256 startTime,
        uint256 endTime
    ) external view returns (address[] memory) {
        // Count agents in range
        uint256 count = 0;
        uint256 totalLength = allAgents.length;
        
        for (uint256 i = 0; i < totalLength; i++) {
            uint256 regTime = agents[allAgents[i]].registeredAt;
            if (regTime >= startTime && regTime <= endTime) {
                count++;
            }
        }

        // Build result
        address[] memory result = new address[](count);
        uint256 idx = 0;
        
        for (uint256 i = 0; i < totalLength && idx < count; i++) {
            uint256 regTime = agents[allAgents[i]].registeredAt;
            if (regTime >= startTime && regTime <= endTime) {
                result[idx] = allAgents[i];
                idx++;
            }
        }
        
        return result;
    }

    /**
     * @notice Get number of agents in a category
     * @param category Category name
     * @return Number of agents
     */
    function getCategoryCount(string calldata category) external view returns (uint256) {
        return _agentsByCategory[category].length();
    }

    /**
     * @notice Check if an agent has a specific category
     * @param agentAddress Agent address
     * @param category Category to check
     * @return True if agent has the category
     */
    function agentHasCategory(
        address agentAddress,
        string calldata category
    ) external view returns (bool) {
        return _agentsByCategory[category].contains(agentAddress);
    }

    // ============ Internal Functions ============

    /**
     * @dev Validate categories array
     * @param categories Array of category strings to validate
     */
    function _validateCategories(string[] calldata categories) private pure {
        uint256 length = categories.length;
        for (uint256 i = 0; i < length; i++) {
            if (bytes(categories[i]).length == 0 || bytes(categories[i]).length > MAX_CATEGORY_LENGTH) {
                revert InvalidCategory();
            }
        }
    }
}
