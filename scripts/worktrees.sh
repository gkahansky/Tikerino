#!/usr/bin/env bash
# Parallel agent lanes: create, list, check and remove git worktrees.
# Worktrees are scratch. They are rebuilt from this script and origin, never
# treated as the source of truth. See docs/PARALLEL_AGENTS.md.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/worktrees.sh setup <lane> <todo-slug>   create lane worktree on branch <lane>/<todo-slug> off origin/main
  scripts/worktrees.sh list                       show every worktree and its branch
  scripts/worktrees.sh check <lane>               pre-merge check: rebase state, diff check, typecheck, tests, content
  scripts/worktrees.sh teardown <lane>            remove the lane worktree (branch is kept)

Lanes: lane-a, lane-b.
Worktrees live next to the repo in ../<repo>-lanes/<lane>; override with LANES_DIR.
USAGE
}

repo_root=$(git rev-parse --show-toplevel)
repo_name=$(basename "$repo_root")
lanes_dir=${LANES_DIR:-"$(dirname "$repo_root")/${repo_name}-lanes"}

valid_lane() {
  case "$1" in
    lane-a|lane-b) ;;
    *) echo "unknown lane '$1' (use lane-a or lane-b)" >&2; exit 2 ;;
  esac
}

valid_slug() {
  if ! [[ "$1" =~ ^[a-z0-9][a-z0-9-]{1,60}$ ]]; then
    echo "todo slug must be lower-case letters, digits and dashes: '$1'" >&2
    exit 2
  fi
}

cmd=${1:-}
case "$cmd" in
  setup)
    lane=${2:-}; slug=${3:-}
    [ -n "$lane" ] && [ -n "$slug" ] || { usage; exit 2; }
    valid_lane "$lane"; valid_slug "$slug"
    path="$lanes_dir/$lane"
    branch="$lane/$slug"
    if [ -e "$path" ]; then
      echo "$lane already exists at $path; tear it down first (one child per lane)" >&2
      exit 1
    fi
    git -C "$repo_root" fetch --quiet origin main
    mkdir -p "$lanes_dir"
    if git -C "$repo_root" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
      git -C "$repo_root" worktree add --quiet -B "$branch" "$path" "origin/$branch"
    else
      git -C "$repo_root" worktree add --quiet -b "$branch" "$path" origin/main
    fi
    echo "$lane ready: $path on $branch ($(git -C "$path" rev-parse --short HEAD))"
    echo "next: cd $path && npm ci"
    ;;
  list)
    git -C "$repo_root" worktree list
    ;;
  check)
    lane=${2:-}
    [ -n "$lane" ] || { usage; exit 2; }
    valid_lane "$lane"
    path="$lanes_dir/$lane"
    [ -d "$path" ] || { echo "$lane has no worktree at $path" >&2; exit 1; }
    cd "$path"
    git fetch --quiet origin main
    if [ -n "$(git status --porcelain)" ]; then
      echo "FAIL $lane has uncommitted changes" >&2; exit 1
    fi
    behind=$(git rev-list --count HEAD..origin/main)
    if [ "$behind" -ne 0 ]; then
      echo "FAIL $lane is $behind commit(s) behind origin/main: git rebase origin/main, then re-run" >&2
      exit 1
    fi
    echo "== files changed against origin/main"
    git diff --stat origin/main...HEAD
    echo "== diff check"
    git diff --check origin/main...HEAD
    echo "== npm run verify (typecheck, tests, content)"
    npm run verify
    echo "PASS $lane is up to date with origin/main and verified"
    ;;
  teardown)
    lane=${2:-}
    [ -n "$lane" ] || { usage; exit 2; }
    valid_lane "$lane"
    path="$lanes_dir/$lane"
    if [ -d "$path" ]; then
      git -C "$repo_root" worktree remove "$path"
      echo "$lane removed ($path); its branch stays until the PR merges"
    fi
    git -C "$repo_root" worktree prune
    ;;
  *)
    usage; [ -z "$cmd" ] && exit 0 || exit 2 ;;
esac
