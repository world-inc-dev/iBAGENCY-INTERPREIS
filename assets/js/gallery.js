(() => {
  document.querySelectorAll('.gallery-card[data-interest]').forEach(card => {
    card.addEventListener('click', () => {
      const select = document.getElementById('interest');
      if (!select) return;
      const wanted = card.getAttribute('data-interest');
      const option = Array.from(select.options).find(item => item.text.trim() === wanted);
      if (option) select.value = option.value;
    });
  });
})();
