#!/bin/sh
set -e

case "$FLY_PROCESS_GROUP" in
  bot)
    exec node bot/bot.js
    ;;
  audio)
    exec node audio-server.js
    ;;
  app|""|*)
    exec node server.js
    ;;
esac
