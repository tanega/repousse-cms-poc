#!/bin/sh
set -eu

bin/repousse eval "Repousse.Release.migrate()"

exec bin/repousse start
