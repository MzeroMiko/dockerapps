#!/bin/bash     

# add user:group
eval ftpusers=($FTPUSERS)     
for userpass in ${ftpusers[@]}; do     
   user=$(echo $userpass | cut -d : -f 1);     
   pass=$(echo $userpass | cut -d : -f 2);     
   addgroup $user; 
   adduser -D -G $user -h /home/$user -s /bin/false $user;     
   sed -i "s/$user:x:$(id $user -u):$(id $user -g)/$user:x:$PUID:$PGID/g" /etc/passwd;     
   sed -i "s/\/home\/$user/\/data\/$user/g" /etc/passwd;     
   echo "$user:$pass" | chpasswd;     
done
echo -e "root:$ROOTPASS" | chpasswd     

# add ssl
mkdir -p /config/ssl/
openssl req -x509 -nodes -keyout /tmp/tmp.key -out /tmp/tmp.crt -days 3650 -newkey rsa:2048 -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=tmp.com"     
if [ ! -e /config/ssl/$CERTFILE ]; then     
    mv /tmp/tmp.crt /config/ssl/$CERTFILE; 
    mv /tmp/tmp.key /config/ssl/$KEYFILE;     
elif [ ! -e /config/ssl/$KEYFILE ]; then     
    mv /tmp/tmp.crt /config/ssl/$CERTFILE; 
    mv /tmp/tmp.key /config/ssl/$KEYFILE; 
fi;     

# run user:group
chown $PUID:$PGID -R /config 
sshd
sed -i "/rsa_cert_file /c \        rsa_cert_file=/config/ssl/$CERTFILE" /etc/vsftpd/vsftpd.conf;
sed -i "/rsa_private_key_file /c \        rsa_private_key_file=/config/ssl/$KEYFILE" /etc/vsftpd/vsftpd.conf;
sed -i "/pasv_max_port /c \        pasv_max_port=$PASV_MAX" /etc/vsftpd/vsftpd.conf;
sed -i "/pasv_min_port /c \        pasv_min_port=$PASV_MIN" /etc/vsftpd/vsftpd.conf;
sed -i "/pasv_address /c \        pasv_address=$PASV_ADDRESS" /etc/vsftpd/vsftpd.conf;
vsftpd /etc/vsftpd/vsftpd.conf     

# keep container running
tail -f /dev/null

