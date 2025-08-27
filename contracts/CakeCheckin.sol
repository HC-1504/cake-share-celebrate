// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CakeCheckIn {
    struct Attendance {
        bool checkedIn;
        bool checkedOut;
    }

    mapping(address => Attendance) public attendance;

    event CheckedIn(address indexed user);
    event CheckedOut(address indexed user);

    function checkIn() external {
        require(!attendance[msg.sender].checkedIn, "Already checked in");
        attendance[msg.sender].checkedIn = true;

        emit CheckedIn(msg.sender);
    }

    function checkOut() external {
        require(attendance[msg.sender].checkedIn, "Not checked in yet");
        require(!attendance[msg.sender].checkedOut, "Already checked out");
        attendance[msg.sender].checkedOut = true;

        emit CheckedOut(msg.sender);
    }

    function getStatus(address user) external view returns (bool inStatus, bool outStatus) {
        Attendance memory a = attendance[user];
        return (a.checkedIn, a.checkedOut);
    }
}
