// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RegistrationPayment {
    address public owner;

    struct Participant {
        address wallet;
        uint256 registeredAt;
        bool hasPaid;
        string category;
    }

    mapping(address => Participant) public participants;

    struct Category {
        uint256 fee;       // in wei (e.g. 0.01 ether)
        uint256 duration;  // in minutes
        bool isInitialized; // ADDED: To check if a category is new
    }

    mapping(string => Category) public categories;
    string[] public categoryNames; // ADDED: Dynamic array for category names

    event Registered(address indexed user, uint256 timestamp, string category);

    constructor() {
        owner = msg.sender;

        // Initialize default categories using the new, safer function
        _setCategory("Normal", 0.01 ether, 120);
        _setCategory("Premium", 0.03 ether, 180);
        _setCategory("Family", 0.05 ether, 150);
        _setCategory("PremiumFamily", 0.08 ether, 240);
    }

    // --- Core Public Functions ---

    function register(string calldata category) external payable {
        require(categories[category].isInitialized, "Invalid category");
        require(!participants[msg.sender].hasPaid, "Already registered");
        require(msg.value == categories[category].fee, "Incorrect payment");

        participants[msg.sender] = Participant({
            wallet: msg.sender,
            registeredAt: block.timestamp,
            hasPaid: true,
            category: category
        });

        emit Registered(msg.sender, block.timestamp, category);
    }

    // --- Owner-Only Functions ---

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        
        // CHANGED: Use the modern, safer .call() pattern instead of .transfer()
        uint256 amount = address(this).balance;
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Failed to send Ether");
    }

    function setCategoryFee(string calldata category, uint256 fee, uint256 duration) external {
        require(msg.sender == owner, "Only owner");
        _setCategory(category, fee, duration);
    }

    // --- View Functions (for Frontend) ---

    function isRegistered(address user) external view returns (bool) {
        return participants[user].hasPaid;
    }
    
    function getCategoryFee(string calldata category) external view returns (uint256) {
        require(categories[category].isInitialized, "Invalid category");
        return categories[category].fee;
    }

    function getCategoryDuration(string calldata category) external view returns (uint256) {
        require(categories[category].isInitialized, "Invalid category");
        return categories[category].duration;
    }
    
    // CHANGED: This is now a view function that reads from our dynamic array
    function getCategoryNames() external view returns (string[] memory) {
        return categoryNames;
    }

    // --- Internal Helper Functions ---

    // ADDED: A private helper to handle category creation/updates cleanly
    function _setCategory(string memory category, uint256 fee, uint256 duration) private {
        // If the category is being created for the first time, add its name to the array
        if (!categories[category].isInitialized) {
            categoryNames.push(category);
        }
        
        // Update the category data
        categories[category] = Category(fee, duration, true);
    }

    function resetRegistration(address user) external {
        require(msg.sender == owner, "Only owner can reset registration");
        // 'delete' resets a struct to its default zero values (false, 0, address(0), etc.)
        delete participants[user];
    }

    // --- Fallback ---

    receive() external payable {
        revert("Direct payments not allowed");
    }
}