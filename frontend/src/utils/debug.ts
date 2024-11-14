import { tokenUtils } from './token';

export const debugUtils = {
  // Funzione per stampare lo stato completo del token
  checkTokenStatus: () => {
    const token = localStorage.getItem('token');
    const status = {
      exists: !!token,
      token: token ? `${token.substring(0, 20)}...` : null,
      decoded: token ? tokenUtils.decodeToken(token) : null,
      isExpired: token ? tokenUtils.isTokenExpired(token) : null,
      userId: token ? tokenUtils.getUserIdFromToken(token) : null,
      localStorage: {
        allKeys: Object.keys(localStorage),
        tokenKey: 'token' in localStorage
      }
    };

    console.group('🔍 Token Debug Info');
    console.log('Token exists:', status.exists);
    console.log('Token preview:', status.token);
    console.log('Decoded token:', status.decoded);
    console.log('Is expired:', status.isExpired);
    console.log('User ID:', status.userId);
    console.log('localStorage keys:', status.localStorage);
    console.groupEnd();

    return status;
  },

  // Funzione per monitorare le richieste API
  debugApiRequest: (config: any) => {
    console.group('🌐 API Request Debug');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Headers:', {
      ...config.headers,
      Authorization: config.headers.Authorization 
        ? `${config.headers.Authorization.substring(0, 20)}...` 
        : null
    });
    console.log('Data:', config.data);
    console.groupEnd();
  },

  // Funzione per verificare lo stato dell'autenticazione
  checkAuthStatus: () => {
    const token = localStorage.getItem('token');
    const decodedToken = token ? tokenUtils.decodeToken(token) : null;
    const now = Math.floor(Date.now() / 1000);

    const status = {
      hasToken: !!token,
      tokenExpiration: decodedToken?.exp ? new Date(decodedToken.exp * 1000).toLocaleString() : null,
      timeUntilExpiration: decodedToken?.exp ? decodedToken.exp - now : null,
      isExpired: decodedToken?.exp ? decodedToken.exp < now : null,
      environment: decodedToken?.env || null
    };

    console.group('🔐 Auth Status Debug');
    console.log('Has token:', status.hasToken);
    console.log('Token expiration:', status.tokenExpiration);
    console.log('Time until expiration:', status.timeUntilExpiration, 'seconds');
    console.log('Is expired:', status.isExpired);
    console.log('Environment:', status.environment);
    console.groupEnd();

    return status;
  },

  // Funzione per testare il refresh del token
  testTokenRefresh: async () => {
    console.group('🔄 Token Refresh Test');
    try {
      const beforeToken = localStorage.getItem('token');
      console.log('Token before refresh:', beforeToken ? `${beforeToken.substring(0, 20)}...` : null);

      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${beforeToken}`
        }
      });
      
      const afterToken = localStorage.getItem('token');
      console.log('Token after refresh:', afterToken ? `${afterToken.substring(0, 20)}...` : null);
      console.log('Refresh successful:', response.ok);
    } catch (error) {
      console.error('Refresh test failed:', error);
    }
    console.groupEnd();
  }
};

// Aggiungiamo i comandi alla console globale per un accesso più facile
declare global {
  interface Window {
    debugAuth: typeof debugUtils;
  }
}

if (import.meta.env.DEV) {
  window.debugAuth = debugUtils;
}

export default debugUtils;