import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScannerApp } from './ScannerApp';

const decodeFromStreamMock = vi.fn();
const stopMock = vi.fn();
const mediaTrackStopMock = vi.fn();
const getUserMediaMock = vi.fn();

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromStream(...args) {
      return decodeFromStreamMock(...args);
    }
  }
}));

describe('ScannerApp', () => {
  beforeEach(() => {
    decodeFromStreamMock.mockReset();
    stopMock.mockReset();
    mediaTrackStopMock.mockReset();
    getUserMediaMock.mockReset();

    getUserMediaMock.mockResolvedValue({
      getTracks: () => [{ stop: mediaTrackStopMock }]
    });

    decodeFromStreamMock.mockResolvedValue({
      stop: stopMock
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: getUserMediaMock
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('submits a manual scan through the device-token client', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: 'checked_in',
        timestamp: '2026-04-21T09:00:00Z',
        employee: {
          id: 1,
          name: 'Alice Janssen',
          profile: { location: 'Main Entrance' }
        }
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ScannerApp />);

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledWith({ video: { facingMode: 'environment' } }));

    fireEvent.change(screen.getByRole('textbox', { name: 'Badgecode' }), { target: { value: 'ALICE-DEMO-001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Handmatige scan' }));

    await waitFor(() => expect(screen.getByText(/ingecheckt/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/scan',
      expect.objectContaining({
        headers: expect.any(Headers),
        method: 'POST'
      })
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.headers.get('X-DEVICE-TOKEN')).toBe('scanner-demo-token');
    expect(requestInit.headers.get('Authorization')).toBeNull();
  });

  it('submits exactly one request for repeated decode callbacks during an active camera scan', async () => {
    let decodeCallback;

    decodeFromStreamMock.mockImplementation(async (_stream, _video, callback) => {
      decodeCallback = callback;

      return {
        stop: stopMock
      };
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: 'checked_out',
        timestamp: '2026-04-21T17:00:00Z',
        employee: {
          id: 1,
          name: 'Alice Janssen'
        }
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ScannerApp />);

    await waitFor(() => expect(decodeFromStreamMock).toHaveBeenCalled());

    await decodeCallback({ getText: () => 'ALICE-DEMO-001' });
    await decodeCallback({ getText: () => 'ALICE-DEMO-001' });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(/uitgecheckt/)).toBeInTheDocument());

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.headers.get('X-DEVICE-TOKEN')).toBe('scanner-demo-token');
    expect(requestInit.headers.get('Authorization')).toBeNull();
  });

  it('shows fallback and retry controls when the camera cannot be started', async () => {
    getUserMediaMock
      .mockRejectedValueOnce(new Error('Environment camera unavailable'))
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce({
        getTracks: () => [{ stop: mediaTrackStopMock }]
      });

    render(<ScannerApp />);

    await waitFor(() => expect(screen.getAllByText('Camera niet beschikbaar')[0]).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: 'Probeer camera opnieuw' })[0]).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Badgecode' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Probeer camera opnieuw' })[0]);

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(3));
  });

  it('renders a kiosk-friendly retry message when the scan endpoint is rate limited', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        code: 'rate_limited',
        message: 'Er worden te veel scans tegelijk verwerkt. Probeer het zo opnieuw.'
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ScannerApp />);

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalled());

    fireEvent.change(screen.getByRole('textbox', { name: 'Badgecode' }), { target: { value: 'ALICE-DEMO-001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Handmatige scan' }));

    await waitFor(() => expect(screen.getByText(/te veel scans tegelijk verwerkt/i)).toBeInTheDocument());
  });
});
