interface ValidationError {
  service: string;
  message: string;
}

export class ServiceConfigValidator {
  private errors: ValidationError[] = [];

  validate(): ValidationError[] {
    this.validateAuth();
    this.validateEmail();
    this.validateStripe();
    this.validateWeather();
    return this.errors;
  }

  private addError(service: string, message: string) {
    this.errors.push({ service, message });
  }

  private validateAuth() {
    const requiredVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];

    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        this.addError('Authentication', `Missing ${variable}`);
      }
    }

    // Validate NEXTAUTH_SECRET length
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      this.addError('Authentication', 'NEXTAUTH_SECRET must be at least 32 characters long');
    }

    // Validate NEXTAUTH_URL format
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
      this.addError('Authentication', 'NEXTAUTH_URL must be a valid URL starting with http/https');
    }
  }

  private validateEmail() {
    if (!process.env.RESEND_API_KEY) {
      this.addError('Email', 'Missing RESEND_API_KEY');
    } else if (!process.env.RESEND_API_KEY.startsWith('re_')) {
      this.addError('Email', 'Invalid RESEND_API_KEY format');
    }

    // Validate email from address if specified
    if (process.env.EMAIL_FROM && !this.isValidEmail(process.env.EMAIL_FROM)) {
      this.addError('Email', 'Invalid EMAIL_FROM format');
    }
  }

  private validateStripe() {
    const requiredVars = [
      'STRIPE_PUBLIC_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_BASIC_PRICE_ID',
      'STRIPE_PRO_PRICE_ID',
      'STRIPE_ENTERPRISE_PRICE_ID'
    ];

    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        this.addError('Stripe', `Missing ${variable}`);
      }
    }

    // Validate Stripe key formats
    if (process.env.STRIPE_PUBLIC_KEY && !process.env.STRIPE_PUBLIC_KEY.startsWith('pk_')) {
      this.addError('Stripe', 'Invalid STRIPE_PUBLIC_KEY format');
    }

    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      this.addError('Stripe', 'Invalid STRIPE_SECRET_KEY format');
    }

    if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      this.addError('Stripe', 'Invalid STRIPE_WEBHOOK_SECRET format');
    }

    // Validate price IDs
    const priceIdVars = [
      'STRIPE_BASIC_PRICE_ID',
      'STRIPE_PRO_PRICE_ID',
      'STRIPE_ENTERPRISE_PRICE_ID'
    ];

    for (const variable of priceIdVars) {
      if (process.env[variable] && !process.env[variable]!.startsWith('price_')) {
        this.addError('Stripe', `Invalid ${variable} format`);
      }
    }
  }

  private validateWeather() {
    if (!process.env.OPENWEATHER_API_KEY) {
      this.addError('Weather', 'Missing OPENWEATHER_API_KEY');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export a singleton instance
export const serviceValidator = new ServiceConfigValidator();

// Export a validation function that throws on error
export function validateServiceConfig() {
  const errors = serviceValidator.validate();
  if (errors.length > 0) {
    const errorMessages = errors.map(
      error => `[${error.service}] ${error.message}`
    ).join('\n');
    throw new Error(`Service configuration validation failed:\n${errorMessages}`);
  }
}