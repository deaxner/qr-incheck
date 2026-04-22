import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/auth';

function createHeaders(initHeaders = {}, { authenticated = true, deviceToken = null } = {}) {
  const headers = new Headers(initHeaders);

  if (authenticated) {
    const token = getAuthToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (deviceToken) {
    headers.set('X-DEVICE-TOKEN', deviceToken);
  }

  return headers;
}

function getDefaultErrorMessage(status, code) {
  if ('rate_limited' === code || 429 === status) {
    return 'Er worden te veel scans tegelijk verwerkt. Probeer het zo opnieuw.';
  }

  if ('invalid_device_token' === code) {
    return 'Scanner device token ontbreekt of is ongeldig.';
  }

  if ('invalid_request' === code || 400 === status) {
    return 'Controleer de invoer en probeer het opnieuw.';
  }

  if ('forbidden' === code || 403 === status) {
    return 'Je hebt geen toegang tot deze actie.';
  }

  if ('unauthorized' === code || 401 === status) {
    return 'Je sessie is verlopen of ongeldig.';
  }

  return 'Er ging iets mis.';
}

async function parseResponse(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message ?? getDefaultErrorMessage(response.status, payload?.code ?? null));
    error.status = response.status;
    error.code = payload?.code ?? null;
    throw error;
  }

  return payload ?? {};
}

export async function login({ email, password }) {
  const response = await fetch('/api/auth/login', {
    body: JSON.stringify({ email, password }),
    headers: createHeaders(
      {
        'Content-Type': 'application/json'
      },
      { authenticated: false }
    ),
    method: 'POST'
  });

  const payload = await parseResponse(response);
  setAuthToken(payload.token);

  return payload;
}

export async function me() {
  const response = await fetch('/api/auth/me', {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function getEmployees() {
  const response = await fetch('/api/employees', {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function getEmployeeHistory(employeeId) {
  const response = await fetch(`/api/employees/${employeeId}/history`, {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function regenerateQrCode(employeeId) {
  const response = await fetch(`/api/employees/${employeeId}/regenerate-qr`, {
    headers: createHeaders(),
    method: 'POST'
  });

  return parseResponse(response);
}

export async function getMyStatus() {
  const response = await fetch('/api/employees/me/status', {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function getMyHistory() {
  const response = await fetch('/api/employees/me/history', {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function scan(code, { deviceToken } = {}) {
  const response = await fetch('/api/scan', {
    body: JSON.stringify({ code }),
    headers: createHeaders(
      {
        'Content-Type': 'application/json'
      },
      {
        authenticated: false,
        deviceToken
      }
    ),
    method: 'POST'
  });

  return parseResponse(response);
}

export { clearAuthToken, getAuthToken };
