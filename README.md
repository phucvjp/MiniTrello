# 🚀 Mini Trello

A modern, full-stack Kanban board application inspired by Trello, built with React, TypeScript, Material-UI, Express.js, and Firebase. Features real-time collaboration, drag-and-drop functionality, and email verification system.

![Mini Trello Screenshot](https://img.shields.io/badge/Status-In%20Development-yellow)
![License](https://img.shields.io/badge/License-ISC-blue)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![React](https://img.shields.io/badge/React-19.1.1-blue)

## ✨ Features

### 🎯 Core Features
- **📋 Kanban Board Management**: Create, edit, and organize boards
- **📝 Card Management**: Create, edit, delete, and move cards between columns
- **🎨 Drag & Drop**: Intuitive HTML5 drag-and-drop interface for card movement
- **⚡ Real-time Updates**: Live collaboration with Socket.io
- **🔐 Authentication**: Secure user authentication with JWT and GitHub OAuth
- **📧 Email Verification**: 6-digit verification codes via Resend API
- **👥 User Management**: Profile management and user avatars

### 🚀 Advanced Features
- **🎨 Material Design**: Beautiful UI with Material-UI components
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🔄 Real-time Notifications**: Toast notifications for all actions
- **🎛️ Priority Management**: Set and manage card priorities
- **💬 Comments System**: Add comments to cards
- **📎 Attachments**: Support for file attachments (planned)
- **🏷️ Labels & Tags**: Organize cards with custom labels

## 🏗️ Tech Stack

### Frontend
- **React 19.1.1** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Material-UI v5** - Premium React UI framework
- **React Router v7** - Client-side routing
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Beautiful notifications
- **HTML5 Drag & Drop API** - Native drag-and-drop functionality

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Database and authentication
- **Socket.io** - Real-time communication
- **JWT** - Secure authentication tokens
- **Passport.js** - Authentication middleware
- **Resend** - Email delivery service
- **bcryptjs** - Password hashing

### Database & Services
- **Firebase Firestore** - NoSQL document database
- **Resend** - Transactional email service
- **GitHub OAuth** - Social authentication

## 📁 Project Structure

```
MiniTrello/
├── be/                          # Backend (Express.js)
│   ├── config/
│   │   ├── firebase.js          # Firebase configuration
│   │   └── passport.js          # Passport authentication config
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validation.js        # Input validation
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── boards.js            # Board management routes
│   │   ├── cards.js             # Card management routes
│   │   └── tasks.js             # Task management routes
│   ├── services/
│   │   └── emailService.js      # Email service with Resend
│   ├── server.js                # Main server file
│   └── package.json
│
├── fe/                          # Frontend (React + TypeScript)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/            # Authentication components
│   │   │   ├── Board/           # Board-related components
│   │   │   └── Layout/          # Layout components
│   │   ├── contexts/            # React contexts
│   │   │   ├── AuthContext.tsx  # Authentication context
│   │   │   └── SocketContext.tsx # Socket.io context
│   │   ├── pages/               # Page components
│   │   │   ├── Auth/            # Auth pages
│   │   │   ├── Board/           # Board pages
│   │   │   ├── Dashboard/       # Dashboard page
│   │   │   └── Profile/         # Profile page
│   │   ├── services/
│   │   │   └── api.ts           # API service layer
│   │   ├── theme/
│   │   │   └── trelloTheme.ts   # Material-UI theme
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Firebase Project** with Firestore enabled
- **Resend Account** for email services
- **GitHub OAuth App** (optional, for social login)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/phucvjp/MiniTrello.git
   cd MiniTrello
   ```

2. **Backend Setup**
   ```bash
   cd be
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd ../fe
   npm install
   ```

### Environment Configuration

Create a `.env` file in the `be/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id

# Resend Email Service
RESEND_API_KEY=re_your-resend-api-key

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Running the Application

1. **Start the Backend**
   ```bash
   cd be
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

2. **Start the Frontend** (in another terminal)
   ```bash
   cd fe
   npm start
   ```
   Frontend will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/github` - GitHub OAuth login

### Boards
- `GET /api/boards` - Get user boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Cards
- `GET /api/cards?boardId=:id` - Get board cards
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `PUT /api/cards/:id/move` - Move card (with real-time updates)
- `DELETE /api/cards/:id` - Delete card

## 🎯 Real-time Features

The application uses Socket.io for real-time collaboration:

- **Live Card Movement**: See cards move in real-time across all connected clients
- **Board Updates**: Live updates when boards are modified
- **User Presence**: See who's currently viewing the board
- **Notifications**: Real-time notifications for all actions

### Socket Events
- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `card:moved` - Card moved between columns
- `board:updated` - Board information updated
- `user:typing` - User typing indicators

## 🎨 UI/UX Features

- **Drag & Drop**: Native HTML5 drag-and-drop for intuitive card movement
- **Visual Feedback**: Smooth animations and hover effects
- **Responsive Design**: Mobile-first approach with Material-UI
- **Dark/Light Theme**: Support for theme switching (planned)
- **Toast Notifications**: Beautiful success/error messages
- **Loading States**: Skeleton loaders and progress indicators

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Express rate limiting for API protection
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Helmet.js**: Security headers for Express.js

## 📧 Email System

Powered by **Resend** for reliable email delivery:

- **Welcome Emails**: Automated welcome emails for new users
- **Email Verification**: 6-digit verification codes
- **Password Reset**: Secure password reset functionality
- **Beautiful Templates**: HTML email templates with branding

## 🧪 Testing

```bash
# Frontend tests
cd fe
npm test

# Backend tests (to be implemented)
cd be
npm test
```

## 📦 Deployment

### Frontend (Build)
```bash
cd fe
npm run build
```

### Backend (Production)
```bash
cd be
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Trello** - Inspiration for the design and functionality
- **Material-UI** - Beautiful React components
- **Firebase** - Backend-as-a-Service platform
- **Resend** - Modern email delivery service
- **Socket.io** - Real-time communication library

## 📞 Support

If you have any questions or need help with setup, please open an issue on GitHub.

---

**Built with ❤️ by [phucvjp](https://github.com/phucvjp)**
