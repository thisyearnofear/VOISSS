// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ScrollPrivacy - zkEVM Privacy Contract for Scroll
 * 
 * Features:
 * - Private content storage with zk proofs
 * - Selective disclosure and access control
 * - Time-based access expiration
 * - Gas-optimized for Scroll's zkEVM
 * 
 * Security:
 * - Reentrancy protection
 * - Access control
 * - Input validation
 * - Comprehensive event logging
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ScrollPrivacy is AccessControl, ReentrancyGuard {
    // Private content structure
    struct PrivateContent {
        bytes32 contentId;
        address owner;
        bytes32 encryptedDataHash;
        bytes zkProof;
        bool isPublic;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Access permission structure
    struct AccessPermission {
        bytes32 contentId;
        address user;
        uint8 permissionType; // 0: view, 1: download, 2: share
        address grantedBy;
        uint256 grantedAt;
        uint256 expiresAt; // 0 means never expires
        bool isActive;
    }

    // Share link structure
    struct ShareLink {
        bytes32 token;
        bytes32 contentId;
        uint8 permissionType;
        address createdBy;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
    }

    // Storage mappings
    mapping(bytes32 => PrivateContent) public privateContents;
    mapping(bytes32 => mapping(address => AccessPermission)) public accessPermissions;
    mapping(bytes32 => ShareLink) public shareLinks;
    mapping(address => bytes32[]) public userPrivateContents;
    mapping(bytes32 => address[]) public contentViewers;

    // Counters
    uint256 public totalPrivateContents;
    uint256 public totalAccessPermissions;
    uint256 public totalShareLinks;

    // Events
    event PrivateContentStored(
        bytes32 indexed contentId,
        address indexed owner,
        bytes32 encryptedDataHash,
        bool isPublic
    );

    event AccessGranted(
        bytes32 indexed contentId,
        address indexed user,
        uint8 permissionType,
        uint256 expiresAt
    );

    event AccessRevoked(
        bytes32 indexed contentId,
        address indexed user,
        uint8 permissionType
    );

    event ShareLinkCreated(
        bytes32 indexed token,
        bytes32 indexed contentId,
        uint256 expiresAt
    );

    event ShareLinkUsed(
        bytes32 indexed token,
        address indexed user
    );

    event ContentVisibilityChanged(
        bytes32 indexed contentId,
        bool isPublic
    );

    // Roles
    bytes32 public constant PRIVACY_ADMIN_ROLE = keccak256("PRIVACY_ADMIN_ROLE");
    bytes32 public constant PRIVACY_MANAGER_ROLE = keccak256("PRIVACY_MANAGER_ROLE");

    // Errors
    error Unauthorized();
    error InvalidInput();
    error ContentNotFound();
    error PermissionDenied();
    error ShareLinkExpired();
    error ShareLinkInvalid();
    error ZKProofVerificationFailed();

    /**
     * Constructor
     */
    constructor() {
        // Grant admin role to deployer
        _grantRole(PRIVACY_ADMIN_ROLE, msg.sender);
        _grantRole(PRIVACY_MANAGER_ROLE, msg.sender);
    }

    /**
     * Store private content with zk proof
     * @param encryptedDataHash Hash of encrypted data
     * @param zkProof Zero-knowledge proof of ownership
     * @param isPublic Whether content should be public
     * @return contentId Unique content identifier
     */
    function storePrivateContent(
        bytes32 encryptedDataHash,
        bytes memory zkProof,
        bool isPublic
    ) external nonReentrant returns (bytes32 contentId) {
        // Validate input
        if (encryptedDataHash == bytes32(0)) {
            revert InvalidInput();
        }

        // Verify zk proof (in production, this would be a real verification)
        // For now, we accept any non-empty proof
        if (zkProof.length == 0) {
            revert ZKProofVerificationFailed();
        }

        // Generate content ID
        contentId = keccak256(abi.encodePacked(
            msg.sender,
            encryptedDataHash,
            block.timestamp,
            totalPrivateContents
        ));

        // Create private content
        PrivateContent memory newContent = PrivateContent({
            contentId: contentId,
            owner: msg.sender,
            encryptedDataHash: encryptedDataHash,
            zkProof: zkProof,
            isPublic: isPublic,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // Store content
        privateContents[contentId] = newContent;
        userPrivateContents[msg.sender].push(contentId);

        // Update counters
        totalPrivateContents++;

        emit PrivateContentStored(
            contentId,
            msg.sender,
            encryptedDataHash,
            isPublic
        );

        return contentId;
    }

    /**
     * Grant access to private content
     * @param contentId The content ID
     * @param user The user to grant access to
     * @param permissionType Type of permission (0: view, 1: download, 2: share)
     * @param expiresAt Expiration timestamp (0 for no expiration)
     */
    function grantAccess(
        bytes32 contentId,
        address user,
        uint8 permissionType,
        uint256 expiresAt
    ) external nonReentrant {
        // Validate input
        if (user == address(0)) {
            revert InvalidInput();
        }

        if (permissionType > 2) {
            revert InvalidInput();
        }

        // Check content exists
        PrivateContent memory content = privateContents[contentId];
        if (content.contentId == bytes32(0)) {
            revert ContentNotFound();
        }

        // Check caller is owner or has manager role
        if (msg.sender != content.owner && !hasRole(PRIVACY_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        // Create access permission
        AccessPermission memory permission = AccessPermission({
            contentId: contentId,
            user: user,
            permissionType: permissionType,
            grantedBy: msg.sender,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });

        // Store permission
        accessPermissions[contentId][user] = permission;
        contentViewers[contentId].push(user);

        // Update counters
        totalAccessPermissions++;

        emit AccessGranted(contentId, user, permissionType, expiresAt);
    }

    /**
     * Revoke access to private content
     * @param contentId The content ID
     * @param user The user to revoke access from
     * @param permissionType Type of permission to revoke
     */
    function revokeAccess(
        bytes32 contentId,
        address user,
        uint8 permissionType
    ) external nonReentrant {
        // Check content exists
        PrivateContent memory content = privateContents[contentId];
        if (content.contentId == bytes32(0)) {
            revert ContentNotFound();
        }

        // Check caller is owner or has manager role
        if (msg.sender != content.owner && !hasRole(PRIVACY_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        // Check permission exists
        AccessPermission memory permission = accessPermissions[contentId][user];
        if (permission.contentId == bytes32(0)) {
            revert PermissionDenied();
        }

        // Deactivate permission
        permission.isActive = false;
        accessPermissions[contentId][user] = permission;

        emit AccessRevoked(contentId, user, permissionType);
    }

    /**
     * Check if user has access to content
     * @param contentId The content ID
     * @param user The user to check
     * @param permissionType Type of permission to check
     * @return hasAccess Whether user has access
     */
    function hasAccess(
        bytes32 contentId,
        address user,
        uint8 permissionType
    ) external view returns (bool hasAccess) {
        // Check if content is public
        PrivateContent memory content = privateContents[contentId];
        if (content.contentId != bytes32(0) && content.isPublic) {
            return true;
        }

        // Check if user is owner
        if (user == content.owner) {
            return true;
        }

        // Check permission
        AccessPermission memory permission = accessPermissions[contentId][user];
        if (permission.contentId != bytes32(0)) {
            // Check if permission is active
            if (permission.isActive) {
                // Check if permission type matches or is higher
                if (permission.permissionType >= permissionType) {
                    // Check expiration
                    if (permission.expiresAt == 0 || block.timestamp < permission.expiresAt) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Create share link for private content
     * @param contentId The content ID
     * @param permissionType Type of permission for the link
     * @param expiresAt Expiration timestamp (0 for no expiration)
     * @return token Share link token
     */
    function createShareLink(
        bytes32 contentId,
        uint8 permissionType,
        uint256 expiresAt
    ) external nonReentrant returns (bytes32 token) {
        // Check content exists
        PrivateContent memory content = privateContents[contentId];
        if (content.contentId == bytes32(0)) {
            revert ContentNotFound();
        }

        // Check caller is owner or has manager role
        if (msg.sender != content.owner && !hasRole(PRIVACY_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        // Generate share token
        token = keccak256(abi.encodePacked(
            contentId,
            msg.sender,
            permissionType,
            expiresAt,
            block.timestamp,
            totalShareLinks
        ));

        // Create share link
        ShareLink memory shareLink = ShareLink({
            token: token,
            contentId: contentId,
            permissionType: permissionType,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });

        // Store share link
        shareLinks[token] = shareLink;

        // Update counters
        totalShareLinks++;

        emit ShareLinkCreated(token, contentId, expiresAt);

        return token;
    }

    /**
     * Verify share link and get content access
     * @param token The share link token
     * @return contentId The content ID
     * @return isValid Whether the link is valid
     */
    function verifyShareLink(
        bytes32 token
    ) external view returns (bytes32 contentId, bool isValid) {
        // Check share link exists
        ShareLink memory shareLink = shareLinks[token];
        if (shareLink.token == bytes32(0)) {
            return (bytes32(0), false);
        }

        // Check if link is active
        if (!shareLink.isActive) {
            return (bytes32(0), false);
        }

        // Check expiration
        if (shareLink.expiresAt != 0 && block.timestamp > shareLink.expiresAt) {
            return (bytes32(0), false);
        }

        return (shareLink.contentId, true);
    }

    /**
     * Use share link to access content
     * @param token The share link token
     * @return contentId The content ID
     */
    function useShareLink(
        bytes32 token
    ) external nonReentrant returns (bytes32 contentId) {
        // Verify share link
        (contentId, bool isValid) = verifyShareLink(token);
        if (!isValid) {
            revert ShareLinkInvalid();
        }

        // Check if link is expired
        ShareLink memory shareLink = shareLinks[token];
        if (shareLink.expiresAt != 0 && block.timestamp > shareLink.expiresAt) {
            revert ShareLinkExpired();
        }

        emit ShareLinkUsed(token, msg.sender);

        return contentId;
    }

    /**
     * Change content visibility
     * @param contentId The content ID
     * @param isPublic New visibility setting
     */
    function setContentVisibility(
        bytes32 contentId,
        bool isPublic
    ) external nonReentrant {
        // Check content exists
        PrivateContent memory content = privateContents[contentId];
        if (content.contentId == bytes32(0)) {
            revert ContentNotFound();
        }

        // Check caller is owner or has manager role
        if (msg.sender != content.owner && !hasRole(PRIVACY_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        // Update visibility
        content.isPublic = isPublic;
        content.updatedAt = block.timestamp;

        privateContents[contentId] = content;

        emit ContentVisibilityChanged(contentId, isPublic);
    }

    /**
     * Get private content details
     * @param contentId The content ID
     * @return content The private content
     */
    function getPrivateContent(
        bytes32 contentId
    ) external view returns (PrivateContent memory content) {
        return privateContents[contentId];
    }

    /**
     * Get user's private contents
     * @param user The user address
     * @return contentIds Array of content IDs
     */
    function getUserPrivateContents(
        address user
    ) external view returns (bytes32[] memory contentIds) {
        return userPrivateContents[user];
    }

    /**
     * Get content viewers
     * @param contentId The content ID
     * @return viewers Array of viewer addresses
     */
    function getContentViewers(
        bytes32 contentId
    ) external view returns (address[] memory viewers) {
        return contentViewers[contentId];
    }

    /**
     * Admin functions
     */
    function grantManagerRole(address user) external onlyRole(PRIVACY_ADMIN_ROLE) {
        _grantRole(PRIVACY_MANAGER_ROLE, user);
    }

    function revokeManagerRole(address user) external onlyRole(PRIVACY_ADMIN_ROLE) {
        _revokeRole(PRIVACY_MANAGER_ROLE, user);
    }

    function grantAdminRole(address user) external onlyRole(PRIVACY_ADMIN_ROLE) {
        _grantRole(PRIVACY_ADMIN_ROLE, user);
    }

    function revokeAdminRole(address user) external onlyRole(PRIVACY_ADMIN_ROLE) {
        _revokeRole(PRIVACY_ADMIN_ROLE, user);
    }
}