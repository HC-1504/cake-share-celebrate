// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CakeUpload {
    address public owner;
    
    struct Cake {
        uint256 id;
        address uploader;
        string title;
        string description;
        string fileUrl;        // IPFS hash or file URL
        string fileType;       // "image" or "3d"
        uint8 tableNumber;     // 1-5
        uint8 seatNumber;      // 1-6
        string story;
        uint256 uploadedAt;
        bool isActive;
    }
    
    struct TableSeat {
        bool isOccupied;
        uint256 cakeId;
        address uploader;
    }
    
    // Mapping: tableNumber => seatNumber => TableSeat
    mapping(uint8 => mapping(uint8 => TableSeat)) public tableSeats;
    
    // All cakes
    Cake[] public cakes;
    
    // User's cakes
    mapping(address => uint256[]) public userCakes;
    
    // Events
    event CakeUploaded(
        uint256 indexed cakeId,
        address indexed uploader,
        string title,
        uint8 tableNumber,
        uint8 seatNumber,
        string fileType
    );
    
    event CakeRemoved(
        uint256 indexed cakeId,
        address indexed uploader,
        uint8 tableNumber,
        uint8 seatNumber
    );
    
    event SeatOccupied(
        uint8 tableNumber,
        uint8 seatNumber,
        address uploader
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyCakeOwner(uint256 cakeId) {
        require(cakeId < cakes.length, "Cake does not exist");
        require(cakes[cakeId].uploader == msg.sender, "Only cake owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Upload a new cake
     * @param title Cake title
     * @param description Cake description
     * @param fileUrl File URL or IPFS hash
     * @param fileType "image" or "3d"
     * @param tableNumber Table number (1-5)
     * @param seatNumber Seat number (1-6)
     * @param story Story behind the cake
     */
    function uploadCake(
        string memory title,
        string memory description,
        string memory fileUrl,
        string memory fileType,
        uint8 tableNumber,
        uint8 seatNumber,
        string memory story
    ) external {
        // Validate inputs
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(fileUrl).length > 0, "File URL cannot be empty");
        require(tableNumber >= 1 && tableNumber <= 5, "Invalid table number");
        require(seatNumber >= 1 && seatNumber <= 6, "Invalid seat number");
        require(
            keccak256(bytes(fileType)) == keccak256(bytes("image")) ||
            keccak256(bytes(fileType)) == keccak256(bytes("3d")),
            "File type must be 'image' or '3d'"
        );
        
        // Check if seat is available
        require(!tableSeats[tableNumber][seatNumber].isOccupied, "Seat is already occupied");
        
        // Create new cake
        Cake memory newCake = Cake({
            id: cakes.length,
            uploader: msg.sender,
            title: title,
            description: description,
            fileUrl: fileUrl,
            fileType: fileType,
            tableNumber: tableNumber,
            seatNumber: seatNumber,
            story: story,
            uploadedAt: block.timestamp,
            isActive: true
        });
        
        // Add cake to array
        cakes.push(newCake);
        
        // Mark seat as occupied
        tableSeats[tableNumber][seatNumber] = TableSeat({
            isOccupied: true,
            cakeId: cakes.length - 1,
            uploader: msg.sender
        });
        
        // Add to user's cakes
        userCakes[msg.sender].push(cakes.length - 1);
        
        // Emit events
        emit CakeUploaded(
            cakes.length - 1,
            msg.sender,
            title,
            tableNumber,
            seatNumber,
            fileType
        );
        
        emit SeatOccupied(tableNumber, seatNumber, msg.sender);
    }
    
    /**
     * @dev Remove a cake (only by cake owner)
     * @param cakeId ID of the cake to remove
     */
    function removeCake(uint256 cakeId) external onlyCakeOwner(cakeId) {
        Cake storage cake = cakes[cakeId];
        require(cake.isActive, "Cake is already inactive");
        
        // Mark cake as inactive
        cake.isActive = false;
        
        // Free up the seat
        tableSeats[cake.tableNumber][cake.seatNumber] = TableSeat({
            isOccupied: false,
            cakeId: 0,
            uploader: address(0)
        });
        
        emit CakeRemoved(
            cakeId,
            cake.uploader,
            cake.tableNumber,
            cake.seatNumber
        );
    }
    
    /**
     * @dev Get all cakes for a user
     * @param user Address of the user
     * @return Array of cake IDs
     */
    function getUserCakes(address user) external view returns (uint256[] memory) {
        return userCakes[user];
    }
    
    /**
     * @dev Get cake details by ID
     * @param cakeId ID of the cake
     * @return Cake details
     */
    function getCake(uint256 cakeId) external view returns (Cake memory) {
        require(cakeId < cakes.length, "Cake does not exist");
        return cakes[cakeId];
    }
    
    /**
     * @dev Get all active cakes
     * @return Array of active cake IDs
     */
    function getAllActiveCakes() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active cakes
        for (uint256 i = 0; i < cakes.length; i++) {
            if (cakes[i].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active cake IDs
        uint256[] memory activeCakes = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < cakes.length; i++) {
            if (cakes[i].isActive) {
                activeCakes[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeCakes;
    }
    
    /**
     * @dev Check if a seat is occupied
     * @param tableNumber Table number
     * @param seatNumber Seat number
     * @return True if occupied, false otherwise
     */
    function isSeatOccupied(uint8 tableNumber, uint8 seatNumber) external view returns (bool) {
        return tableSeats[tableNumber][seatNumber].isOccupied;
    }
    
    /**
     * @dev Get seat information
     * @param tableNumber Table number
     * @param seatNumber Seat number
     * @return Seat information
     */
    function getSeatInfo(uint8 tableNumber, uint8 seatNumber) external view returns (TableSeat memory) {
        return tableSeats[tableNumber][seatNumber];
    }
    
    /**
     * @dev Get total number of cakes
     * @return Total cake count
     */
    function getTotalCakes() external view returns (uint256) {
        return cakes.length;
    }
    
    /**
     * @dev Get active cake count
     * @return Active cake count
     */
    function getActiveCakeCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < cakes.length; i++) {
            if (cakes[i].isActive) {
                count++;
            }
        }
        return count;
    }
    
    // Owner functions for management
    
    /**
     * @dev Force remove a cake (owner only)
     * @param cakeId ID of the cake to remove
     */
    function forceRemoveCake(uint256 cakeId) external onlyOwner {
        require(cakeId < cakes.length, "Cake does not exist");
        Cake storage cake = cakes[cakeId];
        
        cake.isActive = false;
        
        // Free up the seat
        tableSeats[cake.tableNumber][cake.seatNumber] = TableSeat({
            isOccupied: false,
            cakeId: 0,
            uploader: address(0)
        });
        
        emit CakeRemoved(
            cakeId,
            cake.uploader,
            cake.tableNumber,
            cake.seatNumber
        );
    }
    
    /**
     * @dev Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
} 