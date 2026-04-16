import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QrIncheckApp } from './QrIncheckApp';

describe('QrIncheckApp', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a clock result after using the badge action', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            action: 'checked_in',
            timestamp: '2026-04-15 23:45:00 CEST',
            employee: {
              id: 1,
              name: 'Alice',
              profile: {
                department: 'Product Engineering',
                employmentType: 'Full-time',
                location: 'Main Entrance'
              }
            }
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
              lastActionAt: '2026-04-15 23:45:00 CEST',
              profile: {
                department: 'Product Engineering',
                employmentType: 'Full-time',
                location: 'Main Entrance'
              }
            }
          ]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            summary: {
              weekMinutes: 120,
              activeSessionMinutes: 45
            },
            entries: [
              {
                id: '1-in',
                action: 'checked_in',
                timestamp: '2026-04-15 23:45:00 CEST',
                location: 'Main Entrance',
                state: 'onsite',
                stateLabel: 'Ingeklokt'
              }
            ]
          })
        })
    );

    render(
      <QrIncheckApp
        initialEmployees={[
          {
            id: 1,
            name: 'Alice',
            qrCode: 'ALICE-DEMO-001',
            status: 'checked_out',
            statusLabel: 'Uitgecheckt',
            lastActionAt: null,
            profile: {
              department: 'Product Engineering',
              employmentType: 'Full-time',
              location: 'Main Entrance'
            }
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Klok met mijn badge' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Ingeklokt' })).toBeInTheDocument()
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('refreshes the team overview after regenerating a badge', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            employee: {
              id: 2,
              name: 'Bob',
              qrCode: 'NEW-BOB-CODE',
              profile: {
                department: 'Operations',
                employmentType: 'Shift-based',
                location: 'North Lobby'
              }
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
              profile: {
                department: 'Operations',
                employmentType: 'Shift-based',
                location: 'North Lobby'
              }
            }
          ]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            summary: {
              weekMinutes: 0,
              activeSessionMinutes: null
            },
            entries: []
          })
        })
    );

    render(
      <QrIncheckApp
        initialEmployees={[
          {
            id: 2,
            name: 'Bob',
            qrCode: 'OLD-BOB-CODE',
            status: 'checked_out',
            statusLabel: 'Uitgecheckt',
            lastActionAt: null,
            profile: {
              department: 'Operations',
              employmentType: 'Shift-based',
              location: 'North Lobby'
            }
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Teamoverzicht' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nieuwe badge' }));

    await waitFor(() => expect(screen.getByText('NEW-BOB-CODE')).toBeInTheDocument());
  });
});
