// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CakeCheckin {
    enum Status { None, In, Out }

    struct Attendance {
        Status status;
        uint64 checkInAt;
        uint64 checkOutAt;
    }

    mapping(address => Attendance) private _attendance;

    event CheckedIn(address indexed user, uint64 timestamp);
    event CheckedOut(address indexed user, uint64 timestamp);

    function checkIn() external {
        Attendance storage att = _attendance[msg.sender];
        require(att.status == Status.None, "Already checked in/out");
        att.status = Status.In;
        att.checkInAt = uint64(block.timestamp);
        emit CheckedIn(msg.sender, att.checkInAt);
    }

    function checkOut() external {
        Attendance storage att = _attendance[msg.sender];
        require(att.status == Status.In, "Not checked in");
        att.status = Status.Out;
        att.checkOutAt = uint64(block.timestamp);
        emit CheckedOut(msg.sender, att.checkOutAt);
    }

    function getStatus(address user) external view returns (Status) {
        return _attendance[user].status;
    }
}
