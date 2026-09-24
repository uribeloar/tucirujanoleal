/* Portada · Asistentes Liposser — conversaciones que convergen en un solo cerebro.
   Lienzo propio, sin librerías. Ciclo de 20 s; con ?quieto=1 o movimiento reducido, un solo cuadro. */
(function(){
  var c=document.getElementById('portada-fondo'); if(!c) return;
  var h=c.parentNode, tx=h.querySelector('.texto'), ctx=c.getContext('2d');
  var T=20000, quieto=/[?&]quieto=1/.test(location.search) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var S=7; function rnd(){ S=(S*16807)%2147483647; return (S-1)/2147483646; }
  var W=0,H=0,DPR=1,Cx=0,Cy=0,R=0,B=null,nodos=[],g=null,rg=null,movil=false;

  function medir(){
    var r=h.getBoundingClientRect(), t=tx?tx.getBoundingClientRect():null;
    W=Math.max(320,Math.round(r.width)); H=Math.max(400,Math.round(r.height));
    B=t?{x:t.left-r.left,y:t.top-r.top,w:t.width,h:t.height}:null;
    movil=W<760;
  }
  function F(px,py){ /* atenúa cerca del texto para que se lea */
    if(!B) return 1;
    var dx=Math.max(B.x-px,0,px-(B.x+B.w)), dy=Math.max(B.y-py,0,py-(B.y+B.h)), d=Math.sqrt(dx*dx+dy*dy);
    return d>150?1:0.12+0.88*(d/150);
  }
  function arma(){
    medir();
    DPR=Math.min(2,window.devicePixelRatio||1);
    c.width=W*DPR; c.height=H*DPR; c.style.width=W+'px'; c.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    if(movil){ Cx=W*0.56; Cy=Math.max(96,(B?B.y:H*0.4)*0.5); R=34; }
    else { Cx=W*0.72; Cy=H*0.38; R=46; }
    g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1A1D24'); g.addColorStop(1,'#21252E');
    rg=ctx.createRadialGradient(Cx,Cy,0,Cx,Cy,Math.max(W,H)*0.55);
    rg.addColorStop(0,'rgba(201,123,46,.14)'); rg.addColorStop(.35,'rgba(62,142,165,.07)'); rg.addColorStop(1,'rgba(26,29,36,0)');
    siembra();
  }
  function siembra(){
    S=7; nodos=[];
    var n=movil?16:30, intentos=0;
    while(nodos.length<n && intentos<800){
      intentos++;
      var x=rnd()*W, y=rnd()*H;
      var d=Math.hypot(x-Cx,y-Cy); if(d<R*3.2) continue;
      if(B && x>B.x-30 && x<B.x+B.w+30 && y>B.y-20 && y<B.y+B.h+20 && rnd()<0.85) continue;
      var ok=true; for(var i=0;i<nodos.length;i++){ if(Math.hypot(x-nodos[i].x,y-nodos[i].y)<(movil?70:96)){ ok=false; break; } }
      if(!ok) continue;
      var w=movil?34+rnd()*26:44+rnd()*40;
      nodos.push({x:x,y:y,w:w,h:w*0.58,fase:rnd(),vel:0.35+rnd()*0.9,lado:rnd()<0.5?-1:1,tinte:rnd()<0.3?1:0,curva:(rnd()-0.5)*0.8});
    }
  }
  function burbuja(x,y,w,hh,lado,a,tinte){
    var r=Math.min(10,hh*0.45);
    ctx.beginPath();
    ctx.moveTo(x-w/2+r,y-hh/2); ctx.lineTo(x+w/2-r,y-hh/2); ctx.quadraticCurveTo(x+w/2,y-hh/2,x+w/2,y-hh/2+r);
    ctx.lineTo(x+w/2,y+hh/2-r); ctx.quadraticCurveTo(x+w/2,y+hh/2,x+w/2-r,y+hh/2);
    if(lado>0){ ctx.lineTo(x+w/2-r-2,y+hh/2); ctx.lineTo(x+w/2-r-6,y+hh/2+7); ctx.lineTo(x+w/2-r-12,y+hh/2); }
    ctx.lineTo(x-w/2+r,y+hh/2); ctx.quadraticCurveTo(x-w/2,y+hh/2,x-w/2,y+hh/2-r);
    if(lado<0){ ctx.lineTo(x-w/2,y+hh/2-r); }
    ctx.lineTo(x-w/2,y-hh/2+r); ctx.quadraticCurveTo(x-w/2,y-hh/2,x-w/2+r,y-hh/2); ctx.closePath();
    ctx.fillStyle=tinte?'rgba(62,142,165,'+(0.16*a)+')':'rgba(42,47,58,'+(0.9*a)+')';
    ctx.strokeStyle=tinte?'rgba(62,142,165,'+(0.55*a)+')':'rgba(152,160,173,'+(0.45*a)+')';
    ctx.lineWidth=1; ctx.fill(); ctx.stroke();
    /* renglones dentro de la burbuja: la conversación, sin palabras */
    ctx.strokeStyle='rgba(232,234,237,'+(0.32*a)+')'; ctx.lineWidth=2; ctx.lineCap='round';
    var y1=y-hh*0.16, y2=y+hh*0.16, ancho=w-16;
    ctx.beginPath(); ctx.moveTo(x-ancho/2,y1); ctx.lineTo(x+ancho/2,y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-ancho/2,y2); ctx.lineTo(x-ancho/2+ancho*0.62,y2); ctx.stroke();
  }
  function pinta(t){
    var u=(t%T)/T;
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    /* líneas hacia el cerebro, con un pulso que viaja */
    for(var i=0;i<nodos.length;i++){
      var n=nodos[i], a=F(n.x,n.y);
      var mx=(n.x+Cx)/2 + (n.y-Cy)*n.curva, my=(n.y+Cy)/2 - (n.x-Cx)*n.curva;
      ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.quadraticCurveTo(mx,my,Cx,Cy);
      ctx.strokeStyle='rgba(152,160,173,'+(0.16*a)+')'; ctx.lineWidth=1; ctx.stroke();
      var p=quieto?0.55:((u*n.vel+n.fase)%1);
      var qx=(1-p)*(1-p)*n.x+2*(1-p)*p*mx+p*p*Cx, qy=(1-p)*(1-p)*n.y+2*(1-p)*p*my+p*p*Cy;
      var brillo=Math.sin(p*Math.PI);
      ctx.beginPath(); ctx.arc(qx,qy,2.2,0,Math.PI*2);
      ctx.fillStyle=(n.tinte?'rgba(62,142,165,':'rgba(201,123,46,')+(0.85*brillo*a)+')'; ctx.fill();
      var flot=quieto?0:Math.sin((u*2+n.fase)*Math.PI*2)*3;
      burbuja(n.x,n.y+flot,n.w,n.h,n.lado,a,n.tinte);
    }
    /* el cerebro: un solo núcleo, con latido */
    var lat=quieto?0:Math.sin(u*Math.PI*2*3)*0.5+0.5;
    var halo=ctx.createRadialGradient(Cx,Cy,R*0.4,Cx,Cy,R*(2.6+lat*0.5));
    halo.addColorStop(0,'rgba(201,123,46,.28)'); halo.addColorStop(1,'rgba(201,123,46,0)');
    ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(Cx,Cy,R*3.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(Cx,Cy,R*(1.55+lat*0.08),0,Math.PI*2); ctx.strokeStyle='rgba(201,123,46,.28)'; ctx.lineWidth=1; ctx.stroke();
    var nuc=ctx.createRadialGradient(Cx-R*0.3,Cy-R*0.3,2,Cx,Cy,R);
    nuc.addColorStop(0,'#D98C42'); nuc.addColorStop(1,'#8F5220');
    ctx.beginPath(); ctx.arc(Cx,Cy,R,0,Math.PI*2); ctx.fillStyle=nuc; ctx.fill();
    ctx.strokeStyle='rgba(232,234,237,.35)'; ctx.lineWidth=1.2; ctx.stroke();
    /* dentro del núcleo, tres renglones: la misma memoria para todos */
    ctx.strokeStyle='rgba(26,29,36,.55)'; ctx.lineWidth=2.4; ctx.lineCap='round';
    [[-0.5,-0.28,0.5],[-0.5,0,0.3],[-0.5,0.28,0.55]].forEach(function(l){
      ctx.beginPath(); ctx.moveTo(Cx+l[0]*R,Cy+l[1]*R); ctx.lineTo(Cx+(l[0]+l[2]+0.45)*R*0.9,Cy+l[1]*R); ctx.stroke();
    });
  }
  var raf=0, visible=true, t0=performance.now();
  function paso(t){ if(visible){ pinta(t-t0); } raf=requestAnimationFrame(paso); }
  arma(); pinta(0);
  if(!quieto){
    raf=requestAnimationFrame(paso);
    document.addEventListener('visibilitychange',function(){ visible=!document.hidden; });
  }
  var rt=0; window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ arma(); pinta(performance.now()-t0); },120); });
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(function(){ arma(); pinta(performance.now()-t0); }); }
})();
