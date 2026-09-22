/* Boton flotante del Dr. Alejandro Leal: WhatsApp, y nada mas.
   Ninguna pagina lo trae escrito; este guion lo inyecta una sola vez.
   El de Instagram salio el 22-sep-2026 (P-08): flotando solo se quedan
   el WhatsApp y la Guia. Instagram sigue vivo, pero en el pie.
   Y desde P-10 (22-sep-2026) abre con el mensaje ya escrito, en el idioma
   que este viendo la persona; si cambia de idioma sin recargar, el enlace
   se endereza solo al oir `leal:idioma`. */
(function () {
  'use strict';
  var WA = 'https://wa.me/523323505078';
  // P-10 · el mensaje que eligio Pablo (la opcion C), caracter por caracter.
  var TEXTO_ES = 'Buen d\u00eda, doctor Leal. Vengo de su sitio. Quisiera reservar una valoraci\u00f3n y contarle qu\u00e9 busco.';
  var TEXTO_EN = "Good morning, Dr. Leal. I'm coming from your website. I'd like to book a consultation and tell you what I'm looking for.";
  function enIngles() {
    return (document.documentElement.lang || '').slice(0, 2) === 'en' ||
           (window.LealIdioma && window.LealIdioma.activo === 'en');
  }
  function enlace() {
    return WA + '?text=' + encodeURIComponent(enIngles() ? TEXTO_EN : TEXTO_ES);
  }
  // El mensaje tiene que hablar el idioma que la persona esta LEYENDO, no el de la
  // direccion: quien ya eligio ingles ve la pagina en ingles aunque la URL siga
  // siendo la espanola (idioma.js recuerda la eleccion). Por eso los enlaces que
  // vienen escritos en el HTML tambien se enderezan. Solo se tocan los que traen
  // uno de estos dos textos o ninguno: el de la confirmacion de valoracion lleva
  // el mensaje que escribio la propia paciente y ese no se toca jamas.
  function enderezar() {
    var bueno = enlace();
    var links = document.querySelectorAll('a[href^="' + WA + '"]');
    for (var i = 0; i < links.length; i++) {
      var t = '';
      try { t = new URL(links[i].href).searchParams.get('text') || ''; } catch (e) { continue; }
      if (t === '' || t === TEXTO_ES || t === TEXTO_EN) links[i].href = bueno;
    }
  }
  document.addEventListener('leal:idioma', enderezar);
  window.addEventListener('load', enderezar);
  var SVG_WA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"></path></svg>';
  function boton(clase, url, etiqueta, dibujo) {
    var a = document.createElement('a');
    a.className = clase;
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', etiqueta);
    a.innerHTML = dibujo;
    return a;
  }
  function iniciar() {
    if (document.querySelector('.flota-leal')) return;
    var caja = document.createElement('div');
    caja.className = 'flota-leal';
    caja.setAttribute('data-no-traducir', '');
    caja.append(boton('flota-wa', enlace(), 'WhatsApp', SVG_WA));
    document.body.appendChild(caja);
    enderezar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
}());
