'use client';
import { useState } from 'react';
import { useAdmin } from './AdminContext';
import { Alert, Button, Card, Field, Input } from '../ui';

export default function AdminLogin() {
  const { login } = useAdmin();
  const [form, setForm] = useState({
    email: 'admin@playspot.local',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form);
    } catch (err) {
      setError(
        err.status === 401 ? 'Incorrect email or password' : err.message,
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card className="mx-auto mt-6 max-w-sm p-6">
      <h1 className="text-xl font-bold">Admin sign in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sign in to manage venues, slots and bookings.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <Field label="Email" htmlFor="admin-email">
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password" htmlFor="admin-password">
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </Card>
  );
}
