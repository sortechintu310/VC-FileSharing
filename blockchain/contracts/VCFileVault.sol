// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VCFileVault
 * @dev Implements blockchain-based Smart Access Control and Tamper-Proof 
 * Records for the Visual Cryptography File Sharing system.
 */
contract VCFileVault {
    struct FileRecord {
        string fileId;
        string fileName;
        uint256 size;
        string originalFileHash; // Hash of original file for integrity verification
        string[] shareHashes;    // IPFS CIDs for the visual cryptography shares
        address owner;
        uint256 uploadTime;
        bool isActive;
    }

    // Mapping from fileId to FileRecord
    mapping(string => FileRecord) private files;
    
    // Track addresses that have access to reconstruct each fileId
    // fileId => (user address => bool)
    mapping(string => mapping(address => bool)) private accessList;

    event FileUploaded(string indexed fileId, address indexed owner, uint256 uploadTime);
    event AccessGranted(string indexed fileId, address indexed owner, address indexed user);
    event AccessRevoked(string indexed fileId, address indexed owner, address indexed user);

    modifier onlyOwner(string memory _fileId) {
        require(files[_fileId].owner == msg.sender, "VCFileVault: Caller is not the owner");
        _;
    }

    modifier fileExists(string memory _fileId) {
        require(files[_fileId].uploadTime != 0, "VCFileVault: File does not exist");
        _;
    }

    /**
     * @dev Register a visually cryptographically split file immutably on the ledger
     */
    function uploadFile(
        string memory _fileId,
        string memory _fileName,
        uint256 _size,
        string memory _originalFileHash,
        string[] memory _shareHashes
    ) public {
        require(files[_fileId].uploadTime == 0, "VCFileVault: File ID already exists");
        require(_shareHashes.length > 1, "VCFileVault: A valid VC split must have >1 shares");

        files[_fileId] = FileRecord({
            fileId: _fileId,
            fileName: _fileName,
            size: _size,
            originalFileHash: _originalFileHash,
            shareHashes: _shareHashes,
            owner: msg.sender,
            uploadTime: block.timestamp,
            isActive: true
        });

        // The creator is inherently granted access
        accessList[_fileId][msg.sender] = true;

        emit FileUploaded(_fileId, msg.sender, block.timestamp);
    }

    /**
     * @dev Smart Contract Access Control: Grant access to retrieve shares
     */
    function grantAccess(string memory _fileId, address _user) public fileExists(_fileId) onlyOwner(_fileId) {
        require(_user != address(0), "VCFileVault: Invalid user address");
        require(!accessList[_fileId][_user], "VCFileVault: User already has access");

        accessList[_fileId][_user] = true;
        emit AccessGranted(_fileId, msg.sender, _user);
    }

    /**
     * @dev Smart Contract Access Control: Revoke access
     */
    function revokeAccess(string memory _fileId, address _user) public fileExists(_fileId) onlyOwner(_fileId) {
        require(_user != msg.sender, "VCFileVault: Cannot revoke owner access");
        require(accessList[_fileId][_user], "VCFileVault: User does not have access");

        accessList[_fileId][_user] = false;
        emit AccessRevoked(_fileId, msg.sender, _user);
    }

    /**
     * @dev Check verifying rights
     */
    function hasAccess(string memory _fileId, address _user) public view fileExists(_fileId) returns (bool) {
        return accessList[_fileId][_user];
    }

    /**
     * @dev Retrieve the IPFS CIDs of the shares for reconstruction 
     *      ONLY if authorized on the blockchain.
     */
    function getFileShares(string memory _fileId) public view fileExists(_fileId) returns (string[] memory) {
        require(accessList[_fileId][msg.sender], "VCFileVault: Smart Access Control denied access");
        return files[_fileId].shareHashes;
    }

    /**
     * @dev Verify file integrity and metadata
     */
    function getFileMetadata(string memory _fileId) public view fileExists(_fileId) returns (
        string memory fileName,
        uint256 size,
        string memory originalFileHash,
        address owner,
        uint256 uploadTime,
        bool isActive
    ) {
        require(accessList[_fileId][msg.sender], "VCFileVault: Smart Access Control denied access to metadata");
        FileRecord memory f = files[_fileId];
        return (f.fileName, f.size, f.originalFileHash, f.owner, f.uploadTime, f.isActive);
    }
}
