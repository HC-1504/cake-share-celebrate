# Cake Picnic - Blockchain-Powered Cake Sharing Platform

A modern web application that allows users to upload and share their cakes on the blockchain, featuring 3D model support, seat management, and voting system.

## 🍰 Features

- **Blockchain Integration**: Upload cakes to Ethereum blockchain (Holesky testnet)
- **3D Model Support**: Upload GLB files for interactive 3D cake models
- **Seat Management**: Choose table and seat positions with real-time availability
- **Voting System**: Vote for your favorite cakes
- **User Authentication**: Secure login and registration system
- **Email Integration**: Password reset functionality
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui
- **Real-time Updates**: Live blockchain transaction status

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask wallet extension
- Holesky testnet configured in MetaMask

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

## 📁 Project Structure

```
cake-share-celebrate/
├── backend/                 # Express.js server
│   ├── models/             # Sequelize database models
│   ├── index.js            # Main server file
│   ├── email-config.js     # Email configuration
│   └── view-database.js    # Database viewer utility
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── config/            # Web3 configuration
│   └── hooks/             # Custom React hooks
├── uploads/               # File upload directory
└── public/               # Static assets
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Wagmi** for Ethereum integration
- **React Hook Form** for form handling

### Backend
- **Express.js** server
- **Sequelize** ORM with SQLite database
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email functionality
- **bcryptjs** for password hashing

### Blockchain
- **Ethereum** (Holesky testnet)
- **Solidity** smart contracts
- **Web3Modal** for wallet connection

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

## 🎯 Key Features Explained

### Cake Upload Process
1. **File Upload**: Upload images or 3D models (GLB files)
2. **Position Selection**: Choose table and seat with real-time availability
3. **Blockchain Upload**: Upload cake metadata to Ethereum blockchain
4. **Database Storage**: Store cake details in SQLite database

### Seat Management
- Real-time seat availability checking
- Prevents duplicate seat assignments
- Visual seat grid with occupied/available indicators

### 3D Model Support
- Upload GLB files for interactive 3D models
- Three.js integration for 3D rendering
- Fallback to simple viewer for unsupported browsers

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

## 🗄️ Database

SQLite database with the following main tables:
- **Users**: User registration and authentication
- **Cakes**: Cake uploads and metadata
- **Votes**: Voting system data

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

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure MetaMask is connected to Holesky testnet
3. Verify all environment variables are set correctly
4. Check that the backend server is running on port 5001

## 🎉 Acknowledgments

- Built with modern web technologies
- Powered by Ethereum blockchain
- Styled with Tailwind CSS and shadcn/ui
- 3D rendering with Three.js
