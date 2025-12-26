#!/bin/bash
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Fetching latest main..."
git fetch origin

echo "Rebasing $BRANCH onto origin/main..."
git rebase origin/main || {
  echo "Auto-resolving conflicts..."
  git checkout --theirs .
  git add .
  git rebase --continue
}

echo "Committing Codex changes..."
git add -A
git commit -m "codex: automated update"

echo "Pushing with lease..."
git push --force-with-lease origin $BRANCH
