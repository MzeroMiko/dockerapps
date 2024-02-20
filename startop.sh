#!/bin/bash

function installmirror() {
    # Step 1 : modify sources.list
    source_addr="https://ipv6.mirrors.ustc.edu.cn"
    id=$( awk -F'=' '/^ID=/{ print $NF }' /etc/os-release )
    name=$( awk -F'=' '/^VERSION_CODENAME=/{ print $NF }' /etc/os-release )
    sudo apt install apt-transport-https ca-certificates
    sudo cp -i /etc/apt/sources.list /etc/apt/sources.list.d/sources.list.bak
    if [ "$id" == "ubuntu" ]; then
        echo -e "deb $source_addr/ubuntu/ $name main restricted universe multiverse
            \ndeb $source_addr/ubuntu/ $name-security main restricted universe multiverse \
            \ndeb $source_addr/ubuntu/ $name-updates main restricted universe multiverse \
            \ndeb $source_addr/ubuntu/ $name-backports main restricted universe multiverse \
            " | sudo tee /etc/apt/sources.list
    elif [ "$id" == "debian" ]; then
        echo -e "deb $source_addr/debian/ $name main contrib non-free\
            \ndeb $source_addr/debian/ $name-updates main contrib non-free\
            \ndeb $source_addr/debian/ $name-backports main contrib non-free\
            \ndeb $source_addr/debian-security $name-security main contrib non-free\
            " | sudo tee /etc/apt/sources.list
    fi
    sudo apt update
}

function installsshd() {
    sudo apt update
    sudo apt install openssh-server
    echo -e "\nPort 50000\nListenAddress 0.0.0.0\nListenAddress ::" | sudo tee -a /etc/ssh/sshd_config
    sudo systemctl restart ssh.service || sudo systemctl start ssh.service
    ip addr    
}

function installtools() {
    sudo apt install openssh-client openssh-server openssh-sftp-server sshfs nfs-ganesha
    sudo apt install nano vim wget htop bash-completion deborphan screenfetch
    sudo apt install net-tools iftop nmon cockpit
    sudo systemctl start cockpit.service
    sudo apt install docker-compose
    sudo usermod -aG docker $USER
}

function dockeripv6() {
    echo -e "{\"ipv6\": true,\"fixed-cidr-v6\": \"fd00::/80\", \"experimental\": true, \"ip6tables\": true}" | sudo tee /etc/docker/daemon.json
    echo -e "net.ipv6.conf.all.forwarding=1\nnet.ipv6.conf.default.forwarding=1" | sudo tee /etc/sysctl.d/custom_docker_ipv6.conf
    for dev in $(ls /sys/class/net/ | grep -v "$(ls /sys/devices/virtual/net/)"); do \
        echo -e "net.ipv6.conf.$dev.accept_ra=2" | sudo tee -a /etc/sysctl.d/custom_docker_ipv6.conf; \
    done;
    sudo sysctl -f /etc/sysctl.d/custom_docker_ipv6.conf
    sleep 2
    sudo systemctl reload docker
}

function loadimages() {
    dir=$(dirname $(readlink -f $0))
    docker image load -i $dir/images/goserve.busybox.tar.gz
    docker image load -i $dir/images/portainer.portainer-ce.latest.tar.gz
    docker image load -i $dir/images/kodcloud.kodbox.latest.tar.gz
    docker image load -i $dir/images/transmission.alpine.tar.gz
    docker image load -i $dir/images/aria2.alpine.tar.gz
    docker image load -i $dir/images/firefox.debian.tar.gz
    docker image load -i $dir/images/baidunetdisk.debian.tar.gz
    docker image load -i $dir/images/code-server.debian.tar.gz
    docker image load -i $dir/images/ftpd.alpine.tar.gz
    docker image load -i $dir/images/webdav.busybox.tar.gz
    docker image load -i $dir/images/ngrok.alpine.tar.gz
    docker image load -i $dir/images/flynatc.alpine.tar.gz
}

