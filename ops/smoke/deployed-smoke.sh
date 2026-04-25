#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8082}"
JAEGER_URL="${JAEGER_URL:-http://localhost:16686}"

for _ in $(seq 1 60); do
  if curl -fsS "${BASE_URL}/healthz" > /tmp/qr-healthz.json; then
    break
  fi
  sleep 2
done

curl -fsS "${BASE_URL}/healthz" | grep -q '"status":"ok"'
curl -fsS "${BASE_URL}/metrics" | grep -q 'qr_http_requests_total'

curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"email":"bob.admin@timesignal.demo","password":"Admin123!"}' \
  "${BASE_URL}/api/auth/login" > /tmp/qr-login.json

grep -q '"token"' /tmp/qr-login.json

curl -fsS \
  -H 'Content-Type: application/json' \
  -H 'X-DEVICE-TOKEN: scanner-demo-token' \
  -d '{"code":"ALICE-DEMO-001"}' \
  "${BASE_URL}/api/scan" > /tmp/qr-scan.json

grep -Eq '"action":"checked_(in|out)"' /tmp/qr-scan.json

for _ in $(seq 1 30); do
  if curl -fsS "${JAEGER_URL}/api/services" | grep -q 'qr-incheck-backend'; then
    exit 0
  fi
  sleep 2
done

echo "Jaeger did not report the qr-incheck-backend service in time" >&2
exit 1
