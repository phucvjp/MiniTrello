const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Mini Trello Backend Setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found!');
  console.log('📝 Please copy .env.example to .env and configure your environment variables:\n');
  console.log('   cp .env.example .env\n');
  console.log('Required configurations:');
  console.log('   - JWT_SECRET: Generate a strong random string');
  console.log('   - FIREBASE_SERVICE_ACCOUNT_KEY: Your Firebase service account JSON');
  console.log('   - FIREBASE_DATABASE_URL: Your Firebase database URL');
  console.log('   - EMAIL_USER/EMAIL_PASS: For sending verification emails\n');
  
  // Create a basic .env file for development
  const basicEnv = `# Basic development configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-change-in-production
# Add your Firebase and email configurations here
`;
  
  fs.writeFileSync(envPath, basicEnv);
  console.log('✅ Created basic .env file for development\n');
}

// Check Firebase configuration
console.log('🔥 Firebase Setup Instructions:');
console.log('   1. Go to Firebase Console (https://console.firebase.google.com/)');
console.log('   2. Create a new project or select existing one');
console.log('   3. Go to Project Settings > Service Accounts');
console.log('   4. Generate new private key and download JSON');
console.log('   5. Copy the JSON content to FIREBASE_SERVICE_ACCOUNT_KEY in .env');
console.log('   6. Enable Firestore Database in your Firebase project\n');

console.log('📧 Email Setup Instructions:');
console.log('   1. For Gmail: Enable 2FA and generate an App Password');
console.log('   2. Add your email and app password to .env file');
console.log('   3. Or use a service like SendGrid for production\n');

console.log('🎯 API Endpoints Available:');
console.log('   Authentication:');
console.log('     POST /api/auth/signup    - Register new user');
console.log('     POST /api/auth/signin    - Login user');
console.log('     GET  /api/auth/me        - Get current user');
console.log('     GET  /api/auth/verify-email - Verify email');
console.log('   ');
console.log('   Boards:');
console.log('     GET  /api/boards         - Get user boards');
console.log('     POST /api/boards         - Create new board');
console.log('     GET  /api/boards/:id     - Get board details');
console.log('     PUT  /api/boards/:id     - Update board');
console.log('     DELETE /api/boards/:id   - Delete board');
console.log('   ');
console.log('   Cards:');
console.log('     GET  /api/cards          - Get cards for board');
console.log('     POST /api/cards          - Create new card');
console.log('     PUT  /api/cards/:id      - Update card');
console.log('     DELETE /api/cards/:id    - Delete card');
console.log('     PUT  /api/cards/:id/move - Move card (drag & drop)');
console.log('   ');
console.log('   Tasks:');
console.log('     GET  /api/tasks          - Get tasks for card');
console.log('     POST /api/tasks          - Create new task');
console.log('     PUT  /api/tasks/:id      - Update task');
console.log('     DELETE /api/tasks/:id    - Delete task');
console.log('     PUT  /api/tasks/:id/toggle - Toggle task completion\n');

console.log('🔌 Socket.IO Events:');
console.log('   board:created, board:updated, board:deleted');
console.log('   card:created, card:updated, card:deleted, card:moved');
console.log('   task:created, task:updated, task:deleted, task:toggled');
console.log('   user:typing, user:joined, user:left\n');

console.log('🛠️  Development Commands:');
console.log('   npm run dev              - Start with nodemon (auto-reload)');
console.log('   npm start               - Start production server\n');

console.log('✨ Ready to start the server!');
console.log('   Run: npm run dev\n');

// Start the actual server
require('./server.js');
