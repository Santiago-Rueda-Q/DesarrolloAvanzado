FROM node:20-alpine AS build
WORKDIR /app
COPY tailwind.input.css ./tailwind.input.css
COPY tailwind.config.js ./tailwind.config.js
COPY index.html ./index.html
COPY app.js ./app.js
RUN npx tailwindcss -i ./tailwind.input.css -o ./assets/tailwind.css --minify

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/ ./
EXPOSE 80
