FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html
EXPOSE 8_080
CMD ["nginx", "-g", "daemon off;"]
