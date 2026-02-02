#!/bin/sh
# Run this in Git Bash to replace Cursor Agent with pinkeshroy in git history
# Usage: Right-click repo -> "Git Bash Here" -> sh fix-cursor-contributor.sh

cd "$(dirname "$0")"
export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_NAME" = "Cursor Agent" ] || [ "$GIT_AUTHOR_NAME" = "cursoragent" ]; then
  export GIT_AUTHOR_NAME="pinkeshroy"
  export GIT_AUTHOR_EMAIL="pinkeshyadav9661@gmail.com"
fi
if [ "$GIT_COMMITTER_NAME" = "Cursor Agent" ] || [ "$GIT_COMMITTER_NAME" = "cursoragent" ]; then
  export GIT_COMMITTER_NAME="pinkeshroy"
  export GIT_COMMITTER_EMAIL="pinkeshyadav9661@gmail.com"
fi
' --tag-name-filter cat -- --all

echo ""
echo "Done. To push: git push origin master --force"
