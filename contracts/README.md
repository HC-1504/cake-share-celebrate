# Smart Contracts

This folder contains the Solidity smart contracts used in the Cake Share & Celebrate platform.

## 📋 Contract Overview

The platform consists of three interconnected smart contracts:

### 1. CakePicnic.sol
**Event Registration & Payment System**
- **Event Registration**: Secure, paid registration for cake picnic events
- **Category Management**: Multiple event categories (Normal, Premium, Family, PremiumFamily)
- **Payment Processing**: ETH-based registration fees with automatic validation
- **Participant Tracking**: On-chain record of all registered participants

### 2. CakeUpload.sol
**Cake Management & Seat Assignment**
- **Cake Upload**: Store cake metadata on blockchain (title, description, story)
- **File Management**: Support for images and 3D models (IPFS/URL storage)
- **Seat Assignment**: Table and seat management system (5 tables, 6 seats each)
- **Ownership Control**: Users can manage their own cake uploads

### 3. CakeVoting.sol
**Blockchain Voting System**
- **Secure Voting**: Immutable vote recording for "beautiful" and "delicious" categories
- **Duplicate Prevention**: One vote per category per wallet address
- **Vote Verification**: Public functions to check voting status
- **Admin Controls**: Owner can reset votes if needed

## 🌐 Deployment Information

### Holesky Testnet Addresses
- **Network**: Holesky Ethereum Testnet
- **Chain ID**: 17000

