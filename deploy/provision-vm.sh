#!/usr/bin/env bash
set -euo pipefail

repo_url="${1:?Pass the public Git repository URL}"
app_dir="/opt/geoissue"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates docker.io docker-compose-v2 git
systemctl enable --now docker

if [[ -d "$app_dir/.git" ]]; then
  git -C "$app_dir" pull --ff-only
else
  git clone "$repo_url" "$app_dir"
fi

chown -R root:root "$app_dir"
chmod -R go-w "$app_dir"
