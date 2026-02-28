import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import Signup from '../Signup';

const mockSignUp = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    user: null,
    profile: null,
    loading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Signup', () => {
  it('renders the signup form', () => {
    renderWithProviders(<Signup />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('validates password length via Zod', async () => {
    renderWithProviders(<Signup />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email address'), 'john@test.com');
    await user.type(screen.getByLabelText('Password'), '123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows success screen after signup', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    renderWithProviders(<Signup />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email address'), 'john@test.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('shows error on signup failure', async () => {
    mockSignUp.mockResolvedValue({ error: 'Email already registered' });
    renderWithProviders(<Signup />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email address'), 'john@test.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });
});
