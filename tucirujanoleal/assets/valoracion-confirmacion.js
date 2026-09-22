(() => {
  let currentFolio;
  const updateLink = folio => {
    const message = window.LealIdioma?.activo === 'en' ? `Hello, Geraldine. My consultation request has reference ${folio}.` : `Hola, Geraldine. Mi solicitud de valoración tiene el folio ${folio}.`;
    document.querySelector('[data-concierge]').href = `https://wa.me/523323505078?text=${encodeURIComponent(message)}`;
  };
  document.addEventListener('leal:idioma', () => { if (currentFolio) updateLink(currentFolio); });
  window.confirmarValoracionLeal = folio => {
    if (!/^LV3-[A-F0-9]{32}$/.test(folio)) throw new Error('folio');
    const receipt = document.querySelector('#acuse-valoracion');
    receipt.querySelector('[data-folio]').textContent = folio;
    currentFolio = folio;
    updateLink(folio);
    receipt.hidden = false;
    receipt.querySelector('h2').focus({preventScroll:true});
    receipt.scrollIntoView({block:'start',behavior:'instant'});
  };
})();
