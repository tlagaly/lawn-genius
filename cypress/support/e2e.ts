import '@testing-library/cypress/add-commands';
import './commands/auth';
import './commands/navigation';
import './commands/api';

declare global {
  namespace Cypress {
    interface Chainable {
      // Auth commands
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      
      // Navigation commands
      navigateTo(path: string): Chainable<void>;
      
      // API commands
      interceptApi(method: string, path: string, response?: any): Chainable<void>;
    }
  }
}

beforeEach(() => {
  // Clear local storage and cookies before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Preserve Next.js authentication token if needed
  cy.getCookie('next-auth.session-token').then((cookie) => {
    if (cookie) {
      cy.setCookie('next-auth.session-token', cookie.value);
    }
  });
});