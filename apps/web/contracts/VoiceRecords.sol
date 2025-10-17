// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VoiceRecords {
    struct Recording {
        uint256 id;
        address owner;
        string ipfsHash;
        string title;
        bool isPublic;
        uint256 timestamp;
    }

    mapping(uint256 => Recording) public recordings;
    mapping(address => uint256[]) public userRecordings;
    uint256 public totalRecordings;

    event RecordingSaved(
        uint256 indexed recordingId,
        address indexed owner,
        string ipfsHash,
        string title,
        bool isPublic
    );

    function saveRecording(
        string memory ipfsHash,
        string memory title,
        bool isPublic
    ) external returns (uint256) {
        totalRecordings++;
        uint256 recordingId = totalRecordings;

        recordings[recordingId] = Recording({
            id: recordingId,
            owner: msg.sender,
            ipfsHash: ipfsHash,
            title: title,
            isPublic: isPublic,
            timestamp: block.timestamp
        });

        userRecordings[msg.sender].push(recordingId);

        emit RecordingSaved(recordingId, msg.sender, ipfsHash, title, isPublic);

        return recordingId;
    }

    function getRecording(uint256 recordingId) external view returns (
        uint256 id,
        address owner,
        string memory ipfsHash,
        string memory title,
        bool isPublic,
        uint256 timestamp
    ) {
        Recording memory recording = recordings[recordingId];
        return (
            recording.id,
            recording.owner,
            recording.ipfsHash,
            recording.title,
            recording.isPublic,
            recording.timestamp
        );
    }

    function getUserRecordings(address user) external view returns (uint256[] memory) {
        return userRecordings[user];
    }

    function getTotalRecordings() external view returns (uint256) {
        return totalRecordings;
    }
}
