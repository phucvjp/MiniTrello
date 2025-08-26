# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with React + TypeScript frontend and Express.js backend
- User authentication system with JWT and GitHub OAuth
- Email verification system using Resend API with 6-digit codes
- Kanban board creation and management
- Card creation, editing, and deletion functionality
- Real-time drag-and-drop card movement between columns
- Socket.io integration for real-time collaboration
- Material-UI design system implementation
- Responsive design for mobile and desktop
- Toast notifications for user feedback
- Firebase Firestore database integration
- Comprehensive API endpoints for boards and cards
- User profile management
- Password reset functionality
- Rate limiting and security middleware
- Reusable CreateBoardDialog component

### Changed
- Migrated from Nodemailer to Resend for email services
- Implemented HTML5 drag-and-drop instead of external libraries
- Extracted CreateBoardDialog into reusable component

### Fixed
- ESLint errors with global variable usage
- Socket room naming convention consistency
- Real-time card movement synchronization across clients

### Security
- JWT token-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS configuration
- Rate limiting for API endpoints
- Helmet.js security headers

## [1.0.0] - TBD

### Added
- Initial stable release

---

## Version History

- **v1.0.0** - Initial stable release (planned)
- **v0.1.0** - Initial development version with core features
