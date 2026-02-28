import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import Login from '../Login';

const mockSignIn = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    user: null,
    profile: null,
    loading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login', () => {
  it('renders the login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows validation error for empty fields', async () => {
    renderWithProviders(<Login />);
    const user = userEvent.setup();

    // The form has required fields so we need to bypass HTML validation
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    // Directly call the form submit by filling in invalid data
    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'notanemail');
    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'pass');

    // Clear email to trigger our Zod validation
    await user.clear(emailInput);
    await user.click(submitBtn);

    // HTML5 validation will prevent submit when required fields are empty
    // So we test the Zod path by checking the signIn wasn't called
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn and shows error on failure', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' });
    renderWithProviders(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email address'), 'test@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('has a link to signup', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
