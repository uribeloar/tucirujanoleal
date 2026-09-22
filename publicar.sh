#!/bin/bash
# Publica la página del Dr. Leal al link vivo que ve Liposser.
#   bash ~/Documents/Hostess/publicar-drleal/publicar.sh
set -e
SRC=/Users/pablouribe/Documents/Hostess/hostess-web/web/public
REPO="$(cd "$(dirname "$0")" && pwd)"

# el sitio ocupa la RAÍZ del repo: Pages lo sirve bajo /tucirujanoleal/,
# la misma ruta que usa hostess.mx, así ningún enlace interno se rompe.
rsync -a --delete --exclude '.DS_Store' \
  --exclude '.git' --exclude 'publicar.sh' --exclude 'robots.txt' \
  --exclude '.nojekyll' --exclude 'vercel.json' --exclude 'ULTIMA-ACTUALIZACION.txt' \
  "$SRC/tucirujanoleal/" "$REPO/"
mkdir -p "$REPO/_hostess"
cp "$SRC/_hostess/firma.js" "$REPO/_hostess/firma.js"
cp "$SRC/capa-viva.js" "$REPO/capa-viva.js"

# estos dos colgaban de la raíz del dominio: se recuelgan aquí.
# y los dos servicios siguen viviendo en hostess.mx.
find "$REPO" -name '*.html' -not -path '*/.git/*' -print0 | xargs -0 sed -i '' \
  -e 's|"/_hostess/firma.js"|"/tucirujanoleal/_hostess/firma.js"|g' \
  -e 's|"/capa-viva.js"|"/tucirujanoleal/capa-viva.js"|g' \
  -e 's|action="/api/leal-valoracion|action="https://hostess.mx/api/leal-valoracion|g' \
  -e 's|<head>|<head><meta name="robots" content="noindex,nofollow">|'
find "$REPO/assets" -name '*.js' -print0 | xargs -0 sed -i '' \
  -e "s|fetch('/api/asistente/liposser|fetch('https://hostess.mx/api/asistente/liposser|g"

printf 'User-agent: *\nDisallow: /\n' > "$REPO/robots.txt"
: > "$REPO/.nojekyll"
date '+%Y-%m-%d %H:%M' > "$REPO/ULTIMA-ACTUALIZACION.txt"

cd "$REPO"
git add -A
git commit -q -m "Dr. Leal: $(date '+%d %b %H:%M')" || { echo "sin cambios que publicar"; exit 0; }
git push -q origin main
echo "publicado: https://uribeloar.github.io/tucirujanoleal/"
