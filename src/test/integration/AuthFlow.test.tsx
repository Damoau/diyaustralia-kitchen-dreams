import { render, screen, waitFor } from '@testing-library/react';
import Auth from '@/pages/Auth';
import { expect, test, describe, vi } from 'vitest';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    signOut: vi.fn(),
    hasRole: vi.fn(() => false),
    isAuthenticated: false,
  }),
}));

describe('Authentication Flow', () => {
  test('renders sign in form', () => {
    render(<Auth />);
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('switches between sign in and sign up', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    render(<Auth />);
    
    // Should start with sign in
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    
    // Click "Don't have an account? Sign up"
    const signUpLink = screen.getByText(/don't have an account/i);
    await user.click(signUpLink);
    
    // Should switch to sign up
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    render(<Auth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  test('validates password requirements', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    render(<Auth />);
    
    // Switch to sign up
    const signUpLink = screen.getByText(/don't have an account/i);
    await user.click(signUpLink);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    });
    
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Enter weak password
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
  });
});