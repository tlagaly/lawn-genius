export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface TRPCResponse<T = any> {
  result: {
    data: T;
  };
}

declare global {
  namespace Cypress {
    interface Chainable {
      // Auth commands
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      checkAuthState(shouldBeLoggedIn: boolean): Chainable<void>;
      setupAuthTest(): Chainable<void>;
      
      // Navigation commands
      navigateTo(path: string): Chainable<void>;
      
      // API commands
      interceptApi(method: HttpMethod, path: string, response?: any): Chainable<void>;
      interceptTrpc(procedure: string, response: any): Chainable<void>;
      
      // Common API mocks
      mockUserProfile(profile: any): Chainable<void>;
      mockLawnProfiles(profiles: any[]): Chainable<void>;
      mockGrassSpecies(species: any[]): Chainable<void>;
      mockSchedule(schedule: any): Chainable<void>;
    }
  }
}