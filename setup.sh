#!/bin/bash

# 获取本机 IP 地址
IP=$(hostname -I | awk '{print $1}')

# 复制 dockers 目录下的文件到本地
cp -r dockers/* .

# 使用 sed 替换文件中的 IP 地址
# 假设配置文件中使用 localhost 或 127.0.0.1 作为占位符
sed -i "s/localhost/$IP/g" docker-compose.yml

echo "Setup completed. IP address ($IP) has been updated in configuration files."

export PORT=${1:-80}

docker-compose up -d
