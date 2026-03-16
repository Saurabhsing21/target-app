import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export type User = {
  id: number;
  email: string;
  name: string;
  created_at: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        user: null,
        setAuth: (token, user) => set({ token, user }),
        setUser: (user) => set({ user }),
        logout: () => set({ token: null, user: null }),
      }),
      {
        name: "targetapp-auth",
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);
