# 🍰 Cake Share & Celebrate - Blockchain-Powered Cake Competition Platform

A comprehensive web application for cake competitions featuring blockchain voting, 3D model support, real-time results, and complete transparency. Perfect for cake contests, baking competitions, and community events.

## ✨ Key Features

### 🔗 Blockchain Voting System
- **Secure Voting**: All votes recorded on Ethereum blockchain (Holesky testnet)
- **Transparent Results**: Real-time voting results with voter address verification
- **Duplicate Prevention**: Smart contracts prevent multiple votes per category
- **Blockchain Proof**: Every vote verifiable on Etherscan

### 🎂 Cake Management
- **Multi-format Support**: Upload images (JPG, PNG) or 3D models (GLB files)
- **Interactive 3D Viewer**: Three.js powered 3D cake model rendering
- **Detailed Information**: Cake descriptions, ingredients, and creation stories
- **Table & Seat Assignment**: Real-time seat management system

### 🏆 Competition Features
- **Dual Categories**: "Most Beautiful" and "Most Delicious" voting
- **Live Results**: Real-time leaderboards with ranking system
- **Winner Highlighting**: Special styling for top-ranked cakes
- **Voter Evidence**: Complete list of wallet addresses that voted

### 👤 User Experience
- **Complete Event Flow**: Registration → Upload → Check-in → Vote → Check-out
- **MetaMask Integration**: Seamless Web3 wallet connection
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Real-time Updates**: Live status updates and notifications

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or yarn package manager
- **MetaMask** wallet extension installed
- **Holesky testnet** configured in MetaMask with test ETH
- **Modern browser** with WebGL support (for 3D models)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cake-share-celebrate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your-super-secret-key-that-is-long-and-secure
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8081`

6. **Connect MetaMask**
   - Install MetaMask extension if not already installed
   - Add Holesky testnet to MetaMask
   - Get test ETH from a Holesky faucet
   - Connect your wallet to start voting

## 📁 Project Structure

```
cake-share-celebrate/
├── backend/                 # Express.js server
│   ├── models/             # Sequelize database models
│   ├── index.js            # Main server file with voting API
│   ├── email-config.js     # Email configuration
│   └── view-database.js    # Database viewer utility
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ContractTest.tsx    # Blockchain debugging component
│   │   ├── ModelViewer.tsx     # 3D model viewer
│   │   └── ErrorBoundary.tsx   # Error handling
│   ├── pages/             # Main application pages
│   │   ├── voting.tsx         # Blockchain voting interface
│   │   ├── Results.tsx        # Real-time results & rankings
│   │   ├── About.tsx          # How it works guide
│   │   ├── Gallery.tsx        # Cake gallery
│   │   └── checkin.tsx        # Event check-in/out
│   ├── config/
│   │   └── contracts.ts       # Smart contract ABI & addresses
│   └── hooks/             # Custom React hooks
├── uploads/               # Uploaded cake images & 3D models
└── public/               # Static assets
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and building
- **Tailwind CSS** for responsive styling
- **shadcn/ui** for beautiful, accessible UI components
- **React Router** for client-side navigation
- **Wagmi v2** for Ethereum integration and Web3 hooks
- **React Hook Form** for efficient form handling
- **Three.js** for 3D model rendering
- **Lucide React** for consistent iconography

### Backend
- **Express.js** RESTful API server
- **Sequelize** ORM with SQLite database
- **JWT** for secure authentication
- **Multer** for file upload handling (images & 3D models)
- **Nodemailer** for email functionality
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### Blockchain & Web3
- **Ethereum** blockchain (Holesky testnet)
- **Smart Contracts** for voting logic
- **MetaMask** integration for wallet connection
- **Etherscan** integration for transaction verification
- **Real-time** blockchain state monitoring

## 🔧 Available Scripts

