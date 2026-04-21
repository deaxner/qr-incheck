import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmployeeApp } from './EmployeeApp';

describe('EmployeeApp', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders employee status after login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'user-token',
          user: { id: 'demo-user-alice', name: 'Alice Janssen', role: 'user', employeeId: 1 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'demo-user-alice', name: 'Alice Janssen', role: 'user', employeeId: 1 },
          employee: {
            id: 1,
            name: 'Alice Janssen',
            qrCode: 'ALICE-DEMO-001',
            profile: { department: 'Product Engineering', employmentType: 'Full-time', location: 'Main Entrance' }
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'IN',
          lastClock: '2026-04-21T09:00:00Z'
        })
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<EmployeeApp />);

    fireEvent.click(screen.getByRole('button', { name: /Medewerker/ }));

    await waitFor(() => expect(screen.getByText('Aanwezig')).toBeInTheDocument());
    expect(screen.getByText('ALICE-DEMO-001')).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/login',
      '/api/auth/me',
      '/api/employees/me/status'
    ]);
  });
});
