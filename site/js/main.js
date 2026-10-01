const btn = document.querySelector('.menu-btn')
const nav = document.querySelector('#site-nav')

if (btn && nav) {
  const label = btn.querySelector('.menu-label')

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open)
    btn.setAttribute('aria-expanded', String(open))
    if (label) label.textContent = open ? 'Close' : 'Menu'
  }

  btn.addEventListener('click', () => {
    setOpen(btn.getAttribute('aria-expanded') !== 'true')
  })

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false))
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false)
  })

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return
    if (event.target instanceof Node && !nav.contains(event.target) && !btn.contains(event.target)) {
      setOpen(false)
    }
  })

  const desktop = window.matchMedia('(min-width: 861px)')
  const closeOnDesktop = () => {
    if (desktop.matches) setOpen(false)
  }
  if (typeof desktop.addEventListener === 'function') desktop.addEventListener('change', closeOnDesktop)
  else desktop.addListener(closeOnDesktop)
}
