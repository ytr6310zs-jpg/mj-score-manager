#!/bin/sh
# develop へ取り込み済みの作業ブランチを整理する
# 条件:
# - develop へ取り込み済み
# - かつ develop が main へ取り込み済み
# - develop/main は保持
# - ローカルと origin の両方を対象にする

set -u

log() {
  echo "[cleanup-merged-branches] $1"
}

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
log "start: branch=$CURRENT_BRANCH dry_run=$DRY_RUN"
if [ "$CURRENT_BRANCH" != "main" ]; then
  log "skip: current branch is not main ($CURRENT_BRANCH)"
  exit 0
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  log "skip: origin が見つからないためスキップします"
  exit 0
fi

git fetch origin --prune >/dev/null 2>&1 || true

if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  log "skip: origin/main が見つからないためスキップします"
  exit 0
fi

if ! git show-ref --verify --quiet refs/remotes/origin/develop; then
  log "skip: origin/develop が見つからないためスキップします"
  exit 0
fi

# develop が main に取り込み済みでなければ、develop 取り込み済みブランチの削除は行わない
if ! git merge-base --is-ancestor origin/develop origin/main; then
  log "skip: origin/develop が origin/main に未取り込みのためスキップします"
  exit 0
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

LOCAL_CANDIDATES=0
LOCAL_DELETED=0
LOCAL_SKIPPED=0
REMOTE_CANDIDATES=0
REMOTE_DELETED=0
REMOTE_SKIPPED=0

# ローカルの develop 取り込み済みブランチを削除
for branch in $(git for-each-ref --format='%(refname:short)' --merged origin/develop refs/heads); do
  case "$branch" in
    ""|main|develop)
      continue
      ;;
  esac

  if [ "$branch" = "$CURRENT_BRANCH" ]; then
    continue
  fi

  LOCAL_CANDIDATES=$((LOCAL_CANDIDATES + 1))

  if [ "$DRY_RUN" -eq 1 ]; then
    log "local candidate: $branch"
  elif git branch -d "$branch" >/dev/null 2>&1; then
    LOCAL_DELETED=$((LOCAL_DELETED + 1))
    log "local deleted: $branch"
  else
    LOCAL_SKIPPED=$((LOCAL_SKIPPED + 1))
    log "local skip: $branch"
  fi
done

# リモートの develop 取り込み済みブランチを削除
for remote_ref in $(git for-each-ref --format='%(refname:short)' --merged origin/develop refs/remotes/origin); do
  case "$remote_ref" in
    ""|origin|origin/HEAD|origin/main|origin/develop)
      continue
      ;;
  esac

  branch=${remote_ref#origin/}

  case "$branch" in
    ""|origin|HEAD|main|develop)
      continue
      ;;
  esac

  REMOTE_CANDIDATES=$((REMOTE_CANDIDATES + 1))

  if [ "$DRY_RUN" -eq 1 ]; then
    log "remote candidate: origin/$branch"
  elif git push origin --delete "$branch" >/dev/null 2>&1; then
    REMOTE_DELETED=$((REMOTE_DELETED + 1))
    log "remote deleted: origin/$branch"
  else
    REMOTE_SKIPPED=$((REMOTE_SKIPPED + 1))
    log "remote skip: origin/$branch"
  fi
done

log "summary: local candidates=$LOCAL_CANDIDATES deleted=$LOCAL_DELETED skipped=$LOCAL_SKIPPED"
log "summary: remote candidates=$REMOTE_CANDIDATES deleted=$REMOTE_DELETED skipped=$REMOTE_SKIPPED"
