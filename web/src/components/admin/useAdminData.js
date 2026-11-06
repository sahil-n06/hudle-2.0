'use client';
import { useAsync } from '@/lib/useAsync';
import { useAdmin } from './AdminContext';
export function useAdminData(loader, deps) {
  const admin = useAdmin();
  return useAsync(
    () =>
      loader(admin.api).catch((err) => {
        if (err.status === 401) admin.logout();
        throw err;
      }),
    [admin.user?.email, ...deps],
  );
}
