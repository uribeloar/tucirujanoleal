/* Lote E · 22-sep-2026 — antes y después a un clic (P-12).
   Visor a pantalla completa para las fichas de #antes-despues: tocar la foto la abre
   en grande, con flechas / teclado / dedo para moverse entre todas las de la página,
   y se cierra con Escape o el botón. Cero filtro sobre la imagen, cero texto encima. */
(function(){
  'use strict';

  function listo(fn){
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn); }
  }

  listo(function(){
    var esIngles = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('en') === 0;
    var TXT = esIngles
      ? { cerrar:'Close', anterior:'Previous photo', siguiente:'Next photo', de:'of' }
      : { cerrar:'Cerrar', anterior:'Foto anterior', siguiente:'Foto siguiente', de:'de' };

    var grupos = document.querySelectorAll('#antes-despues .fichas-procedimientos');
    if(!grupos.length) return;

    var fotos = [];
    grupos.forEach(function(grupo){
      var figuras = grupo.querySelectorAll('figure.documento');
      figuras.forEach(function(fig){
        var img = fig.querySelector('img');
        if(!img) return;
        var cap = fig.querySelector('figcaption');
        var etiqueta = cap ? cap.textContent.trim() : '';
        var idx = fotos.length;
        fotos.push({ src: img.currentSrc || img.src, alt: img.getAttribute('alt') || '', etiqueta: etiqueta });

        fig.classList.add('lb-disparador');
        fig.setAttribute('tabindex', '0');
        fig.setAttribute('role', 'button');
        var nombreAccesible = etiqueta ? (etiqueta + (img.alt ? ': ' + img.alt : '')) : (img.alt || '');
        if(nombreAccesible){ fig.setAttribute('aria-label', nombreAccesible); }

        fig.addEventListener('click', function(){ abrir(idx); });
        fig.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
            e.preventDefault();
            abrir(idx);
          }
        });
      });
    });

    if(!fotos.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'lb-galeria';
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="lb-velo" data-lb-cerrar></div>' +
      '<button type="button" class="lb-cerrar" data-lb-cerrar aria-label="' + TXT.cerrar + '">&times;</button>' +
      '<button type="button" class="lb-flecha lb-flecha--prev" data-lb-prev aria-label="' + TXT.anterior + '">&#8249;</button>' +
      '<button type="button" class="lb-flecha lb-flecha--next" data-lb-next aria-label="' + TXT.siguiente + '">&#8250;</button>' +
      '<figure class="lb-marco"><img class="lb-foto" src="" alt=""></figure>' +
      '<p class="lb-pie"><span class="lb-etiqueta"></span><span class="lb-contador"></span></p>';
    document.body.appendChild(overlay);

    var elFoto = overlay.querySelector('.lb-foto');
    var elEtiqueta = overlay.querySelector('.lb-etiqueta');
    var elContador = overlay.querySelector('.lb-contador');
    var btnCerrar = overlay.querySelector('.lb-cerrar');
    var btnPrev = overlay.querySelector('[data-lb-prev]');
    var btnNext = overlay.querySelector('[data-lb-next]');

    var actual = 0;
    var quienAbrio = null;

    function pintar(){
      var f = fotos[actual];
      elFoto.src = f.src;
      elFoto.alt = f.alt;
      elEtiqueta.textContent = f.etiqueta;
      elContador.textContent = (actual + 1) + ' ' + TXT.de + ' ' + fotos.length;
    }

    function abrir(idx){
      actual = idx;
      quienAbrio = document.activeElement;
      pintar();
      overlay.removeAttribute('hidden');
      document.body.classList.add('lb-bloqueo');
      btnCerrar.focus();
    }

    function cerrar(){
      if(overlay.hasAttribute('hidden')) return;
      overlay.setAttribute('hidden', '');
      document.body.classList.remove('lb-bloqueo');
      if(quienAbrio && typeof quienAbrio.focus === 'function'){ quienAbrio.focus(); }
    }

    function anterior(){ actual = (actual - 1 + fotos.length) % fotos.length; pintar(); }
    function siguiente(){ actual = (actual + 1) % fotos.length; pintar(); }

    btnCerrar.addEventListener('click', cerrar);
    btnPrev.addEventListener('click', anterior);
    btnNext.addEventListener('click', siguiente);
    overlay.querySelector('.lb-velo').addEventListener('click', cerrar);

    document.addEventListener('keydown', function(e){
      if(overlay.hasAttribute('hidden')) return;
      if(e.key === 'Escape'){ cerrar(); }
      else if(e.key === 'ArrowLeft'){ anterior(); }
      else if(e.key === 'ArrowRight'){ siguiente(); }
    });

    var tx0 = null, ty0 = null;
    overlay.addEventListener('touchstart', function(e){
      if(e.touches.length !== 1) return;
      tx0 = e.touches[0].clientX;
      ty0 = e.touches[0].clientY;
    }, { passive:true });
    overlay.addEventListener('touchend', function(e){
      if(tx0 === null) return;
      var dx = e.changedTouches[0].clientX - tx0;
      var dy = e.changedTouches[0].clientY - ty0;
      tx0 = null; ty0 = null;
      if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
        if(dx < 0){ siguiente(); } else { anterior(); }
      }
    }, { passive:true });
  });
})();
