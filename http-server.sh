#!/usr/bin/env bash

set -u

public_path="$1"
shift
server_opts="$@"

http-server  $public_path --gzip --brotli -p 9001 -c-1 --cors $server_opts 
