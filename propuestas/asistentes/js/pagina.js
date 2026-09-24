/* Recorrido · Asistentes Liposser — el scroll arma la página (GSAP ScrollTrigger); sin GSAP o con movimiento reducido, todo queda en su estado final. */
(function(){
  var root=document.documentElement, body=document.body;
  var reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* la barrita de arriba: 2 px que llenan y se apagan */
  var ritual=document.getElementById('ritual');
  if(ritual){ requestAnimationFrame(function(){ ritual.style.width='100%'; setTimeout(function(){ ritual.style.opacity='0'; },900); }); }

  function estadoFinal(){
    root.classList.add('sin-animar'); body.classList.add('fin');
    document.querySelectorAll('.paso').forEach(function(p){ p.classList.add('on'); });
    document.querySelectorAll('[data-medidor]').forEach(function(m){ m.style.setProperty('--lleno',(m.getAttribute('data-medidor')||'0')+'%'); });
    document.querySelectorAll('[data-cuenta]').forEach(function(o){ o.textContent=fmt(o,+o.getAttribute('data-cuenta')); });
  }
  function fmt(o,v){
    var dec=+(o.getAttribute('data-dec')||0), pre=o.getAttribute('data-prefijo')||'', suf=o.getAttribute('data-sufijo')||'';
    return pre+(dec?v.toFixed(dec):Math.round(v)).toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;
  }

  /* el «+»: abre y cierra con altura animada, avisa al recorrido */
  function abrirMas(){
    document.querySelectorAll('details.mas').forEach(function(d){
      var s=d.querySelector('summary'), c=d.querySelector('.mas-in'); if(!s||!c||d.__mas) return; d.__mas=true;
      s.setAttribute('aria-expanded',d.open?'true':'false');
      s.addEventListener('click',function(e){
        e.preventDefault();
        var abre=!d.open;
        if(reduce){ d.open=abre; s.setAttribute('aria-expanded',abre?'true':'false'); refresca(); return; }
        if(abre){
          d.open=true; c.style.overflow='hidden'; c.style.height='0px'; c.style.opacity='0';
          var h=c.scrollHeight; c.style.transition='height .28s cubic-bezier(.2,.7,.2,1), opacity .28s ease';
          requestAnimationFrame(function(){ c.style.height=h+'px'; c.style.opacity='1'; });
          setTimeout(function(){ c.style.height=''; c.style.overflow=''; c.style.transition=''; refresca(); },300);
        } else {
          var h0=c.scrollHeight; c.style.overflow='hidden'; c.style.height=h0+'px'; c.style.transition='height .24s cubic-bezier(.2,.7,.2,1), opacity .2s ease';
          requestAnimationFrame(function(){ c.style.height='0px'; c.style.opacity='0'; });
          setTimeout(function(){ d.open=false; c.style.height=''; c.style.overflow=''; c.style.opacity=''; c.style.transition=''; refresca(); },260);
        }
        s.setAttribute('aria-expanded',abre?'true':'false');
      });
    });
  }
  function refresca(){ if(window.ScrollTrigger){ ScrollTrigger.refresh(); } }
  window.abrirMas=abrirMas; abrirMas();

  if(reduce || !window.gsap || !window.ScrollTrigger){ estadoFinal(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var desde={sube:{y:40,opacity:0},izq:{x:-60,opacity:0},der:{x:60,opacity:0},escala:{scale:.82,opacity:0},luz:{opacity:0},traza:{strokeDashoffset:1}};
  var hasta={sube:{y:0,opacity:1},izq:{x:0,opacity:1},der:{x:0,opacity:1},escala:{scale:1,opacity:1},luz:{opacity:1},traza:{strokeDashoffset:0}};

  /* trazos del mapa: se dibujan con el scroll */
  document.querySelectorAll('[data-arma="traza"]').forEach(function(p){
    try{ var L=p.getTotalLength(); p.style.strokeDasharray=L; p.style.strokeDashoffset=L; p.__L=L; }catch(e){}
  });
  function d0(t,el){ var o=Object.assign({},desde[t]||desde.sube); if(t==='traza'&&el.__L){ o.strokeDashoffset=el.__L; } return o; }
  function d1(t){ return Object.assign({},hasta[t]||hasta.sube); }

  /* grupos: una sola línea de tiempo por grupo, pieza tras pieza */
  document.querySelectorAll('[data-arma-grupo]').forEach(function(g){
    var piezas=g.querySelectorAll('[data-arma]'); if(!piezas.length) return;
    var tl=gsap.timeline({scrollTrigger:{trigger:g,start:g.getAttribute('data-inicio')||'top 78%',end:g.getAttribute('data-fin')||'bottom 55%',scrub:.6}});
    piezas.forEach(function(p,i){
      var t=p.getAttribute('data-arma')||'sube'; p.setAttribute('data-armado','');
      tl.fromTo(p,d0(t,p),Object.assign(d1(t),{ease:'none',duration:1}),i===0?0:'>-0.35');
    });
  });
  /* sueltas */
  document.querySelectorAll('[data-arma]:not([data-armado])').forEach(function(p){
    var t=p.getAttribute('data-arma')||'sube';
    gsap.fromTo(p,d0(t,p),Object.assign(d1(t),{ease:'none',scrollTrigger:{trigger:p,start:'top 92%',end:'top 60%',scrub:.6}}));
  });
  /* contadores */
  document.querySelectorAll('[data-cuenta]').forEach(function(o){
    var fin=+o.getAttribute('data-cuenta'), obj={v:0};
    var r=o.getBoundingClientRect();
    function corre(){ gsap.to(obj,{v:fin,duration:1.6,ease:'power3.out',onUpdate:function(){ o.textContent=fmt(o,obj.v); }}); }
    if(r.top<innerHeight*0.95 && r.bottom>0){ corre(); }
    else { ScrollTrigger.create({trigger:o,start:'top 88%',once:true,onEnter:corre}); }
  });
  /* medidores */
  document.querySelectorAll('[data-medidor]').forEach(function(m){
    var v=+m.getAttribute('data-medidor'), obj={p:0};
    gsap.to(obj,{p:v,duration:1.4,ease:'power2.out',scrollTrigger:{trigger:m,start:'top 90%',once:true},onUpdate:function(){ m.style.setProperty('--lleno',obj.p.toFixed(1)+'%'); }});
  });
  /* pasos */
  document.querySelectorAll('.paso').forEach(function(p){
    ScrollTrigger.create({trigger:p,start:'top 82%',onEnter:function(){ p.classList.add('on'); },onLeaveBack:function(){ p.classList.remove('on'); }});
  });
  /* menú: se prende el apartado que se está viendo (medido en cada scroll, sin depender de posiciones guardadas) */
  var links=[].slice.call(document.querySelectorAll('.nav a[href^="#"]')).map(function(a){ return {a:a,sec:document.querySelector(a.getAttribute('href'))}; }).filter(function(x){ return x.sec; });
  var navTick=false;
  function pintaNav(){
    navTick=false; var linea=innerHeight*0.4, on=null;
    links.forEach(function(x){ var r=x.sec.getBoundingClientRect(); if(r.top<=linea && r.bottom>linea){ on=x; } });
    links.forEach(function(x){ x.a.classList.toggle('on',x===on); });
    if(on && !on.a.__visto){ on.a.__visto=true; var nv=on.a.parentElement; if(nv && nv.scrollWidth>nv.clientWidth){ var dest=on.a.offsetLeft-(nv.clientWidth-on.a.offsetWidth)/2; try{ nv.scrollTo({left:Math.max(0,dest),behavior:'smooth'}); }catch(e){ nv.scrollLeft=Math.max(0,dest); } } }
  }
  window.addEventListener('scroll',function(){ if(!navTick){ navTick=true; requestAnimationFrame(pintaNav); } },{passive:true});
  pintaNav();
  /* las posiciones se vuelven a medir cuando llegan letras e imágenes, y una vez más al asentarse la página */
  function remide(){ ScrollTrigger.refresh(); pintaNav(); }
  window.addEventListener('load',function(){ remide(); setTimeout(remide,900); });
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(remide); }
  document.querySelectorAll('img').forEach(function(im){ if(!im.complete){ im.addEventListener('load',remide,{once:true}); } });
  var rt=0; window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(remide,150); });
})();
