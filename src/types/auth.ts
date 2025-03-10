import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

// Base session user type extending NextAuth User
export type SessionUser = User & {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
};

// User profile type with additional fields
export interface UserProfile extends SessionUser {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  displayName: string | null;
  location: string | null;
  avatarUrl: string | null;
  coverImage: string | null;
  bio: string | null;
  privacySettings: {
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showExpertise: boolean;
  };
}

// Validated session type with required user properties
export interface ValidSession {
  user: Required<Pick<SessionUser, 'id' | 'email'>> & SessionUser;
  expires: string;
}

// Storage interface for session persistence
export interface StorageAPI {
  setItem(key: string, value: string): boolean;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  clear(): void;
}

// Extended JWT type with custom fields
export interface ExtendedJWT extends JWT {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  iat: number;
  exp: number;
}

// Type guards
export const isValidSession = (session: unknown): session is ValidSession => {
  if (!session || typeof session !== 'object') return false;
  
  const { user, expires } = session as ValidSession;
  
  return (
    typeof expires === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    user.id.length > 0 &&
    user.email.length > 0 &&
    (user.avatarUrl === null || typeof user.avatarUrl === 'string') &&
    (user.name === null || typeof user.name === 'string') &&
    (user.image === null || typeof user.image === 'string')
  );
};

export const isUserProfile = (profile: unknown): profile is UserProfile => {
  if (!profile || typeof profile !== 'object') return false;
  
  const p = profile as UserProfile;
  
  return (
    typeof p.id === 'string' &&
    typeof p.userId === 'string' &&
    p.createdAt instanceof Date &&
    p.updatedAt instanceof Date &&
    (p.displayName === null || typeof p.displayName === 'string') &&
    (p.location === null || typeof p.location === 'string') &&
    (p.avatarUrl === null || typeof p.avatarUrl === 'string') &&
    (p.coverImage === null || typeof p.coverImage === 'string') &&
    (p.bio === null || typeof p.bio === 'string') &&
    typeof p.privacySettings === 'object' &&
    p.privacySettings !== null &&
    typeof p.privacySettings.profileVisibility === 'string' &&
    typeof p.privacySettings.showEmail === 'boolean' &&
    typeof p.privacySettings.showPhone === 'boolean' &&
    typeof p.privacySettings.showLocation === 'boolean' &&
    typeof p.privacySettings.showExpertise === 'boolean'
  );
};

export const isValidStorage = (storage: unknown): storage is StorageAPI => {
  if (!storage || typeof storage !== 'object') return false;
  
  const api = storage as StorageAPI;
  
  return (
    typeof api.setItem === 'function' &&
    typeof api.getItem === 'function' &&
    typeof api.removeItem === 'function' &&
    typeof api.clear === 'function'
  );
};

export const isValidJWT = (token: unknown): token is ExtendedJWT => {
  if (!token || typeof token !== 'object') return false;
  
  const jwt = token as ExtendedJWT;
  
  return (
    typeof jwt.id === 'string' &&
    typeof jwt.email === 'string' &&
    typeof jwt.iat === 'number' &&
    typeof jwt.exp === 'number' &&
    jwt.id.length > 0 &&
    jwt.email.length > 0
  );
};

// Error types
export type SessionError = {
  code: string;
  message: string;
};

export type ProfileError = SessionError & {
  field?: string;
  validation?: string[];
};

// Operation types
export type ProfileUpdateData = Partial<Pick<UserProfile,
  'displayName' |
  'location' |
  'avatarUrl' |
  'coverImage' |
  'bio' |
  'privacySettings'
>>;

// State types
export type SessionState = {
  isValid: boolean;
  isLoading: boolean;
  error?: SessionError;
  profile?: UserProfile;
};

export type ProfileState = {
  isLoading: boolean;
  error?: ProfileError;
  data?: UserProfile;
  isDirty: boolean;
};