async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'Er ging iets mis.');
  }

  return payload;
}

export async function fetchEmployees() {
  const response = await fetch('/api/employees');

  return parseResponse(response);
}

export async function fetchEmployeeHistory(employeeId) {
  const response = await fetch(`/api/employees/${employeeId}/history`);

  return parseResponse(response);
}

export async function submitScan(code) {
  const response = await fetch('/api/scan', {
    body: JSON.stringify({ code }),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST'
  });

  return parseResponse(response);
}

export async function regenerateQrCode(employeeId) {
  const response = await fetch(`/api/employees/${employeeId}/regenerate-qr`, {
    method: 'POST'
  });

  return parseResponse(response);
}