function saveimages() {
    dir=$(dirname $(readlink -f $0))
    docker image save -o $dir/images/goserve.busybox.tar goserve:busybox
    docker image save -o $dir/images/portainer.portainer-ce.latest.tar portainer/portainer-ce:latest
    docker image save -o $dir/images/kodcloud.kodbox.latest.tar kodcloud/kodbox:latest
    docker image save -o $dir/images/transmission.alpine.tar transmission:alpine
    docker image save -o $dir/images/aria2.alpine.tar aria2:alpine
    docker image save -o $dir/images/firefox.debian.tar firefox:debian
    docker image save -o $dir/images/baidunetdisk.debian.tar baidunetdisk:debian
    docker image save -o $dir/images/code-server.debian.tar code-server:debian
    docker image save -o $dir/images/ftpd.alpine.tar ftpd:alpine
    docker image save -o $dir/images/webdav.busybox.tar webdav:busybox
    docker image save -o $dir/images/ngrok.alpine.tar ngrok:alpine
    docker image save -o $dir/images/flynatc.alpine.tar flynatc:alpine
    gzip $dir/images/*.tar
}

function mountall() {
    sudo mkdir -p /media/Data /media/Data2 /media/Data4 /media/Share /media/TmpShare
    sudo mount -U 52e648d8-e9c2-4cb3-b860-70bc65847669 /media/Data
    sudo mount -U f168d291-b7ca-ec4e-8046-fa6028e2bf0c /media/Data2
    sudo mount -U 3ac08f06-6105-415c-b2dd-ad215efa766d /media/Data4
    sudo mkdir -p /media/Data/Downloads /media/Data/TmpShare /media/Data2/FileStorage /media/Data/Downloads/Data3
    sudo mount -U 363a52dc-47ba-4048-a898-fe8231372b88 /media/Data/Downloads/Data3
    sudo mkdir -p /media/Share/Downloads /media/Share/FileStorage
    sudo mount -R /media/Data/TmpShare /media/TmpShare
    sudo mount -R /media/Data/Downloads /media/Share/Downloads
    sudo mount -R /media/Data2/FileStorage /media/Share/FileStorage
}

function umountall() {
    sudo umount /media/TmpShare
    sudo umount /media/Share/Downloads
    sudo umount /media/Share/FileStorage
    sudo umount /media/Data/Downloads/Data3
    sudo umount /media/Data4
    sudo umount /media/Data2
    sudo umount /media/Data
}

function changemac(){
    dev=enp3s0
    rand=$(echo $RANDOM | xargs  printf "%x")
    mac=f4:4d:30:46:${rand:0:2}:${rand:2}
    sudo ip link set dev $dev down
    sudo ip link set dev $dev address $mac
    sudo ip link set dev $dev up
}

function startop() {
    umountall;
    mountall;
    sleep 90 && changemac; # change after previous mac being banned
    # docker-compose -f $HOME/docker-compose.yaml build container
    # docker-compose -f $HOME/docker-compose.yaml up -d container
    # docker-compose -f $HOME/docker-compose.yaml restart container
}

function test() {
    echo "this is a test"
    echo '
        {
            "cockpit":"https://__IP__:9090",
            "portainer":"https://__IP__:8004",            
            "trweb": "https://__IP__:8007",
            "aria2": "https://__IP__:8009",
            "firefox": "https://__IP__:8012/?path=websockify&autoconnect=true&resize=scale", 
            "baidunetdisk": "https://__IP__:8014/?path=websockify&autoconnect=true&resize=scale", 
            "code": "https://__IP__:8016"
        }
    '
    echo 'tar -czvf dockerapps.20230916.tar.gz  --exclude=dockerapps/volumes dockerapps'
}

if [ -z $1 ]; then 
    echo "choose from [startop changemac installmirror installsshd installtools dockeripv6 loadimages saveimages mountall umountall test]"; 
else
    set -x
    eval $1;
fi;


