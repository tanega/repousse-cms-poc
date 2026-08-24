#!/bin/sh
set -eu

envsubst < /etc/hanko/config.template.yaml > /etc/hanko/config.yaml

/usr/local/bin/hanko migrate up --config /etc/hanko/config.yaml

exec /usr/local/bin/hanko serve --config /etc/hanko/config.yaml all
