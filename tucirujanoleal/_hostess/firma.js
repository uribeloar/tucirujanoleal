/*!
 * FIRMA DE LA CASA — la marca de Hostess en toda página que hacemos.
 * ---------------------------------------------------------------------------
 * Nace el 30-ago-2026 de una retro de Alex sobre las páginas de clientes:
 *   "siempre tiene que tener el botón abajo a la derecha de powered by hostess
 *    a todas las páginas que hagamos, y tiene que tener el botón de whatsapp
 *    con el diseño de la de hostess.mx no esa genérica"
 *
 * POR QUÉ VIVE AQUÍ Y NO PEGADO EN CADA PÁGINA:
 * el barrido de esa noche midió 23 sitios de cliente: 23 sin "Powered by
 * Hostess" y 20 con la burbuja verde genérica de plantilla. Copiar el markup a
 * mano 23 veces es exactamente cómo nació esa falla. Una sola fuente: se corrige
 * aquí y se corrige en todas. La bolita es el MISMO diseño que hostess.mx
 * (components/whatsapp-flotante.tsx + .waFab* de globals.css), no un parecido.
 *
 * CÓMO SE USA — una línea antes de </body>:
 *   <script src="/_hostess/firma.js" defer
 *           data-wa="5213312345678"
 *           data-wa-msg="Hola, vengo de su página"></script>
 *
 * Atributos (todos opcionales menos data-wa):
 *   data-wa       número en formato internacional, solo dígitos. Sin él no sale
 *                 la bolita (nunca se inventa un teléfono).
 *   data-wa-msg   mensaje precargado.
 *   data-wa-label texto accesible del enlace.
 *   data-firma    "no" apaga el sello Powered by Hostess (solo para hostess.mx,
 *                 que no se firma a sí misma).
 *   data-firma-url a dónde manda el sello. Por defecto hostess.mx con utm.
 *
 * Se salta solo si va embebido en un iframe (igual que en hostess.mx), para que
 * las vistas previas del panel no salgan con dos bolitas.
 */
