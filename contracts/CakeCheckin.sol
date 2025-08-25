@@ -0,0 +1,98 @@
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICakeVoting {
    function hasVotedInCategory(address voter, string calldata category)
        external
        view
        returns (bool);
}

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

    mapping(address => Attendance) private _attendance;

    ICakeVoting public cakeVoting;
    address public owner;

    event CheckedIn(address indexed user, uint64 timestamp);
    event CheckedOut(address indexed user, uint64 timestamp);
    event VotingContractUpdated(address indexed newAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _cakeVoting) {
        require(_cakeVoting != address(0), "invalid voting address");
        owner = msg.sender;
        cakeVoting = ICakeVoting(_cakeVoting);
        emit VotingContractUpdated(_cakeVoting);
    }

    /// --- Admin ---
    function setCakeVoting(address _cakeVoting) external onlyOwner {
        require(_cakeVoting != address(0), "invalid address");
        cakeVoting = ICakeVoting(_cakeVoting);
        emit VotingContractUpdated(_cakeVoting);
    }

    /// --- User actions ---
    function checkIn() external {
        Attendance storage a = _attendance[msg.sender];
        require(a.status != Status.In, "already checked in");

        a.status = Status.In;
        a.checkInAt = uint64(block.timestamp);
        a.checkOutAt = 0;

        emit CheckedIn(msg.sender, a.checkInAt);
    }

    function checkOut() external {
        Attendance storage a = _attendance[msg.sender];
        require(a.status == Status.In, "not checked in");

        bool votedBeautiful = cakeVoting.hasVotedInCategory(msg.sender, "beautiful");
        bool votedDelicious = cakeVoting.hasVotedInCategory(msg.sender, "delicious");
        require(votedBeautiful && votedDelicious, "vote both categories first");

        a.status = Status.Out;
        a.checkOutAt = uint64(block.timestamp);

        emit CheckedOut(msg.sender, a.checkOutAt);
    }

    /// --- Views ---
    function getStatus(address user) external view returns (Status) {
        return _attendance[user].status;
    }

    function getAttendance(address user)
        external
        view
        returns (Status status, uint64 checkInAt, uint64 checkOutAt)
    {
        Attendance memory a = _attendance[user];
        return (a.status, a.checkInAt, a.checkOutAt);
    }

    function canCheckOut(address user) external view returns (bool) {
        if (_attendance[user].status != Status.In) return false;
        bool votedBeautiful = cakeVoting.hasVotedInCategory(user, "beautiful");
        bool votedDelicious = cakeVoting.hasVotedInCategory(user, "delicious");
        return votedBeautiful && votedDelicious;
    }
}
