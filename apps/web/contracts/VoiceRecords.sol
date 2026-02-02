// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title VoiceRecords
 * @dev Secure registry for VOISSS AI voice transformations.
 * 
 * @notice This contract manages voice recordings with IPFS storage, categorization,
 * pricing, and agent-specific content with comprehensive access controls.
 */
contract VoiceRecords is Ownable, Pausable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    // Constants
    uint256 public constant MAX_TITLE_LENGTH = 128;
    uint256 public constant MAX_METADATA_LENGTH = 2048;
    uint256 public constant MAX_CATEGORY_LENGTH = 32;
    uint256 public constant MAX_IPFS_HASH_LENGTH = 128;

    // Custom Errors (Gas-efficient)
    error NotOwner();
    error RecordingNotFound();
    error EmptyInput();
    error Unauthorized();
    error InvalidInput();
    error StringTooLong();
    error RecordingIsDeleted();
    error PaymentRequired();
    error InvalidPrice();

    struct Recording {
        address owner;
        string ipfsHash;
        string title;
        string metadata;       // For AI summaries, tags, or template IDs
        bool isPublic;
        uint256 timestamp;
        bool isAgentContent;
        string category;       // e.g., "defi", "governance", "alpha"
        uint256 x402Price;     // 0 = free, otherwise price in wei
        address agentId;       // For agent-authored content
        bool isDeleted;        // Soft delete flag
        uint256 views;         // View counter
        uint256 lastModified;  // Last update timestamp
    }

    // State variables
    mapping(uint256 => Recording) private _recordings;
    mapping(address => EnumerableSet.UintSet) private _userRecordings;
    mapping(string => EnumerableSet.UintSet) private _categoryRecordings;
    EnumerableSet.UintSet private _agentRecordings;
    EnumerableSet.UintSet private _publicRecordings;
    
    // Access tracking for paid content
    mapping(uint256 => mapping(address => bool)) public hasAccess;
    mapping(uint256 => uint256) public recordingRevenue;
    
    uint256 public totalRecordings;
    uint256 public platformFeePercent = 5; // 5% platform fee
    uint256 public accumulatedFees;

    // Optional: Integration with AgentRegistry
    address public agentRegistry;
    bool public requireRegisteredAgents;

    // Events
    event RecordingSaved(
        uint256 indexed recordingId,
        address indexed owner,
        string ipfsHash,
        string title,
        bool isPublic,
        bool isAgentContent,
        string category
    );
    
    event RecordingUpdated(
        uint256 indexed recordingId,
        string title,
        bool isPublic
    );
    
    event MetadataUpdated(
        uint256 indexed recordingId,
        string metadata
    );
    
    event RecordingDeleted(
        uint256 indexed recordingId
    );
    
    event RecordingViewed(
        uint256 indexed recordingId,
        address indexed viewer
    );
    
    event AccessGranted(
        uint256 indexed recordingId,
        address indexed user,
        uint256 price
    );
    
    event PriceUpdated(
        uint256 indexed recordingId,
        uint256 newPrice
    );

    event CategoryChanged(
        uint256 indexed recordingId,
        string oldCategory,
        string newCategory
    );

    event AgentRegistrySet(address indexed registry);
    
    event PlatformFeeUpdated(uint256 newFeePercent);
    
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    /**
     * @notice Constructor
     * @param initialOwner Address of the contract owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set the AgentRegistry contract address
     * @param registry Address of the AgentRegistry contract
     * @param required Whether to require agent registration
     */
    function setAgentRegistry(address registry, bool required) external onlyOwner {
        agentRegistry = registry;
        requireRegisteredAgents = required;
        emit AgentRegistrySet(registry);
    }

    /**
     * @notice Set platform fee percentage
     * @param feePercent New fee percentage (0-100)
     */
    function setPlatformFee(uint256 feePercent) external onlyOwner {
        if (feePercent > 100) revert InvalidInput();
        platformFeePercent = feePercent;
        emit PlatformFeeUpdated(feePercent);
    }

    /**
     * @notice Withdraw accumulated platform fees
     * @param recipient Address to receive fees
     */
    function withdrawFees(address payable recipient) external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        if (amount == 0) revert InvalidInput();
        
        accumulatedFees = 0;
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FeesWithdrawn(recipient, amount);
    }

    /**
     * @notice Saves a new voice recording entry
     * @param ipfsHash The IPFS CID for the audio file
     * @param title Display title for the recording
     * @param metadata JSON or raw string for extra AI data (summaries, tags)
     * @param isPublic Whether the recording is visible to others
     * @param isAgentContent Whether this is agent-authored content
     * @param category Category tag for discovery (e.g., "defi", "governance")
     * @param x402Price Price to access this content (0 = free)
     * @return recordingId The unique ID of the newly created recording
     */
    function saveRecording(
        string calldata ipfsHash,
        string calldata title,
        string calldata metadata,
        bool isPublic,
        bool isAgentContent,
        string calldata category,
        uint256 x402Price
    ) external whenNotPaused returns (uint256 recordingId) {
        // Validation
        if (bytes(ipfsHash).length == 0 || bytes(ipfsHash).length > MAX_IPFS_HASH_LENGTH) {
            revert InvalidInput();
        }
        if (bytes(title).length == 0 || bytes(title).length > MAX_TITLE_LENGTH) {
            revert InvalidInput();
        }
        if (bytes(metadata).length > MAX_METADATA_LENGTH) {
            revert StringTooLong();
        }
        if (bytes(category).length > MAX_CATEGORY_LENGTH) {
            revert StringTooLong();
        }

        // Verify agent registration if required
        if (isAgentContent && requireRegisteredAgents && agentRegistry != address(0)) {
            (bool success, bytes memory data) = agentRegistry.staticcall(
                abi.encodeWithSignature("isAgent(address)", msg.sender)
            );
            if (!success || !abi.decode(data, (bool))) {
                revert Unauthorized();
            }
        }

        totalRecordings++;
        recordingId = totalRecordings;

        _recordings[recordingId] = Recording({
            owner: msg.sender,
            ipfsHash: ipfsHash,
            title: title,
            metadata: metadata,
            isPublic: isPublic,
            timestamp: block.timestamp,
            isAgentContent: isAgentContent,
            category: category,
            x402Price: x402Price,
            agentId: isAgentContent ? msg.sender : address(0),
            isDeleted: false,
            views: 0,
            lastModified: block.timestamp
        });

        _userRecordings[msg.sender].add(recordingId);

        // Track by category if specified
        if (bytes(category).length > 0) {
            _categoryRecordings[category].add(recordingId);
        }

        // Track agent content
        if (isAgentContent) {
            _agentRecordings.add(recordingId);
        }

        // Track public recordings
        if (isPublic) {
            _publicRecordings.add(recordingId);
        }

        // Owner always has access
        hasAccess[recordingId][msg.sender] = true;

        emit RecordingSaved(recordingId, msg.sender, ipfsHash, title, isPublic, isAgentContent, category);
    }

    /**
     * @notice Update the title or visibility of a recording
     * @param recordingId Recording ID
     * @param title New title
     * @param isPublic New visibility status
     */
    function updateRecording(
        uint256 recordingId,
        string calldata title,
        bool isPublic
    ) external whenNotPaused {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner == address(0)) revert RecordingNotFound();
        if (recording.owner != msg.sender) revert NotOwner();
        if (recording.isDeleted) revert RecordingIsDeleted();
        if (bytes(title).length == 0 || bytes(title).length > MAX_TITLE_LENGTH) {
            revert InvalidInput();
        }

        bool wasPublic = recording.isPublic;
        recording.title = title;
        recording.isPublic = isPublic;
        recording.lastModified = block.timestamp;

        // Update public recordings tracking
        if (wasPublic && !isPublic) {
            _publicRecordings.remove(recordingId);
        } else if (!wasPublic && isPublic) {
            _publicRecordings.add(recordingId);
        }

        emit RecordingUpdated(recordingId, title, isPublic);
    }

    /**
     * @notice Update metadata separately (e.g., adding AI tags later)
     * @param recordingId Recording ID
     * @param metadata New metadata
     */
    function updateMetadata(
        uint256 recordingId,
        string calldata metadata
    ) external whenNotPaused {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner != msg.sender) revert NotOwner();
        if (recording.isDeleted) revert RecordingIsDeleted();
        if (bytes(metadata).length > MAX_METADATA_LENGTH) {
            revert StringTooLong();
        }

        recording.metadata = metadata;
        recording.lastModified = block.timestamp;
        
        emit MetadataUpdated(recordingId, metadata);
    }

    /**
     * @notice Update the category of a recording
     * @param recordingId Recording ID
     * @param newCategory New category
     */
    function updateCategory(
        uint256 recordingId,
        string calldata newCategory
    ) external whenNotPaused {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner != msg.sender) revert NotOwner();
        if (recording.isDeleted) revert RecordingIsDeleted();
        if (bytes(newCategory).length > MAX_CATEGORY_LENGTH) {
            revert StringTooLong();
        }

        string memory oldCategory = recording.category;
        
        // Remove from old category
        if (bytes(oldCategory).length > 0) {
            _categoryRecordings[oldCategory].remove(recordingId);
        }
        
        // Add to new category
        if (bytes(newCategory).length > 0) {
            _categoryRecordings[newCategory].add(recordingId);
        }

        recording.category = newCategory;
        recording.lastModified = block.timestamp;
        
        emit CategoryChanged(recordingId, oldCategory, newCategory);
    }

    /**
     * @notice Update the price of a recording
     * @param recordingId Recording ID
     * @param newPrice New price in wei
     */
    function updatePrice(
        uint256 recordingId,
        uint256 newPrice
    ) external whenNotPaused {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner != msg.sender) revert NotOwner();
        if (recording.isDeleted) revert RecordingIsDeleted();

        recording.x402Price = newPrice;
        recording.lastModified = block.timestamp;
        
        emit PriceUpdated(recordingId, newPrice);
    }

    /**
     * @notice Soft delete a recording (preserves data but marks as deleted)
     * @param recordingId Recording ID
     */
    function deleteRecording(uint256 recordingId) external {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner != msg.sender) revert NotOwner();
        if (recording.isDeleted) revert RecordingIsDeleted();

        recording.isDeleted = true;
        recording.lastModified = block.timestamp;

        // Remove from tracking sets
        if (recording.isPublic) {
            _publicRecordings.remove(recordingId);
        }
        if (recording.isAgentContent) {
            _agentRecordings.remove(recordingId);
        }
        if (bytes(recording.category).length > 0) {
            _categoryRecordings[recording.category].remove(recordingId);
        }

        emit RecordingDeleted(recordingId);
    }

    /**
     * @notice Purchase access to a paid recording
     * @param recordingId Recording ID
     */
    function purchaseAccess(uint256 recordingId) external payable whenNotPaused nonReentrant {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner == address(0)) revert RecordingNotFound();
        if (recording.isDeleted) revert RecordingIsDeleted();
        if (recording.x402Price == 0) revert InvalidPrice();
        if (msg.value < recording.x402Price) revert PaymentRequired();
        if (hasAccess[recordingId][msg.sender]) revert InvalidInput(); // Already has access

        // Calculate platform fee
        uint256 fee = (msg.value * platformFeePercent) / 100;
        uint256 creatorAmount = msg.value - fee;

        // Update state
        hasAccess[recordingId][msg.sender] = true;
        recordingRevenue[recordingId] += msg.value;
        accumulatedFees += fee;

        // Transfer to creator
        (bool success, ) = payable(recording.owner).call{value: creatorAmount}("");
        require(success, "Transfer failed");

        // Refund excess payment
        if (msg.value > recording.x402Price) {
            uint256 refund = msg.value - recording.x402Price;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            require(refundSuccess, "Refund failed");
        }

        emit AccessGranted(recordingId, msg.sender, recording.x402Price);
    }

    /**
     * @notice Grant free access to a user (owner only)
     * @param recordingId Recording ID
     * @param user User address
     */
    function grantAccess(uint256 recordingId, address user) external {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner != msg.sender) revert NotOwner();
        if (recording.isDeleted) revert RecordingIsDeleted();

        hasAccess[recordingId][user] = true;
        emit AccessGranted(recordingId, user, 0);
    }

    /**
     * @notice Revoke access from a user (owner only)
     * @param recordingId Recording ID
     * @param user User address
     */
    function revokeAccess(uint256 recordingId, address user) external {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner != msg.sender) revert NotOwner();
        if (user == recording.owner) revert Unauthorized(); // Can't revoke owner access

        hasAccess[recordingId][user] = false;
    }

    /**
     * @notice Increment view counter (called when recording is played)
     * @param recordingId Recording ID
     */
    function recordView(uint256 recordingId) external {
        Recording storage recording = _recordings[recordingId];
        
        if (recording.owner == address(0)) revert RecordingNotFound();
        if (recording.isDeleted) revert RecordingIsDeleted();
        
        // Check access for non-public recordings
        if (!recording.isPublic && !hasAccess[recordingId][msg.sender]) {
            revert Unauthorized();
        }

        recording.views++;
        emit RecordingViewed(recordingId, msg.sender);
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
     * @notice Get all recording IDs for a specific user
     * @param user User address
     * @return Array of recording IDs
     */
    function getUserRecordings(address user) external view returns (uint256[] memory) {
        return _userRecordings[user].values();
    }

    /**
     * @notice Get paginated recording IDs for a user
     * @param user User address
     * @param offset Starting index
     * @param limit Maximum results
     * @return Array of recording IDs
     */
    function getUserRecordingsPaged(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256[] memory allRecordings = _userRecordings[user].values();
        uint256 userCount = allRecordings.length;
        
        if (offset >= userCount) return new uint256[](0);
        
        uint256 end = offset + limit;
        if (end > userCount) end = userCount;
        
        uint256 size = end - offset;
        uint256[] memory page = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = allRecordings[offset + i];
        }
        return page;
    }

    /**
     * @notice Get active (non-deleted) recordings for a user
     * @param user User address
     * @return Array of recording IDs
     */
    function getUserActiveRecordings(address user) external view returns (uint256[] memory) {
        uint256[] memory allRecordings = _userRecordings[user].values();
        
        // Count active
        uint256 activeCount = 0;
        uint256 length = allRecordings.length;
        for (uint256 i = 0; i < length; i++) {
            if (!_recordings[allRecordings[i]].isDeleted) {
                activeCount++;
            }
        }

        // Build result
        uint256[] memory result = new uint256[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < activeCount; i++) {
            if (!_recordings[allRecordings[i]].isDeleted) {
                result[idx] = allRecordings[i];
                idx++;
            }
        }
        
        return result;
    }

    /**
     * @notice Fetch recording details
     * @param recordingId Recording ID
     * @return Recording struct
     */
    function getRecording(uint256 recordingId) external view returns (Recording memory) {
        Recording memory recording = _recordings[recordingId];
        if (recording.owner == address(0)) revert RecordingNotFound();
        
        // Privacy check for non-deleted, private recordings
        if (!recording.isDeleted && !recording.isPublic && 
            recording.owner != msg.sender && !hasAccess[recordingId][msg.sender]) {
            revert Unauthorized();
        }

        return recording;
    }

    /**
     * @notice Get basic recording info (doesn't check authorization)
     * @param recordingId Recording ID
     * @return owner Owner address
     * @return title Recording title
     * @return isPublic Public status
     * @return x402Price Price in wei
     * @return views View count
     */
    function getRecordingInfo(uint256 recordingId) external view returns (
        address owner,
        string memory title,
        bool isPublic,
        uint256 x402Price,
        uint256 views
    ) {
        Recording memory recording = _recordings[recordingId];
        if (recording.owner == address(0)) revert RecordingNotFound();
        
        return (
            recording.owner,
            recording.title,
            recording.isPublic,
            recording.x402Price,
            recording.views
        );
    }

    /**
     * @notice Check if user has access to a recording
     * @param recordingId Recording ID
     * @param user User address
     * @return True if user has access
     */
    function checkAccess(uint256 recordingId, address user) external view returns (bool) {
        Recording memory recording = _recordings[recordingId];
        if (recording.owner == address(0)) revert RecordingNotFound();
        
        return recording.isPublic || hasAccess[recordingId][user];
    }

    /**
     * @notice Get total recording count
     * @return Total recordings
     */
    function getTotalRecordings() external view returns (uint256) {
        return totalRecordings;
    }

    /**
     * @notice Get all public recording IDs
     * @return Array of recording IDs
     */
    function getPublicRecordings() external view returns (uint256[] memory) {
        return _publicRecordings.values();
    }

    /**
     * @notice Get paginated public recordings
     * @param offset Starting index
     * @param limit Maximum results
     * @return Array of recording IDs
     */
    function getPublicRecordingsPaged(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256[] memory allPublic = _publicRecordings.values();
        uint256 totalCount = allPublic.length;
        
        if (offset >= totalCount) return new uint256[](0);
        
        uint256 end = offset + limit;
        if (end > totalCount) end = totalCount;
        
        uint256 size = end - offset;
        uint256[] memory page = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = allPublic[offset + i];
        }
        return page;
    }

    /**
     * @notice Get all recording IDs in a specific category
     * @param category Category tag
     * @return Array of recording IDs
     */
    function getRecordingsByCategory(string calldata category) external view returns (uint256[] memory) {
        return _categoryRecordings[category].values();
    }

    /**
     * @notice Get public recordings in a specific category
     * @param category Category tag
     * @return Array of recording IDs
     */
    function getPublicRecordingsByCategory(string calldata category) external view returns (uint256[] memory) {
        uint256[] memory categoryIds = _categoryRecordings[category].values();
        
        // Count public recordings
        uint256 publicCount = 0;
        uint256 length = categoryIds.length;
        for (uint256 i = 0; i < length; i++) {
            Recording storage rec = _recordings[categoryIds[i]];
            if (rec.isPublic && !rec.isDeleted) {
                publicCount++;
            }
        }
        
        // Build result
        uint256[] memory result = new uint256[](publicCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < publicCount; i++) {
            Recording storage rec = _recordings[categoryIds[i]];
            if (rec.isPublic && !rec.isDeleted) {
                result[idx] = categoryIds[i];
                idx++;
            }
        }
        
        return result;
    }

    /**
     * @notice Get all agent-authored recordings
     * @return Array of recording IDs
     */
    function getAgentRecordings() external view returns (uint256[] memory) {
        return _agentRecordings.values();
    }

    /**
     * @notice Get public agent-authored recordings
     * @return Array of recording IDs
     */
    function getPublicAgentRecordings() external view returns (uint256[] memory) {
        uint256[] memory agentIds = _agentRecordings.values();
        
        // Count public
        uint256 publicCount = 0;
        uint256 length = agentIds.length;
        for (uint256 i = 0; i < length; i++) {
            Recording storage rec = _recordings[agentIds[i]];
            if (rec.isPublic && !rec.isDeleted) {
                publicCount++;
            }
        }
        
        // Build result
        uint256[] memory result = new uint256[](publicCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < length && idx < publicCount; i++) {
            Recording storage rec = _recordings[agentIds[i]];
            if (rec.isPublic && !rec.isDeleted) {
                result[idx] = agentIds[i];
                idx++;
            }
        }
        
        return result;
    }

    /**
     * @notice Get recordings by a specific agent address
     * @param agent Agent address
     * @return Array of recording IDs
     */
    function getRecordingsByAgent(address agent) external view returns (uint256[] memory) {
        return _userRecordings[agent].values();
    }

    /**
     * @notice Get top recordings by views in a category
     * @param category Category tag
     * @param limit Maximum results
     * @return recordingIds Array of recording IDs
     * @return viewCounts Array of view counts
     */
    function getTopRecordingsByCategory(
        string calldata category,
        uint256 limit
    ) external view returns (uint256[] memory recordingIds, uint256[] memory viewCounts) {
        uint256[] memory categoryIds = _categoryRecordings[category].values();
        
        // Filter public, non-deleted
        uint256 validCount = 0;
        uint256 length = categoryIds.length;
        for (uint256 i = 0; i < length; i++) {
            Recording storage rec = _recordings[categoryIds[i]];
            if (rec.isPublic && !rec.isDeleted) {
                validCount++;
            }
        }

        // Create temp arrays
        uint256[] memory tempIds = new uint256[](validCount);
        uint256[] memory tempViews = new uint256[](validCount);
        uint256 idx = 0;
        
        for (uint256 i = 0; i < length && idx < validCount; i++) {
            Recording storage rec = _recordings[categoryIds[i]];
            if (rec.isPublic && !rec.isDeleted) {
                tempIds[idx] = categoryIds[i];
                tempViews[idx] = rec.views;
                idx++;
            }
        }

        // Sort by views (selection sort for top-k)
        uint256 resultSize = validCount < limit ? validCount : limit;
        for (uint256 i = 0; i < resultSize && i < validCount; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < validCount; j++) {
                if (tempViews[j] > tempViews[maxIdx]) {
                    maxIdx = j;
                }
            }
            
            if (maxIdx != i) {
                // Swap
                (tempViews[i], tempViews[maxIdx]) = (tempViews[maxIdx], tempViews[i]);
                (tempIds[i], tempIds[maxIdx]) = (tempIds[maxIdx], tempIds[i]);
            }
        }

        // Return top results
        recordingIds = new uint256[](resultSize);
        viewCounts = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            recordingIds[i] = tempIds[i];
            viewCounts[i] = tempViews[i];
        }

        return (recordingIds, viewCounts);
    }

    /**
     * @notice Get recordings by time range
     * @param startTime Start timestamp
     * @param endTime End timestamp
     * @return Array of recording IDs
     */
    function getRecordingsByTimeRange(
        uint256 startTime,
        uint256 endTime
    ) external view returns (uint256[] memory) {
        // This is a simplified version - in production, use events and off-chain indexing
        uint256[] memory result = new uint256[](totalRecordings);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalRecordings; i++) {
            Recording storage rec = _recordings[i];
            if (rec.owner != address(0) && !rec.isDeleted &&
                rec.timestamp >= startTime && rec.timestamp <= endTime) {
                result[count] = i;
                count++;
            }
        }

        // Resize
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }

    /**
     * @notice Get revenue statistics for a recording
     * @param recordingId Recording ID
     * @return totalRevenue Total revenue generated
     * @return accessCount Number of users with access
     */
    function getRecordingRevenue(uint256 recordingId) external view returns (
        uint256 totalRevenue,
        uint256 accessCount
    ) {
        Recording memory recording = _recordings[recordingId];
        if (recording.owner != msg.sender) revert Unauthorized();
        
        totalRevenue = recordingRevenue[recordingId];
        
        // Note: In production, track access count separately for efficiency
        accessCount = 0; // Placeholder - would need separate tracking
        
        return (totalRevenue, accessCount);
    }

    /**
     * @notice Get category count
     * @param category Category tag
     * @return Number of recordings in category
     */
    function getCategoryCount(string calldata category) external view returns (uint256) {
        return _categoryRecordings[category].length();
    }

    /**
     * @notice Check if recording exists and is not deleted
     * @param recordingId Recording ID
     * @return True if recording exists and is active
     */
    function isActiveRecording(uint256 recordingId) external view returns (bool) {
        Recording memory recording = _recordings[recordingId];
        return recording.owner != address(0) && !recording.isDeleted;
    }
}
