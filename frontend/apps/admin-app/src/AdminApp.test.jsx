import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminApp } from './AdminApp';

class MockEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    MockEventSource.instances.push(this);
  }

  close() {}
}

describe('AdminApp', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    MockEventSource.instances = [];
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
    vi.stubGlobal('EventSource', MockEventSource);

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

  it('applies live Mercure updates to the team dashboard', async () => {
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
            qrCode: 'BOB-DEMO-002',
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
          summary: { weekMinutes: 60, activeSessionMinutes: 10 },
          entries: []
        })
      });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('EventSource', MockEventSource);

    render(<AdminApp />);

    fireEvent.click(screen.getByRole('button', { name: /Admin/ }));

    await waitFor(() => expect(screen.getByText('BOB-DEMO-002')).toBeInTheDocument());
    expect(screen.getByText(/Live updates via Mercure/)).toBeInTheDocument();
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toContain('/.well-known/mercure');
    expect(MockEventSource.instances[0].url).toContain('topic=%2Fadmin%2Factivity');
    expect(MockEventSource.instances[0].url).toContain('topic=%2Femployees%2F2');

    MockEventSource.instances[0].onmessage({
      data: JSON.stringify({
        employee: {
          id: 2,
          name: 'Bob',
          qrCode: 'BOB-DEMO-002',
          status: 'checked_in',
          statusLabel: 'Ingecheckt',
          lastActionAt: '22 apr. 2026, 11:35',
          profile: { department: 'Operations', employmentType: 'Shift-based', location: 'North Lobby' }
        },
        history: {
          summary: { weekMinutes: 90, activeSessionMinutes: 40 },
          entries: []
        },
        activity: {
          id: '2-checked_in-1713785700',
          type: 'checked_in',
          label: 'Ingeklokt',
          timestamp: '2026-04-22T09:35:00Z',
          location: 'North Lobby',
          employeeName: 'Bob'
        }
      })
    });

    await waitFor(() => expect(screen.getAllByText('Ingecheckt')[0]).toBeInTheDocument());
    expect(MockEventSource.instances).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.getByText('Live operations wall')).toBeInTheDocument();
    expect(screen.getByText('Bob op North Lobby')).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/login',
      '/api/auth/me',
      '/api/employees',
      '/api/employees/2/history'
    ]);
  });

  it('keeps the same Mercure connection when switching the selected employee', async () => {
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
            id: 1,
            name: 'Alice',
            qrCode: 'ALICE-DEMO-001',
            status: 'checked_in',
            statusLabel: 'Ingecheckt',
            lastActionAt: '22 apr. 2026, 09:00',
            profile: { department: 'Product Engineering', employmentType: 'Full-time', location: 'Main Entrance' }
          },
          {
            id: 2,
            name: 'Bob',
            qrCode: 'BOB-DEMO-002',
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
          summary: { weekMinutes: 120, activeSessionMinutes: null },
          entries: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: { weekMinutes: 300, activeSessionMinutes: 30 },
          entries: []
        })
      });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('EventSource', MockEventSource);

    render(<AdminApp />);

    fireEvent.click(screen.getByRole('button', { name: /Admin/ }));

    await waitFor(() => expect(screen.getByText('ALICE-DEMO-001')).toBeInTheDocument());
    expect(MockEventSource.instances).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Bekijk historie' })[1]);

    await waitFor(() => expect(fetchMock.mock.calls.map(([url]) => url)).toContain('/api/employees/2/history'));
    expect(MockEventSource.instances).toHaveLength(1);
  });
});
