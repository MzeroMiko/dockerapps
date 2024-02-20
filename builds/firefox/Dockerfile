FROM debian:bookworm-slim
MAINTAINER mzero "3496274007@qq.com"

# update sourcelist
ENV DEBIAN_FRONTEND=noninteractive SOURCE_ADDR="http://ipv6.mirrors.ustc.edu.cn"
RUN /bin/echo -e " \
    \ndeb ${SOURCE_ADDR}/debian/ bookworm main contrib non-free non-free-firmware\
    \ndeb ${SOURCE_ADDR}/debian/ bookworm-updates main contrib non-free non-free-firmware\
    \ndeb ${SOURCE_ADDR}/debian/ bookworm-backports main contrib non-free non-free-firmware\
    \ndeb ${SOURCE_ADDR}/debian-security bookworm-security main contrib non-free non-free-firmware\
    " | tee /etc/apt/sources.list && apt update \
    && apt install -y --no-install-recommends apt-transport-https ca-certificates

# install desktop with fluxbox
RUN apt install -y --no-install-recommends apt-utils sudo wget xvfb x11vnc dbus-x11 fluxbox locales procps nano lxterminal

# install chinese-input-method
RUN apt install -y --no-install-recommends fcitx fcitx-module-dbus fcitx-ui-classic fcitx-googlepinyin fonts-wqy-microhei \
    && /bin/echo "zh_CN.UTF-8 UTF-8" >> /etc/locale.gen && locale-gen

# install firefox
RUN apt install -y --no-install-recommends firefox-esr

# build entry | http:8000; https:8001
COPY ./novnc/noVNC* /novnc/noVNC
COPY ./novnc/wsnovnc /novnc/wsnovnc
COPY ./entrypoint.sh /entrypoint.sh
COPY ./entrypoint_user.sh /entrypoint_user.sh
RUN cp /novnc/noVNC/vnc.html /novnc/noVNC/index.html \
    && chmod +x /entrypoint.sh /entrypoint_user.sh
ENV PUID=0 PGID=0 TZ=Asia/Shanghai DISPLAY=":1" RESOLUTION=1600x900x24 VNCPATH="/websockify" PASSWORD="" \
    CERTFILE="ssl.crt" KEYFILE="ssl.key" ROOTPASS="root" USERPASS="user"
VOLUME ["/downloads", "/config"]
EXPOSE 8000 8001
ENTRYPOINT ["/entrypoint.sh"]
