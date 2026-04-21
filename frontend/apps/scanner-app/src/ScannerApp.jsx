import React, { useEffect, useRef, useState } from 'react';
import { scan } from '../../../shared/api/client';
import { formatDateTime } from '../../../shared/utils/dateTime';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_TOKEN ?? 'scanner-demo-token';
const RESET_DELAY_MS = 4000;
const CAMERA_CONSTRAINTS = {
  video: { facingMode: 'environment' }
};
const CAMERA_FALLBACK_CONSTRAINTS = {
  video: true
};
const CAMERA_READY_MESSAGE = 'Richt de camera op een badge-QR of gebruik handmatige invoer.';

function getDecodedText(result) {
  if (!result) {
    return null;
  }

  if (typeof result.getText === 'function') {
    return result.getText();
  }

  return result.text ?? null;
}

export function ScannerApp() {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraState, setCameraState] = useState('initializing');
  const [cameraMessage, setCameraMessage] = useState('Camera starten...');

  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);
  const scanLockRef = useRef(false);

  useEffect(() => {
    startCamera();

    return () => {
      isMountedRef.current = false;
      cleanupScanner();
      clearResetTimeout();
    };
  }, []);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    clearResetTimeout();

    resetTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      setFeedback(null);
      setCode('');
      scanLockRef.current = false;
    }, RESET_DELAY_MS);

    return () => clearResetTimeout();
  }, [feedback]);

  function clearResetTimeout() {
    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }

  function cleanupScanner() {
    if (controlsRef.current?.stop) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function requestCameraStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Deze browser ondersteunt geen camera-toegang.');
    }

    try {
      return await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    } catch (error) {
      return navigator.mediaDevices.getUserMedia(CAMERA_FALLBACK_CONSTRAINTS);
    }
  }

  async function startCamera() {
    cleanupScanner();
    scanLockRef.current = false;

    if (!isMountedRef.current) {
      return;
    }

    setCameraState('initializing');
    setCameraMessage('Camera starten...');

    try {
      if (!readerRef.current) {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        readerRef.current = new BrowserQRCodeReader();
      }

      const stream = await requestCameraStream();

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const controls = await readerRef.current.decodeFromStream(stream, videoRef.current, async (result) => {
        const decodedText = getDecodedText(result)?.trim();

        if (!decodedText || scanLockRef.current || isSubmittingRef.current) {
          return;
        }

        scanLockRef.current = true;
        await submitScan(decodedText, { source: 'camera' });
      });

      if (!isMountedRef.current) {
        controls?.stop?.();
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      controlsRef.current = controls;
      setCameraState('ready');
      setCameraMessage(CAMERA_READY_MESSAGE);
    } catch (error) {
      cleanupScanner();

      if (!isMountedRef.current) {
        return;
      }

      setCameraState('unavailable');
      setCameraMessage(error?.message ?? 'Camera niet beschikbaar. Gebruik handmatige invoer of probeer opnieuw.');
    }
  }

  async function submitScan(nextCode, { source }) {
    const normalizedCode = nextCode.trim();

    if (!normalizedCode) {
      setFeedback({
        kind: 'error',
        message: 'Voer eerst een badgecode in.',
        source,
        timestamp: null
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await scan(normalizedCode, { deviceToken: DEVICE_TOKEN });

      if (!isMountedRef.current) {
        return;
      }

      setCode(normalizedCode);
      setFeedback({
        kind: 'success',
        message: `${result.employee.name} ${result.action === 'checked_in' ? 'ingecheckt' : 'uitgecheckt'}`,
        source,
        timestamp: result.timestamp
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setFeedback({
        kind: 'error',
        message: error.message,
        source,
        timestamp: null
      });
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (scanLockRef.current || isSubmittingRef.current) {
      return;
    }

    scanLockRef.current = true;
    await submitScan(code, { source: 'manual' });
  }

  const isCameraReady = cameraState === 'ready';
  const isCameraUnavailable = cameraState === 'unavailable';
  const statusTitle = feedback
    ? feedback.kind === 'error'
      ? 'Scan mislukt'
      : 'Scan verwerkt'
    : cameraState === 'initializing'
      ? 'Camera wordt voorbereid'
      : isCameraReady
        ? 'Scanner actief'
        : 'Handmatige fallback actief';
  const statusMessage = feedback?.message ?? cameraMessage;
  const statusMeta = feedback
    ? feedback.timestamp
      ? formatDateTime(feedback.timestamp)
      : feedback.source === 'camera'
        ? 'Controleer beeld, badge en device-token.'
        : 'Controleer invoer of device-token.'
    : isCameraReady
      ? 'De kiosk reset automatisch na elke scan.'
      : 'Je kunt direct een badgecode typen terwijl de kiosk actief blijft.';
  const statusClassName = feedback?.kind === 'error' || isCameraUnavailable
    ? 'scanner-status scanner-status-error'
    : feedback?.kind === 'success'
      ? 'scanner-status scanner-status-success'
      : 'scanner-status';
  const stageClassName = isSubmitting ? 'scanner-stage scanner-stage-busy' : 'scanner-stage';
  const cameraClassName = isCameraReady ? 'scanner-camera scanner-camera-ready' : 'scanner-camera';
  const statusBadge = isSubmitting
    ? 'Bezig met verzenden'
    : feedback?.kind === 'success'
      ? 'Check succesvol'
      : feedback?.kind === 'error'
        ? 'Actie vereist'
        : cameraState === 'initializing'
          ? 'Camera voorbereiden'
          : isCameraReady
            ? 'Klaar om te scannen'
            : 'Fallback beschikbaar';
  const scannerHint = isCameraReady
    ? 'QR in beeld houden tot de kiosk reageert.'
    : 'Gebruik handmatige invoer zolang de camera niet klaar is.';
  const lastCode = code ? `Laatste code: ${code}` : 'Nog geen badgecode verwerkt.';
  const statusDescription = feedback?.source === 'camera'
    ? 'Resultaat via live scan'
    : feedback?.source === 'manual'
      ? 'Resultaat via handmatige invoer'
      : isCameraReady
        ? 'Live camera met QR-detectie'
        : 'Camera fallbackstatus';

  return (
    <div className="scanner-shell">
      <section className="scanner-panel">
        <div>
          <p className="eyebrow">TimeSignal</p>
          <h1 className="app-title scanner-title">Scanner kiosk</h1>
          <p className="app-subtitle">Camera-first kiosk met QR-detectie, device-token beveiliging en handmatige fallback.</p>
        </div>

        <section className={stageClassName}>
          <div className={cameraClassName}>
            <video
              ref={videoRef}
              className="scanner-video"
              autoPlay
              muted
              playsInline
              title="Scanner camera preview"
            />
            {!isCameraReady ? (
              <div className="scanner-overlay">
                <p className="detail-label">{cameraState === 'initializing' ? 'Camera initialiseren' : 'Camera niet beschikbaar'}</p>
                <p className="scanner-overlay-title">{cameraMessage}</p>
                <p className="panel-copy">{scannerHint}</p>
                {isCameraUnavailable ? (
                  <button type="button" className="secondary-button scanner-retry" onClick={startCamera}>
                    Probeer camera opnieuw
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={isCameraReady ? 'scanner-camera-note scanner-camera-note-live' : 'scanner-camera-note'}>
            <p className="detail-label">{statusBadge}</p>
            <p className="panel-copy">{CAMERA_READY_MESSAGE}</p>
          </div>
        </section>

        <div className="scanner-stage-copy">
          <div>
            <p className="detail-label">{isCameraReady ? 'Live scanner' : 'Fallbackmodus'}</p>
            <p className="panel-copy">{scannerHint}</p>
          </div>
          <p className="panel-copy scanner-code-meta">{lastCode}</p>
        </div>

        <section className={statusClassName} aria-live="polite">
          <p className="detail-label">Kiosk status</p>
          <p className="scanner-status-title">{statusTitle}</p>
          <p className="detail-label scanner-status-tag">{statusDescription}</p>
          <p className="panel-copy">{statusMessage}</p>
          <p className="panel-copy">{statusMeta}</p>
        </section>

        <form className="scanner-form" onSubmit={handleSubmit}>
          <div className="scanner-form-header">
            <div>
              <p className="detail-label">Handmatige fallback</p>
              <p className="panel-copy">
                {isCameraReady
                  ? 'Handmatige invoer blijft beschikbaar voor fallback of testscans.'
                  : 'Voer een badgecode in als de camera geblokkeerd is of niet bruikbaar is.'}
              </p>
            </div>
            {isCameraUnavailable ? (
              <button type="button" className="secondary-button scanner-retry" onClick={startCamera}>
                Probeer camera opnieuw
              </button>
            ) : null}
          </div>

          <label className="auth-field">
            <span className="detail-label">Badgecode</span>
            <input
              className="auth-input scanner-input"
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={isCameraReady ? 'Fallback badgecode' : 'Badgecode'}
              disabled={isSubmitting}
            />
          </label>

          <button type="submit" className="primary-button scanner-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verwerken...' : 'Handmatige scan'}
          </button>
        </form>
      </section>
    </div>
  );
}
