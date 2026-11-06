import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApiError, api } from '@/lib/api';
import NotFound from '@/app/not-found';
import AdminLogin from '@/components/admin/AdminLogin';
import { AdminProvider } from '@/components/admin/AdminContext';
import { ToastProvider } from '@/components/Toast';
import { VenueSkeletons } from '@/components/LoadingSkeletons';
afterEach(() => vi.restoreAllMocks());
describe('production frontend helpers', () => {
  it('uses same-origin cookies for admin requests', async () => {
    const fetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: { user: { email: 'admin@playspot.local' } },
      }),
    });
    const { default: adminLogin } = await import('@/lib/api').then((m) => ({
      default: m.adminApi.login,
    }));
    await adminLogin({ email: 'admin@playspot.local', password: 'admin123' });
    expect(fetch.mock.calls[0][1].credentials).toBe('same-origin');
    expect(JSON.parse(fetch.mock.calls[0][1].body).email).toBe(
      'admin@playspot.local',
    );
  });
  it('retrieves confirmations by reference', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { reference: 'PS-12AB34CD' } }),
    });
    expect((await api.confirmation('PS-12AB34CD')).reference).toBe(
      'PS-12AB34CD',
    );
    expect(fetch.mock.calls[0][0]).toContain(
      '/bookings/confirmation/PS-12AB34CD',
    );
  });
  it('preserves structured API errors', () => {
    const error = new ApiError(400, 'Invalid', [
      { field: 'email', message: 'Enter a valid email' },
    ]);
    expect(error.fieldErrors.email).toBe('Enter a valid email');
  });
  it('provides an accessible 404 and loading skeleton', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Explore venues' }),
    ).toHaveAttribute('href', '/');
    render(<VenueSkeletons />);
    expect(
      screen.getByRole('status', { name: 'Loading venues' }),
    ).toBeInTheDocument();
  });
  it('renders admin sign-in with an email and password', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    render(
      <ToastProvider>
        <AdminProvider>
          <AdminLogin />
        </AdminProvider>
      </ToastProvider>,
    );
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });
});
