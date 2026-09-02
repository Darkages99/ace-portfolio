// Persona-filtered, infinite photo-carousel of member reviews. Same behaviour
// as Wolfpack Weightlifting's results wall (src/sections/wl-results.js there):
// filter pills narrow the set, the track is rebuilt with just enough repeats
// to loop cleanly, and --wall-dur is derived from the built width so the
// on-screen speed (PX_PER_SEC) stays constant no matter how many cards match.
//
// PLACEHOLDER MEDIA: photos are stand-ins reusing existing gym stills. Swap
// `photo` for real member portraits before launch. Names, ages, genders and
// disciplines are illustrative and need founder sign-off.

const PX_PER_SEC = 75

const PLACEHOLDER_PHOTOS = [
  './assets/hero-spar.webp', './assets/bag-power.webp', './assets/group-class.webp',
  './assets/conditioning.webp', './assets/skip.webp', './assets/boxing.webp',
  './assets/ceremony.webp', './assets/proof-trophy.webp',
]

const AGE_LABEL = { u15: 'Under 15', '15-20': '15–20', '20-30': '20–30', '30plus': '30+' }

const REVIEWS = [
  { gender: 'male',   age: '20-30', tag: 'Boxing',                 name: 'Arjun R.',  quote: 'The boxing training here <span class="hl">completely transformed my fitness</span>. The coaches are friendly, motivating, and truly know their craft.' },
  { gender: 'female', age: '20-30', tag: 'Muay Thai',               name: 'Priya M.',  quote: 'Top-notch facilities in a convenient Alwarpet location. I came for fitness and <span class="hl">stayed for the community</span>.' },
  { gender: 'male',   age: '30plus', tag: 'Brazilian Jiu-Jitsu',    name: 'Karthik S.', quote: 'ACE has had a <span class="hl">massive positive impact on both my mental and physical well-being</span>. More than a gym, a transformation space.' },
  { gender: 'female', age: '15-20', tag: 'MMA',                     name: 'Divya K.',  quote: "I used to think MMA wasn't for girls my age. Coach never treated me differently, he just pushed me. <span class=\"hl\">I've competed twice now</span>." },
  { gender: 'male',   age: 'u15',   tag: 'Boxing',                  name: 'Rohan T.',  quote: "I was nervous about sparring at first. Coach keeps it safe and fun for my age group, and my <span class=\"hl\">footwork's come on so fast</span>." },
  { gender: 'female', age: 'u15',   tag: 'Muay Thai',               name: 'Meera V.',  quote: "I joined with my brother just to try it. Now I'm the one who <span class=\"hl\">doesn't want to miss class</span>." },
  { gender: 'male',   age: '15-20', tag: 'Strength & Conditioning', name: 'Sanjay P.', quote: 'College trials were coming up and I needed to get stronger fast. Six months here and <span class="hl">I made the team</span>.' },
  { gender: 'male',   age: '20-30', tag: 'MMA',                     name: 'Ishaan R.', quote: 'Trained at three other gyms before this one. The technical detail in the coaching here is <span class="hl">on another level</span>.' },
  { gender: 'female', age: '30plus', tag: 'Boxing',                 name: 'Ananya B.', quote: "Started boxing at 34 thinking I was too old for it. <span class=\"hl\">Best decision I've made</span> for my body and my head." },
  { gender: 'male',   age: '30plus', tag: 'Muay Thai',              name: 'Vikram N.', quote: 'A desk job wrecked my back for years. Training Muay Thai here <span class="hl">rebuilt it</span>, and I actually look forward to sessions now.' },
  { gender: 'female', age: '15-20', tag: 'Brazilian Jiu-Jitsu',     name: 'Sneha K.',  quote: 'BJJ gave me <span class="hl">more confidence walking home at night</span> than anything else ever has.' },
  { gender: 'male',   age: 'u15',   tag: 'MMA',                     name: 'Yusuf A.',  quote: 'My coach focuses on <span class="hl">discipline and technique first</span>, not just fighting. My parents like that as much as I do.' },
]

export function initReviewsWall() {
  const wall = document.getElementById('reviewsWall')
  if (!wall) return

  const track = wall.querySelector('[data-reviews-track]')
  const countEl = document.querySelector('[data-reviews-count]')
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const state = { gender: 'any', age: 'any' }
  let photoIdx = 0

  const matches = (r) =>
    (state.gender === 'any' || r.gender === state.gender) &&
    (state.age === 'any' || r.age === state.age)

  const cardHTML = (r, hidden) => `
    <figure class="qcard" ${hidden ? 'aria-hidden="true"' : 'role="listitem"'}>
      <div class="qcard__media">
        <img src="${PLACEHOLDER_PHOTOS[photoIdx++ % PLACEHOLDER_PHOTOS.length]}" alt="${hidden ? '' : `${r.name}, trains ${r.tag} at Ancient Combat Evolution`}" loading="lazy" decoding="async" />
        <span class="qcard__tag">${AGE_LABEL[r.age]}</span>
      </div>
      <div class="qcard__body">
        <blockquote class="qcard__quote">&ldquo;${r.quote}&rdquo;</blockquote>
        <figcaption class="qcard__by"><b>${r.name}</b> &middot; ${r.tag}</figcaption>
      </div>
    </figure>`

  const updateCount = (n) => {
    if (!countEl) return
    countEl.innerHTML = n > 0
      ? `<b>${n}</b> ${n === 1 ? 'member matches' : 'members match'} your filters`
      : 'No exact matches yet. More stories coming soon.'
  }

  const build = () => {
    const set = REVIEWS.filter(matches)
    updateCount(set.length)
    if (!set.length) { track.innerHTML = ''; track.classList.remove('is-animating'); return }

    photoIdx = 0

    if (reduceMotion) {
      track.classList.remove('is-animating')
      track.style.removeProperty('--wall-dur')
      track.innerHTML = set.map((r) => cardHTML(r, false)).join('')
      return
    }

    const vw = wall.clientWidth || window.innerWidth
    let half = ''
    let reps = 0
    track.classList.remove('is-animating')
    do {
      half += set.map((r) => cardHTML(r, false)).join('')
      reps++
      track.innerHTML = half
    } while (track.scrollWidth < vw * 1.5 && reps < 12)

    photoIdx = 0
    let cloneHalf = ''
    for (let r = 0; r < reps; r++) cloneHalf += set.map((rv) => cardHTML(rv, true)).join('')
    track.innerHTML = half + cloneHalf

    const halfWidth = track.scrollWidth / 2
    if (halfWidth > 0) {
      track.style.setProperty('--wall-dur', `${(halfWidth / PX_PER_SEC).toFixed(1)}s`)
      track.classList.add('is-animating')
    }
  }

  wall.closest('.reviews-finder')?.querySelectorAll('.pf__row').forEach((row) => {
    const key = row.dataset.filter
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('.pf__btn')
      if (!btn || btn.classList.contains('is-active')) return
      row.querySelectorAll('.pf__btn').forEach((b) => {
        b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false')
      })
      btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true')
      state[key] = btn.dataset.val
      build()
    })
  })

  // touch devices don't fire :hover — mirror the pause-to-read behaviour
  wall.addEventListener('touchstart', () => wall.classList.add('is-touched'), { passive: true })
  wall.addEventListener('touchend', () => setTimeout(() => wall.classList.remove('is-touched'), 1200))
  wall.addEventListener('touchcancel', () => wall.classList.remove('is-touched'))

  build()

  let rt
  window.addEventListener('resize', () => {
    clearTimeout(rt)
    rt = setTimeout(build, 200)
  })

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build)
}
