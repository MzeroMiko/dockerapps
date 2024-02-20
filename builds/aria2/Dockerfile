FROM alpine:latest
MAINTAINER mzero "3496274007@qq.com"

# update sourcelist
ENV SOURCE_ADDR="http://ipv6.mirrors.ustc.edu.cn"
RUN /bin/echo -e "\
    \n${SOURCE_ADDR}/alpine/latest-stable/main\n# \
    \n${SOURCE_ADDR}/alpine/latest-stable/community\n# \
    " | tee /etc/apk/repositories && apk update \
    && apk --no-cache add bash ca-certificates openssl

# install aria2 nginx
RUN apk --no-cache add aria2 nginx

# build entry | http:8000; https:8001
COPY ./aria2.conf /www/aria2.conf
COPY ./index.html /www/index.html
COPY ./aria2nginx.conf /etc/nginx/http.d/aria2nginx.conf
COPY ./entrypoint.sh /entrypoint.sh
COPY ./entrypoint_user.sh /entrypoint_user.sh
RUN chmod +x /entrypoint.sh /entrypoint_user.sh
ENV PUID=0 PGID=0 TZ=Asia/Shanghai SECRET="aria2" BTPORT=32516 CERTFILE="ssl.crt" KEYFILE="ssl.key" ROOTPASS="root" USERPASS="user"
VOLUME ["/config", "/downloads"]
EXPOSE 8000 8001 ${BTPORT} ${BTPORT}/udp
ENTRYPOINT ["/entrypoint.sh"]

