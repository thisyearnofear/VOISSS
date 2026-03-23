// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VoiceLicenseMarket
 * @notice Minimal viable marketplace for voice licensing
 * @dev ENHANCEMENT FIRST: Integrates with existing VoiceRecords contract
 * 
 * Core Principles:
 * - MINIMAL: Only essential functions for MVP
 * - MODULAR: Can be upgraded without affecting VoiceRecords
 * - CLEAN: Clear separation from existing contracts
 */
contract VoiceLicenseMarket is Ownable, ReentrancyGuard {
    // USDC on Base Mainnet
    IERC20 public immutable usdc;
    
    // Platform fee (30% = 3000 basis points)
    uint256 public platformFeeBps = 3000;
    uint256 public constant MAX_FEE_BPS = 5000; // Max 50%
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Revenue split: 70% to contributor, 30% to platform
    address public platformTreasury;
    
    struct VoiceListing {
        address contributor;
        uint256 price; // USDC (6 decimals)
        bool isExclusive;
        bool isActive;
        uint256 totalSales;
        uint256 totalUsage;
    }
    
    struct License {
        address licensee;
        uint256 voiceId;
        bool isExclusive;
        uint256 purchasedAt;
        uint256 usageCount;
        bool isActive;
    }
    
    // voiceId => VoiceListing
    mapping(uint256 => VoiceListing) public listings;
    
    // licenseId => License
    mapping(uint256 => License) public licenses;
    
    // voiceId => licensee => licenseId
    mapping(uint256 => mapping(address => uint256)) public userLicenses;
    
    // Track exclusive licenses
    mapping(uint256 => uint256) public exclusiveLicenses; // voiceId => licenseId
    
    uint256 public nextLicenseId = 1;
    
    event VoiceListed(
        uint256 indexed voiceId,
        address indexed contributor,
        uint256 price,
        bool isExclusive
    );
    
    event VoiceDelisted(uint256 indexed voiceId);

    event VoicePriceUpdated(
        uint256 indexed voiceId,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    event LicensePurchased(
        uint256 indexed licenseId,
        uint256 indexed voiceId,
        address indexed licensee,
        uint256 price,
        bool isExclusive
    );
    
    event UsageReported(
        uint256 indexed licenseId,
        uint256 indexed voiceId,
        uint256 usageCount
    );
    
    event PlatformFeeUpdated(uint256 newFeeBps);
    
    constructor(address _usdc, address _platformTreasury) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_platformTreasury != address(0), "Invalid treasury");
        
        usdc = IERC20(_usdc);
        platformTreasury = _platformTreasury;
    }
    
    /**
     * @notice List a voice for licensing
     * @param voiceId Unique voice identifier (from VoiceRecords)
     * @param price Price in USDC (6 decimals)
     * @param isExclusive Whether this is exclusive licensing
     */
    function listVoice(
        uint256 voiceId,
        uint256 price,
        bool isExclusive
    ) external {
        VoiceListing storage existingListing = listings[voiceId];

        require(price > 0, "Price must be > 0");
        require(exclusiveLicenses[voiceId] == 0, "Exclusive license exists");

        if (existingListing.contributor == address(0)) {
            listings[voiceId] = VoiceListing({
                contributor: msg.sender,
                price: price,
                isExclusive: isExclusive,
                isActive: true,
                totalSales: 0,
                totalUsage: 0
            });
        } else {
            require(existingListing.contributor == msg.sender, "Already listed");
            require(!existingListing.isActive, "Already active");

            existingListing.price = price;
            existingListing.isExclusive = isExclusive;
            existingListing.isActive = true;
        }
        
        emit VoiceListed(voiceId, msg.sender, price, isExclusive);
    }
    
    /**
     * @notice Delist a voice (contributor only)
     * @param voiceId Voice to delist
     */
    function delistVoice(uint256 voiceId) external {
        VoiceListing storage listing = listings[voiceId];
        require(listing.contributor == msg.sender, "Not contributor");
        require(listing.isActive, "Not active");
        
        listing.isActive = false;
        
        emit VoiceDelisted(voiceId);
    }

    /**
     * @notice Update the listing price for an active voice
     * @param voiceId Voice to update
     * @param newPrice New price in USDC (6 decimals)
     */
    function updateListingPrice(uint256 voiceId, uint256 newPrice) external {
        VoiceListing storage listing = listings[voiceId];
        require(listing.contributor == msg.sender, "Not contributor");
        require(listing.isActive, "Not active");
        require(newPrice > 0, "Price must be > 0");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit VoicePriceUpdated(voiceId, oldPrice, newPrice);
    }
    
    /**
     * @notice Purchase a voice license
     * @param voiceId Voice to license
     */
    function purchaseLicense(uint256 voiceId) external nonReentrant returns (uint256) {
        VoiceListing storage listing = listings[voiceId];
        require(listing.isActive, "Not available");
        require(listing.contributor != msg.sender, "Cannot license own voice");
        
        // Check if exclusive license already exists
        if (listing.isExclusive) {
            require(exclusiveLicenses[voiceId] == 0, "Exclusive license exists");
        }
        
        // Check if user already has license
        uint256 existingLicenseId = userLicenses[voiceId][msg.sender];
        if (existingLicenseId != 0) {
            require(!licenses[existingLicenseId].isActive, "Already licensed");
        }
        
        // Transfer USDC from licensee
        require(
            usdc.transferFrom(msg.sender, address(this), listing.price),
            "USDC transfer failed"
        );
        
        // Calculate splits
        uint256 platformFee = (listing.price * platformFeeBps) / BPS_DENOMINATOR;
        uint256 contributorAmount = listing.price - platformFee;
        
        // Transfer to contributor and platform
        require(usdc.transfer(listing.contributor, contributorAmount), "Contributor transfer failed");
        require(usdc.transfer(platformTreasury, platformFee), "Platform transfer failed");
        
        // Create license
        uint256 licenseId = nextLicenseId++;
        licenses[licenseId] = License({
            licensee: msg.sender,
            voiceId: voiceId,
            isExclusive: listing.isExclusive,
            purchasedAt: block.timestamp,
            usageCount: 0,
            isActive: true
        });
        
        userLicenses[voiceId][msg.sender] = licenseId;
        
        if (listing.isExclusive) {
            exclusiveLicenses[voiceId] = licenseId;
            listing.isActive = false; // Delist after exclusive purchase
        }
        
        listing.totalSales++;
        
        emit LicensePurchased(licenseId, voiceId, msg.sender, listing.price, listing.isExclusive);
        
        return licenseId;
    }
    
    /**
     * @notice Report usage for metering (called by synthesis API)
     * @param licenseId License being used
     * @param usageCount Number of synthesis calls
     */
    function reportUsage(uint256 licenseId, uint256 usageCount) external onlyOwner {
        License storage license = licenses[licenseId];
        require(license.isActive, "License not active");
        
        license.usageCount += usageCount;
        
        VoiceListing storage listing = listings[license.voiceId];
        listing.totalUsage += usageCount;
        
        emit UsageReported(licenseId, license.voiceId, usageCount);
    }
    
    /**
     * @notice Update platform fee (owner only)
     * @param newFeeBps New fee in basis points
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }
    
    /**
     * @notice Update platform treasury (owner only)
     * @param newTreasury New treasury address
     */
    function updatePlatformTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        platformTreasury = newTreasury;
    }
    
    /**
     * @notice Get listing details
     */
    function getListing(uint256 voiceId) external view returns (VoiceListing memory) {
        return listings[voiceId];
    }
    
    /**
     * @notice Get license details
     */
    function getLicense(uint256 licenseId) external view returns (License memory) {
        return licenses[licenseId];
    }
    
    /**
     * @notice Check if user has active license for voice
     */
    function hasActiveLicense(uint256 voiceId, address user) external view returns (bool) {
        uint256 licenseId = userLicenses[voiceId][user];
        if (licenseId == 0) return false;
        return licenses[licenseId].isActive;
    }
    
    /**
     * @notice Get user's license ID for a voice
     */
    function getUserLicense(uint256 voiceId, address user) external view returns (uint256) {
        return userLicenses[voiceId][user];
    }
}
