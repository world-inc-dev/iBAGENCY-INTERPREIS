(() => {
  const select = document.getElementById('interest');
  if (!select) return;

  document.querySelectorAll('[data-interest]').forEach(link => {
    link.addEventListener('click', () => {
      const wanted = (link.getAttribute('data-interest') || '').trim().toLowerCase();
      const option = Array.from(select.options).find(item =>
        item.text.trim().toLowerCase() === wanted
      );
      if (option) select.value = option.value;
    });
  });
})();
