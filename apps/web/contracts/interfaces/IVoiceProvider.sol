// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVoiceProvider
 * @dev Interface for voice generation service providers in the VOISSS ecosystem
 * Enables pluggable voice services while maintaining consistent pricing and quality
 */
interface IVoiceProvider {
    // Events
    event VoiceGenerated(
        address indexed agentAddress,
        bytes32 indexed contentHash,
        uint256 cost,
        uint256 characterCount
    );
    
    event ProviderRegistered(
        address indexed provider,
        string name,
        uint256 stakeAmount
    );
    
    event ProviderDeregistered(address indexed provider);

    // Structs
    struct VoiceGenerationRequest {
        string voiceId;      // Voice identifier (e.g., ElevenLabs voice ID)
        string text;         // Text to convert to speech
        address agentAddress; // Agent requesting the service
        bytes32 requestId;   // Unique request identifier
    }

    struct VoiceGenerationResult {
        bytes32 contentHash; // IPFS hash of generated audio
        uint256 cost;        // Cost in wei
        uint256 characterCount; // Number of characters processed
        string audioUrl;     // Direct URL to audio file (optional)
        bool success;        // Whether generation succeeded
        string errorMessage; // Error details if failed
    }

    struct ProviderInfo {
        string name;         // Provider display name
        address providerAddress; // Provider contract address
        uint256 stakeAmount; // Collateral staked
        uint256 costPerCharacter; // Price in wei per character
        bool isActive;       // Whether provider is accepting requests
        uint256 totalGenerated; // Total audio files generated
        uint256 averageRating; // Quality rating (0-100)
    }

    /**
     * @notice Generate voice audio from text
     * @param request Voice generation parameters
     * @return result Generation result with content hash and cost
     */
    function generate(VoiceGenerationRequest calldata request) 
        external 
        returns (VoiceGenerationResult memory result);

    /**
     * @notice Validate if a voice ID is supported by this provider
     * @param voiceId Voice identifier to validate
     * @return isValid True if voice is supported
     */
    function validateVoice(string calldata voiceId) 
        external 
        view 
        returns (bool isValid);

    /**
     * @notice Get cost estimate for text generation
     * @param text Text to estimate cost for
     * @param voiceId Voice identifier
     * @return estimatedCost Cost in wei
     */
    function estimateCost(string calldata text, string calldata voiceId) 
        external 
        view 
        returns (uint256 estimatedCost);

    /**
     * @notice Get provider information
     * @return info Provider details and statistics
     */
    function getProviderInfo() 
        external 
        view 
        returns (ProviderInfo memory info);

    /**
     * @notice Get supported voice IDs
     * @return voiceIds Array of supported voice identifiers
     */
    function getSupportedVoices() 
        external 
        view 
        returns (string[] memory voiceIds);

    /**
     * @notice Check if provider is currently available
     * @return isAvailable True if accepting new requests
     */
    function isAvailable() 
        external 
        view 
        returns (bool isAvailable);
}