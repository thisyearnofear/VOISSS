// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IVoiceProvider.sol";

/**
 * @title VoisssVoiceProvider
 * @dev Default VOISSS voice provider using ElevenLabs integration
 * Handles voice generation requests and manages pricing/quality
 */
contract VoisssVoiceProvider is IVoiceProvider, Ownable, Pausable, ReentrancyGuard {
    // Constants
    uint256 public constant BASE_COST_PER_CHARACTER = 0.0001 ether; // 0.0001 ETH per character
    uint256 public constant MAX_TEXT_LENGTH = 5000; // Maximum characters per request
    uint256 public constant MIN_STAKE_AMOUNT = 1 ether; // Minimum stake for providers
    
    // State variables
    string public providerName;
    uint256 public costPerCharacter;
    uint256 public totalGenerated;
    uint256 public totalRevenue;
    mapping(string => bool) public supportedVoices;
    string[] public voiceList;
    
    // Quality tracking
    mapping(bytes32 => uint256) public generationRatings; // requestId => rating
    uint256 public totalRatings;
    uint256 public averageRating;
    
    // Events
    event CostPerCharacterUpdated(uint256 newCost);
    event VoiceAdded(string voiceId);
    event VoiceRemoved(string voiceId);
    event QualityRated(bytes32 indexed requestId, uint256 rating);

    // Custom errors
    error TextTooLong();
    error UnsupportedVoice();
    error InsufficientPayment();
    error GenerationFailed();
    error InvalidRating();

    constructor(string memory _providerName) Ownable(msg.sender) {
        providerName = _providerName;
        costPerCharacter = BASE_COST_PER_CHARACTER;
        averageRating = 85; // Start with good rating
        
        // Add default ElevenLabs voices
        _addVoice("21m00Tcm4TlvDq8ikWAM"); // Rachel
        _addVoice("AZnzlk1XvdvUeBnXmlld"); // Domi
        _addVoice("EXAVITQu4vr4xnSDxMaL"); // Bella
        _addVoice("ErXwobaYiN019PkySvjV"); // Antoni
        _addVoice("MF3mGyEYCl7XYWbV9V6O"); // Elli
        _addVoice("TxGEqnHWrfWFTfGW9XjX"); // Josh
        _addVoice("VR6AewLTigWG4xSOukaG"); // Arnold
        _addVoice("pNInz6obpgDQGcFmaJgB"); // Adam
        _addVoice("yoZ06aMxZJJ28mfd3POQ"); // Sam
    }

    /**
     * @notice Generate voice audio from text
     * @param request Voice generation parameters
     * @return result Generation result with content hash and cost
     */
    function generate(VoiceGenerationRequest calldata request) 
        external 
        payable 
        whenNotPaused 
        nonReentrant
        returns (VoiceGenerationResult memory result) 
    {
        // Validate input
        if (bytes(request.text).length > MAX_TEXT_LENGTH) revert TextTooLong();
        if (!supportedVoices[request.voiceId]) revert UnsupportedVoice();
        
        // Calculate cost
        uint256 characterCount = bytes(request.text).length;
        uint256 totalCost = characterCount * costPerCharacter;
        
        if (msg.value < totalCost) revert InsufficientPayment();
        
        // For now, we'll simulate the generation and return a mock result
        // In production, this would integrate with ElevenLabs API via oracle or off-chain service
        bytes32 contentHash = keccak256(abi.encodePacked(
            request.text,
            request.voiceId,
            request.agentAddress,
            block.timestamp
        ));
        
        // Update statistics
        totalGenerated++;
        totalRevenue += totalCost;
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        // Emit event
        emit VoiceGenerated(request.agentAddress, contentHash, totalCost, characterCount);
        
        return VoiceGenerationResult({
            contentHash: contentHash,
            cost: totalCost,
            characterCount: characterCount,
            audioUrl: string(abi.encodePacked("https://ipfs.io/ipfs/", _bytes32ToString(contentHash))),
            success: true,
            errorMessage: ""
        });
    }

    /**
     * @notice Validate if a voice ID is supported by this provider
     * @param voiceId Voice identifier to validate
     * @return isValid True if voice is supported
     */
    function validateVoice(string calldata voiceId) 
        external 
        view 
        returns (bool isValid) 
    {
        return supportedVoices[voiceId];
    }

    /**
     * @notice Get cost estimate for text generation
     * @param text Text to estimate cost for
     * @param voiceId Voice identifier (unused in current implementation)
     * @return estimatedCost Cost in wei
     */
    function estimateCost(string calldata text, string calldata voiceId) 
        external 
        view 
        returns (uint256 estimatedCost) 
    {
        if (!supportedVoices[voiceId]) revert UnsupportedVoice();
        return bytes(text).length * costPerCharacter;
    }

    /**
     * @notice Get provider information
     * @return info Provider details and statistics
     */
    function getProviderInfo() 
        external 
        view 
        returns (ProviderInfo memory info) 
    {
        return ProviderInfo({
            name: providerName,
            providerAddress: address(this),
            stakeAmount: address(this).balance, // Use contract balance as stake
            costPerCharacter: costPerCharacter,
            isActive: !paused(),
            totalGenerated: totalGenerated,
            averageRating: averageRating
        });
    }

    /**
     * @notice Get supported voice IDs
     * @return voiceIds Array of supported voice identifiers
     */
    function getSupportedVoices() 
        external 
        view 
        returns (string[] memory voiceIds) 
    {
        return voiceList;
    }

    /**
     * @notice Check if provider is currently available
     * @return isAvailable True if accepting new requests
     */
    function isAvailable() 
        external 
        view 
        returns (bool isAvailable) 
    {
        return !paused();
    }

    // ============ Admin Functions ============

    /**
     * @notice Update cost per character (admin only)
     * @param newCost New cost in wei per character
     */
    function setCostPerCharacter(uint256 newCost) external onlyOwner {
        costPerCharacter = newCost;
        emit CostPerCharacterUpdated(newCost);
    }

    /**
     * @notice Add supported voice (admin only)
     * @param voiceId ElevenLabs voice ID to add
     */
    function addVoice(string calldata voiceId) external onlyOwner {
        _addVoice(voiceId);
    }

    /**
     * @notice Remove supported voice (admin only)
     * @param voiceId Voice ID to remove
     */
    function removeVoice(string calldata voiceId) external onlyOwner {
        if (!supportedVoices[voiceId]) return;
        
        supportedVoices[voiceId] = false;
        
        // Remove from voiceList array
        for (uint256 i = 0; i < voiceList.length; i++) {
            if (keccak256(bytes(voiceList[i])) == keccak256(bytes(voiceId))) {
                voiceList[i] = voiceList[voiceList.length - 1];
                voiceList.pop();
                break;
            }
        }
        
        emit VoiceRemoved(voiceId);
    }

    /**
     * @notice Rate the quality of a generation (admin only for now)
     * @param requestId Request ID to rate
     * @param rating Quality rating (0-100)
     */
    function rateGeneration(bytes32 requestId, uint256 rating) external onlyOwner {
        if (rating > 100) revert InvalidRating();
        
        // Update average rating
        if (generationRatings[requestId] == 0) {
            // New rating
            totalRatings++;
            averageRating = ((averageRating * (totalRatings - 1)) + rating) / totalRatings;
        } else {
            // Update existing rating
            uint256 oldRating = generationRatings[requestId];
            averageRating = ((averageRating * totalRatings) - oldRating + rating) / totalRatings;
        }
        
        generationRatings[requestId] = rating;
        emit QualityRated(requestId, rating);
    }

    /**
     * @notice Withdraw accumulated revenue (admin only)
     * @param amount Amount to withdraw
     */
    function withdrawRevenue(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    /**
     * @notice Pause the provider (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the provider (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    /**
     * @dev Add a voice to supported list
     * @param voiceId Voice ID to add
     */
    function _addVoice(string memory voiceId) internal {
        if (supportedVoices[voiceId]) return; // Already exists
        
        supportedVoices[voiceId] = true;
        voiceList.push(voiceId);
        emit VoiceAdded(voiceId);
    }

    /**
     * @dev Convert bytes32 to string for IPFS hash
     * @param _bytes32 Bytes32 to convert
     * @return String representation
     */
    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}