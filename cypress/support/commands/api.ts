/// <reference types="cypress" />
import { HttpMethod, TRPCResponse } from '../types';

// TRPC specific helpers
const TRPC_PREFIX = '/api/trpc';

// TRPC interceptor
Cypress.Commands.add('interceptTrpc', (procedure: string, response: any) => {
  return cy.intercept('POST', `${TRPC_PREFIX}/${procedure}`, {
    statusCode: 200,
    body: {
      result: {
        data: response
      }
    } as TRPCResponse
  }).as(`trpc_${procedure}`);
});

// Generic API interceptor
Cypress.Commands.add('interceptApi', (method: HttpMethod, path: string, response?: any) => {
  const alias = `api_${path.replace(/\//g, '_')}`;
  
  if (response) {
    return cy.intercept({
      method,
      url: path
    }, {
      statusCode: 200,
      body: response
    }).as(alias);
  } else {
    return cy.intercept({
      method,
      url: path
    }).as(alias);
  }
});

// Common API mocks
Cypress.Commands.add('mockUserProfile', (profile: any) => {
  return cy.interceptTrpc('user.getProfile', profile);
});

Cypress.Commands.add('mockLawnProfiles', (profiles: any[]) => {
  return cy.interceptTrpc('lawn.list', profiles);
});

Cypress.Commands.add('mockGrassSpecies', (species: any[]) => {
  return cy.interceptTrpc('species.list', species);
});

Cypress.Commands.add('mockSchedule', (schedule: any) => {
  return cy.interceptTrpc('schedule.get', schedule);
});