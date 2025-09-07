// utils/localStorage.ts

// Interface for user data structure
export interface UserData {
  id: string;
  email: string;
  // Add other user properties you might need
}

// Interface for session data structure
export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: UserData;
}

// Keys for localStorage items
export const STORAGE_KEYS = {
  SESSION: 'supabase_session',
  USER: 'supabase_user',
  EXPIRY: 'session_expiry'
};

// Check if localStorage is available (useful for SSR or certain mobile environments)
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Store session data in localStorage
export const storeSession = (sessionData: SessionData): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_at: sessionData.expires_at
    }));
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionData.user));
    
    if (sessionData.expires_at) {
      localStorage.setItem(STORAGE_KEYS.EXPIRY, sessionData.expires_at.toString());
    }
  } catch (error) {
    console.error('Error storing session in localStorage:', error);
  }
};

// Retrieve session data from localStorage
export const getSession = (): SessionData | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (!sessionStr || !userStr) return null;
    
    const session = JSON.parse(sessionStr);
    const user = JSON.parse(userStr);
    
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user
    };
  } catch (error) {
    console.error('Error retrieving session from localStorage:', error);
    return null;
  }
};

// Check if session is still valid based on expiry time
export const isSessionValid = (): boolean => {
  const session = getSession();
  if (!session || !session.expires_at) return false;
  
  // Check if the current time is before the expiry time (with 5-second buffer)
  return Date.now() < (session.expires_at * 1000) - 5000;
};

// Remove session data from localStorage
export const clearSession = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.EXPIRY);
  } catch (error) {
    console.error('Error clearing session from localStorage:', error);
  }
};

// Get just the user data from localStorage
export const getUserData = (): UserData | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error retrieving user data from localStorage:', error);
    return null;
  }
};

// Get the access token from localStorage
export const getAccessToken = (): string | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    return session.access_token || null;
  } catch (error) {
    console.error('Error retrieving access token from localStorage:', error);
    return null;
  }
};