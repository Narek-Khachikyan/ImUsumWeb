import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from '@/services/api';

describe('getApiErrorMessage', () => {
  it('returns backend detail for axios errors', () => {
    const error = {
      isAxiosError: true,
      message: 'Request failed with status code 409',
      response: {
        data: {
          detail: 'Email already registered',
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe('Email already registered');
  });

  it('falls back to provided message when no detail exists', () => {
    const error = {
      isAxiosError: true,
      message: '',
      response: {
        data: {},
      },
    };

    expect(getApiErrorMessage(error, 'Registration failed')).toBe('Registration failed');
  });
});