```bash
# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎯 How It Works - Complete Event Flow

### 1. Registration
- Users sign up and create accounts
- Secure authentication with JWT tokens
- Email verification and password reset functionality

### 2. Upload Cake
- Upload cake photos (JPG, PNG) or 3D models (GLB files)
- Add detailed descriptions, ingredients, and creation stories
- Choose table and seat positions with real-time availability
- Store cake metadata securely in database

### 3. Check In
- Event participants check in when they arrive
- Real-time attendance tracking
- Seat assignment confirmation

### 4. Vote (Blockchain-Powered)
- Connect MetaMask wallet to Holesky testnet
- Vote for "Most Beautiful" and "Most Delicious" cakes
- Each vote recorded permanently on blockchain
- Smart contracts prevent duplicate voting
- Real-time transaction confirmation

### 5. Check Out
- Participants check out when leaving
- Complete event attendance tracking

## 🏆 Voting & Results System

### Blockchain Voting Features
- **Immutable Records**: All votes permanently stored on blockchain
- **Transparency**: Every vote verifiable on Etherscan
- **Fair Play**: Smart contracts prevent cheating and duplicate votes
- **Real-time Results**: Live leaderboards update as votes are cast

### Results Page Features
- **Live Rankings**: Real-time top cakes in each category
- **Voter Evidence**: Complete list of wallet addresses that voted
- **Winner Highlighting**: Special styling for #1 ranked cakes
- **Blockchain Links**: Direct links to verify votes on Etherscan
- **Vote Counts**: Exact number of votes for each cake

## 🔐 Authentication

- JWT-based authentication
- Secure password hashing with bcryptjs
- Email-based password reset functionality
- Protected routes and API endpoints

## 📧 Email Configuration

The application uses Gmail SMTP for sending emails. Configure your email settings in `backend/email-config.js`:

```javascript
export const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};
```

## 🗄️ Database Schema

SQLite database with comprehensive data structure:

### Tables
- **Users**: User accounts, authentication, and profile data
- **Cakes**: Cake details, images/3D models, table assignments
- **Votes**: Blockchain voting records with voter addresses and transaction hashes

### Key Features
- **Relational Design**: Proper foreign key relationships
- **Blockchain Integration**: Transaction hashes stored for verification
- **File Management**: Secure file path storage for uploads
- **Real-time Queries**: Optimized for live results and voting status

## 🌐 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm install
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues & Solutions

#### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Add Holesky testnet to MetaMask networks
- Get test ETH from a Holesky faucet
- Refresh page after connecting wallet

#### Voting Problems
- Check you're on the correct network (Holesky)
- Ensure you haven't already voted for that category
- Verify you have sufficient test ETH for gas fees
- Check transaction status on Etherscan

#### File Upload Issues
- Supported formats: JPG, PNG (images), GLB (3D models)
- Maximum file size limits apply
- Ensure backend server is running on port 5001

#### 3D Model Display Issues
- Ensure browser supports WebGL
- GLB files must be properly formatted
- Check browser console for Three.js errors

### Debug Tools
- **Contract Test Component**: Shows blockchain connection status
- **Console Logs**: Check browser developer tools
- **API Endpoints**: Test backend connectivity
- **Database Viewer**: Use `node backend/view-database.js`

## � Live Demo Features

### Pages & Navigation
- **Home**: Welcome page with event overview
- **About**: Complete guide on how the system works
- **Gallery**: Browse all uploaded cakes with filtering
- **Voting**: Blockchain-powered voting interface
- **Results**: Real-time leaderboards with voter evidence
- **Check-in**: Event attendance management

### Smart Contract Integration
- **Holesky Testnet**: Safe testing environment
- **Vote Recording**: Permanent blockchain storage
- **Duplicate Prevention**: Smart contract validation
- **Transaction Verification**: Etherscan integration

## 🎉 Acknowledgments

- **Blockchain**: Powered by Ethereum and Holesky testnet
- **UI/UX**: Beautiful design with Tailwind CSS and shadcn/ui
- **3D Graphics**: Interactive models with Three.js
- **Web3**: Seamless integration with Wagmi and MetaMask
- **Modern Stack**: React 18, TypeScript, and Vite
- **Database**: Reliable data with Sequelize and SQLite

---

**Built for cake competitions, baking contests, and community events with complete transparency and blockchain verification.** 🍰✨
