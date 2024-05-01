FROM busybox:latest
# busybox's /bin/sh is very different from ubuntu/debian/alpine, but more like /bin/bash
MAINTAINER mzero "3496274007@qq.com"

# build entry | http:8000; https:8001
COPY ./goserve/goserve /goserve/goserve
COPY ./goserve/public /goserve/public
COPY ./entrypoint.sh /entrypoint.sh
COPY ./entrypoint_user.sh /entrypoint_user.sh
RUN chmod +x /entrypoint.sh /entrypoint_user.sh
RUN chmod +x /goserve/goserve
ENV PUID=0 PGID=0 TZ=Asia/Shanghai USERNAME="user" PASSWORD="pass" SESSIONTIME=10 SCOPE="/data" PREFIX="/home" \
    CERTFILE="ssl.crt" KEYFILE="ssl.key" ROOTPASS="root" USERPASS="user" \
    PLUGIN="-plugin \"/config/plugins/postAction.so:NewPostAction:true:maxFromMem:5000000:trashDir:.trash:signPass:pass:signExist:exist:signFail:fail\""
VOLUME ["/data", "/config"]
EXPOSE 8000 8001
ENTRYPOINT ["/entrypoint.sh"]
