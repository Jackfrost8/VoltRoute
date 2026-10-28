import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { AuthContext } from '../context/AuthContext';

describe('Auth Pages Verification', () => {
  describe('LoginPage Form & Validation', () => {
    it('displays client error if email is invalid', async () => {
      const mockLogin = vi.fn();
      render(
        <AuthContext.Provider value={{ login: mockLogin }}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      const emailInput = screen.getByPlaceholderText('driver@voltroute.com');
      const passInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
      fireEvent.change(passInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Please provide a valid email address.')).toBeDefined();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('displays backend error message on failed credentials', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid email or password.'));

      render(
        <AuthContext.Provider value={{ login: mockLogin }}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      const emailInput = screen.getByPlaceholderText('driver@voltroute.com');
      const passInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'bad@driver.com' } });
      fireEvent.change(passInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeDefined();
      });
    });

    it('calls auth.login with trimmed payload on valid submission', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ token: 'abc' });

      render(
        <AuthContext.Provider value={{ login: mockLogin }}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      const emailInput = screen.getByPlaceholderText('driver@voltroute.com');
      const passInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: ' driver@test.com ' } });
      fireEvent.change(passInput, { target: { value: 'Secret123!' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'driver@test.com',
          password: 'Secret123!',
        });
      });
    });
  });

  describe('RegisterPage Form & Validation', () => {
    it('enforces password minimum length of 6 characters', async () => {
      const mockRegister = vi.fn();

      render(
        <AuthContext.Provider value={{ register: mockRegister }}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('driver@voltroute.com'), {
        target: { value: 'jane@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Minimum 6 characters'), {
        target: { value: '123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least 6 characters.')).toBeDefined();
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('submits registration form with complete user fields', async () => {
      const mockRegister = vi.fn().mockResolvedValue({ token: 'xyz' });

      render(
        <AuthContext.Provider value={{ register: mockRegister }}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('driver@voltroute.com'), {
        target: { value: 'jane@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Minimum 6 characters'), {
        target: { value: 'Secret123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@test.com',
          password: 'Secret123!',
        });
      });
    });
  });
});
