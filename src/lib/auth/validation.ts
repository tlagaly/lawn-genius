import { z } from "zod";

// Validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Error messages
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  ACCOUNT_LOCKED: "Account temporarily locked. Please try again later.",
  GOOGLE_AUTH_FAILED: "Google sign-in failed. Please try again.",
  SERVER_ERROR: "An unexpected error occurred. Please try again later.",
} as const;

// Validation helper
export const validateLoginForm = (data: LoginFormData) => {
  try {
    return {
      success: true,
      data: loginSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    return {
      success: false,
      error: AUTH_ERRORS.SERVER_ERROR,
    };
  }
};

// Session verification
export const verifySession = async (session: any) => {
  if (!session) {
    throw new Error(AUTH_ERRORS.SESSION_EXPIRED);
  }
  
  if (!session.user?.email) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  return true;
};