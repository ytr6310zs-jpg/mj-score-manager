#!/bin/sh
# main へ取り込み済みの作業ブランチを整理する
# - develop は保持
# - 未マージブランチは削除しない
# - ローカルと origin の両方を対象にする

set -u

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ "$CURRENT_BRANCH" != "main" ]; then
  exit 0
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[cleanup-merged-branches] origin が見つからないためスキップします"
  exit 0
fi

git fetch origin --prune >/dev/null 2>&1 || true

if git show-ref --verify --quiet refs/remotes/origin/main; then
  MERGED_BASE="origin/main"
else
  MERGED_BASE="main"
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

# ローカルの取り込み済みブランチを削除
for branch in $(git for-each-ref --format='%(refname:short)' --merged "$MERGED_BASE" refs/heads); do
  case "$branch" in
    ""|main|develop)
      continue
      ;;
  esac

  if [ "$branch" = "$CURRENT_BRANCH" ]; then
    continue
  fi

  if git branch -d "$branch" >/dev/null 2>&1; then
    echo "[cleanup-merged-branches] local deleted: $branch"
  else
    echo "[cleanup-merged-branches] local skip: $branch"
  fi
done

# リモートの取り込み済みブランチを削除
if git show-ref --verify --quiet refs/remotes/origin/main; then
  for remote_ref in $(git for-each-ref --format='%(refname:short)' --merged origin/main refs/remotes/origin); do
    branch=${remote_ref#origin/}

    case "$branch" in
      ""|HEAD|main|develop)
        continue
        ;;
    esac

    if git push origin --delete "$branch" >/dev/null 2>&1; then
      echo "[cleanup-merged-branches] remote deleted: origin/$branch"
    else
      echo "[cleanup-merged-branches] remote skip: origin/$branch"
    fi
  done
fi
