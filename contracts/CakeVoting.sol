// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CakeVoting {
    address public owner;

    // Categories (hash once, compare cheaply)
    bytes32 private constant CAT_BEAUTIFUL = keccak256("beautiful");
    bytes32 private constant CAT_DELICIOUS = keccak256("delicious");

    // voter => categoryHash => hasVoted
    mapping(address => mapping(bytes32 => bool)) public hasVoted;

    // Emitted on successful vote
    event VoteCast(address indexed voter, uint256 indexed cakeId, string category);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Single entry point for voting; category must be "beautiful" or "delicious"
    function vote(uint256 cakeId, string calldata category) external {
        bytes32 cat = keccak256(bytes(category));
        require(cat == CAT_BEAUTIFUL || cat == CAT_DELICIOUS, "Invalid category");
        require(!hasVoted[msg.sender][cat], "Already voted in category");

        hasVoted[msg.sender][cat] = true;
        emit VoteCast(msg.sender, cakeId, category);
    }

    // Optional: view helper
    function hasVotedInCategory(address voter, string calldata category) external view returns (bool) {
        bytes32 cat = keccak256(bytes(category));
        return hasVoted[voter][cat];
    }

    // Optional: admin recovery to reset a user's vote in a category
    function resetVote(address voter, string calldata category) external onlyOwner {
        bytes32 cat = keccak256(bytes(category));
        require(cat == CAT_BEAUTIFUL || cat == CAT_DELICIOUS, "Invalid category");
        hasVoted[voter][cat] = false;
    }

    // Ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}