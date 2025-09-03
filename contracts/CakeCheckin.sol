// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CheckInOut {
    mapping(address => uint256) public checkInTimes;
    mapping(address => uint256) public checkOutTimes;

    event CheckedIn(address indexed user, uint256 time);
    event CheckedOut(address indexed user, uint256 time);

    function checkIn() external {
        require(checkInTimes[msg.sender] == 0, "Already checked in");
        checkInTimes[msg.sender] = block.timestamp;
        emit CheckedIn(msg.sender, block.timestamp);
    }

    function checkOut() external {
        require(checkInTimes[msg.sender] != 0, "Not checked in");
        require(checkOutTimes[msg.sender] == 0, "Already checked out");
        checkOutTimes[msg.sender] = block.timestamp;
        emit CheckedOut(msg.sender, block.timestamp);
    }

    function hasCheckedIn(address user) external view returns (bool) {
        return checkInTimes[user] != 0;
    }

    function hasCheckedOut(address user) external view returns (bool) {
        return checkOutTimes[user] != 0;
    }
}
