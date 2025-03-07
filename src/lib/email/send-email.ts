import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// For testing, we'll use a mock transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_EMAIL_SENDING === 'true') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'testpass'
      }
    });
  }

  // Production email configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Skip actual sending in test environment
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_EMAIL_SENDING === 'true') {
    console.log('Test environment: Skipping email send', options);
    return;
  }

  const transporter = createTransporter();
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lawngenius.com',
      ...options
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

// For testing purposes
export const mockSendEmail = jest.fn(async () => Promise.resolve());