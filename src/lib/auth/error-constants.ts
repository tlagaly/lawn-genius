export const AUTH_ERRORS = {
  // Registration errors
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  EMAIL_IN_USE: "This email is already registered.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_WEAK: "Password must be at least 8 characters with numbers and letters.",
  PASSWORDS_DONT_MATCH: "Passwords do not match.",
  
  // Login errors
  LOGIN_FAILED: "Login failed. Please check your credentials.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_NOT_FOUND: "No account found with this email.",
  
  // Password reset errors
  RESET_TOKEN_INVALID: "Invalid or expired reset token.",
  RESET_EMAIL_NOT_FOUND: "No account found with this email.",
  RESET_EMAIL_SENT: "Password reset email sent. Please check your inbox.",
  RESET_FAILED: "Password reset failed. Please try again.",
  
  // General errors
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again."
} as const;

export type AuthErrorKey = keyof typeof AUTH_ERRORS;
export type AuthErrorMessage = typeof AUTH_ERRORS[AuthErrorKey];