#### Contract Addresses
1. **CakePicnic**: `0x...` (Add your deployed address)
   - [View on Etherscan](https://holesky.etherscan.io/address/0x...)
2. **CakeUpload**: `0x...` (Add your deployed address)
   - [View on Etherscan](https://holesky.etherscan.io/address/0x...)
3. **CakeVoting**: `0x...` (Add your deployed address)
   - [View on Etherscan](https://holesky.etherscan.io/address/0x...)

#### Solidity Versions
- **CakePicnic**: ^0.8.19
- **CakeUpload**: ^0.8.19
- **CakeVoting**: ^0.8.20

## 🔧 Contract Functions

### CakePicnic.sol Functions
**Registration & Payment**
- `register(string calldata category)` - Register for event with payment
- `isRegistered(address user)` - Check if user is registered
- `getCategoryFee(string calldata category)` - Get registration fee for category
- `getCategoryDuration(string calldata category)` - Get event duration for category
- `getCategoryNames()` - Get all available category names
- `withdraw()` - Withdraw contract balance (owner only)
- `setCategoryFee(string calldata category, uint256 fee, uint256 duration)` - Update category settings

### CakeUpload.sol Functions
**Cake Management**
- `uploadCake(string title, string description, string fileUrl, string fileType, uint8 tableNumber, uint8 seatNumber, string story)` - Upload cake
- `removeCake(uint256 cakeId)` - Remove own cake
- `getCake(uint256 cakeId)` - Get cake details
- `getAllActiveCakes()` - Get all active cake IDs
- `getUserCakes(address user)` - Get user's cakes
- `isSeatOccupied(uint8 tableNumber, uint8 seatNumber)` - Check seat availability
- `getSeatInfo(uint8 tableNumber, uint8 seatNumber)` - Get seat information

### CakeVoting.sol Functions
**Voting System**
- `vote(uint256 cakeId, string calldata category)` - Cast vote for cake
- `hasVotedInCategory(address voter, string calldata category)` - Check if user voted
- `resetVote(address voter, string calldata category)` - Reset user vote (owner only)

### Events
- **CakePicnic**: `Registered(address indexed user, uint256 timestamp, string category)`
- **CakeUpload**: `CakeUploaded(uint256 indexed cakeId, address indexed uploader, string title, uint8 tableNumber, uint8 seatNumber, string fileType)`
- **CakeVoting**: `VoteCast(address indexed voter, uint256 indexed cakeId, string category)`

## �️ Getting Contract Address & ABI from Remix

### Step-by-Step Guide

#### 1. Deploy Contract in Remix
1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create new file and paste your contract code
3. Go to **Solidity Compiler** tab
4. Select correct compiler version (^0.8.19 or ^0.8.20)
5. Click **Compile**
6. Go to **Deploy & Run Transactions** tab
7. Select **Injected Provider - MetaMask** as environment
8. Make sure you're connected to **Holesky Testnet**
9. Click **Deploy**

#### 2. Get Contract Address
After successful deployment:
1. Look in the **Deployed Contracts** section
2. Copy the contract address (starts with `0x...`)
3. This is your deployed contract address

#### 3. Get Contract ABI
1. In **Solidity Compiler** tab, click on your contract name
2. Scroll down to find **ABI** section
3. Click the **Copy** button next to ABI
4. This copies the complete ABI JSON to clipboard

#### 4. Verify on Etherscan
1. Go to [Holesky Etherscan](https://holesky.etherscan.io/)
2. Search for your contract address
3. Go to **Contract** tab → **Verify and Publish**
4. Upload your source code for verification

### Example ABI Usage in Frontend
```typescript
// In src/config/contracts.ts
export const cakePicnicAddress = {
  17000: '0x...' // Your deployed address
}

export const cakePicnicABI = [
  // Paste your copied ABI here
]
```

## �💰 Registration Categories (CakePicnic)

### Default Categories
1. **Normal**: 0.01 ETH - 120 minutes duration
2. **Premium**: 0.03 ETH - 180 minutes duration
3. **Family**: 0.05 ETH - 150 minutes duration
4. **PremiumFamily**: 0.08 ETH - 240 minutes duration

### Category Features
- **Dynamic Management**: Owner can add/update categories
- **Flexible Pricing**: Each category has custom fee and duration
- **Validation**: Contract validates payment matches category fee

## 🏗️ Seat Management (CakeUpload)

### Table Layout
- **5 Tables**: Numbered 1-5
- **6 Seats per Table**: Numbered 1-6
- **Total Capacity**: 30 cakes maximum
- **Real-time Availability**: Seat status tracked on blockchain

### File Support
- **Images**: JPG, PNG formats
- **3D Models**: GLB files
- **Storage**: IPFS hashes or direct URLs
- **Metadata**: Title, description, story stored on-chain

## �️ Voting Categories (CakeVoting)

### Supported Categories
- **"beautiful"**: Vote for most beautiful cake
- **"delicious"**: Vote for most delicious cake

### Voting Rules
- **One Vote per Category**: Each wallet can vote once per category
- **Immutable Records**: All votes permanently stored on blockchain
- **Category Validation**: Only "beautiful" and "delicious" accepted
- **Admin Reset**: Owner can reset votes if needed

## �🚀 Usage in Frontend

The contracts are integrated with the frontend using:
- **Wagmi v2**: React hooks for Web3 interactions
- **Contract ABIs**: Located in `src/config/contracts.ts`
- **MetaMask**: User wallet connection and transaction signing
- **Multi-contract Support**: All three contracts working together

### Integration Flow
1. **Registration**: CakePicnic contract handles event registration
2. **Upload**: CakeUpload contract manages cake submissions
3. **Voting**: CakeVoting contract records votes
4. **Results**: Frontend aggregates data from all contracts

## 🔒 Security Features

### Across All Contracts
- **Owner-only Functions**: Critical functions restricted to contract owners
- **Input Validation**: All user inputs validated on-chain
- **Duplicate Prevention**: Various mechanisms prevent duplicate actions
- **Safe Operations**: Modern Solidity patterns used throughout

### Specific Security
- **CakePicnic**: Payment validation, exact fee matching
- **CakeUpload**: Seat availability checks, ownership verification
- **CakeVoting**: Category validation, duplicate vote prevention

## 📝 Deployment Notes

- **Testnet Deployment**: All contracts deployed on Holesky testnet for safe testing
- **Permanent Records**: All data permanently recorded on blockchain
- **Gas Optimization**: Contracts optimized for gas efficiency
- **Frontend Integration**: Contract addresses configured in frontend config files
- **Verification**: Recommend verifying contracts on Etherscan for transparency

## 🔗 Contract Interactions

The three contracts work together to provide a complete cake competition platform:

1. **Users register** via CakePicnic (with payment)
2. **Upload cakes** via CakeUpload (with seat assignment)
3. **Vote for favorites** via CakeVoting (blockchain recorded)
4. **View results** aggregated from all contract data
