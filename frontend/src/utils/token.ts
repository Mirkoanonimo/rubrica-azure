import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
  env: string;
}

export const tokenUtils = {
  // Salva il token nel localStorage
  setToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  // Recupera il token dal localStorage
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Rimuove il token dal localStorage
  removeToken: (): void => {
    localStorage.removeItem('token');
  },

  // Controlla se il token è presente
  hasToken: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Decodifica il token
  decodeToken: (token: string): DecodedToken | null => {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  },

  // Controlla se il token è scaduto
  isTokenExpired: (token: string): boolean => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  },

  // Recupera l'user ID dal token
  getUserIdFromToken: (token: string): string | null => {
    const decoded = tokenUtils.decodeToken(token);
    return decoded?.sub || null;
  },

  // Controlla se il token è valido
  isValidToken: (token: string): boolean => {
    return !!tokenUtils.decodeToken(token) && !tokenUtils.isTokenExpired(token);
  }
};

export default tokenUtils;