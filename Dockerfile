FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app
RUN npm install -g decap-server@latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html

RUN rm -f /usr/share/nginx/html/Dockerfile \
         /usr/share/nginx/html/docker-compose.yml \
         /usr/share/nginx/html/.dockerignore \
         /usr/share/nginx/html/deploy.sh \
         /usr/share/nginx/html/DEPLOY.md

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /var/log/nginx /var/cache/nginx /tmp

EXPOSE 80

CMD ["/entrypoint.sh"]
