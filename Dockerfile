FROM nginx:alpine

WORKDIR /app

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html

EXPOSE 8080

