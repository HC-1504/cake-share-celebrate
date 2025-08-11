// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CakeVoting Smart Contract
 * @dev Handles voting for cakes in two categories: beautiful and delicious
 * @notice Each wallet address can vote once per category to prevent fraud
 */
contract CakeVoting {
    // Contract owner who can perform administrative functions
    address public owner;

    // Pre-computed category hashes for gas efficiency
    // Using keccak256 hash comparison is cheaper than string comparison
    bytes32 private constant CAT_BEAUTIFUL = keccak256("beautiful");
    bytes32 private constant CAT_DELICIOUS = keccak256("delicious");

    // Nested mapping to track voting status:
    // voter address => category hash => has voted (true/false)
    // This prevents duplicate voting per wallet per category
    mapping(address => mapping(bytes32 => bool)) public hasVoted;

    // Event emitted when a vote is successfully cast
    // Indexed parameters allow efficient filtering of events
    event VoteCast(address indexed voter, uint256 indexed cakeId, string category);

    // Modifier to restrict certain functions to contract owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _; // Continue with function execution
    }

    // Constructor sets the deployer as the contract owner
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Main voting function - allows users to vote for a cake in a specific category
     * @param cakeId The ID of the cake being voted for
     * @param category The voting category ("beautiful" or "delicious")
     * @notice Each wallet can only vote once per category
     */
    function vote(uint256 cakeId, string calldata category) external {
        // Convert category string to hash for efficient comparison
        bytes32 cat = keccak256(bytes(category));

        // Validate that category is either "beautiful" or "delicious"
        require(cat == CAT_BEAUTIFUL || cat == CAT_DELICIOUS, "Invalid category");

        // Check if this wallet has already voted in this category
        require(!hasVoted[msg.sender][cat], "Already voted in category");

        // Record the vote in the mapping
        hasVoted[msg.sender][cat] = true;

        // Emit event for transparency and off-chain tracking
        emit VoteCast(msg.sender, cakeId, category);
    }

    /**
     * @dev Check if a specific wallet has voted in a category
     * @param voter The wallet address to check
     * @param category The category to check ("beautiful" or "delicious")
     * @return bool True if the voter has voted in this category
     */
    function hasVotedInCategory(address voter, string calldata category) external view returns (bool) {
        bytes32 cat = keccak256(bytes(category));
        return hasVoted[voter][cat];
    }

    /**
     * @dev Admin function to reset a user's vote (for testing/emergency)
     * @param voter The wallet address whose vote to reset
     * @param category The category to reset
     * @notice Only contract owner can call this function
     */
    function resetVote(address voter, string calldata category) external onlyOwner {
        bytes32 cat = keccak256(bytes(category));
        require(cat == CAT_BEAUTIFUL || cat == CAT_DELICIOUS, "Invalid category");
        hasVoted[voter][cat] = false;
    }

    /**
     * @dev Transfer contract ownership to a new address
     * @param newOwner The address of the new owner
     * @notice Only current owner can transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}