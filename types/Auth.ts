import { User } from "./User";

export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
}
