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

const liveFront = document.querySelector('#live-front')
const liveBack = document.querySelector('#live-back')

if (liveFront && liveBack) {
  const key = 'sb_publishable_UYJLhWpyuB-K53DNY93VIw_ITSoPHa2'
  const rpcUrl = 'https://yqdskcnxvkmhtfnucbcw.supabase.co/rest/v1/rpc/'
  const board = 'https://classify-junction.digibillmate-billing.workers.dev'
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const codeOk = /^CJ\d{1,12}$/i
  const postedOn = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let ads = []
  let index = 0
  let painted = ''
  let paintToken = 0
  let paused = false

  const rpc = (name, body) => fetch(rpcUrl + name, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  }).then((response) => {
    if (!response.ok) throw new Error('Could not load advertisements.')
    return response.json()
  })

  const text = (value) => (typeof value === 'string' ? value.trim() : '')

  const cleanAd = (row) => {
    if (!row || row.is_open === false || typeof row.id !== 'string' || !uuid.test(row.id)) return null
    const title = text(row.title)
    if (!title) return null
    const code = text(row.ad_code)
    return {
      id: row.id,
      code: codeOk.test(code) ? code.toUpperCase() : '',
      title,
      description: text(row.description),
      category: text(row.category_name),
      audience: text(row.audience_name),
      publishedAt: text(row.published_at),
      masked: null,
    }
  }

  const pair = () => {
    if (ads.length === 0) return []
    const front = ads[index % ads.length]
    if (ads.length === 1) return [front]
    return [front, ads[(index + 1) % ads.length]]
  }

  const pill = (label, red) => {
    const node = document.createElement('span')
    node.className = red ? 'pill pill-red' : 'pill'
    node.textContent = label
    return node
  }

  const fill = (article, ad, role) => {
    const url = `${board}/ads/${ad.id}`
    article.hidden = false
    article.replaceChildren()
    const ribbon = document.createElement('p')
    ribbon.className = 'ribbon'
    ribbon.textContent = role === 'back'
      ? 'Also on the board'
      : (ad.code ? `Live · ${ad.code}` : 'Live listing')
    article.append(ribbon)

    if (ad.category || ad.audience) {
      const pills = document.createElement('div')
      pills.className = 'pills'
      if (ad.category) pills.append(pill(ad.category, true))
      if (ad.audience) pills.append(pill(ad.audience, false))
      article.append(pills)
    }

    const title = document.createElement('p')
    title.className = 'listing-title'
    const titleLink = document.createElement('a')
    titleLink.href = url
    titleLink.textContent = ad.title
    title.append(titleLink)
    article.append(title)

    if (ad.description) {
      const description = document.createElement('p')
      description.className = 'listing-desc'
      description.textContent = ad.description
      article.append(description)
    }

    const when = document.createElement('p')
    when.className = 'listing-when'
    const parsed = new Date(ad.publishedAt)
    when.textContent = Number.isNaN(parsed.getTime()) ? 'Published' : `Posted ${postedOn.format(parsed)}`
    article.append(when)

    const numberRow = document.createElement('div')
    numberRow.className = 'number-row'
    const numberLabel = document.createElement('span')
    numberLabel.className = 'number-label'
    numberLabel.textContent = 'Mobile'
    const number = document.createElement('span')
    number.className = 'number'
    number.textContent = ad.masked || 'Masked'
    numberRow.append(numberLabel, number)
    article.append(numberRow)

    const action = document.createElement('a')
    action.className = 'fake-btn'
    action.href = url
    action.textContent = 'View mobile number'
    article.append(action)
  }

  const showWaiting = (message) => {
    painted = ''
    liveBack.hidden = true
    liveBack.replaceChildren()
    liveFront.hidden = false
    liveFront.replaceChildren()
    const ribbon = document.createElement('p')
    ribbon.className = 'ribbon'
    ribbon.textContent = 'Live listing'
    const title = document.createElement('p')
    title.className = 'listing-title'
    title.textContent = message
    const action = document.createElement('a')
    action.className = 'fake-btn'
    action.href = `${board}/#published`
    action.textContent = 'Browse advertisements'
    liveFront.append(ribbon, title, action)
  }

  const paint = async () => {
    const token = ++paintToken
    const shown = pair()
    if (shown.length === 0) {
      showWaiting('Nothing is public on the board yet.')
      return
    }
    await Promise.all(shown.map(async (ad) => {
      if (ad.masked !== null) return
      try {
        const detail = await rpc('public_get_ad', { p_id: ad.id })
        const row = Array.isArray(detail) ? detail[0] : null
        ad.masked = text(row && row.masked_mobile)
      } catch {
        ad.masked = ''
      }
    }))
    if (token !== paintToken) return
    const signature = shown.map((ad) => `${ad.id}:${ad.masked}`).join('|')
    if (signature === painted) return
    painted = signature
    fill(liveFront, shown[0], 'front')
    if (shown[1]) fill(liveBack, shown[1], 'back')
    else {
      liveBack.hidden = true
      liveBack.replaceChildren()
    }
  }

  const refresh = async () => {
    try {
      const rows = await rpc('public_list_ads', { p_limit: 6 })
      if (!Array.isArray(rows)) throw new Error('Unexpected advertisements.')
      const next = []
      for (const row of rows) {
        const ad = cleanAd(row)
        if (!ad) continue
        const previous = ads.find((item) => item.id === ad.id)
        if (previous && previous.masked !== null) ad.masked = previous.masked
        next.push(ad)
      }
      const newestChanged = next[0] && ads[0] && next[0].id !== ads[0].id
      ads = next
      if (newestChanged || index >= ads.length) index = 0
      await paint()
    } catch {
      if (ads.length === 0) showWaiting('The live board did not load. Browse it on the marketplace.')
    }
  }

  const boardEl = document.querySelector('#live-board')
  if (boardEl) {
    boardEl.addEventListener('mouseenter', () => { paused = true })
    boardEl.addEventListener('mouseleave', () => { paused = false })
    boardEl.addEventListener('focusin', () => { paused = true })
    boardEl.addEventListener('focusout', () => { paused = false })
  }

  refresh()
  setInterval(() => {
    if (!document.hidden) refresh()
  }, 30000)
  setInterval(() => {
    if (document.hidden || paused || reduceMotion.matches || ads.length < 2) return
    index = (index + 1) % ads.length
    paint()
  }, 10000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh()
  })
}
