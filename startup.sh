#!/bin/sh
cd /home/site/wwwroot
npx next start -p ${PORT:-8080}
