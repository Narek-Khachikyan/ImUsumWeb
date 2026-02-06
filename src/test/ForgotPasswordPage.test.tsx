import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage';
import { authService } from '@/services/authService';

vi.mock('@/services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits email and shows generic success message', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({
      message: 'If an account exists, reset instructions have been sent.',
    });

    render(
      <HelmetProvider>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    await userEvent.type(screen.getByLabelText('Էլ․ փոստ'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Ուղարկել վերականգնման հղում' }));

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    expect(
      await screen.findByText('If an account exists, reset instructions have been sent.')
    ).toBeInTheDocument();
  });
});
