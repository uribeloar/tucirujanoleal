/* Guía virtual pública del Dr. Leal: conserva solo esta pestaña y solo pares de conversación. */
(function () {
  'use strict';
  var CLAVE = 'leal-asistente-v1';
  var TTL = 8 * 60 * 60 * 1000;
  var RUTA = '/tucirujanoleal/valoracion';
  function texto(n, valor) { n.textContent = valor; return n; }
  function crear(etiqueta, clase, valor) { var n = document.createElement(etiqueta); if (clase) n.className = clase; if (valor) texto(n, valor); return n; }
  function leer() { try { var r = JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); return r && Date.now() - r.fecha < TTL && Array.isArray(r.pares) ? r.pares.filter(function(p){return p && typeof p.u==='string' && typeof p.a==='string';}).slice(-6).map(function(p){return {u:p.u.slice(0,1000),a:p.a.slice(0,1000)};}) : []; } catch (_) { return []; } }
  function guardar(pares) { try { sessionStorage.setItem(CLAVE, JSON.stringify({ fecha: Date.now(), pares: pares.slice(-6).map(function (p) { return { u: p.u.slice(0, 1000), a: p.a.slice(0, 1000) }; }) })); } catch (_) {} }
  function iniciar() {
    if (document.querySelector('.lpa-bola')) return;
    var bola = crear('button', 'lpa-bola', 'Guía'); bola.type = 'button'; bola.setAttribute('aria-expanded', 'false'); bola.setAttribute('aria-controls', 'lpa-panel');
    var panel = crear('section', 'lpa-panel'); panel.id = 'lpa-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Guía virtual del Dr. Leal');
    var cab = crear('div', 'lpa-cab'); var titulo = crear('p', 'lpa-cab-titulo', 'Guía virtual'); var limpiar = crear('button', 'lpa-cab-boton', 'Limpiar'); limpiar.type = 'button'; var cerrar = crear('button', 'lpa-cab-boton', '×'); cerrar.type = 'button'; cerrar.setAttribute('aria-label','Cerrar guía'); cab.append(titulo, limpiar, cerrar);
    var mensajes = crear('div', 'lpa-msgs'); mensajes.setAttribute('aria-live', 'polite');
    var error = crear('p', 'lpa-error'); error.hidden = true; error.setAttribute('role', 'alert');
    var form = crear('form', 'lpa-pie'); var entrada = crear('input'); entrada.type = 'text'; entrada.maxLength = 1000; entrada.autocomplete = 'off'; entrada.setAttribute('aria-label', 'Pregunta para la guía virtual'); entrada.placeholder = 'Tu pregunta'; var enviar = crear('button', '', 'Enviar'); enviar.type = 'submit'; form.append(entrada, enviar);
    panel.append(cab, mensajes, error, form); document.body.append(bola, panel); var lugarGuia = document.querySelector('.valoracion .margen-editorial'); if (lugarGuia) lugarGuia.appendChild(bola);
    var pares = leer(); var ocupado = false;
    function abajo() { mensajes.scrollTop = mensajes.scrollHeight; }
    function mensaje(clase, valor) { var n = crear('p', 'lpa-m ' + clase, valor); if (clase === 'lpa-u') n.setAttribute('data-no-traducir',''); mensajes.appendChild(n); abajo(); return n; }
    function cta() { var cont = crear('div', 'lpa-chips'); var a = crear('a', 'lpa-chip', 'Valoración'); a.href = RUTA; cont.appendChild(a); mensajes.appendChild(cont); abajo(); }
    function mostrarHistorial() { mensajes.replaceChildren(); if (!pares.length) return; pares.forEach(function (p) { mensaje('lpa-u', p.u); mensaje('lpa-a', p.a); cta(); }); }
    function abrir() { panel.hidden = false; bola.setAttribute('aria-expanded', 'true'); mostrarHistorial(); entrada.focus(); }
    function cerrarPanel() { panel.hidden = true; bola.setAttribute('aria-expanded', 'false'); bola.focus(); }
    bola.addEventListener('click', function () { if (panel.hidden) abrir(); else cerrarPanel(); }); cerrar.addEventListener('click', cerrarPanel);
    limpiar.addEventListener('click', function () { pares = []; try { sessionStorage.removeItem(CLAVE); } catch (_) {} mostrarHistorial(); entrada.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); cerrarPanel(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var pregunta = entrada.value.trim().replace(/\s+/g, ' '); if (ocupado || !pregunta) return; ocupado = true; enviar.disabled = true; error.hidden = true; mensaje('lpa-u', pregunta); entrada.value = ''; var espera = mensaje('lpa-a lpa-pensando', '…');
      var control = new AbortController(); var reloj = setTimeout(function () { control.abort(); }, 8000);
      fetch('https://hostess.mx/api/asistente/liposser', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensaje: pregunta, pagina: location.pathname, idioma: window.LealIdioma?.activo || 'es' }), signal: control.signal })
        .then(function (r) { if (!r.ok) throw new Error('respuesta'); return r.text(); })
        .then(function (respuesta) { respuesta = respuesta.trim().slice(0, 1000); if (!respuesta) throw new Error('vacia'); espera.textContent = respuesta; espera.classList.remove('lpa-pensando'); pares.push({ u: pregunta, a: respuesta }); guardar(pares); cta(); })
        .catch(function () { espera.remove(); error.hidden = false; texto(error, 'Inténtalo otra vez.'); cta(); })
        .finally(function () { clearTimeout(reloj); ocupado = false; enviar.disabled = false; if (!panel.hidden) entrada.focus(); abajo(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
}());
