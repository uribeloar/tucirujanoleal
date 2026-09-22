(() => {
  const header = document.querySelector('.cabecera');
  if (header && 'ResizeObserver' in window) new ResizeObserver(() => { document.documentElement.style.setProperty('--cabecera',Math.ceil(header.getBoundingClientRect().height)+'px'); }).observe(header);
  const menu = document.querySelector('.menu');
  const panel = document.querySelector('#menu-principal');
  if (menu && panel) {
    const close = (restoreFocus = false) => {
      panel.hidden = true;
      menu.setAttribute('aria-expanded', 'false');
      const symbol = menu.querySelector('.menu-simbolo');
      if (symbol) symbol.textContent = '+';
      if (restoreFocus) menu.focus();
    };
    menu.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      menu.setAttribute('aria-expanded', String(open));
      const symbol = menu.querySelector('.menu-simbolo');
      if (symbol) symbol.textContent = open ? '−' : '+';
      if (open) panel.querySelector('a')?.focus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) close(true);
    });
    document.addEventListener('click', event => {
      if (!panel.hidden && !panel.contains(event.target) && !menu.contains(event.target)) close();
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('a')) close();
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
