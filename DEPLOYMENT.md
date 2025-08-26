# Deployment Guide

This guide covers deploying Mini Trello to various cloud platforms.

## 🚀 Render.com Deployment

### Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Root Directory: `be`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   Set these environment variables in Render:
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-frontend-domain.onrender.com
   JWT_SECRET=your-super-secure-jwt-secret
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   RESEND_API_KEY=re_your-resend-api-key
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   HTTPS=true
   ```

### Frontend Deployment

1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Root Directory: `fe`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   REACT_APP_SOCKET_URL=https://your-backend-domain.onrender.com
   ```

3. **Build Settings**
   Create `fe/_redirects` file:
   ```
   /*    /index.html   200
   ```

## 🌊 Heroku Deployment

### Backend

1. **Create Heroku App**
   ```bash
   heroku create your-app-name-backend
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set FRONTEND_URL=https://your-frontend-app.herokuapp.com
   # ... other variables
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix be heroku main
   ```

### Frontend

1. **Create Heroku App**
   ```bash
   heroku create your-app-name-frontend
   heroku buildpacks:set mars/create-react-app
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set REACT_APP_API_URL=https://your-backend-app.herokuapp.com
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix fe heroku main
   ```

## 🐳 Docker Deployment

### Backend Dockerfile

Create `be/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["npm", "start"]
```

### Frontend Dockerfile

Create `fe/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./be
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FRONTEND_URL=http://localhost:3000
    env_file:
      - ./be/.env

  frontend:
    build: ./fe
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:3001
```

Run with:
```bash
docker-compose up -d
```

## ☁️ Vercel Deployment

### Frontend (Recommended for Vercel)

1. **Connect GitHub Repository**
2. **Build Settings**
   - Framework Preset: Create React App
   - Root Directory: `fe`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-domain.com
   REACT_APP_SOCKET_URL=https://your-backend-domain.com
   ```

### Backend (Vercel Functions)

Create `be/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

## 🔧 Environment Configuration

### Production Environment Variables

**Required:**
- `NODE_ENV=production`
- `JWT_SECRET` - Strong secret key for JWT tokens
- `FRONTEND_URL` - Your frontend domain
- `RESEND_API_KEY` - For email services
- Firebase configuration variables

**Optional:**
- `PORT` - Server port (default: 3001)
- `HTTPS=true` - Enable HTTPS-only cookies
- GitHub OAuth credentials

### Firebase Setup

1. Create a Firebase project
2. Enable Firestore database
3. Create a service account
4. Download the service account JSON
5. Extract the required fields for environment variables

### Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add to environment variables

## 🔒 Security Considerations

- Use strong JWT secrets
- Enable HTTPS in production
- Set secure cookie options
- Configure CORS properly
- Use environment variables for all secrets
- Enable rate limiting
- Trust proxy settings for deployed platforms

## 📊 Monitoring

### Health Checks

- Backend: `GET /health` or `GET /api/health`
- Returns server status, uptime, and version

### Logs

Monitor application logs for:
- Authentication attempts
- Rate limit hits
- Database errors
- Socket connection issues

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` environment variable
   - Verify CORS configuration in server.js

2. **Socket.io Connection Issues**
   - Ensure WebSocket support on hosting platform
   - Check Socket.io configuration

3. **Firebase Connection Issues**
   - Verify all Firebase environment variables
   - Check service account permissions

4. **Rate Limiting Issues**
   - Verify trust proxy configuration
   - Check `X-Forwarded-For` header handling

5. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check build logs for specific errors

---

For specific platform issues, consult the platform's documentation or create an issue in the repository.
