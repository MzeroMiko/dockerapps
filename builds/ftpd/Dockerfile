FROM alpine:3.18
MAINTAINER mzero "3496274007@qq.com"

# update sourcelist
ENV SOURCE_ADDR="http://ipv6.mirrors.ustc.edu.cn"
RUN /bin/echo -e "\
    \n${SOURCE_ADDR}/alpine/v3.18/main\n# \
    \n${SOURCE_ADDR}/alpine/v3.18/community\n# \
    " | tee /etc/apk/repositories && apk update \
    && apk --no-cache add bash ca-certificates openssl

# install openssh, vsftpd
RUN apk --no-cache add openssh-server openssh-sftp-server vsftpd

# config ssh
RUN echo -e "Port 22\nPermitRootLogin yes\nListenAddress 0.0.0.0\nListenAddress ::" >> /etc/ssh/sshd_config \
    && ssh-keygen -t dsa -P "" -f /etc/ssh/ssh_host_dsa_key \
    && ssh-keygen -t rsa -P "" -f /etc/ssh/ssh_host_rsa_key \
    && ssh-keygen -t ecdsa -P "" -f /etc/ssh/ssh_host_ecdsa_key \
    && ssh-keygen -t ed25519 -P "" -f /etc/ssh/ssh_host_ed25519_key

# build entry | http:8000; https:8001
COPY ./vsftpd.conf /etc/vsftpd/vsftpd.conf
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV PUID=0 PGID=0 TZ=Asia/Shanghai ROOTPASS=admin FTPUSERS="aftp:aftp:1000:1000 bftp:bftp" \
    PASV_ADDRESS=10.10.10.10 PASV_MIN=21100 PASV_MAX=21102 CERTFILE="ssl.crt" KEYFILE="ssl.key"
VOLUME ["/data/ftp", "/config"]
# VOLUME ["/data/ftp", "/data/\$user",...,"/config"]
EXPOSE 20 21 22 ${PASV_MIN}-${PASV_MAX}
ENTRYPOINT ["/entrypoint.sh"]

