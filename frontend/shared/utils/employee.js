import { formatClockTime } from './dateTime';

export function toEmployeeCode(qrCode) {
  return `TS-${qrCode.replace(/[^A-Z0-9]/gi, '').slice(0, 8)}`;
}

export function buildTeamEntries(employees) {
  return employees.map((employee) => ({
    ...employee,
    employeeCode: toEmployeeCode(employee.qrCode),
    lastActionTime: employee.lastActionAt ? formatClockTime(employee.lastActionAt) : null
  }));
}
