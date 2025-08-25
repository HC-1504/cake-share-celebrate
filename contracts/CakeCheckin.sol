// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CakeCheckin {
    enum Status {
        None,
        In,
        Out
    }

    struct Attendance {
        Status status;
        uint64 checkInAt;
        uint64 checkOutAt;
    }

    // Store attendance for each user
    mapping(address => Attendance) private _attendance;

    // Events
    event CheckedIn(address indexed user, uint64 timestamp);
    event CheckedOut(address indexed user, uint64 timestamp);

    /// @notice Check in to the event
    function checkIn() external {
        Attendance storage a = _attendance[msg.sender];
        require(a.status == Status.None, "Already checked in or out");

        a.status = Status.In;
        a.checkInAt = uint64(block.timestamp);

        emit CheckedIn(msg.sender, a.checkInAt);
    }

    /// @notice Check out of the event
    function checkOut() external {
        Attendance storage a = _attendance[msg.sender];
        require(a.status == Status.In, "Not checked in or already checked out");

        a.status = Status.Out;
        a.checkOutAt = uint64(block.timestamp);

        emit CheckedOut(msg.sender, a.checkOutAt);
    }

    /// @notice Get a user’s attendance info
    function getAttendance(address user)
        external
        view
        returns (Status status, uint64 checkInAt, uint64 checkOutAt)
    {
        Attendance storage a = _attendance[user];
        return (a.status, a.checkInAt, a.checkOutAt);
    }
}
