import { JWT } from "next-auth/jwt";

/**
 * JWT validation and management utilities
 */

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a JWT token's structure and expiration
 */
export const validateToken = (token: JWT): TokenValidationResult => {
  if (!token.sub) {
    return { isValid: false, error: "Missing subject identifier" };
  }

  if (!token.email) {
    return { isValid: false, error: "Missing email" };
  }

  if (!token.exp) {
    return { isValid: false, error: "Missing expiration" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (token.exp < now) {
    return { isValid: false, error: "Token expired" };
  }

  return { isValid: true };
};

/**
 * Checks if a token needs refresh (less than 1 hour remaining)
 */
export const needsRefresh = (token: JWT): boolean => {
  if (!token.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  
  return now > (token.exp - oneHour);
};

/**
 * Creates a new expiration timestamp
 */
export const createExpiration = (hours: number = 24): number => {
  const now = Math.floor(Date.now() / 1000);
  return now + (hours * 60 * 60);
};

/**
 * Formats token data for session use
 */
export const formatTokenData = (token: JWT) => {
  return {
    id: token.sub!,
    name: token.name || null,
    email: token.email!,
    image: token.picture || null,
    role: token.role || "USER",
  };
};