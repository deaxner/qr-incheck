FROM node:22-alpine AS builder
ARG APP_NAME
ARG APP_DIR
ARG VITE_DEVICE_TOKEN=scanner-demo-token
ENV VITE_DEVICE_TOKEN=${VITE_DEVICE_TOKEN}
WORKDIR /app/frontend
COPY frontend ./
RUN npm ci
RUN npm run build --workspace=${APP_NAME}
RUN cp -r /app/frontend/apps/${APP_DIR}/dist /tmp/app-dist

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /tmp/app-dist /usr/share/nginx/html
EXPOSE 80
