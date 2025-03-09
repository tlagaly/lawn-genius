describe('Registration Flow', () => {
  beforeEach(() => {
    // Reset database before each test
    cy.task('db:reset');
    cy.visit('/auth/register');
  });

  it('should successfully register a new user', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Fill out registration form
    cy.get('[data-testid="email-input"]').type(testEmail);
    cy.get('[data-testid="password-input"]').type(testPassword);
    cy.get('[data-testid="confirm-password-input"]').type(testPassword);

    // Submit form
    cy.get('[data-testid="register-submit"]').click();

    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard');

    // Welcome message should be visible
    cy.get('[data-testid="registration-success"]')
      .should('be.visible')
      .and('contain', 'Welcome!');

    // Message should disappear after 5 seconds
    cy.get('[data-testid="registration-success"]', { timeout: 6000 })
      .should('not.exist');
  });

  it('should show error for existing email', () => {
    const existingEmail = 'existing@example.com';
    const testPassword = 'TestPassword123!';

    // Create a user first
    cy.task('db:createUser', {
      email: existingEmail,
      password: testPassword
    });

    // Try to register with same email
    cy.get('[data-testid="email-input"]').type(existingEmail);
    cy.get('[data-testid="password-input"]').type(testPassword);
    cy.get('[data-testid="confirm-password-input"]').type(testPassword);
    cy.get('[data-testid="register-submit"]').click();

    // Should show error message
    cy.get('[data-testid="registration-error"]')
      .should('be.visible')
      .and('contain', 'User already exists');
  });

  it('should validate password confirmation', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Enter mismatched passwords
    cy.get('[data-testid="email-input"]').type(testEmail);
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword123!');
    cy.get('[data-testid="register-submit"]').click();

    // Should show password mismatch error
    cy.get('[data-testid="confirm-password-error"]')
      .should('be.visible')
      .and('contain', 'Passwords don\'t match');
  });

  it('should validate email format', () => {
    // Enter invalid email
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="register-submit"]').click();

    // Should show email format error
    cy.get('[data-testid="email-error"]')
      .should('be.visible')
      .and('contain', 'Please enter a valid email address');
  });

  it('should validate password length', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Enter short password
    cy.get('[data-testid="email-input"]').type(testEmail);
    cy.get('[data-testid="password-input"]').type('short');
    cy.get('[data-testid="confirm-password-input"]').type('short');
    cy.get('[data-testid="register-submit"]').click();

    // Should show password length error
    cy.get('[data-testid="password-error"]')
      .should('be.visible')
      .and('contain', 'Password must be at least 8 characters');
  });
});