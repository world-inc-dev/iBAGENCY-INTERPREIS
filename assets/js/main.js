(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const form = document.getElementById('inquiry-form');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const phone = String(data.get('phone') || '').trim();
      const interest = String(data.get('interest') || '').trim();
      const details = String(data.get('message') || '').trim();
      const message = [
        'Hello iBAGENCY Marketing Investment Empire, I would like to make an enquiry.',
        '',
        'Name: ' + name,
        'Phone: ' + phone,
        'Service of interest: ' + interest,
        details ? 'Details: ' + details : ''
      ].filter(Boolean).join('\n');
      window.open('https://wa.me/2349118045889?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
    });
  }
})();