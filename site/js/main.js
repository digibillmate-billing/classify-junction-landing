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

const priceRows = document.querySelector('#price-rows')
const priceCards = document.querySelector('#price-cards')
const priceCaption = document.querySelector('#price-caption')

if (priceRows && priceCards) {
  // Publishable key already used by the public marketplace. It can read active categories only.
  const key = 'sb_publishable_UYJLhWpyuB-K53DNY93VIw_ITSoPHa2'
  const endpoint = 'https://yqdskcnxvkmhtfnucbcw.supabase.co/rest/v1/categories?select=name,post_price,mobile_view_price&status=eq.active&order=sort_order.asc,name.asc'
  const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

  const formatPrice = (amount) => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return { text: 'Free', free: true }
    return { text: `₹${inr.format(n)}`, free: false }
  }

  const priceNode = (amount, tag) => {
    const formatted = formatPrice(amount)
    const node = document.createElement(tag)
    node.textContent = formatted.text
    if (formatted.free) node.className = 'free'
    return node
  }

  fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
    .then((response) => {
      if (!response.ok) throw new Error('Could not load category prices.')
      return response.json()
    })
    .then((rows) => {
      if (!Array.isArray(rows)) return
      const clean = rows.filter((row) => {
        return row && typeof row.name === 'string' && row.name.trim()
          && Number.isFinite(Number(row.post_price))
          && Number.isFinite(Number(row.mobile_view_price))
      })
      if (clean.length === 0) return

      const nextRows = document.createDocumentFragment()
      const nextCards = document.createDocumentFragment()

      for (const row of clean) {
        const name = row.name.trim()
        const tr = document.createElement('tr')
        const th = document.createElement('th')
        th.scope = 'row'
        th.textContent = name
        const post = document.createElement('td')
        post.append(priceNode(row.post_price, 'span'))
        const view = document.createElement('td')
        view.append(priceNode(row.mobile_view_price, 'span'))
        tr.append(th, post, view)
        nextRows.append(tr)

        const li = document.createElement('li')
        const heading = document.createElement('h3')
        heading.textContent = name
        const postLine = document.createElement('p')
        postLine.append('To post ', priceNode(row.post_price, 'strong'))
        const viewLine = document.createElement('p')
        viewLine.append('To view a number ', priceNode(row.mobile_view_price, 'strong'))
        li.append(heading, postLine, viewLine)
        nextCards.append(li)
      }

      priceRows.replaceChildren(nextRows)
      priceCards.replaceChildren(nextCards)
      if (priceCaption) priceCaption.textContent = 'Current category prices.'
    })
    .catch(() => {
      // Keep the printed rows if the marketplace cannot be reached.
    })
}