(function () {
  "use strict";

  var s = document.currentScript;
  if (!s) return;

  // Embebido en iframe: no se firma ni se pone bolita.
  var embebido = false;
  try { embebido = window.self !== window.top; } catch (e) { embebido = true; }
  if (embebido) return;

  var tel = (s.getAttribute("data-wa") || "").replace(/[^0-9]/g, "");
  var msg = s.getAttribute("data-wa-msg") || "";
  var label = s.getAttribute("data-wa-label") || "Escríbenos por WhatsApp";
  var conFirma = (s.getAttribute("data-firma") || "").toLowerCase() !== "no";
  var firmaUrl = s.getAttribute("data-firma-url") ||
    "https://hostess.mx/?utm_source=firma&utm_medium=sitio-cliente";
  // El logotipo de la casa se sirve SIEMPRE desde hostess.mx: estos sitios
  // también corren en dominios propios del cliente, donde /logo/ no existe.
  var RAIZ = "https://hostess.mx";

  if (!tel && !conFirma) return;

  // ── estilos ───────────────────────────────────────────────────────────────
  // Calcados de hostess.mx. La caja flotante ya solo lleva la bolita de
  // WhatsApp: el sello se mudó al pie (ver .hsPie).
  var css = [
    '.hsFirma{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));z-index:70;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}',
    '.hsFirma>*{pointer-events:auto}',
    'body[data-menu-abierto="1"] .hsFirma{opacity:0;pointer-events:none}',
    '@media (max-width:1023px){body[data-caja-escritura="1"] .hsFirma{opacity:0;pointer-events:none}}',
    // ── El sello vive en EL PIE, no flotando ──
    // Alex, 31-ago-2026: "lo de powered by hostess no es ahi, tiene que estar
    // asi como en la foto 4 donde dice pagina desarrollada por hostess".
    // Flotando le robaba la esquina a la bolita de WhatsApp y tapaba contenido.
    // En el pie es una firma de autor, que es lo que siempre fue.
    '.hsPie{display:flex;justify-content:flex-end;padding:22px 24px 26px;pointer-events:auto}',
    '.hsPie--suelto{border-top:1px solid rgba(128,128,128,.18)}',
    '.hsSello{display:inline-flex;align-items:center;gap:8px;padding:11px 20px 11px 16px;border-radius:9999px;text-decoration:none;font:600 12.5px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.03em;color:#16181c;background:#fff;border:1px solid rgba(0,0,0,.08);box-shadow:0 4px 14px rgba(0,0,0,.10);transition:box-shadow .24s ease,transform .24s ease}',
    '.hsSello:hover{transform:translateY(-1px)}',
    '.hsSello:hover{box-shadow:0 10px 24px rgba(0,0,0,.2)}',
    // LEY (31-ago-2026): "sin la H, y Hostess siempre
    // debe de ser el logo". La marca de la casa NUNCA se dibuja a mano ni se
    // escribe como texto: se pone el lockup oficial. Antes el sello armaba una
    // H de tres trazos + la palabra en negritas — dos marcas falsas en una pieza
    // de 200 px. → .claude/doctrina/sello-hostess-es-el-logo.md
    '.hsSello__logo{display:block;height:19px;width:auto;flex:none}',
    '@media (max-width:600px){.hsSello__logo{height:17px}}',
    '.hsSello__t{opacity:.58;font-weight:500}',
    '@media (max-width:600px){.hsPie{justify-content:center;padding:20px 18px 24px}.hsSello{font-size:12px;padding:10px 18px 10px 14px}}',
    // El sello se pinta contra el fondo de LA PÁGINA, no contra el tema del
    // navegador: en Grupo Bildim (crema) un sello blanco se perdía, y con el
    // navegador en oscuro salía invertido aunque la página fuera clara.
    '.hsPie--claro .hsSello{color:#f4f1ec;background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.20);box-shadow:none}',
    // bolita de WhatsApp — mismo diseño que hostess.mx
    '.hsWa{display:block;text-decoration:none;opacity:0;transform:translateY(14px) scale(.92);transition:transform .5s ease,opacity .45s ease}',
    '.hsWa{pointer-events:none}',
    '.hsFirma--in .hsWa{opacity:1;transform:none;pointer-events:auto}',
    '.hsWa__btn{position:relative;flex:none;width:58px;height:58px;border-radius:9999px;background:linear-gradient(145deg,#25d366,#12b455);display:grid;place-items:center;box-shadow:0 10px 26px rgba(18,180,85,.44),0 2px 6px rgba(0,0,0,.25);transition:transform 240ms cubic-bezier(.34,1.56,.64,1),filter 160ms ease,box-shadow 240ms ease}',
    '.hsWa__btn svg{width:32px;height:32px;position:relative;z-index:1}',
    '.hsWa:hover .hsWa__btn{transform:scale(1.14);filter:brightness(1.08);box-shadow:0 16px 34px rgba(18,180,85,.52),0 3px 8px rgba(0,0,0,.28)}',
    '.hsWa:active .hsWa__btn{transform:scale(1.04)}',
    '@media print{.hsSello,.hsWa{display:none !important}}',
   '.hsWa__pulso{position:absolute;inset:0;border-radius:9999px;z-index:0;animation:hsWaPulso 2.4s ease-out infinite}',
    '@keyframes hsWaPulso{0%{box-shadow:0 0 0 0 rgba(37,211,102,.42)}70%,100%{box-shadow:0 0 0 22px rgba(37,211,102,0)}}',
    '@media (max-width:600px){.hsWa__btn{width:54px;height:54px}.hsWa__btn svg{width:30px;height:30px}.hsSello{font-size:10px;padding:6px 10px 6px 9px}}',
    '@media (prefers-reduced-motion:reduce){.hsFirma .hsWa,.hsFirma .hsSello{transition:opacity .3s ease;transform:none}.hsWa__pulso{animation:none}.hsWa:hover .hsWa__btn{transform:none}}'
  ].join("");

  var st = document.createElement("style");
  st.setAttribute("data-hostess", "firma");
  st.appendChild(document.createTextNode(css));
  document.head.appendChild(st);

  // ── piezas ────────────────────────────────────────────────────────────────
  var caja = document.createElement("div");
  caja.className = "hsFirma";

  var pie = null;
  if (conFirma) {
    pie = document.createElement("div");
    pie.className = "hsPie";
    var a = document.createElement("a");
    a.className = "hsSello";
    a.href = firmaUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "Sitio hecho por Hostess");
    a.setAttribute("data-cta", "powered-by-hostess");
    // El logo va en dos tintas porque el sello se pinta contra el fondo REAL de
    // la página (ver fondoOscuro más abajo): la oscura sobre fondo claro y la
    // hueso sobre fondo oscuro. Ruta absoluta a hostess.mx: el sello viaja a
    // sitios que viven en su propio dominio.
    a.innerHTML =
      '<span class="hsSello__t">Powered by</span>' +
      '<img class="hsSello__logo" src="' + RAIZ + '/logo/sello-hostess-tinta.png" ' +
      'alt="Hostess" width="348" height="88" decoding="async" loading="lazy">';
    pie.appendChild(a);
  }

  if (tel) {
    var w = document.createElement("a");
    w.className = "hsWa";
    w.href = "https://wa.me/" + tel + (msg ? "?text=" + encodeURIComponent(msg) : "");
    w.target = "_blank";
    w.rel = "noopener noreferrer";
    w.setAttribute("aria-label", label);
    w.setAttribute("data-cta", "fab-flotante");
    w.innerHTML =
      '<span class="hsWa__btn"><span class="hsWa__pulso" aria-hidden="true"></span>' +
      '<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.163 5.335 5.5.001 12.05.001c3.2 0 6.207 1.246 8.466 3.507a11.82 11.82 0 013.505 8.472c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.729-.978zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.017-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.007-1.413.247-.695.247-1.29.173-1.414z"/>' +
      '</svg></span>';
    caja.appendChild(w);
  }

  /**
   * ¿Ya hay algo flotando en el rincón de abajo a la derecha?
   * Muchas páginas de cliente traen SU propia bolita de WhatsApp pegada a mano.
   * Si la firma se monta encima, se tapan una a la otra. En vez de un atributo
   * por página (que se olvida), se mide el rincón al vuelo y la firma se sube
   * lo necesario. Se corrige sola aunque la otra pieza cambie de tamaño.
   */
  /** ¿Este color es oscuro? Devuelve null si es transparente o ilegible. */
  function esOscuro(c) {
    var m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return null;
    return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255 < 0.5;
  }

  /** Luminancia del fondo real de la página, para saber de qué color va el sello. */
  function fondoOscuro() {
    var nodos = [document.body, document.documentElement];
    for (var i = 0; i < nodos.length; i++) {
      var v = esOscuro(window.getComputedStyle(nodos[i]).backgroundColor);
      if (v !== null) return v;
    }
    return false;
  }

  function estorbo() {
    var alto = 0;
    var nodos = document.body.querySelectorAll("a,button,div,aside,section");
    for (var i = 0; i < nodos.length; i++) {
      var n = nodos[i];
      if (n === caja || caja.contains(n)) continue;
      var cs = window.getComputedStyle(n);
      if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
      var r = n.getBoundingClientRect();
      if (!r.width || !r.height || r.width > 260 || r.height > 260) continue;
      var aDerecha = window.innerWidth - r.right;
      var aAbajo = window.innerHeight - r.bottom;
      if (aDerecha < 130 && aAbajo < 130 && aAbajo > -40) {
        alto = Math.max(alto, r.height + aAbajo + 14);
      }
    }
    return alto;
  }

  /**
   * Mete el sello DENTRO del pie de la página, pegado a la derecha, como la
   * firma de autor de The Lords. Si la página no tiene pie, se cuelga uno al
   * final del cuerpo con una línea de separación para que no quede huérfano.
   */
  /**
   * El pie DE LA PÁGINA, no cualquier cosa que se llame "pie".
   * 31-ago-2026: el sello apareció colgado a media página, pegado a una
   * tarjeta de producto. Causa: `.pie` es el nombre que estas páginas usan
   * TAMBIÉN para la botonera de cada ficha, y el selector se quedaba con la
   * primera. Ahora manda la marca semántica (<footer> / role=contentinfo) y
   * solo si no hay ninguna se acepta un `.pie` — el ÚLTIMO, y nunca uno que
   * viva dentro de un artículo o una sección de contenido.
   */
  function buscaPie() {
    var f = document.querySelector("footer, [role=contentinfo]");
    if (f) return f;
    var cand = document.querySelectorAll(".pie, .footer");
    for (var i = cand.length - 1; i >= 0; i--) {
      if (!cand[i].closest("article, .prod, .ficha, .tarjeta")) return cand[i];
    }
    return null;
  }

  function montarPie() {
    if (!pie) return;
    var f = buscaPie();
    if (f) {
      var cs = window.getComputedStyle(f);
      pie.classList.toggle("hsPie--claro", esOscuro(cs.backgroundColor) || fondoOscuro());
      f.appendChild(pie);
    } else {
      pie.classList.add("hsPie--suelto");
      pie.classList.toggle("hsPie--claro", fondoOscuro());
      document.body.appendChild(pie);
    }
    tintaDelLogo();
  }

  /** El lockup tiene dos tintas. Sobre fondo oscuro va la hueso, o el azul
      del logotipo se pierde contra el fondo y solo se lee el punto naranja. */
  function tintaDelLogo() {
    var img = pie && pie.querySelector(".hsSello__logo");
    if (!img) return;
    var claro = pie.classList.contains("hsPie--claro");
    img.src = RAIZ + (claro ? "/logo/sello-hostess-blanco.png" : "/logo/sello-hostess-tinta.png");
  }

  function montar() {
    // La caja flotante ya solo carga la bolita: sin teléfono no se monta nada.
    if (tel) document.body.appendChild(caja);
    montarPie();
    var acomodar = function () {
      var h = estorbo();
      caja.style.bottom = h
        ? "calc(max(20px, env(safe-area-inset-bottom)) + " + Math.round(h) + "px)"
        : "";
    };
    window.setTimeout(acomodar, 1500);
    window.setTimeout(acomodar, 3500);
    window.addEventListener("resize", acomodar);
    // Entra con fundido, igual que en hostess.mx: aparece al rato o al primer scroll.
    //
    // ⚠️ Salvo que la página abra con portada a pantalla completa. Ahí la bolita
    // caía justo encima del botón principal y en teléfono se comía el final de
    // "Ser distribuidor" (medido el 31-ago-2026). En esas páginas espera a que
    // el visitante pase la portada, y se vuelve a guardar si regresa arriba: el
    // primer botón de la página es del cliente, no nuestro.
    var portada = document.querySelector(".hero.cine, .hero--cine, [data-portada-completa]");
    if (portada) {
      var vigilaPortada = function () {
        var r = portada.getBoundingClientRect();
        if (r.bottom < window.innerHeight * 0.5) caja.classList.add("hsFirma--in");
        else caja.classList.remove("hsFirma--in");
      };
      window.addEventListener("scroll", vigilaPortada, { passive: true });
      window.addEventListener("resize", vigilaPortada);
      vigilaPortada();
      return;
    }
    var t = window.setTimeout(function () { caja.classList.add("hsFirma--in"); }, 1200);
    var onScroll = function () {
      caja.classList.add("hsFirma--in");
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll, true);
    };
    window.addEventListener("scroll", onScroll, true);
  }

  if (document.body) montar();
  else document.addEventListener("DOMContentLoaded", montar);
})();
