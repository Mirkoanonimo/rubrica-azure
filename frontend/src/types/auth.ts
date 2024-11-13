export interface User {
    id: number;
    email: string;
    username: string;
    tenant_id: number;
    is_active: boolean;
    created_at: string;
    last_login?: string;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    email: string;
    username: string;
    password: string;
    tenant_name?: string;
  }
  
  export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  }
  
  export interface PasswordReset {
    email: string;
  }
  
  export interface PasswordUpdate {
    current_password: string;
    new_password: string;
  }
  
  export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
  }