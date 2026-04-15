import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QrIncheckApp } from './QrIncheckApp';

describe('QrIncheckApp', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows success feedback after a successful scan', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            action: 'checked_in',
            employee: {
              id: 1,
              name: 'Alice'
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
              lastActionAt: '2026-04-15 21:45:00 UTC'
            }
          ]
        })
    );

    render(<QrIncheckApp initialEmployees={[]} />);

    fireEvent.change(screen.getByLabelText('QR-code'), {
      target: { value: 'ALICE-DEMO-001' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verwerk scan' }));

    await waitFor(() =>
      expect(screen.getByText('Alice is ingecheckt.')).toBeInTheDocument()
    );
  });

  it('refreshes the employee list after regenerating a QR code', async () => {
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
              qrCode: 'NEW-BOB-CODE'
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
              lastActionAt: null
            }
          ]
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
            lastActionAt: null
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Nieuwe QR' }));

    await waitFor(() => expect(screen.getByText('NEW-BOB-CODE')).toBeInTheDocument());
  });
});
