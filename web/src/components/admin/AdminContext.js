'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { adminApi } from '@/lib/api';

const AdminContext = createContext(null);
export function AdminProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    adminApi
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);
  const login = useCallback(async (credentials) => {
    const result = await adminApi.login(credentials);
    setUser(result.user);
  }, []);
  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setUser(null);
    }
  }, []);
  const value = useMemo(
    () => ({ ready, user, api: adminApi, login, logout }),
    [ready, user, login, logout],
  );
  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
export const useAdmin = () => useContext(AdminContext);
