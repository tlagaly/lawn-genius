# Cypress E2E Testing Setup

## Overview
This directory contains the end-to-end tests for the Lawn Genius application using Cypress. The tests cover critical user flows and ensure the application works as expected from a user's perspective.

## Structure
```
cypress/
├── e2e/                    # Test files organized by feature
│   └── auth/              # Authentication related tests
├── support/               # Support files and custom commands
│   ├── commands/         # Custom Cypress commands
│   │   ├── api.ts       # API and TRPC related commands
│   │   ├── auth.ts      # Authentication related commands
│   │   └── navigation.ts # Navigation related commands
│   ├── e2e.ts           # Main support file
│   └── types.ts         # Shared TypeScript types
└── tsconfig.json         # TypeScript configuration for Cypress
```

## Available Commands

### Running Tests
- `npm run cypress:open` - Opens Cypress Test Runner in interactive mode
- `npm run cypress:run` - Runs Cypress tests in headless mode
- `npm run cypress:run:auth` - Runs only authentication related tests

### Custom Commands

#### Authentication
- `cy.login(email, password)` - Logs in a user
- `cy.logout()` - Logs out the current user
- `cy.checkAuthState(shouldBeLoggedIn)` - Verifies authentication state

#### API/TRPC
- `cy.interceptTrpc(procedure, response)` - Intercepts TRPC calls
- `cy.interceptApi(method, path, response)` - Intercepts REST API calls
- `cy.mockUserProfile(profile)` - Mocks user profile data
- `cy.mockLawnProfiles(profiles)` - Mocks lawn profile data
- `cy.mockGrassSpecies(species)` - Mocks grass species data
- `cy.mockSchedule(schedule)` - Mocks schedule data

#### Navigation
- `cy.navigateTo(path)` - Navigates to a specific route
- `cy.goToDashboard()` - Navigates to dashboard
- `cy.goToLawnProfiles()` - Navigates to lawn profiles
- `cy.goToGrassSpecies()` - Navigates to grass species
- `cy.goToSchedule()` - Navigates to schedule

## Best Practices

1. **Test Organization**
   - Group tests by feature/functionality
   - Use descriptive test names
   - Keep tests independent and isolated

2. **Data Management**
   - Use cy.interceptApi/cy.interceptTrpc for API mocking
   - Clean up state before each test
   - Use meaningful test data

3. **Selectors**
   - Use data-cy attributes for test selectors
   - Avoid using CSS classes or IDs
   - Keep selectors specific to testing

4. **Assertions**
   - Make assertions specific and meaningful
   - Check both positive and negative cases
   - Verify state changes and UI updates

## Writing New Tests

1. Create a new test file in the appropriate directory under `cypress/e2e/`
2. Import any necessary commands or utilities
3. Use the provided custom commands for common operations
4. Follow the existing patterns for API mocking and assertions
5. Run tests locally before committing

Example:
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should do something specific', () => {
    // Arrange - Set up test data and mocks
    cy.interceptApi('GET', '/api/endpoint', mockData);

    // Act - Perform the test actions
    cy.navigateTo('/some-route');
    cy.get('[data-cy=element]').click();

    // Assert - Verify the expected outcome
    cy.get('[data-cy=result]').should('contain', 'Expected Result');
  });
});
```

## Debugging

1. Use `cy.log()` for debugging information
2. Check the Cypress Test Runner for detailed logs
3. Use the time-travel feature to debug test steps
4. Review screenshots and videos in CI failures

## CI/CD Integration

Tests are automatically run in the CI pipeline:
- On pull requests to main branch
- On direct pushes to main branch
- Nightly for regression testing

Failed tests will block merging of pull requests.