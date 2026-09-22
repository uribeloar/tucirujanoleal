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
    var enIngles = (document.documentElement.lang || '').slice(0, 2) === 'en' || (window.LealIdioma && window.LealIdioma.activo === 'en');
    var wa = crear('a', 'lpa-wa', enIngles ? 'Message me on WhatsApp' : 'Escribirme por WhatsApp'); var textoWa = function () { return 'https://wa.me/523323505078?text=' + encodeURIComponent(((document.documentElement.lang || '').slice(0, 2) === 'en' || (window.LealIdioma && window.LealIdioma.activo === 'en')) ? "Good morning, Dr. Leal. I'm coming from your website. I'd like to book a consultation and tell you what I'm looking for." : 'Buen d\u00eda, doctor Leal. Vengo de su sitio. Quisiera reservar una valoraci\u00f3n y contarle qu\u00e9 busco.'); }; wa.href = textoWa(); document.addEventListener('leal:idioma', function () { wa.href = textoWa(); }); wa.target = '_blank'; wa.rel = 'noopener'; wa.setAttribute('data-no-traducir', ''); wa.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"></path></svg>');
    panel.append(cab, mensajes, error, form, wa); document.body.append(bola, panel); var lugarGuia = document.querySelector('.valoracion .margen-editorial'); if (lugarGuia) lugarGuia.appendChild(bola);
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
