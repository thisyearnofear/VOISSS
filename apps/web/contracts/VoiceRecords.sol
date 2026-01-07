// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VoiceRecords
 * @dev Secure registry for VOISSS AI voice transformations.
 */
contract VoiceRecords {
    // Custom Errors (Gas-efficient)
    error NotOwner();
    error RecordingNotFound();
    error EmptyInput();
    error Unauthorized();

    struct Recording {
        address owner;
        string ipfsHash;
        string title;
        string metadata; // For AI summaries, tags, or template IDs
        bool isPublic;
        uint256 timestamp;
    }

    mapping(uint256 => Recording) public recordings;
    mapping(address => uint256[]) private _userRecordings;
    uint256 public totalRecordings;

    event RecordingSaved(
        uint256 indexed recordingId,
        address indexed owner,
        string ipfsHash,
        string title,
        bool isPublic
    );
    
    event RecordingUpdated(uint256 indexed recordingId, string title, bool isPublic);
    event MetadataUpdated(uint256 indexed recordingId);

    /**
     * @dev Saves a new voice recording entry.
     * @param ipfsHash The IPFS CID for the audio file.
     * @param title Display title for the recording.
     * @param metadata JSON or raw string for extra AI data (summaries, tags).
     * @param isPublic Whether the recording is visible to others.
     * @return recordingId The unique ID of the newly created recording.
     */
    function saveRecording(
        string calldata ipfsHash,
        string calldata title,
        string calldata metadata,
        bool isPublic
    ) external returns (uint256 recordingId) {
        if (bytes(ipfsHash).length == 0 || bytes(title).length == 0) revert EmptyInput();

        totalRecordings++;
        recordingId = totalRecordings;

        recordings[recordingId] = Recording({
            owner: msg.sender,
            ipfsHash: ipfsHash,
            title: title,
            metadata: metadata,
            isPublic: isPublic,
            timestamp: block.timestamp
        });

        _userRecordings[msg.sender].push(recordingId);

        emit RecordingSaved(recordingId, msg.sender, ipfsHash, title, isPublic);
    }

    /**
     * @dev Allows the owner to update the title or visibility of a recording.
     */
    function updateRecording(uint256 recordingId, string calldata title, bool isPublic) external {
        if (recordings[recordingId].owner == address(0)) revert RecordingNotFound();
        if (recordings[recordingId].owner != msg.sender) revert NotOwner();
        if (bytes(title).length == 0) revert EmptyInput();

        recordings[recordingId].title = title;
        recordings[recordingId].isPublic = isPublic;
        emit RecordingUpdated(recordingId, title, isPublic);
    }

    /**
     * @dev Allows updating metadata separately (e.g., adding AI tags later).
     */
    function updateMetadata(uint256 recordingId, string calldata metadata) external {
        if (recordings[recordingId].owner != msg.sender) revert NotOwner();
        recordings[recordingId].metadata = metadata;
        emit MetadataUpdated(recordingId);
    }

    /**
     * @dev Returns all recording IDs for a specific user.
     */
    function getUserRecordings(address user) external view returns (uint256[] memory) {
        return _userRecordings[user];
    }

    /**
     * @dev Supports the frontend by paginating through a user's potentially large list of recordings.
     */
    function getUserRecordingsPaged(address user, uint256 offset, uint256 limit) 
        external view returns (uint256[] memory) 
    {
        uint256 userCount = _userRecordings[user].length;
        if (offset >= userCount) return new uint256[](0);
        
        uint256 end = offset + limit;
        if (end > userCount) end = userCount;
        
        uint256 size = end - offset;
        uint256[] memory page = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = _userRecordings[user][offset + i];
        }
        return page;
    }

    /**
     * @dev Fetches recording details with optional authorization check for private recordings.
     */
    function getRecording(uint256 recordingId) external view returns (
        address owner,
        string memory ipfsHash,
        string memory title,
        string memory metadata,
        bool isPublic,
        uint256 timestamp
    ) {
        Recording memory recording = recordings[recordingId];
        if (recording.owner == address(0)) revert RecordingNotFound();
        
        // Soft privacy check: only let owner or public readers fetch via this function
        if (!recording.isPublic && recording.owner != msg.sender) revert Unauthorized();

        return (
            recording.owner,
            recording.ipfsHash,
            recording.title,
            recording.metadata,
            recording.isPublic,
            recording.timestamp
        );
    }

    function getTotalRecordings() external view returns (uint256) {
        return totalRecordings;
    }
}
