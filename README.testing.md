# Testing Guide

## Overview
This project includes comprehensive testing infrastructure with:
- **Unit Tests**: Vitest + React Testing Library
- **Integration Tests**: Component and hook testing
- **E2E Tests**: Playwright for end-to-end testing
- **Mocking**: MSW for API mocking

## Running Tests

```bash
# Unit & Integration Tests
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:ui       # Visual UI
npm run test:coverage # With coverage

# E2E Tests
npm run test:e2e      # Run E2E tests
npm run test:e2e:ui   # E2E with UI
```

## Test Structure
- `src/test/` - Test utilities and setup
- `src/test/components/` - Component tests
- `src/test/hooks/` - Hook tests
- `src/test/integration/` - Integration tests
- `src/test/factories/` - Test data factories
- `e2e/` - Playwright E2E tests

## Key Features
- ✅ Vitest configuration with JSdom
- ✅ React Testing Library setup
- ✅ MSW API mocking
- ✅ Playwright E2E testing
- ✅ Test factories for data creation
- ✅ Comprehensive test utilities