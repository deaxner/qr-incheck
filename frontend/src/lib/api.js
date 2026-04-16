const AUTH_TOKEN_KEY = 'qr-incheck-demo-token';

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

function createHeaders(initHeaders = {}, { authenticated = true } = {}) {
  const headers = new Headers(initHeaders);

  if (authenticated) {
    const token = getAuthToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message ?? 'Er ging iets mis.');
    error.status = response.status;
    error.code = payload.code ?? null;
    throw error;
  }

  return payload;
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

export async function fetchCurrentSession() {
  const response = await fetch('/api/auth/me', {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function fetchEmployees() {
  const response = await fetch('/api/employees', {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function fetchEmployeeHistory(employeeId) {
  const response = await fetch(`/api/employees/${employeeId}/history`, {
    headers: createHeaders()
  });

  return parseResponse(response);
}

export async function submitScan(code) {
  const response = await fetch('/api/scan', {
    body: JSON.stringify({ code }),
    headers: createHeaders({
      'Content-Type': 'application/json'
    }),
    method: 'POST'
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
