// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgentRegistry
 * @dev EIP-8004 inspired agent identity registry for VOISSS agent voice commentary network.
 * Agents register with metadata URI pointing to their configuration (voice, categories, pricing).
 */
contract AgentRegistry {
    // Custom Errors
    error NotAgent();
    error AgentAlreadyRegistered();
    error AgentNotRegistered();
    error InvalidMetadata();

    struct AgentProfile {
        address agentAddress;
        string metadataURI;      // IPFS or HTTPS link to agent config JSON
        string name;
        string[] categories;     // e.g., ["defi", "governance", "alpha"]
        uint256 registeredAt;
        bool isActive;
        bool x402Enabled;        // Whether agent accepts x402 payments
    }

    // agentAddress => profile
    mapping(address => AgentProfile) public agents;
    
    // category => agent addresses
    mapping(string => address[]) public agentsByCategory;
    
    // All registered agent addresses
    address[] public allAgents;

    uint256 public totalAgents;

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

    event CategoryAdded(address indexed agentAddress, string category);
    event CategoryRemoved(address indexed agentAddress, string category);

    /**
     * @dev Register as an agent on the VOISSS network.
     * @param name Agent display name
     * @param metadataURI URI to agent configuration (IPFS/HTTPS)
     * @param categories Array of category tags (e.g., ["defi", "governance"])
     * @param x402Enabled Whether agent supports x402 payments
     */
    function registerAgent(
        string calldata name,
        string calldata metadataURI,
        string[] calldata categories,
        bool x402Enabled
    ) external returns (bool) {
        if (bytes(name).length == 0) revert InvalidMetadata();
        if (agents[msg.sender].agentAddress != address(0)) revert AgentAlreadyRegistered();

        AgentProfile memory profile = AgentProfile({
            agentAddress: msg.sender,
            metadataURI: metadataURI,
            name: name,
            categories: categories,
            registeredAt: block.timestamp,
            isActive: true,
            x402Enabled: x402Enabled
        });

        agents[msg.sender] = profile;
        allAgents.push(msg.sender);
        totalAgents++;

        // Index by categories
        for (uint256 i = 0; i < categories.length; i++) {
            agentsByCategory[categories[i]].push(msg.sender);
        }

        emit AgentRegistered(msg.sender, name, metadataURI, x402Enabled);
        return true;
    }

    /**
     * @dev Update agent metadata and status.
     */
    function updateAgent(
        string calldata metadataURI,
        bool isActive
    ) external {
        AgentProfile storage profile = agents[msg.sender];
        if (profile.agentAddress == address(0)) revert AgentNotRegistered();

        profile.metadataURI = metadataURI;
        profile.isActive = isActive;

        emit AgentUpdated(msg.sender, metadataURI, isActive);
    }

    /**
     * @dev Add a new category to agent's profile.
     */
    function addCategory(string calldata category) external {
        AgentProfile storage profile = agents[msg.sender];
        if (profile.agentAddress == address(0)) revert AgentNotRegistered();

        // Check if category already exists
        for (uint256 i = 0; i < profile.categories.length; i++) {
            if (keccak256(bytes(profile.categories[i])) == keccak256(bytes(category))) {
                return; // Already exists
            }
        }

        profile.categories.push(category);
        agentsByCategory[category].push(msg.sender);

        emit CategoryAdded(msg.sender, category);
    }

    /**
     * @dev Remove a category from agent's profile.
     */
    function removeCategory(string calldata category) external {
        AgentProfile storage profile = agents[msg.sender];
        if (profile.agentAddress == address(0)) revert AgentNotRegistered();

        // Find and remove from profile.categories
        string[] storage cats = profile.categories;
        for (uint256 i = 0; i < cats.length; i++) {
            if (keccak256(bytes(cats[i])) == keccak256(bytes(category))) {
                // Swap with last element and pop
                cats[i] = cats[cats.length - 1];
                cats.pop();
                break;
            }
        }

        emit CategoryRemoved(msg.sender, category);
    }

    /**
     * @dev Get agent profile by address.
     */
    function getAgent(address agentAddress) external view returns (AgentProfile memory) {
        return agents[agentAddress];
    }

    /**
     * @dev Check if address is a registered agent.
     */
    function isAgent(address addr) external view returns (bool) {
        return agents[addr].agentAddress != address(0) && agents[addr].isActive;
    }

    /**
     * @dev Get all agents in a specific category.
     */
    function getAgentsByCategory(string calldata category) external view returns (address[] memory) {
        return agentsByCategory[category];
    }

    /**
     * @dev Get paginated list of all agents.
     */
    function getAllAgents(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 end = offset + limit;
        if (end > allAgents.length) end = allAgents.length;
        if (offset >= allAgents.length) return new address[](0);

        uint256 size = end - offset;
        address[] memory result = new address[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = allAgents[offset + i];
        }
        return result;
    }

    /**
     * @dev Get agents that support x402 payments.
     */
    function getX402Agents(uint256 offset, uint256 limit) external view returns (address[] memory) {
        // Count first
        uint256 count = 0;
        for (uint256 i = 0; i < allAgents.length; i++) {
            if (agents[allAgents[i]].x402Enabled) {
                count++;
            }
        }

        // Build result
        address[] memory result = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allAgents.length && idx < count; i++) {
            if (agents[allAgents[i]].x402Enabled) {
                result[idx] = allAgents[i];
                idx++;
            }
        }
        return result;
    }
}
