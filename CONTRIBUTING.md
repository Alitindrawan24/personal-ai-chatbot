# Contributing to Portfolio AI Chatbot

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the GitHub issue tracker
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Open a GitHub issue with the "enhancement" label
2. Describe the feature and its use case
3. Explain why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/portfolio-chatbot-ai.git
cd portfolio-chatbot-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your credentials to .env
# Never commit .env file!

# Run development server
npm run dev
```

### Code Style

- Use ES6+ features
- Follow existing code patterns
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Test your changes locally
- Ensure existing functionality still works
- Add tests for new features (if applicable)

### Security

- Never commit credentials or API keys
- Report security issues privately (see SECURITY.md)
- Follow security best practices

## Questions?

Open a GitHub issue with the "question" label.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
