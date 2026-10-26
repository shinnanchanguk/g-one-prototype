#!/usr/bin/env bash
# GitHub Actions 없이 GitHub Pages(gh-pages 브랜치, legacy)로 올린다.
# 계정 결제 잠금으로 Actions 가 안 돌 때도 pages-build-deployment 는 성공한다(2026-10-26 실측).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="https://github.com/shinnanchanguk/g-one-prototype.git"
EMAIL="164468614+shinnanchanguk@users.noreply.github.com"
cd "$ROOT"
npx vite build
H=$(git rev-parse --short HEAD)
cp dist/index.html dist/404.html && touch dist/.nojekyll
D=$(mktemp -d); cp -R dist/. "$D"/
cd "$D"
git init -q && git checkout -q -b gh-pages && git add -A
git -c user.email="$EMAIL" -c user.name=shinnanchanguk commit -qm "Publish build of $H"
git remote add origin "$REMOTE" && git push -qf origin gh-pages
cd "$ROOT"; rm -rf "$D"
JS=$(basename "$(ls dist/assets/*.js | head -1)")
L=""
for i in $(seq 1 18); do
  L=$(curl -s "https://shinnanchanguk.github.io/g-one-prototype/?cb=$RANDOM" | grep -o 'index-[^"]*\.js' || true)
  [ "$L" = "$JS" ] && { echo "LIVE $H $JS"; exit 0; }
  sleep 10
done
echo "NOT-LIVE-YET $H expected=$JS got=$L"; exit 1
