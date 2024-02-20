#! /bin/bash

# GOPROXY=https://goproxy.cn GO111MODULE=auto CGO_ENABLED=0 go build -ldflags '-extldflags \"-static\" -w -s' -o wdav wdav.go && upx wdav

function _run() {
    name=$1
    action=$2
    check=$3
    cmd_start=$4
    # cmd_pids=$5 # must be like "pids=..."
    # cmd_stop=$6
    cmd_pids="pids=\$(ps aux | grep \"\$check\" | grep -v grep | awk '{print \$2}')"
    cmd_stop="kill \$pids 1>/dev/null 2>&1"
    
    # echo $cmd_start

    eval $cmd_pids
    case "$action" in
        start)
            if [ "$pids" == "" ]; then eval $cmd_start && sleep 1 && eval $cmd_pids; fi
            echo "$name starts at $pids"
            ;;
        stop)
            eval $cmd_stop && sleep 1
            echo "$name stops at $pids"
            ;;
        status)
            eval $cmd_pids
            echo "$name runs on $pids"
            ;;
        restart)
            eval $cmd_stop && sleep 1 && eval $cmd_start && sleep 1 && eval $cmd_pids
            echo "$name restarts at $pids"
            ;;
        *)
            eval $cmd_pids
            echo "$name runs on $pids"
            ;;
    esac
}

dir=$(dirname $(readlink -f $0))
action=$1

check="$dir/wdav"
cmd_start="nohup $dir/wdav -addr [::]:6000 -tls -auth -def /data/share:/:false -user admin:admin:/data/all:/:true -user demo:demo:/data/share:/:false > /tmp/wdav.log 2>&1 &"
_run "goserve" "$action" "$check" "$cmd_start" 


