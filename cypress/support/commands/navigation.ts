// Define common routes for type safety
export const routes = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  dashboard: '/dashboard',
  profile: '/dashboard/settings',
  lawnProfiles: '/dashboard/lawn',
  grassSpecies: '/dashboard/grass-species',
  schedule: '/dashboard/schedule',
  notifications: '/dashboard/notifications'
} as const;

type Route = keyof typeof routes;

Cypress.Commands.add('navigateTo', (path: string) => {
  // Handle loading states
  cy.visit(path);
  
  // Wait for page to be fully loaded
  cy.get('body').should('not.have.class', 'loading');
  
  // Ensure no error states are present
  cy.get('[data-cy=error-message]').should('not.exist');
});

// Navigation helpers for common flows
Cypress.Commands.add('goToDashboard', () => {
  cy.navigateTo(routes.dashboard);
  // Wait for dashboard-specific elements
  cy.get('[data-cy=dashboard-content]').should('be.visible');
});

Cypress.Commands.add('goToLawnProfiles', () => {
  cy.navigateTo(routes.lawnProfiles);
  // Wait for lawn profiles list
  cy.get('[data-cy=lawn-profiles-list]').should('be.visible');
});

Cypress.Commands.add('goToGrassSpecies', () => {
  cy.navigateTo(routes.grassSpecies);
  // Wait for species grid
  cy.get('[data-cy=species-grid]').should('be.visible');
});

Cypress.Commands.add('goToSchedule', () => {
  cy.navigateTo(routes.schedule);
  // Wait for calendar
  cy.get('[data-cy=schedule-calendar]').should('be.visible');
});

// Add these to global Cypress chain
declare global {
  namespace Cypress {
    interface Chainable {
      goToDashboard(): Chainable<void>;
      goToLawnProfiles(): Chainable<void>;
      goToGrassSpecies(): Chainable<void>;
      goToSchedule(): Chainable<void>;
    }
  }
}