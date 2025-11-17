// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Fid Ghost
 * @notice ERC721 collection where token ID = user's FID
 */
contract FidGhost is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public totalSupply = 0;

    mapping(uint256 => bool) public fidMinted;
    mapping(uint256 => address) public fidToMinter;
    mapping(uint256 => uint8) public levelOf;
    mapping(uint8 => uint256) public upgradePrice;

    // Mint fee 0.00001 ETH
    uint256 public mintFee = 0.00001 ether;

    bool public metadataFrozen;

    event FidGhostMinted(
        uint256 indexed fid,
        address indexed minter,
        uint8 level,
        string metadataURI
    );

    event FidGhostUpgraded(
        uint256 indexed fid,
        address indexed owner,
        uint8 oldLevel,
        uint8 newLevel,
        string metadataURI
    );

    event MintFeeUpdated(uint256 newFee);

    error MaxSupplyExceeded();
    error FidAlreadyMinted();
    error InvalidFid();
    error IncorrectFee();
    error NotTokenOwner();
    error LevelNotAllowed();

    constructor(address initialOwner)
        ERC721("Fid Ghost", "FGHOST")
        Ownable(initialOwner)
    {}

    /**
     * @notice Mint a Fid Ghost NFT. Token ID will be the user's FID.
     */
    function mint(
        uint256 fid,
        string calldata metadataURI,
        uint8 initialLevel
    ) external payable nonReentrant {
        if (initialLevel > 3) revert LevelNotAllowed();
        if (msg.value != mintFee) revert IncorrectFee();
        if (totalSupply >= MAX_SUPPLY) revert MaxSupplyExceeded();
        if (fid == 0) revert InvalidFid();
        if (fidMinted[fid]) revert FidAlreadyMinted();
        if (metadataFrozen) revert("MetadataFrozen");

        fidMinted[fid] = true;
        fidToMinter[fid] = msg.sender;

        levelOf[fid] = initialLevel;
        totalSupply++;

        _safeMint(msg.sender, fid);
        _setTokenURI(fid, metadataURI);

        emit FidGhostMinted(fid, msg.sender, initialLevel, metadataURI);
    }

    /**
     * @notice Upgrade an existing Fid Ghost NFT
     */
    function upgradeNft(
        uint256 fid,
        uint8 newLevel,
        string calldata metadataURI
    ) external payable nonReentrant {
        if (metadataFrozen) revert("MetadataFrozen");
        if (!fidMinted[fid]) revert InvalidFid();

        address ownerAddr = ownerOf(fid);
        if (ownerAddr != msg.sender) revert NotTokenOwner();

        uint8 current = levelOf[fid];
        if (newLevel <= current) revert LevelNotAllowed();
        if (newLevel > 3) revert LevelNotAllowed();

        uint256 required = upgradePrice[newLevel];
        if (msg.value != required) revert IncorrectFee();

        levelOf[fid] = newLevel;
        _setTokenURI(fid, metadataURI);

        emit FidGhostUpgraded(fid, msg.sender, current, newLevel, metadataURI);
    }

    function setUpgradePrice(uint8 level, uint256 price) external onlyOwner {
        require(level <= 3, "LEVEL_OUT_OF_RANGE");
        upgradePrice[level] = price;
    }

    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function freezeMetadata() external onlyOwner {
        metadataFrozen = true;
    }

    function isFidMinted(uint256 fid) external view returns (bool) {
        return fidMinted[fid];
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "WITHDRAW_FAILED");
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
