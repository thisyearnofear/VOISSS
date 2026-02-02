// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AgentRegistry
 * @dev EIP-8004 inspired agent identity registry for VOISSS agent voice commentary network.
 * Agents register with metadata URI pointing to their configuration (voice, categories, pricing).
 * 
 * @notice This contract manages agent registration, profiles, and categorization with enhanced
 * security features and gas optimizations. Uses USDC for credits (not ETH).
 * 
 * CHANGELOG:
 * - v2.0.0: Migrated from ETH to USDC for credit balances
 * - Added usdcLocked for pending transactions
 * - Added totalSpent tracking
 * - Added deposit/withdraw events with USDC
 */
contract AgentRegistry is Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant MAX_CATEGORIES = 10;
    uint256 public constant MAX_CATEGORY_LENGTH = 32;
    uint256 public constant MAX_NAME_LENGTH = 64;
    uint256 public constant MAX_URI_LENGTH = 256;
    
    // USDC token contract (Base mainnet)
    IERC20 public immutable usdcToken;
    
    // Version
    string public constant VERSION = "2.0.0";

    // Custom Errors
    error NotAgent();
    error AgentAlreadyRegistered();
    error AgentNotRegistered();
    error InvalidMetadata();
    error InvalidCategory();
    error TooManyCategories();
    error AgentIsBanned();
    error StringTooLong();
    error InsufficientCredits();
    error CreditTransferFailed();
    error InvalidAmount();
    error USDCTransferFailed();
    error NotAuthorizedService();

    enum ServiceTier { Managed, Verified, Sovereign }

    struct AgentProfile {
        string metadataURI;      // IPFS or HTTPS link to agent config JSON
        string name;
        string[] categories;     // e.g., ["defi", "governance", "alpha"]
        uint256 registeredAt;
        bool isActive;
        bool x402Enabled;        // Whether agent accepts x402 payments
        bool isBanned;           // Admin can ban malicious agents
        ServiceTier tier;        // Managed | Verified | Sovereign
        uint256 usdcBalance;     // Prepaid credits in USDC (6 decimals)
        uint256 usdcLocked;      // Pending transaction amount
        uint256 totalSpent;      // Lifetime USDC spent
        address voiceProvider;   // Address of voice service (0x0 = VOISSS default)
    }

    // State variables
    mapping(address => AgentProfile) public agents;
    mapping(string => EnumerableSet.AddressSet) private _agentsByCategory;
    address[] public allAgents;
    uint256 public totalAgents;
    uint256 public activeAgents;
    
    // Authorized services that can deduct credits
    mapping(address => bool) public authorizedServices;
    
    // Total USDC held by contract
    uint256 public totalUSDCHeld;

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
    
    event AgentBanStatusChanged(address indexed agentAddress, bool banned);
    
    event CreditsDeposited(address indexed agentAddress, uint256 amount, uint256 newBalance);
    
    event CreditsWithdrawn(address indexed agentAddress, uint256 amount, uint256 newBalance);
    
    event CreditsDeducted(address indexed agentAddress, uint256 amount, uint256 newBalance, string service);
    
    event VoiceProviderChanged(address indexed agentAddress, address voiceProvider);
    
    event ServiceTierChanged(address indexed agentAddress, ServiceTier tier);
    
    event ServiceAuthorized(address indexed service, bool authorized);

    /**
     * @dev Modifier to check if caller is a registered agent
     */
    modifier onlyAgent() {
        if (agents[msg.sender].registeredAt == 0) revert AgentNotRegistered();
        if (agents[msg.sender].isBanned) revert AgentIsBanned();
        _;
    }
    
    /**
     * @dev Modifier to check if caller is an authorized service
     */
    modifier onlyAuthorizedService() {
        if (!authorizedServices[msg.sender]) revert NotAuthorizedService();
        _;
    }

    constructor(address _usdcToken) Ownable(msg.sender) {
        if (_usdcToken == address(0)) revert InvalidMetadata();
        usdcToken = IERC20(_usdcToken);
    }

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
        profile.tier = ServiceTier.Managed;
        profile.usdcBalance = 0;
        profile.usdcLocked = 0;
        profile.totalSpent = 0;
        profile.voiceProvider = address(0);

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

        emit AgentBanStatusChanged(agentAddress, banned);
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

    // ============ Credit Management (USDC) ============

    /**
     * @notice Deposit USDC credits for voice generation
     * @dev Agents must approve USDC transfer before calling
     * @param amount Amount of USDC to deposit (6 decimals)
     */
    function depositUSDC(uint256 amount) external onlyAgent {
        if (amount == 0) revert InvalidAmount();
        
        AgentProfile storage profile = agents[msg.sender];
        
        // Transfer USDC from agent to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        profile.usdcBalance += amount;
        totalUSDCHeld += amount;
        
        emit CreditsDeposited(msg.sender, amount, profile.usdcBalance);
    }

    /**
     * @notice Withdraw unused USDC credits
     * @param amount Amount to withdraw in USDC (6 decimals)
     */
    function withdrawUSDC(uint256 amount) external onlyAgent {
        AgentProfile storage profile = agents[msg.sender];
        
        if (amount > profile.usdcBalance) revert InsufficientCredits();
        
        profile.usdcBalance -= amount;
        totalUSDCHeld -= amount;
        
        // Transfer USDC back to agent
        usdcToken.safeTransfer(msg.sender, amount);
        
        emit CreditsWithdrawn(msg.sender, amount, profile.usdcBalance);
    }

    /**
     * @notice Deduct credits for service usage (called by authorized services only)
     * @param agentAddress Address of the agent
     * @param amount Amount to deduct in USDC (6 decimals)
     * @param serviceName Name of the service using credits
     */
    function deductCredits(
        address agentAddress,
        uint256 amount,
        string calldata serviceName
    ) external onlyAuthorizedService whenNotPaused {
        AgentProfile storage profile = agents[agentAddress];
        
        if (profile.registeredAt == 0) revert AgentNotRegistered();
        if (profile.isBanned) revert AgentIsBanned();
        if (!profile.isActive) revert AgentNotRegistered();
        if (amount > profile.usdcBalance) revert InsufficientCredits();
        
        profile.usdcBalance -= amount;
        profile.totalSpent += amount;
        totalUSDCHeld -= amount;
        
        // Transfer USDC to service or owner (depending on business logic)
        // For now, USDC stays in contract and owner can withdraw
        
        emit CreditsDeducted(agentAddress, amount, profile.usdcBalance, serviceName);
    }
    
    /**
     * @notice Lock credits for pending transaction (called by authorized services)
     * @param agentAddress Address of the agent
     * @param amount Amount to lock
     */
    function lockCredits(address agentAddress, uint256 amount) external onlyAuthorizedService {
        AgentProfile storage profile = agents[agentAddress];
        
        if (amount > profile.usdcBalance - profile.usdcLocked) revert InsufficientCredits();
        
        profile.usdcLocked += amount;
    }
    
    /**
     * @notice Unlock credits after transaction completes (called by authorized services)
     * @param agentAddress Address of the agent
     * @param amount Amount to unlock
     */
    function unlockCredits(address agentAddress, uint256 amount) external onlyAuthorizedService {
        AgentProfile storage profile = agents[agentAddress];
        
        if (amount > profile.usdcLocked) revert InvalidAmount();
        
        profile.usdcLocked -= amount;
    }
    
    /**
     * @notice Confirm deduction of locked credits (called by authorized services)
     * @param agentAddress Address of the agent
     * @param amount Amount to confirm
     * @param serviceName Name of the service
     */
    function confirmDeduction(
        address agentAddress,
        uint256 amount,
        string calldata serviceName
    ) external onlyAuthorizedService {
        AgentProfile storage profile = agents[agentAddress];
        
        if (amount > profile.usdcLocked) revert InvalidAmount();
        
        profile.usdcLocked -= amount;
        profile.totalSpent += amount;
        
        emit CreditsDeducted(agentAddress, amount, profile.usdcBalance, serviceName);
    }

    /**
     * @notice Set voice provider address (for sovereign agents)
     * @param provider Address of voice provider (0x0 for VOISSS default)
     */
    function setVoiceProvider(address provider) external onlyAgent {
        agents[msg.sender].voiceProvider = provider;
        emit VoiceProviderChanged(msg.sender, provider);
    }

    /**
     * @notice Admin function to upgrade agent tier
     * @param agentAddress Address of the agent
     * @param newTier New service tier
     */
    function setServiceTier(address agentAddress, ServiceTier newTier) external onlyOwner {
        AgentProfile storage profile = agents[agentAddress];
        if (profile.registeredAt == 0) revert AgentNotRegistered();
        
        profile.tier = newTier;
        emit ServiceTierChanged(agentAddress, newTier);
    }
    
    /**
     * @notice Authorize or deauthorize a service to deduct credits
     * @param service Address of the service
     * @param authorized Whether the service is authorized
     */
    function setServiceAuthorization(address service, bool authorized) external onlyOwner {
        authorizedServices[service] = authorized;
        emit ServiceAuthorized(service, authorized);
    }
    
    /**
     * @notice Withdraw accumulated USDC (admin only)
     * @param amount Amount to withdraw
     * @param recipient Address to receive USDC
     */
    function withdrawAccumulatedUSDC(uint256 amount, address recipient) external onlyOwner {
        if (recipient == address(0)) revert InvalidMetadata();
        if (amount > usdcToken.balanceOf(address(this))) revert InsufficientCredits();
        
        usdcToken.safeTransfer(recipient, amount);
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
     * @notice Get agent's available USDC balance (excluding locked)
     * @param agentAddress Address of the agent
     * @return Available balance in USDC (6 decimals)
     */
    function getAvailableUSDC(address agentAddress) external view returns (uint256) {
        AgentProfile storage profile = agents[agentAddress];
        return profile.usdcBalance - profile.usdcLocked;
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
