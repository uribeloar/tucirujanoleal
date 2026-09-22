#!/bin/bash
# Publica la página del Dr. Leal al link vivo que ve Liposser.
# Un solo comando: bash ~/Documents/Hostess/publicar-drleal/publicar.sh
set -e
SRC=/Users/pablouribe/Documents/Hostess/hostess-web/web/public
REPO="$(cd "$(dirname "$0")" && pwd)"
D="$REPO/tucirujanoleal"

rm -rf "$D"; mkdir -p "$D"
rsync -a --delete --exclude '.DS_Store' "$SRC/tucirujanoleal/" "$D/"
mkdir -p "$D/_hostess"
cp "$SRC/_hostess/firma.js" "$D/_hostess/firma.js"
cp "$SRC/capa-viva.js" "$D/capa-viva.js"

# el sitio vive bajo /tucirujanoleal/ en Pages igual que en hostess.mx,
# pero estos dos colgaban de la raíz del dominio: se recuelgan aquí.
find "$D" -name '*.html' -print0 | xargs -0 sed -i '' \
  -e 's|"/_hostess/firma.js"|"/tucirujanoleal/_hostess/firma.js"|g' \
  -e 's|"/capa-viva.js"|"/tucirujanoleal/capa-viva.js"|g' \
  -e 's|action="/api/leal-valoracion|action="https://hostess.mx/api/leal-valoracion|g'
find "$D/assets" -name '*.js' -print0 | xargs -0 sed -i '' \
  -e "s|fetch('/api/asistente/liposser|fetch('https://hostess.mx/api/asistente/liposser|g"

# vista previa privada: se ve con el link, no sale en Google
find "$D" -name '*.html' -print0 | xargs -0 sed -i '' \
  -e 's|<head>|<head><meta name="robots" content="noindex,nofollow">|'
printf 'User-agent: *\nDisallow: /\n' > "$REPO/robots.txt"
: > "$REPO/.nojekyll"
date '+%Y-%m-%d %H:%M' > "$REPO/ULTIMA-ACTUALIZACION.txt"
printf '<!doctype html><meta charset=utf-8><meta http-equiv=refresh content="0;url=./tucirujanoleal/">\n' > "$REPO/index.html"

cd "$REPO"
git add -A
git commit -q -m "Dr. Leal: $(date '+%d %b %H:%M') $(git diff --cached --shortstat | tr -d '\n')" || { echo "sin cambios"; exit 0; }
git push -q origin main
echo "publicado: https://uribeloar.github.io/tucirujanoleal/"
