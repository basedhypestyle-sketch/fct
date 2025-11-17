// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FIDGhost is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public constant MINT_PRICE = 0.0002 ether;
    mapping(uint256 => bool) public minted;

    constructor() ERC721("FID Ghost", "GHOST") {}

    function mint(uint256 fid, string memory uri) external payable nonReentrant {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(!minted[fid], "Already minted");

        minted[fid] = true;

        (bool sent, ) = owner().call{value: MINT_PRICE}("");
        require(sent, "Transfer to owner failed");

        uint256 excess = msg.value - MINT_PRICE;
        if (excess > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: excess}("");
            require(refunded, "Refund failed");
        }

        _safeMint(msg.sender, fid);
        _setTokenURI(fid, uri);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
