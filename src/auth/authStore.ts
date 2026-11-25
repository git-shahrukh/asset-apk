import { create } from 'zustand';
import { queryClient, setOnSessionExpired, storage, tokenStorage } from '../api/client';
import { login as loginApi } from '../api/endpoints';
import { User } from '../api/types';

const SESSION_KEY = 'session';
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleLogout(expiresAt: number) {
  clearTimeout(expiryTimer);
  expiryTimer = setTimeout(() => useAuth.getState().logout(), expiresAt - Date.now());
}

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: User | null;
  restore: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  // Called once when the app opens: is there a saved, unexpired session?
  restore: async () => {
    try {
      const token = await tokenStorage.load();
      const saved = await storage.get(SESSION_KEY);
      const session = saved ? (JSON.parse(saved) as { user: User; expiresAt: number }) : null;

      if (!token || !session || session.expiresAt <= Date.now()) {
        await tokenStorage.clear();
        return set({ status: 'signedOut', user: null });
      }
      scheduleLogout(session.expiresAt);
      set({ status: 'signedIn', user: session.user });
    } catch (e) {
      // Unreadable storage must never block the app: just show Login.
      if (__DEV__) console.warn('Could not restore session', e);
      await tokenStorage.clear();
      await storage.remove(SESSION_KEY);
      set({ status: 'signedOut', user: null });
    }
  },

  login: async (username, password) => {
    const { token, refreshToken, user, expiresAt } = await loginApi(username, password);
    await tokenStorage.save(token, refreshToken);
    await storage.set(SESSION_KEY, JSON.stringify({ user, expiresAt }));
    scheduleLogout(expiresAt);
    set({ status: 'signedIn', user });
  },

  logout: async () => {
    clearTimeout(expiryTimer);
    await tokenStorage.clear();
    await storage.remove(SESSION_KEY);
    queryClient.clear(); // don't leak one user's data to the next
    set({ status: 'signedOut', user: null });
  },
}));

setOnSessionExpired(() => useAuth.getState().logout());
