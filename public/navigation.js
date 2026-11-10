const navigationLinks = [...document.querySelectorAll('.sidebar .nav-link')];
function updateNavigation() {
  const target = location.hash || '#visao';
  for (const link of navigationLinks) {
    const selected = link.getAttribute('href') === target;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', updateNavigation);
updateNavigation();
