FROM busybox:latest
# busybox's /bin/sh is very different from ubuntu/debian/alpine, but more like /bin/bash
MAINTAINER mzero "3496274007@qq.com"

# build entry | http:8000; https:8001
COPY ./webdav/wdav /webdav/wdav
COPY ./entrypoint.sh /entrypoint.sh
COPY ./entrypoint_user.sh /entrypoint_user.sh
RUN chmod +x /entrypoint.sh  /entrypoint_user.sh
ENV PUID=0 PGID=0 TZ=Asia/Shanghai DEFUSER="/data/share:/:false" APPEND_USERS="-user demo:demo:/data/share:false" \
    CERTFILE="ssl.crt" KEYFILE="ssl.key" ROOTPASS="root" USERPASS="user"
VOLUME ["/config"]
# VOLUME ["/data/share", "/data/...",...,"/config"]
EXPOSE 8000 8001
ENTRYPOINT ["/entrypoint.sh"]
