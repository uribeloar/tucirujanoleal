/* Capa viva Hostess — pinta los datos editables del sitio (horario, WhatsApp,
   avisos…) desde la base de Hostess, para que los cambios del cliente entren
   EN VIVO sin redeploy. Uso en el sitio:

     <script src="https://hostess.mx/capa-viva.js" data-sitio="mi-negocio" defer></script>

   y en el HTML, marcar los valores editables:

     <span data-hostess="horario">Lun–Vie 9am–7pm</span>

   Si la red falla o no hay datos, la página se queda con lo que trae el HTML
   (los valores del build siguen siendo el respaldo). */
(function () {
  var s = document.currentScript;
  var sitio = s && s.getAttribute("data-sitio");
  if (!sitio) return;
  var src = (s && s.getAttribute("src")) || "";
  var base = src.indexOf("/capa-viva.js") > 0 ? src.split("/capa-viva.js")[0] : "";

  /* Aplica el reacomodo del dueño: `orden-<grupo>` = lista de ids en orden,
     `oculto-<id>` = "1" para esconder. Corre para TODO visitante, así ven la
     página como el dueño la dejó. No rompe el flujo responsive: reordena los
     hijos y esconde con display:none (nada de posiciones absolutas). */
  function aplicarLayout(datos) {
    Object.keys(datos).forEach(function (campo) {
      if (campo.indexOf("orden-") === 0) {
        var g = campo.slice(6);
        var cont = document.querySelector('[data-hostess-group="' + g + '"]');
        if (!cont) return;
        String(datos[campo])
          .split(",")
          .map(function (x) { return x.trim(); })
          .filter(Boolean)
          .forEach(function (id) {
            var el = cont.querySelector('[data-hostess-item="' + id + '"]');
            if (el && el.parentNode === cont) cont.appendChild(el);
          });
      } else if (campo.indexOf("oculto-") === 0) {
        var it = document.querySelector('[data-hostess-item="' + campo.slice(7) + '"]');
        if (it) it.style.display = String(datos[campo]) === "1" ? "none" : "";
      }
    });
  }

  /* El WhatsApp se guarda en dígitos (5213331234567) porque así lo pide el
     enlace de wa.me, pero en pantalla se lee como lo escribe la gente. */
  function telLegible(valor) {
    var d = String(valor).replace(/\D/g, "");
    if (d.length === 13 && d.slice(0, 3) === "521") d = d.slice(3);
    else if (d.length === 12 && d.slice(0, 2) === "52") d = d.slice(2);
    if (d.length !== 10) return String(valor);
    return d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6);
  }

  function pintar(datos) {
    Object.keys(datos).forEach(function (campo) {
      var els = document.querySelectorAll('[data-hostess="' + campo + '"]');
      var texto = campo === "whatsapp" ? telLegible(datos[campo]) : String(datos[campo]);
      for (var i = 0; i < els.length; i++) {
        els[i].textContent = texto;
        /* Un campo vacío no debe dejar una franja en blanco: el que lleve
           data-hostess-ocultar-vacio desaparece hasta que tenga contenido. */
        if (els[i].hasAttribute("data-hostess-ocultar-vacio")) {
          var caja = els[i].closest("[data-hostess-caja]") || els[i];
          caja.hidden = texto.trim() === "";
        }
      }
    });
    aplicarLayout(datos);
    if (datos.whatsapp) {
      var dig = String(datos.whatsapp).replace(/\D/g, "");
      if (dig.length === 10) dig = "52" + dig;
      if (dig.length >= 11) {
        var links = document.querySelectorAll('a[href*="wa.me/"], a[href*="api.whatsapp.com"]');
        for (var j = 0; j < links.length; j++) {
          /* Hay páginas con DOS números: el del cliente y el de Hostess (el
             "quiero una página así"). Cambiarlos todos mandaría a los clientes
             del cliente a nuestro chat. El enlace que no se debe tocar se marca
             en el HTML con data-hostess-wa="fijo". */
          if (links[j].getAttribute("data-hostess-wa") === "fijo") continue;
          links[j].href = links[j].href
            .replace(/wa\.me\/\d+/, "wa.me/" + dig)
            .replace(/phone=\d+/, "phone=" + dig);
        }
      }
    }
  }

  function arrancar() {
    /* El borde cachea 30s y sirve hasta 5 min de copia vieja mientras revalida:
       sin esto, el dueño cambia un dato y el visitante siguiente ve lo de antes.
       La marca del minuto rompe el empate —todos los que entran en ese minuto
       comparten la misma copia, así que se sigue cacheando— y garantiza que lo
       que se ve nunca tiene más de un minuto, que es lo que se le promete. */
    var minuto = Math.floor(new Date().getTime() / 60000);
    fetch(base + "/api/sitios-datos?sitio=" + encodeURIComponent(sitio) + "&m=" + minuto)
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.datos) pintar(d.datos); })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
