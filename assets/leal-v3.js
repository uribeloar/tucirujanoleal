(() => {
  const header = document.querySelector('.cabecera');
  if (header && 'ResizeObserver' in window) new ResizeObserver(() => { document.documentElement.style.setProperty('--cabecera',Math.ceil(header.getBoundingClientRect().height)+'px'); }).observe(header);
  const menu = document.querySelector('.menu');
  const panel = document.querySelector('#menu-principal');
  const velo = document.querySelector('.velo-menu');
  if (menu && panel) {
    let cierre = null;
    const abrir = () => {
      clearTimeout(cierre);
      panel.hidden = false;
      if (velo) velo.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        panel.classList.add('abierto');
        if (velo) velo.classList.add('abierto');
      });
      menu.setAttribute('aria-expanded', 'true');
      panel.querySelector('.cerrar-menu')?.focus();
    };
    const close = (restoreFocus = false) => {
      panel.classList.remove('abierto');
      if (velo) velo.classList.remove('abierto');
      menu.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      clearTimeout(cierre);
      cierre = setTimeout(() => { panel.hidden = true; if (velo) velo.hidden = true; }, 340);
      if (restoreFocus) menu.focus();
    };
    menu.addEventListener('click', () => { panel.hidden ? abrir() : close(); });
    panel.querySelector('.cerrar-menu')?.addEventListener('click', () => close(true));
    if (velo) velo.addEventListener('click', () => close());
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) close(true);
    });
    panel.addEventListener('click', event => {
      const rama = event.target.closest('.abre-rama');
      if (rama) {
        const sub = document.getElementById(rama.getAttribute('aria-controls'));
        const abierta = rama.getAttribute('aria-expanded') === 'true';
        rama.setAttribute('aria-expanded', String(!abierta));
        if (sub) sub.hidden = abierta;
        return;
      }
      if (event.target.closest('a')) close();
    });
    panel.querySelectorAll('.rama').forEach(rama => {
      if (!rama.querySelector('a[aria-current="page"]')) return;
      const boton = rama.querySelector('.abre-rama');
      const sub = rama.querySelector('.sub-menu');
      if (boton && sub) { boton.setAttribute('aria-expanded', 'true'); sub.hidden = false; }
    });
  }

  const video = document.querySelector('#portada');
  const figure = document.querySelector('.retrato-film');
  const control = document.querySelector('.control-recorrido');
  if (!video || !figure || !control) return;
  const label = control.querySelector('.texto-control');
  const words = { play: 'Ver recorrido', pause: 'Pausar', replay: 'Volver a ver', pending: 'El video sigue pendiente.' };
  let finished = false;
  const update = () => {
    const active = !video.paused && !video.ended;
    control.setAttribute('aria-pressed', String(active));
    if (label) label.textContent = active ? words.pause : finished ? words.replay : words.play;
  };
  const failed = () => {
    control.disabled = false;
    figure.classList.remove('reproduciendo');
    const status = figure.querySelector('.estado-recorrido');
    if (status) status.textContent = words.pending;
    update();
  };
  control.addEventListener('click', async () => {
    if (!video.paused) { video.pause(); return; }
    const status = figure.querySelector('.estado-recorrido');
    if (status) status.textContent = '';
    if (finished) video.currentTime = 0;
    finished = false;
    control.disabled = true;
    try {
      await video.play();
      figure.classList.add('reproduciendo');
      update();
    } catch { failed(); }
    finally { control.disabled = false; }
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('error', failed);
  video.addEventListener('ended', () => {
    finished = true;
    figure.classList.remove('reproduciendo');
    update();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) video.pause();
    }, { threshold: 0 });
    observer.observe(figure);
  }
  update();
})();
