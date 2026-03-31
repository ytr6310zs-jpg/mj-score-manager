#!/usr/bin/env bash
set -euo pipefail
# Bootstrap script for a self-hosted GitHub Actions runner intended to run DB migrations.
# Usage (manual steps required):
# 1. Create a registration token in GitHub (Settings → Actions → Runners → New self-hosted runner)
# 2. Run this script on the target VM as a privileged user, passing the token and the repo/org URL.
#    e.g. ./bootstrap-runner.sh https://github.com/<org>/<repo> <REGISTRATION_TOKEN>

REPO_URL=${1:-}
REG_TOKEN=${2:-}
LABELS=${3:-"self-hosted,linux,mj-db-runner"}

if [ -z "$REPO_URL" ] || [ -z "$REG_TOKEN" ]; then
  echo "Usage: $0 <github_repo_url> <registration_token> [labels]"
  exit 2
fi

echo "Installing prerequisites..."
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y curl jq ca-certificates tar gzip software-properties-common
  sudo apt-get install -y nodejs npm postgresql-client
fi

ARCHIVE_URL="https://github.com/actions/runner/releases/download/v2.308.0/actions-runner-linux-x64-2.308.0.tar.gz"
WORKDIR=/opt/actions-runner
sudo mkdir -p $WORKDIR
sudo chown $(id -u):$(id -g) $WORKDIR
cd $WORKDIR

echo "Downloading runner..."
curl -fsSL -o actions-runner.tar.gz $ARCHIVE_URL
tar xzf actions-runner.tar.gz

echo "Configuring runner for $REPO_URL with labels: $LABELS"
./config.sh --url "$REPO_URL" --token "$REG_TOKEN" --labels "$LABELS" --unattended

echo "Installing runner as a service (systemd)..."
sudo ./svc.sh install
sudo ./svc.sh start

echo "Bootstrap complete. Runner should be connected to GitHub."
echo "Note: keep the registration token private and follow GitHub guidance for runner security." 
