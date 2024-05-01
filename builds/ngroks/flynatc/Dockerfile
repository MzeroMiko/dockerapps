FROM alpine:3.18
MAINTAINER mzero "3496274007@qq.com"

# update sourcelist
ENV SOURCE_ADDR="http://mirrors.ustc.edu.cn"
RUN /bin/echo -e "\
    \n${SOURCE_ADDR}/alpine/v3.18/main\n# \
    \n${SOURCE_ADDR}/alpine/v3.18/community\n# \
    " | tee /etc/apk/repositories && apk update \
    && apk --no-cache add bash ca-certificates openssl

# install openssh, net-tools, tzdata
RUN apk --no-cache add net-tools openssh-client openssh-server openssh-sftp-server tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# config ssh
RUN echo -e "Port 22\nPermitRootLogin yes" >> /etc/ssh/sshd_config \
    && ssh-keygen -t dsa -P "" -f /etc/ssh/ssh_host_dsa_key \
    && ssh-keygen -t rsa -P "" -f /etc/ssh/ssh_host_rsa_key \
    && ssh-keygen -t ecdsa -P "" -f /etc/ssh/ssh_host_ecdsa_key \
    && ssh-keygen -t ed25519 -P "" -f /etc/ssh/ssh_host_ed25519_key


# build entry 
COPY ./flynatc /flynatc
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV TOKEN="yourtoken" USER="name" ROOTPASS="root"
ENTRYPOINT ["/entrypoint.sh"]
