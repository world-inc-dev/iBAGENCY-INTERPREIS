(() => {
  const navToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    }));
  }
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const category = document.getElementById('req-category');
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    if (category) category.value = button.dataset.category;
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('req-name')?.focus({ preventScroll: true }), 350);
  }));
  const SUPABASE_URL='https://jkwhnahxkmqzplgvpbre.supabase.co';
  const SUPABASE_KEY='sb_publishable_tHga70SJR6CGFz3VPBcfWg_UtY_bfai';
  const db=window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
  const form = document.getElementById('listing-request');
  if (form) form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const fields = [
      'Hello iBAGENCY Marketing Investment Empire, I would like to request current opportunities.',
      '',
      'Name: ' + String(data.get('name') || '').trim(),
      'Phone / WhatsApp: ' + String(data.get('phone') || '').trim(),
      'Category: ' + String(data.get('category') || '').trim(),
      data.get('location') ? 'Preferred location: ' + String(data.get('location')).trim() : '',
      data.get('budget') ? 'Budget / price range: ' + String(data.get('budget')).trim() : '',
      data.get('details') ? 'Requirements: ' + String(data.get('details')).trim() : '',
      '',
      'Please share current availability, full costs and supporting verification details.'
    ].filter(Boolean);
    const url = 'https://wa.me/2349118045889?text=' + encodeURIComponent(fields.join('\n'));
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    const status = document.getElementById('request-status');
    if (status) status.textContent = opened ? 'WhatsApp opened. Review the message and press Send to contact iBAGENCY.' : 'If WhatsApp did not open, use the WhatsApp contact link on this page and send your enquiry manually.';
  });
})();