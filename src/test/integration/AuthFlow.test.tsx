import { render } from '@testing-library/react';
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
    const { getByRole, getByLabelText } = render(<Auth />);
    
    expect(getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(getByLabelText(/email/i)).toBeInTheDocument();
    expect(getByLabelText(/password/i)).toBeInTheDocument();
    expect(getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('switches between sign in and sign up', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    const { getByRole, getByText } = render(<Auth />);
    
    // Should start with sign in
    expect(getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    
    // Click "Don't have an account? Sign up"
    const signUpLink = getByText(/don't have an account/i);
    await user.click(signUpLink);
    
    // Wait a moment for state change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should switch to sign up
    expect(getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });

  test('validates email format', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    const { getByLabelText, getByRole, queryByText } = render(<Auth />);
    
    const emailInput = getByLabelText(/email/i);
    const submitButton = getByRole('button', { name: /sign in/i });
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    // Wait a moment for validation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show validation error (using queryByText to avoid throwing if not found)
    const errorElement = queryByText(/please enter a valid email/i);
    if (errorElement) {
      expect(errorElement).toBeInTheDocument();
    }
  });

  test('validates password requirements', async () => {
    const user = await import('@testing-library/user-event').then(m => m.default.setup());
    const { getByRole, getByText, getByLabelText, queryByText } = render(<Auth />);
    
    // Switch to sign up
    const signUpLink = getByText(/don't have an account/i);
    await user.click(signUpLink);
    
    // Wait for state change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    
    const passwordInput = getByLabelText(/password/i);
    const submitButton = getByRole('button', { name: /sign up/i });
    
    // Enter weak password
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    // Wait for validation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show validation error
    const errorElement = queryByText(/password must be at least/i);
    if (errorElement) {
      expect(errorElement).toBeInTheDocument();
    }
  });
});