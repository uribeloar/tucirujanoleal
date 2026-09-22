/* P-07 · El croquis del consultorio del Dr. Leal.
   Dibuja las calles desde assets/croquis-consultorio.json —trazo nuestro, bajado
   una sola vez de OpenStreetMap— y deja moverlo con el cursor, la rueda o dos dedos.
   Si el archivo no llega, la seccion se queda con su direccion y su boton: nada se rompe. */
(function () {
  'use strict';
  var marco = document.querySelector('[data-croquis]');
  if (!marco || !window.fetch) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var ANCHO_INICIAL = 760;   // metros de lado a lado al abrir: lo que hace falta para que entre Avenida de las Américas, la referencia que da el texto de arriba
  var MIN = 110, MAX = 1300; // piso y techo del acercamiento, en metros
  var TOPE = 620;            // no se puede arrastrar mas alla de esto, en metros

  var svg, capaVias, capaNombres, pin, tarjeta, aviso;
  var etiquetas = [];
  var mandos = null, cajaMandos = null;
  var cx = 0, cy = 0, ancho = ANCHO_INICIAL, alto = ANCHO_INICIAL * 0.8;
  var W = 1, H = 1, despierto = false;

  fetch(marco.dataset.croquis, { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error('croquis'); return r.json(); })
    .then(dibujar)
    .catch(function () { marco.setAttribute('data-croquis-falla', ''); });

  function nuevo(nombre, atributos) {
    var e = document.createElementNS(SVGNS, nombre);
    for (var k in atributos) if (atributos[k] != null) e.setAttribute(k, atributos[k]);
    return e;
  }

  function puntos(d) {
    return d.slice(1).split(' L').map(function (p) {
      var q = p.split(','); return [+q[0], +q[1]];
    });
  }

  function dibujar(datos) {
    svg = nuevo('svg', { 'class': 'croquis-trazo', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid meet' });
    svg.setAttribute('data-no-traducir', '');
    capaVias = nuevo('g', {});
    capaNombres = nuevo('g', { 'class': 'nombres', 'text-anchor': 'middle' });

    datos.calles.forEach(function (calle) {
      var suya = calle.nombre === 'Calle Ottawa';
      calle.tramos.forEach(function (tramo, j) {
        capaVias.appendChild(nuevo('path', {
          'class': 'via via-' + calle.clase + (suya ? ' via-suya' : ''), d: tramo.d
        }));
        // el nombre va una vez por calle, en su tramo mas largo, si hay calle que leer
        if (j === 0 && tramo.largo > 150) {
          var t = nuevo('text', { 'class': suya ? 'suya' : null });
          t.textContent = calle.nombre;
          capaNombres.appendChild(t);
          etiquetas.push({ el: t, pts: puntos(tramo.d), suya: suya, largo: tramo.largo,
            rango: suya ? 3 : (calle.clase === 'secondary' || calle.clase === 'primary') ? 2
                   : calle.clase === 'tertiary' ? 1 : 0 });
        }
      });
    });

    // Primero la suya, luego las avenidas y al final las calles chicas; a igual
    // rango, la mas larga. Un croquis nombra las avenidas antes que los callejones:
    // si no, Avenida de las Américas —la referencia que da el texto— se quedaba muda.
    etiquetas.sort(function (a, b) { return (b.rango - a.rango) || (b.largo - a.largo); });

    svg.appendChild(capaVias);
    svg.appendChild(capaNombres);
    marco.insertBefore(svg, marco.firstChild);

    pin = marco.querySelector('.croquis-pin');
    tarjeta = marco.querySelector('.croquis-tarjeta');
    aviso = marco.querySelector('.croquis-aviso');
    cablear();
    medir();
    pintar();
  }

  /* El punto de la calle mas cercano a donde esta mirando el visitante. */
  function cerca(pts, tx, ty) {
    var mejor = null;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      var t = L2 ? Math.max(0, Math.min(1, ((tx - a[0]) * dx + (ty - a[1]) * dy) / L2)) : 0;
      var px = a[0] + t * dx, py = a[1] + t * dy;
      var d = (px - tx) * (px - tx) + (py - ty) * (py - ty);
      if (!mejor || d < mejor.d) mejor = { d: d, p: [px, py], v: [dx, dy] };
    }
    return mejor;
  }

  /* Los nombres se acomodan donde se esta mirando: nunca encima del pin,
     nunca uno sobre otro, y si no caben se callan. */
  // La caja REAL de un nombre, en pixeles y ya girada. Antes se medía el ancla,
  // no el letrero: por eso AVENIDA PROVIDENCIA se metía debajo de los mandos con
  // el ancla "fuera" de la zona. En pixeles el letrero no cambia de tamaño con el
  // acercamiento (la letra va en unidades del mapa), así que se mide una sola vez.
  function cajaTexto(e, px, py, a, m) {
    if (!e.w) {
      var b = e.el.getBBox();
      e.w = b.width / m; e.h = b.height / m;
    }
    var r = a * Math.PI / 180;
    var co = Math.abs(Math.cos(r)), si = Math.abs(Math.sin(r));
    var d = 3.4 + 0.35 * e.h;                       // el dy lo sube sobre la calle
    var mx = px + d * Math.sin(r), my = py - d * Math.cos(r);
    var hw = (co * e.w + si * e.h) / 2, hh = (si * e.w + co * e.h) / 2;
    return [mx - hw, my - hh, mx + hw, my + hh];
  }

  function choca(a, b) {
    return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  }

  function colocarNombres() {
    var m = ancho / W;
    var x0 = cx - ancho / 2, y0 = cy - alto / 2;
    if (!cajaMandos && mandos) {
      var cm = mandos.getBoundingClientRect(), cq = marco.getBoundingClientRect();
      cajaMandos = [cm.left - cq.left - 8, cm.top - cq.top - 8,
                    cm.right - cq.left + 8, cm.bottom - cq.top + 8];
    }
    var pxPin = (ancho / 2 - cx) / ancho * W, pyPin = (alto / 2 - cy) / alto * H;
    var vedadas = [[pxPin - 22, pyPin - 42, pxPin + 22, pyPin + 6]];
    if (cajaMandos) vedadas.push(cajaMandos);
    var puestos = [];
    etiquetas.forEach(function (e) {
      // Se prueban varios puntos de SU PROPIA calle antes de rendirse: un nombre
      // que estorba en el centro casi siempre cabe un poco mas arriba o al lado,
      // y asi el croquis no se queda mudo por un choque de dos letreros.
      var tiros = e.suya
        ? [[0, -alto * .3], [0, 0], [0, alto * .3], [-ancho * .26, 0], [ancho * .26, 0]]
        : [[0, 0], [0, -alto * .28], [0, alto * .28], [-ancho * .26, 0], [ancho * .26, 0],
           [-ancho * .26, -alto * .26], [ancho * .26, -alto * .26],
           [-ancho * .26, alto * .26], [ancho * .26, alto * .26],
           [0, -alto * .45], [0, alto * .45]];
      for (var t = 0; t < tiros.length; t++) {
        var punto = cerca(e.pts, cx + tiros[t][0], cy + tiros[t][1]);
        var p = punto.p;
        var px = (p[0] - x0) / ancho * W, py = (p[1] - y0) / alto * H;
        var a = Math.atan2(punto.v[1], punto.v[0]) * 180 / Math.PI;
        if (a > 90) a -= 180; else if (a < -90) a += 180;
        e.el.setAttribute('dy', (-3.4 * m).toFixed(2));
        e.el.setAttribute('transform',
          'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ') rotate(' + a.toFixed(1) + ')');
        if (e.el.style.display === 'none') e.el.style.display = '';   // visible para medirlo
        var c = cajaTexto(e, px, py, a, m);
        var cabe = c[0] > 4 && c[1] > 4 && c[2] < W - 4 && c[3] < H - 4;
        for (var i = 0; cabe && i < vedadas.length; i++) if (choca(c, vedadas[i])) cabe = false;
        for (var j = 0; cabe && j < puestos.length; j++) if (choca(c, puestos[j])) cabe = false;
        if (cabe) { puestos.push([c[0] - 6, c[1] - 4, c[2] + 6, c[3] + 4]); return; }
      }
      e.el.style.display = 'none';
    });
  }

  function medir() {
    var caja = marco.getBoundingClientRect();
    W = caja.width || 1; H = caja.height || 1;
    mandos = marco.querySelector('.croquis-mandos');
    cajaMandos = null;
    alto = ancho * (H / W);
  }

  function pintar() {
    alto = ancho * (H / W);
    cx = Math.max(-TOPE, Math.min(TOPE, cx));
    cy = Math.max(-TOPE, Math.min(TOPE, cy));
    svg.setAttribute('viewBox', (cx - ancho / 2) + ' ' + (cy - alto / 2) + ' ' + ancho + ' ' + alto);
    // el texto no crece con el acercamiento: se recalcula en unidades del mapa
    var m = ancho / W;
    capaNombres.setAttribute('font-size', (10.5 * m).toFixed(2));
    capaNombres.setAttribute('letter-spacing', (1.1 * m).toFixed(2));
    capaNombres.setAttribute('stroke-width', (2.6 * m).toFixed(2));
    colocarNombres();
    if (pin) {
      pin.style.left = ((ancho / 2 - cx) / ancho * W).toFixed(1) + 'px';
      pin.style.top = ((alto / 2 - cy) / alto * H).toFixed(1) + 'px';
    }
  }

  function acercar(factor, hx, hy) {
    var antes = ancho;
    ancho = Math.max(MIN, Math.min(MAX, ancho * factor));
    if (ancho === antes) return;
    if (hx != null) { // el punto bajo el cursor se queda donde estaba
      var altoAntes = antes * (H / W);
      var mundoX = cx - antes / 2 + (hx / W) * antes;
      var mundoY = cy - altoAntes / 2 + (hy / H) * altoAntes;
      cx = mundoX - (hx / W - 0.5) * ancho;
      cy = mundoY - (hy / H - 0.5) * ancho * (H / W);
    }
    pintar();
  }

  function despertar() {
    if (despierto) return;
    despierto = true;
    if (aviso) aviso.hidden = true;
  }

  function mostrarAviso() {
    if (aviso && !despierto && tarjeta && tarjeta.hidden) aviso.hidden = false;
  }

  function cablear() {
    // ── raton y lapiz: se arrastra con el mismo cursor ──
    var arrastrando = false, ux = 0, uy = 0;
    marco.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if (e.target.closest('.croquis-mandos, .croquis-tarjeta, .croquis-pin')) return;
      arrastrando = true; ux = e.clientX; uy = e.clientY;
      despertar();
      marco.classList.add('esta-arrastrando');
      marco.setPointerCapture(e.pointerId);
    });
    marco.addEventListener('pointermove', function (e) {
      if (!arrastrando) return;
      cx -= (e.clientX - ux) * ancho / W;
      cy -= (e.clientY - uy) * alto / H;
      ux = e.clientX; uy = e.clientY;
      pintar();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) {
      marco.addEventListener(n, function () { arrastrando = false; marco.classList.remove('esta-arrastrando'); });
    });

    // ── la rueda acerca, una vez que el mapa esta despierto ──
    marco.addEventListener('wheel', function (e) {
      if (!despierto) { mostrarAviso(); return; }
      e.preventDefault();
      var caja = marco.getBoundingClientRect();
      acercar(e.deltaY > 0 ? 1.12 : 0.89, e.clientX - caja.left, e.clientY - caja.top);
    }, { passive: false });

    // ── dedos: uno hace scroll de la pagina, dos mueven el mapa ──
    var dedos = null;
    marco.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { dedos = leerDedos(e); despertar(); }
      else if (e.touches.length === 1 && !e.target.closest('.croquis-mandos,.croquis-tarjeta,.croquis-pin')) mostrarAviso();
    }, { passive: true });
    marco.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2 || !dedos) return;
      e.preventDefault();
      var ahora = leerDedos(e);
      cx -= (ahora.x - dedos.x) * ancho / W;
      cy -= (ahora.y - dedos.y) * alto / H;
      pintar();
      if (dedos.d > 12 && ahora.d > 12) acercar(dedos.d / ahora.d, ahora.x, ahora.y);
      dedos = ahora;
    }, { passive: false });
    ['touchend', 'touchcancel'].forEach(function (n) {
      marco.addEventListener(n, function (e) { if (e.touches.length < 2) dedos = null; }, { passive: true });
    });

    function leerDedos(e) {
      var caja = marco.getBoundingClientRect();
      var a = e.touches[0], b = e.touches[1];
      return {
        x: (a.clientX + b.clientX) / 2 - caja.left,
        y: (a.clientY + b.clientY) / 2 - caja.top,
        d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      };
    }

    // ── los mandos ──
    Array.prototype.forEach.call(marco.querySelectorAll('[data-croquis-zoom]'), function (b) {
      b.addEventListener('click', function () {
        despertar();
        acercar(b.dataset.croquisZoom === 'mas' ? 0.78 : 1.28, W / 2, H / 2);
      });
    });
    var encuadre = marco.querySelector('[data-croquis-encuadre]');
    if (encuadre) encuadre.addEventListener('click', function () {
      cx = 0; cy = 0; ancho = ANCHO_INICIAL; pintar();
    });

    // ── el teclado ──
    marco.addEventListener('keydown', function (e) {
      var paso = ancho / 8, hecho = true;
      if (e.key === 'ArrowLeft') cx -= paso;
      else if (e.key === 'ArrowRight') cx += paso;
      else if (e.key === 'ArrowUp') cy -= paso;
      else if (e.key === 'ArrowDown') cy += paso;
      else if (e.key === '+' || e.key === '=') acercar(0.78, W / 2, H / 2);
      else if (e.key === '-' || e.key === '_') acercar(1.28, W / 2, H / 2);
      else if (e.key === 'Escape' && tarjeta && !tarjeta.hidden) cerrarTarjeta();
      else hecho = false;
      if (hecho) { e.preventDefault(); despertar(); pintar(); }
    });

    // ── el pin y su tarjeta ──
    if (pin && tarjeta) {
      pin.addEventListener('click', function () {
        var abierta = !tarjeta.hidden;
        tarjeta.hidden = abierta;
        pin.setAttribute('aria-expanded', String(!abierta));
        if (aviso) aviso.hidden = true;
        if (!abierta) { var c = tarjeta.querySelector('.croquis-cerrar'); if (c) c.focus(); }
      });
      var cerrar = tarjeta.querySelector('.croquis-cerrar');
      if (cerrar) cerrar.addEventListener('click', cerrarTarjeta);
    }
    function cerrarTarjeta() { tarjeta.hidden = true; pin.setAttribute('aria-expanded', 'false'); pin.focus(); }

    if (window.ResizeObserver) new ResizeObserver(function () { medir(); pintar(); }).observe(marco);
    else window.addEventListener('resize', function () { medir(); pintar(); });
  }
}());
