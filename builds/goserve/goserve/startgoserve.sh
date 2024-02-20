#! /bin/bash
# CGO_ENABLED=0 go build -ldflags '-extldflags \"-static\" -w -s' -o goserve goserve.go && upx goserve

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

check="$dir/goserve"
# cmd_start="nohup $dir/goserve $dir/goserve.json > /tmp/__goserve.log 2>&1 &"
cmd_start="nohup $dir/goserve -addr [::]:7001 -tls -session 10 -user admin -pass admin -prefix /home -scope /media/Share > /tmp/__goserve.log 2>&1 &"
_run "goserve" "$action" "$check" "$cmd_start" 
