import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminApp } from './AdminApp';

describe('AdminApp', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('refreshes team overview after regenerating a badge', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'admin-token',
          user: { id: 'demo-admin-bob', name: 'Bob', role: 'admin', employeeId: 2 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'demo-admin-bob', name: 'Bob', role: 'admin', employeeId: 2 },
          employee: { id: 2, name: 'Bob', qrCode: 'BOB-DEMO-002', profile: { location: 'North Lobby' } }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 2,
            name: 'Bob',
            qrCode: 'OLD-BOB-CODE',
            status: 'checked_out',
            statusLabel: 'Uitgecheckt',
            lastActionAt: null,
            profile: { department: 'Operations', employmentType: 'Shift-based', location: 'North Lobby' }
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: { weekMinutes: 0, activeSessionMinutes: null },
          entries: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          employee: {
            id: 2,
            name: 'Bob',
            qrCode: 'NEW-BOB-CODE',
            profile: { department: 'Operations', employmentType: 'Shift-based', location: 'North Lobby' }
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 2,
            name: 'Bob',
            qrCode: 'NEW-BOB-CODE',
            status: 'checked_out',
            statusLabel: 'Uitgecheckt',
            lastActionAt: null,
            profile: { department: 'Operations', employmentType: 'Shift-based', location: 'North Lobby' }
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: { weekMinutes: 0, activeSessionMinutes: null },
          entries: []
        })
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<AdminApp />);

    fireEvent.click(screen.getByRole('button', { name: /Admin/ }));

    await waitFor(() => expect(screen.getByText('OLD-BOB-CODE')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Nieuwe badge' }));

    await waitFor(() => expect(screen.getByText('NEW-BOB-CODE')).toBeInTheDocument());
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/login',
      '/api/auth/me',
      '/api/employees',
      '/api/employees/2/history',
      '/api/employees/2/regenerate-qr',
      '/api/employees',
      '/api/employees/2/history'
    ]);
  });
});
