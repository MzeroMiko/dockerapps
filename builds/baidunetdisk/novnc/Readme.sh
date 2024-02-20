#! /bin/bash
GOPROXY=https://goproxy.cn GO111MODULE=auto CGO_ENABLED=0 go build -ldflags '-extldflags \"-static\" -w -s' -o wsnovnc wsnovnc.go && upx wsnovnc

