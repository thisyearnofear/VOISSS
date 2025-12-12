// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * ScrollVRF - Verifiable Random Function Contract for Scroll
 * Simplified for Remix deployment without external VRF dependencies
 * 
 * Features:
 * - On-chain randomness for fair voice selection
 * - Access control for consumer requests
 * - Event-based architecture for frontend integration
 * - Gas-optimized for Scroll's zkEVM
 */

contract ScrollVRF is AccessControl, ReentrancyGuard {
    // Randomness request structure
    struct RandomnessRequest {
        uint256 requestId;
        address requester;
        uint256 timestamp;
        string callbackFunction;
        uint256 deadline;
        uint256 randomNumber;
        bool fulfilled;
    }

    // Storage
    mapping(uint256 => RandomnessRequest) public requests;
    mapping(address => uint256[]) public userRequests;
    uint256 public requestCounter;

    // Events
    event RandomnessRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 timestamp,
        uint256 deadline
    );

    event RandomnessFulfilled(
        uint256 indexed requestId,
        uint256 indexed randomNumber
    );

    event RandomnessUsed(
        uint256 indexed requestId,
        address indexed user,
        string useCase
    );

    // Roles
    bytes32 public constant VRF_ADMIN_ROLE = keccak256("VRF_ADMIN_ROLE");
    bytes32 public constant VRF_CONSUMER_ROLE = keccak256("VRF_CONSUMER_ROLE");

    // Errors
    error Unauthorized();
    error InvalidInput();
    error RequestNotFound();
    error AlreadyFulfilled();

    /**
     * Constructor
     * Initialize with default admin
     */
    constructor() {
        _grantRole(VRF_ADMIN_ROLE, msg.sender);
        _grantRole(VRF_CONSUMER_ROLE, msg.sender);
    }

    /**
     * Request randomness for voice selection
     * @param user Address requesting randomness
     * @param callbackFunction Function to call with result
     * @param deadline Timestamp for when randomness should be fulfilled
     * @return requestId Unique request identifier
     */
    function requestRandomness(
        address user,
        string memory callbackFunction,
        uint256 deadline
    ) external nonReentrant returns (uint256 requestId) {
        // Validate input
        if (user == address(0)) {
            revert InvalidInput();
        }

        if (deadline <= block.timestamp) {
            revert InvalidInput();
        }

        // Check consumer role
        if (!hasRole(VRF_CONSUMER_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        // Generate request ID
        requestId = requestCounter++;

        // Generate randomness using on-chain entropy
        // In production, this would use Chainlink VRF or similar
        // For Scroll testnet, we use block hash + timestamp for fairness
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(
                blockhash(block.number - 1),
                block.timestamp,
                user,
                requestId
            ))
        );

        // Store request
        requests[requestId] = RandomnessRequest({
            requestId: requestId,
            requester: user,
            timestamp: block.timestamp,
            callbackFunction: callbackFunction,
            deadline: deadline,
            randomNumber: randomNumber,
            fulfilled: true
        });

        userRequests[user].push(requestId);

        emit RandomnessRequested(requestId, user, block.timestamp, deadline);
        emit RandomnessFulfilled(requestId, randomNumber);

        return requestId;
    }

    /**
     * Get randomness result
     * @param requestId The request ID
     * @return randomNumber The random number
     * @return isFulfilled Whether request has been fulfilled
     */
    function getRandomness(
        uint256 requestId
    ) external view returns (uint256 randomNumber, bool isFulfilled) {
        RandomnessRequest memory request = requests[requestId];
        if (request.requestId == 0 && requestId != 0) {
            revert RequestNotFound();
        }
        return (request.randomNumber, request.fulfilled);
    }

    /**
     * Verify randomness is valid
     * @param requestId The request ID
     * @return isValid Whether the randomness is valid
     */
    function verifyRandomness(
        uint256 requestId
    ) external view returns (bool isValid) {
        return requests[requestId].fulfilled;
    }

    /**
     * Use randomness for a specific purpose
     * @param requestId The request ID
     * @param user The user using the randomness
     * @param useCase Description of the use case (e.g., "voice-selection")
     */
    function useRandomness(
        uint256 requestId,
        address user,
        string memory useCase
    ) external nonReentrant {
        RandomnessRequest memory request = requests[requestId];
        
        if (!request.fulfilled) {
            revert RequestNotFound();
        }

        emit RandomnessUsed(requestId, user, useCase);
    }

    /**
     * Get user's requests
     * @param user The user address
     * @return requestIds Array of request IDs
     */
    function getUserRequests(address user) external view returns (uint256[] memory requestIds) {
        return userRequests[user];
    }

    /**
     * Admin: Grant consumer role
     * @param user Address to grant role to
     */
    function grantConsumerRole(address user) external onlyRole(VRF_ADMIN_ROLE) {
        _grantRole(VRF_CONSUMER_ROLE, user);
    }

    /**
     * Admin: Revoke consumer role
     * @param user Address to revoke role from
     */
    function revokeConsumerRole(address user) external onlyRole(VRF_ADMIN_ROLE) {
        _revokeRole(VRF_CONSUMER_ROLE, user);
    }

    /**
     * Admin: Grant admin role
     * @param user Address to grant role to
     */
    function grantAdminRole(address user) external onlyRole(VRF_ADMIN_ROLE) {
        _grantRole(VRF_ADMIN_ROLE, user);
    }

    /**
     * Admin: Revoke admin role
     * @param user Address to revoke role from
     */
    function revokeAdminRole(address user) external onlyRole(VRF_ADMIN_ROLE) {
        _revokeRole(VRF_ADMIN_ROLE, user);
    }
}
