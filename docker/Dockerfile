# syntax=docker/dockerfile:1.3-labs

FROM nginx

COPY <<EOF /etc/nginx/nginx.conf
worker_processes 1;
error_log /dev/stdout;
pid /tmp/nginx.pid;
events {
    worker_connections 1024;
}
http {
    server {
        listen 8020;
        listen [::]:8020;
        server_name _;
        location / {
            proxy_pass http://controllers:8020;
        }
    }
}
EOF
