/* ==========================================================================
   LIPOSSER · EL MANIQUÍ — comportamiento
   --------------------------------------------------------------------------
   Una sola idea: el dibujo, las tarjetas, el resumen y los botones de cierre
   son EL MISMO ESTADO. Se toca donde se toque, todo se entera y la página no
   se mueve de su sitio.

   Lo que NO hace, a propósito:
     · no navega al tocar el cuerpo (esa era la falla del maniquí anterior:
       location.href se llevaba a la paciente y por eso solo se podía señalar
       una cosa a la vez);
     · no simula resultados. Es un selector de interés.

   Compatibilidad de claves: usa las mismas que el maniquí de puntos del sitio
   (rostro, parpados, papada, busto, brazos, abdomen, piel-abdomen, flancos,
   gluteos, muslos, definicion, orejas) y añade tres verificadas: caderas,
   espalda-alta y espalda-baja. Una zona = una clave, aquí y en el guardado.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Orden canónico: de la cabeza a los pies. Es el orden en que se listan las
     zonas marcadas, para que la lista se lea siempre igual sin importar en qué
     orden las fue tocando la paciente. */
  var CLAVES = [
    'rostro', 'parpados', 'orejas', 'papada',
    'busto', 'brazos', 'espalda-alta',
    'abdomen', 'definicion', 'flancos', 'espalda-baja',
    'piel-abdomen', 'caderas', 'gluteos', 'muslos'
  ];

  /* La gente no habla en claves. Este puente evita que "panza" o "llantitas"
     se pierdan cuando la selección llega desde la dirección o desde el
     formulario por voz. */
  var SINONIMOS = {
    cara: 'rostro', face: 'rostro',
    ojos: 'parpados', parpado: 'parpados', eyelids: 'parpados',
    oreja: 'orejas', ears: 'orejas',
    cuello: 'papada', menton: 'papada', 'doble menton': 'papada', neck: 'papada',
    senos: 'busto', pecho: 'busto', mama: 'busto', mamas: 'busto', breast: 'busto', chest: 'busto',
    brazo: 'brazos', arms: 'brazos',
    panza: 'abdomen', estomago: 'abdomen', vientre: 'abdomen', barriga: 'abdomen',
    tummy: 'abdomen', belly: 'abdomen',
    faldon: 'piel-abdomen', 'piel colgada': 'piel-abdomen', 'piel del abdomen': 'piel-abdomen',
    llantitas: 'flancos', cintura: 'flancos', costados: 'flancos', 'love handles': 'flancos', flanks: 'flancos',
    espalda: 'espalda-alta', 'espalda alta': 'espalda-alta', 'espalda baja': 'espalda-baja',
    dorso: 'espalda-alta', back: 'espalda-alta',
    cadera: 'caderas', hips: 'caderas',
    pompas: 'gluteos', cola: 'gluteos', gluteo: 'gluteos', bbl: 'gluteos', buttocks: 'gluteos',
    piernas: 'muslos', pierna: 'muslos', muslo: 'muslos', thighs: 'muslos',
    marcar: 'definicion', definir: 'definicion', marcaje: 'definicion', abs: 'definicion'
  };

  var LLAVE = 'liposser:zonas';
  var WA = '523332239324';   // WhatsApp de Hostess. NUNCA el de la clínica.

  var raiz = $('[data-maniqui-lm]');
  if (!raiz) return;

  var elegidas = [];
  var ultima = null;    // la última zona tocada: la única que escribe su nombre

  /* ---------- normalizar: una zona, un nombre ---------- */
  function normalizar(z) {
    if (z == null) return '';
    var s = String(z).trim().toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/\s+/g, ' ');
    if (CLAVES.indexOf(s) !== -1) return s;
    if (SINONIMOS[s]) return SINONIMOS[s];
    var guion = s.replace(/\s/g, '-');
    return CLAVES.indexOf(guion) !== -1 ? guion : '';
  }

  /* El nombre visible vive en el marcado, no aquí: así el día que exista la
     versión en inglés sale del mismo motor sin duplicar diccionarios. */
  function nombre(z) {
    var c = $('.lm-card[data-zona="' + z + '"] .lm-card-txt b', raiz);
    if (c) return c.textContent.trim();
    var g = $('[data-zona="' + z + '"][aria-label]', raiz);
    if (g) return g.getAttribute('aria-label');
    return z;
  }

  function guardar() {
    try { sessionStorage.setItem(LLAVE, elegidas.join(',')); } catch (e) { /* modo privado */ }
  }

  /* ---------- pintar: el estado se refleja en las cuatro piezas ---------- */
  function pintar() {
    // 1 · el dibujo (las tres vistas a la vez: una zona marcada en frente
    //     aparece marcada también en espalda si vive en las dos)
    $$('[data-marca]', raiz).forEach(function (g) {
      var c = g.getAttribute('data-marca');
      g.classList.toggle('on', elegidas.indexOf(c) !== -1);
      // El nombre escrito sobre el cuerpo se enseña de UNO en uno: el de la
      // zona que se acaba de tocar. Con diez marcadas, diez nombres apilados
      // en el torso son un muro de letras encimadas — se probó y se ve mal.
      // Los nombres completos ya están en las tarjetas y en el resumen.
      g.classList.toggle('rotulado', c === ultima);
    });
    $$('.lm-zona', raiz).forEach(function (r) {
      var si = elegidas.indexOf(r.getAttribute('data-zona')) !== -1;
      r.setAttribute('aria-pressed', si ? 'true' : 'false');
    });

    // 2 · las tarjetas
    $$('.lm-card', raiz).forEach(function (c) {
      var si = elegidas.indexOf(c.getAttribute('data-zona')) !== -1;
      c.classList.toggle('on', si);
      var b = $('.lm-card-sel', c);
      if (b) b.setAttribute('aria-pressed', si ? 'true' : 'false');
    });

    // 3 · el punto en la pestaña de la vista que tiene zonas marcadas
    $$('.lm-vista', raiz).forEach(function (b) {
      var v = b.getAttribute('data-vista');
      var svg = $('svg[data-vista="' + v + '"]', raiz);
      var tiene = false;
      if (svg) {
        tiene = $$('.lm-zona', svg).some(function (r) {
          return elegidas.indexOf(r.getAttribute('data-zona')) !== -1;
        });
      }
      b.classList.toggle('tiene', tiene);
    });

    // 4 · el resumen
    var res = $('[data-lm-resumen]', raiz);
    if (res) {
      res.hidden = elegidas.length === 0;
      var cta = $('[data-lm-cuenta]', res);
      if (cta) cta.textContent = elegidas.length === 1 ? '1 zona marcada' : elegidas.length + ' zonas marcadas';

      var cont = $('[data-lm-chips]', res);
      if (cont) {
        cont.innerHTML = '';
        elegidas.forEach(function (z) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'lm-chip';
          b.setAttribute('data-quitar', z);
          b.setAttribute('aria-label', 'Quitar ' + nombre(z));
          b.innerHTML = nombre(z) +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
          cont.appendChild(b);
        });
      }
    }

    // 5 · el cierre comercial: lo elegido viaja pegado al botón
    var texto = elegidas.map(nombre).join(', ');
    $$('[data-lm-ir]').forEach(function (a) {
      var base = a.getAttribute('data-lm-ir');
      a.setAttribute('href', elegidas.length ? base + '?zonas=' + encodeURIComponent(elegidas.join(',')) : base);
    });
    $$('[data-lm-wa]').forEach(function (a) {
      var msg = elegidas.length
        ? 'Hola, me gustaría una valoración. Las zonas que marqué son: ' + texto + '.'
        : 'Hola, me gustaría información sobre una valoración en Liposser.';
      a.setAttribute('href', 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg));
    });
    // El servidor del formulario solo acepta cuatro grupos (cuerpo · mama-gluteo ·
    // rostro · consultorio). Las zonas marcadas viajan como detalle; el campo
    // «interes» lleva el grupo, o la solicitud se rechazaria al enviarse.
    var ROSTRO = ['rostro', 'parpados', 'orejas', 'papada'];
    var MAMA_GLUTEO = ['busto', 'gluteos'];
    var enGrupo = function (lista) {
      return elegidas.some(function (z) { return lista.indexOf(z) !== -1; });
    };
    var cuerpo = elegidas.some(function (z) {
      return ROSTRO.indexOf(z) === -1 && MAMA_GLUTEO.indexOf(z) === -1;
    });
    var grupo = cuerpo ? 'cuerpo' : enGrupo(MAMA_GLUTEO) ? 'mama-gluteo' : enGrupo(ROSTRO) ? 'rostro' : '';
    $$('[data-lm-campo]').forEach(function (i) { i.value = grupo; });
    $$('[data-lm-detalle]').forEach(function (i) { i.value = texto; });
    $$('[data-lm-zonas]').forEach(function (i) { i.value = elegidas.join(','); });

    guardar();

    // 6 · avisar afuera. El evento sirve dentro de la página; el postMessage,
    //     cuando la pieza va en un iframe dentro de otra página del sitio.
    document.dispatchEvent(new CustomEvent('maniqui:cambio', { detail: { seleccionadas: elegidas.slice() } }));
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ tipo: 'maniqui', zonas: elegidas.slice(), nombres: elegidas.map(nombre) }, '*');
      } catch (e) { /* origen distinto y sin permiso: no es fatal */ }
    }
  }

  /* ---------- las cuatro operaciones ---------- */
  function marcar(z) {
    var k = normalizar(z);
    if (!k) return elegidas.slice();
    ultima = k;                       // su nombre es el que se escribe encima
    if (elegidas.indexOf(k) !== -1) { pintar(); return elegidas.slice(); }
    elegidas.push(k);
    elegidas.sort(function (a, b) { return CLAVES.indexOf(a) - CLAVES.indexOf(b); });
    pintar();
    return elegidas.slice();
  }
  function desmarcar(z) {
    var k = normalizar(z), i = elegidas.indexOf(k);
    if (i !== -1) {
      elegidas.splice(i, 1);
      if (ultima === k) ultima = elegidas[elegidas.length - 1] || null;
      pintar();
    }
    return elegidas.slice();
  }
  function alternar(z) {
    var k = normalizar(z);
    return elegidas.indexOf(k) !== -1 ? desmarcar(k) : marcar(k);
  }
  function limpiar() { elegidas = []; ultima = null; pintar(); return []; }

  /* ---------- el vistazo desde la tarjeta ---------- */
  function mirar(z, si) {
    $$('[data-marca="' + z + '"]', raiz).forEach(function (g) { g.classList.toggle('mira', si); });
  }

  /* ---------- enganchar el dibujo ---------- */
  $$('.lm-zona', raiz).forEach(function (r) {
    var z = r.getAttribute('data-zona');
    r.addEventListener('click', function (e) { e.preventDefault(); alternar(z); });
    r.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); alternar(z); }
    });
    r.addEventListener('mouseenter', function () { mirar(z, true); });
    r.addEventListener('mouseleave', function () { mirar(z, false); });
    r.addEventListener('focus', function () { mirar(z, true); });
    r.addEventListener('blur', function () { mirar(z, false); });
  });

  /* ---------- enganchar las tarjetas ---------- */
  $$('.lm-card', raiz).forEach(function (c) {
    var z = c.getAttribute('data-zona');
    var b = $('.lm-card-sel', c);
    if (b) {
      /* type="button" a mano: si la pieza cae dentro de un formulario, un
         botón sin tipo lo envía a medias. */
      b.setAttribute('type', 'button');
      b.addEventListener('click', function (e) { e.preventDefault(); alternar(z); });
    }
    c.addEventListener('mouseenter', function () { mirar(z, true); });
    c.addEventListener('mouseleave', function () { mirar(z, false); });
  });

  /* ---------- quitar desde el resumen, y limpiar todo ---------- */
  raiz.addEventListener('click', function (e) {
    var q = e.target.closest ? e.target.closest('[data-quitar]') : null;
    if (q) { e.preventDefault(); desmarcar(q.getAttribute('data-quitar')); }
  });
  var borrar = $('[data-lm-limpiar]', raiz);
  if (borrar) borrar.addEventListener('click', function (e) { e.preventDefault(); limpiar(); });

  /* ---------- las tres vistas ---------- */
  var pestanas = $$('.lm-vista', raiz);
  function verVista(v) {
    // ojo: `svg.hidden = true` NO funciona. La propiedad `hidden` vive en
    // HTMLElement y un <svg> no lo es, así que asignarla solo cuelga una
    // propiedad suelta y el dibujo se queda como estaba, mudo. Hay que tocar
    // el atributo. Se ve idéntico en el código y no hace nada.
    var hay = $$('svg[data-vista]', raiz).some(function (s) {
      return s.getAttribute('data-vista') === v;
    });
    if (!hay) return;                 // una vista que no existe no apaga todas
    pestanas.forEach(function (b) {
      var si = b.getAttribute('data-vista') === v;
      b.setAttribute('aria-selected', si ? 'true' : 'false');
      b.setAttribute('tabindex', si ? '0' : '-1');
    });
    $$('svg[data-vista]', raiz).forEach(function (s) {
      if (s.getAttribute('data-vista') === v) s.removeAttribute('hidden');
      else s.setAttribute('hidden', '');
    });
  }
  pestanas.forEach(function (b, i) {
    b.addEventListener('click', function () { verVista(b.getAttribute('data-vista')); });
    // flechas entre pestañas, como manda el patrón de tablist
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = pestanas[(i + d + pestanas.length) % pestanas.length];
      verVista(n.getAttribute('data-vista'));
      n.focus();
    });
  });

  /* ---------- el encuadre: en teléfono la figura se acerca ----------
     Los rótulos viven fuera del cuerpo y piden aire a los lados; en pantalla
     angosta ese aire se cobra en altura de silueta, así que se cierra el
     encuadre y los rótulos se dibujan encima de la región. */
  (function () {
    var svgs = $$('svg[data-ancha]', raiz);
    if (!svgs.length || !window.matchMedia) return;
    var mq = window.matchMedia('(max-width:759.98px)');
    function ajustar() {
      svgs.forEach(function (s) {
        s.setAttribute('viewBox', s.getAttribute(mq.matches ? 'data-angosta' : 'data-ancha'));
      });
    }
    ajustar();
    if (mq.addEventListener) mq.addEventListener('change', ajustar);
    else if (mq.addListener) mq.addListener(ajustar);
  })();

  /* ---------- lo que traía puesto: primero la dirección, luego la sesión ---------- */
  (function () {
    var previo = new URLSearchParams(location.search).get('zonas');
    if (!previo) { try { previo = sessionStorage.getItem(LLAVE); } catch (e) { previo = null; } }
    if (previo) previo.split(',').forEach(marcar);
    pintar();
  })();

  /* ---------- la puerta de afuera ---------- */
  window.maniquiLiposser = {
    marcar: marcar, desmarcar: desmarcar, alternar: alternar, limpiar: limpiar,
    seleccionadas: function () { return elegidas.slice(); },
    claves: function () { return CLAVES.slice(); },
    nombre: nombre,
    vista: verVista
  };
})();
