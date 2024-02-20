# file-server-helper
to build a file-server with docker in a newly installed ubuntu

### step 1: make the script launch at startup
```bash
# modify mount and umount in startop.sh to the disks you want to mount at startup
# modify the "ExecStart=/home/mzero/dockerapps/startop.sh startop" to the script you want to launch at startup 
sudo cp startop.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable startop
```

### step 2: install tools
```bash
sudo apt install openssh-client openssh-server openssh-sftp-server sshfs nfs-ganesha
sudo apt install nano vim wget htop bash-completion deborphan screenfetch
sudo apt install net-tools iftop nmon cockpit
sudo systemctl start cockpit.service
sudo apt install docker-compose
sudo usermod -aG docker $USER
```

### step 2: build docker packages (optional)
```bash
sudo docker-compose -f docker-compose-public.yaml build
```
If you have problem fetch the network, build them on one machine and use `docker save -o` and `docker load` to use in another.
There exists some bugs in `dockeripv6` in startup.sh, which is not compatible with ipv6. you need to make sure that you can connect to `http://ipv6.mirrors.ustc.edu.cn` in docker to build those images...

### step 3: use the pre-build package
check releases in this repo, and you can download those pre-build docker images, and load to your system with
```bash
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
```


### step 3: use
```bash
sudo docker-compose -f docker-compose-public.yaml up
```

