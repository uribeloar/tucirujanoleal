(() => {
  const form = document.querySelector('#filtro-valoracion');
  if (!form) return;
  const steps = [...form.querySelectorAll('fieldset')];
  const next = form.querySelector('[data-siguiente]');
  const back = form.querySelector('[data-volver]');
  const send = form.querySelector('[type=submit]');
  const error = form.querySelector('.filtro-error');
  const progress = form.querySelector('.filtro-progreso');
  const messages = { review:'Revisa los campos marcados.', pending:'El envío sigue pendiente. Inténtalo otra vez.' };
  let current = 0;
  let sending = false;
  let ready = false;
  next.disabled = true;
  send.disabled = true;
  form.noValidate = true;
  next.hidden = false;
  progress.hidden = false;
  const show = (index, focus = true) => {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== current; });
    back.hidden = current === 0;
    next.hidden = current === steps.length - 1 || Boolean(steps[current].querySelector('.filtro-opciones'));
    send.hidden = current !== steps.length - 1;
    progress.setAttribute('aria-valuenow', String(current + 1));
    progress.querySelectorAll('span').forEach((bar, i) => bar.toggleAttribute('data-completo', i <= current));
    error.textContent = '';
    if (focus) {
      const legend = steps[current].querySelector('legend');
      legend.tabIndex = -1;
      legend.focus({ preventScroll:true });
      form.scrollIntoView({ block:'start', behavior:'instant' });
    }
  };
  const fields = step => [...step.querySelectorAll('input')].filter(input => input.type !== 'radio' && input.type !== 'checkbox' && input.type !== 'hidden');
  steps.forEach(step => { const list = fields(step); list.forEach((input, i) => input.setAttribute('enterkeyhint', i === list.length - 1 ? 'go' : 'next')); });
  const validate = step => {
    let first;
    for (const input of step.querySelectorAll('input')) {
      let valid = input.checkValidity();
      if (input.type !== 'radio' && input.type !== 'checkbox' && input.required) valid = valid && input.value.trim().length >= 2;
      if (input.name === 'whatsapp') valid = /^[+\d\s().-]+$/.test(input.value) && /^[0-9]{7,15}$/.test(input.value.replace(/\D/g,''));
      input.toggleAttribute('aria-invalid', !valid);
      if (!valid) { input.setAttribute('aria-invalid','true'); first ||= input; }
    }
    if (first) {
      error.textContent = messages.review;
      first.focus();
      return false;
    }
    return true;
  };
  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    if (event.target.type === 'radio') form.querySelectorAll(`input[name="${event.target.name}"]`).forEach(input => input.removeAttribute('aria-invalid'));
    error.textContent = '';
  });
  const advance = () => { if (ready && validate(steps[current])) show(current + 1); };
  let pointed = false;
  form.addEventListener('pointerdown', () => { pointed = true; });
  form.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Spacebar') pointed = true; });
  form.addEventListener('change', event => {
    if (event.target.type !== 'radio' || !pointed) return;
    const step = steps[current];
    if (!step.contains(event.target) || !step.querySelector('.filtro-opciones') || current === steps.length - 1) return;
    pointed = false;
    setTimeout(() => { if (steps[current] === step) advance(); }, 220);
  });
  form.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !event.target.matches('.filtro-campo input')) return;
    event.preventDefault();
    const pending = fields(steps[current]).find(input => !input.value.trim());
    if (pending) { if (pending !== event.target) pending.focus(); return; }
    advance();
  });
  next.addEventListener('click', advance);
  back.addEventListener('click', () => { if (!sending) show(Math.max(0,current - 1)); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !ready) return;
    if (current < steps.length - 1) { if (validate(steps[current])) show(current + 1); return; }
    for (let index=0; index<steps.length; index++) {
      if (!validate(steps[index])) { show(index); validate(steps[index]); return; }
    }
    sending = true;
    send.disabled = true;
    back.disabled = true;
    form.setAttribute('aria-busy','true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const data = Object.fromEntries(new FormData(form));
      const response = await fetch(form.action, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:controller.signal });
      const result = await response.json();
      if (!response.ok || result.ok !== true || !/^LV3-[A-F0-9]{32}$/.test(result.folio || '') || !Number.isInteger(Number(result.id)) || Number(result.id) < 1) throw new Error('pending');
      window.confirmarValoracionLeal(result.folio);
      form.reset();
      form.hidden = true;
    } catch {
      error.textContent = messages.pending;
      error.tabIndex = -1;
      error.focus();
    } finally {
      clearTimeout(timeout);
      sending = false;
      send.disabled = false;
      back.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
  show(0, false);
  const configController = new AbortController();
  const configTimeout = setTimeout(() => configController.abort(), 8000);
  fetch('/tucirujanoleal/assets/filtro-config.json', {cache:'no-store', signal:configController.signal})
    .then(response => { if (!response.ok) throw new Error('config'); return response.json(); })
    .then(config => {
      if (!/^[A-Z]{3}$/.test(config.moneda) || !Array.isArray(config.inversiones) || config.inversiones.length !== 4 || config.inversiones.some((n,i,a) => !Number.isSafeInteger(n) || n <= 0 || (i > 0 && n <= a[i-1]))) throw new Error('config');
      const container = steps[0].querySelector('.filtro-opciones');
      const options = config.inversiones.map(value => {
        const label = document.createElement('label'); label.className = 'filtro-opcion';
        const input = document.createElement('input'); input.type = 'radio'; input.name = 'inversion'; input.value = String(value); input.required = true; input.setAttribute('aria-describedby','filtro-error');
        const text = document.createElement('span'); text.textContent = `Desde $${value.toLocaleString('en-US')} ${config.moneda}`;
        label.append(input,text); return label;
      });
      container.replaceChildren(...options);
      form.dataset.configuracion = config.moneda;
      ready = true; next.disabled = false; send.disabled = false;
    }).catch(() => { error.textContent = messages.pending; }).finally(() => clearTimeout(configTimeout));
})();
