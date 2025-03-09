/// <reference types="cypress" />
import { HttpMethod } from '../types';

// Test user data
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

Cypress.Commands.add('login', (email: string = TEST_USER.email, password: string = TEST_USER.password) => {
  // Intercept auth API calls
  cy.interceptApi('POST' as HttpMethod, '/api/auth/signin/credentials', {
    statusCode: 200,
    body: {
      user: {
        email,
        name: TEST_USER.name
      }
    }
  });

  // Visit login page with error handling
  cy.visit('/auth/login', {
    failOnStatusCode: false,
    timeout: 10000,
    retryOnNetworkFailure: true
  });

  // Fill in login form
  cy.get('[data-cy=email]', { timeout: 10000 }).should('be.visible').type(email);
  cy.get('[data-cy=password]', { timeout: 10000 }).should('be.visible').type(password);
  cy.get('[data-cy=submit]', { timeout: 10000 }).should('be.visible').click();

  // Wait for navigation to complete
  cy.url().should('not.include', '/auth/login');
});

Cypress.Commands.add('logout', () => {
  // Intercept logout request
  cy.interceptApi('POST' as HttpMethod, '/api/auth/signout', {
    statusCode: 200,
    body: { success: true }
  });

  // Click logout button/link
  cy.get('[data-cy=logout]', { timeout: 10000 }).should('be.visible').click();

  // Verify redirect to home page
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});

// Helper function to check auth state
Cypress.Commands.add('checkAuthState', (shouldBeLoggedIn: boolean) => {
  cy.window().then((win) => {
    const user = win.localStorage.getItem('user');
    if (shouldBeLoggedIn) {
      expect(user).to.exist;
    } else {
      expect(user).to.be.null;
    }
  });
});

// Add test setup command
Cypress.Commands.add('setupAuthTest', () => {
  // Clear previous state
  cy.clearLocalStorage();
  cy.clearCookies();

  // Set up interceptors for common auth endpoints
  cy.interceptApi('GET' as HttpMethod, '/api/auth/session', {
    statusCode: 200,
    body: null
  });

  cy.interceptApi('GET' as HttpMethod, '/api/auth/csrf', {
    statusCode: 200,
    body: { csrfToken: 'test-csrf-token' }
  });
});