FROM alpine:3.18
MAINTAINER mzero "3496274007@qq.com"

# update sourcelist
ENV SOURCE_ADDR="http://mirrors.ustc.edu.cn"
RUN /bin/echo -e "\
    \n${SOURCE_ADDR}/alpine/v3.18/main\n# \
    \n${SOURCE_ADDR}/alpine/v3.18/community\n# \
    " | tee /etc/apk/repositories && apk update
RUN apk --no-cache add bash ca-certificates openssl

# add nginx transmission
RUN apk --no-cache add nginx transmission-daemon

# build entry | http:8000; https:8001
COPY ./transnginx.conf /etc/nginx/http.d/transmission.conf
COPY ./transmission-web-*/src /transmission-web-control
# RUN  mv /usr/share/transmission/web/index.html /usr/share/transmission/web/index.original.html \
#     && mv /transmission-web-control/* /usr/share/transmission/web/
RUN  mv /usr/share/transmission/public_html/index.html /usr/share/transmission/public_html/index.original.html \
    && mv /transmission-web-control/* /usr/share/transmission/public_html/
COPY ./entrypoint.sh /entrypoint.sh
COPY ./entrypoint_user.sh /entrypoint_user.sh    
RUN chmod +x /entrypoint.sh /entrypoint_user.sh
ENV PUID=0 PGID=0 TZ=Asia/Shanghai USERNAME="user" PASSWORD="pass" PEERPORT=51413 INCOMPLETEDIR="" \
    CERTFILE="ssl.crt" KEYFILE="ssl.key" ROOTPASS="root" USERPASS="user"
VOLUME ["/downloads", "/config"]
EXPOSE 8000 8001 ${PEERPORT} ${PEERPORT}/udp
ENTRYPOINT ["/entrypoint.sh"]

