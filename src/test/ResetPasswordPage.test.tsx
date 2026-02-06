import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';
import { authService } from '@/services/authService';

vi.mock('@/services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

function renderResetPage(initialPath: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when token is missing', async () => {
    renderResetPage('/reset-password');

    await userEvent.type(screen.getByLabelText('Նոր գաղտնաբառ'), 'newpassword123');
    await userEvent.type(
      screen.getByLabelText('Հաստատեք նոր գաղտնաբառը'),
      'newpassword123'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Պահպանել նոր գաղտնաբառը' }));

    expect(await screen.findByText('Վերականգնման հղումը անվավեր է։')).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('blocks submit when password is shorter than 6 chars', async () => {
    renderResetPage('/reset-password?token=valid-token');

    await userEvent.type(screen.getByLabelText('Նոր գաղտնաբառ'), '12345');
    await userEvent.type(screen.getByLabelText('Հաստատեք նոր գաղտնաբառը'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Պահպանել նոր գաղտնաբառը' }));

    expect(
      await screen.findByText('Գաղտնաբառը պետք է պարունակի առնվազն 6 նիշ')
    ).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('blocks submit when passwords do not match', async () => {
    renderResetPage('/reset-password?token=valid-token');

    await userEvent.type(screen.getByLabelText('Նոր գաղտնաբառ'), 'newpassword123');
    await userEvent.type(screen.getByLabelText('Հաստատեք նոր գաղտնաբառը'), 'newpassword321');
    await userEvent.click(screen.getByRole('button', { name: 'Պահպանել նոր գաղտնաբառը' }));

    expect(await screen.findByText('Գաղտնաբառերը չեն համընկնում')).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('submits valid token and password and shows success message', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({
      message: 'Password has been reset successfully.',
    });

    renderResetPage('/reset-password?token=valid-token');

    await userEvent.type(screen.getByLabelText('Նոր գաղտնաբառ'), 'newpassword123');
    await userEvent.type(
      screen.getByLabelText('Հաստատեք նոր գաղտնաբառը'),
      'newpassword123'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Պահպանել նոր գաղտնաբառը' }));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: 'valid-token',
        new_password: 'newpassword123',
      });
    });

    expect(
      await screen.findByText('Password has been reset successfully.')
    ).toBeInTheDocument();
  });
});
