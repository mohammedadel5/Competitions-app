window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');

  if (window.renderLoginView) {
    window.renderLoginView(root);
  } else {
    root.textContent = 'Competitions App';
  }
});
