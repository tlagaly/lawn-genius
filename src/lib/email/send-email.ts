import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
}

// For testing purposes
let mockEnabled = false;
let mockImplementation: ((options: EmailOptions) => Promise<void>) | null = null;

export function enableEmailMocking(implementation?: (options: EmailOptions) => Promise<void>) {
  mockEnabled = true;
  mockImplementation = implementation || (async () => Promise.resolve());
}

export function disableEmailMocking() {
  mockEnabled = false;
  mockImplementation = null;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.SKIP_EMAIL_SENDING === 'true') {
    return;
  }

  if (mockEnabled && mockImplementation) {
    return mockImplementation(options);
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing Resend API key');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@lawngenius.app',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      headers: options.headers,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}