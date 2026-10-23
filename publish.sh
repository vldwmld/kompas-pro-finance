#!/bin/sh
# Rebuild every site and publish it to GitHub Pages (the gh-pages branch).
#   https://vldwmld.github.io/kompas-pro-finance/          main site
#   https://vldwmld.github.io/kompas-pro-finance/<client>/ each client
set -e
cd "$(dirname "$0")"
REPO=https://github.com/vldwmld/kompas-pro-finance.git

python3 build.py --site

cd _site
if [ ! -d .git ]; then
  git init -q
  git checkout -q -b gh-pages
  git config http.postBuffer 524288000
fi
git add -A
if git diff --cached --quiet; then
  echo "Nothing changed; the live sites are up to date."
  exit 0
fi
git commit -qm "Publish sites"
git push --force "$REPO" gh-pages
echo "Published. GitHub Pages updates in a minute or two."
