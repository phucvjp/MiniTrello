# Contributing to Mini Trello

We love your input! We want to make contributing to Mini Trello as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Code Style

### Frontend (React/TypeScript)
- Use TypeScript for all new components
- Follow React hooks patterns
- Use Material-UI components when possible
- Maintain consistent naming conventions:
  - Components: PascalCase (`BoardView`, `CreateBoardDialog`)
  - Functions: camelCase (`handleBoardCreated`, `loadCards`)
  - Files: PascalCase for components, camelCase for utilities

### Backend (Node.js/Express)
- Use async/await for asynchronous operations
- Follow REST API conventions
- Include proper error handling
- Use JSDoc comments for functions
- Maintain consistent file structure

### General Guidelines
- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Resend account

### Local Development
1. Clone your fork locally
2. Follow the setup instructions in README.md
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Test your changes thoroughly
6. Commit and push to your fork
7. Create a pull request

## Commit Messages

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(auth): add GitHub OAuth integration
fix(drag-drop): resolve card positioning issue
docs(readme): update installation instructions
```

## Project Structure Guidelines

### Frontend Structure
```
src/
├── components/           # Reusable UI components
│   ├── Auth/            # Authentication-related components
│   ├── Board/           # Board-specific components
│   └── Layout/          # Layout components (Navbar, etc.)
├── contexts/            # React contexts
├── pages/               # Page components
├── services/            # API and external services
├── types/               # TypeScript type definitions
├── theme/               # Material-UI theme configuration
└── utils/               # Utility functions
```

### Backend Structure
```
be/
├── config/              # Configuration files
├── middleware/          # Express middleware
├── routes/              # API route handlers
├── services/            # Business logic services
└── server.js            # Main server file
```

## Feature Development Guidelines

### Adding New Features

1. **Plan First**: Discuss significant features in an issue before implementing
2. **Small PRs**: Keep pull requests focused and reasonably sized
3. **Tests**: Add tests for new functionality
4. **Documentation**: Update relevant documentation
5. **Real-time**: Consider real-time implications for collaborative features

### UI/UX Guidelines

- Follow Material Design principles
- Ensure responsive design (mobile-first)
- Add loading states for async operations
- Include error handling and user feedback
- Test across different screen sizes

### API Guidelines

- Follow REST conventions
- Include proper HTTP status codes
- Add input validation
- Implement rate limiting for public endpoints
- Document new endpoints
- Include real-time events where appropriate

## Testing

### Frontend Testing
```bash
cd fe
npm test
```

### Backend Testing
```bash
cd be
npm test
```

Test Requirements:
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows (planned)

## Issues

We use GitHub issues to track public bugs. Report a bug by opening a new issue.

### Bug Reports

Great bug reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

Feature requests should include:

- Clear description of the problem being solved
- Proposed solution or implementation approach
- Alternative solutions considered
- Additional context or mockups if applicable

## Security

If you discover a security vulnerability, please email us directly instead of opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Questions?

Feel free to open an issue for any questions about contributing!

---

Thank you for contributing to Mini Trello! 🎉
