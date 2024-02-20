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

# install nginx openssl ssh 
RUN apt install -y --no-install-recommends nginx openssl openssh-client openssh-server openssh-sftp-server

# config ssh
RUN /bin/echo -e "Port 22\nPermitRootLogin yes\nListenAddress 0.0.0.0\nListenAddress ::" >> /etc/ssh/sshd_config; \
    if [ ! -e /etc/ssh/ssh_host_dsa_key ]; then ssh-keygen -t dsa -P "" -f /etc/ssh/ssh_host_dsa_key; fi; \
    if [ ! -e /etc/ssh/ssh_host_rsa_key ]; then ssh-keygen -t rsa -P "" -f /etc/ssh/ssh_host_rsa_key; fi; \
    if [ ! -e /etc/ssh/ssh_host_ecdsa_key ]; then ssh-keygen -t ecdsa -P "" -f /etc/ssh/ssh_host_ecdsa_key; fi; \
    if [ ! -e /etc/ssh/ssh_host_ed25519_key ]; then ssh-keygen -t ed25519 -P "" -f /etc/ssh/ssh_host_ed25519_key; fi;

# install code-server
COPY ./code-server*.deb /tmp/code-server.deb
RUN dpkg -i /tmp/code-server.deb && rm /tmp/code-server.deb

# build entry | http:8000; https:8001
COPY ./entrypoint.sh /entrypoint.sh
COPY ./entrypoint_user.sh /entrypoint_user.sh
COPY ./codenginx.conf /etc/nginx/conf.d/codeserver.conf
RUN chmod +x /entrypoint.sh /entrypoint_user.sh
ENV PUID=0 PGID=0 TZ=Asia/Shanghai PASSWORD="" CERTFILE="ssl.crt" KEYFILE="ssl.key" ROOTPASS="root" USERPASS="user"
VOLUME ["/workspace", "/config"]
EXPOSE 8000 8001
ENTRYPOINT ["/entrypoint.sh"]
