FROM nginx:alpine
COPY ./ /usr/share/nginx/html/
RUN sed -i 's#/usr/share/nginx/html#/usr/share/nginx/html#g' /etc/nginx/conf.d/default.conf
EXPOSE 80
