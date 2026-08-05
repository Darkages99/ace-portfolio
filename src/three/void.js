// Hero ambient "void" — a slow gold ember field with a few faint god-ray shafts
// drifting behind the headline. No fighter, no hologram, no scan-lines: just
// atmosphere on the dark theme. Full tier only, dynamic-imported after idle.
// Pauses off-screen / when the tab is hidden, and silently falls back to the
// CSS gradient on any WebGL trouble (context loss, soft GPU stall).

import {
  Scene, PerspectiveCamera, WebGLRenderer, Color, FogExp2,
  BufferGeometry, BufferAttribute, Points, PointsMaterial,
  AdditiveBlending, Vector2, CanvasTexture,
} from 'three'

const GOLD = new Color('#d4af37')
const BG = new Color('#0a0a0a')

export function initVoid(mountSelector = '.hero__void') {
  const mount = document.querySelector(mountSelector)
  if (!mount) return () => {}
  const hero = document.querySelector('.hero') || mount

  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)

  const canvas = renderer.domElement
  canvas.className = 'hero__void-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  mount.appendChild(canvas)

  const gl = renderer.getContext()

  const scene = new Scene()
  scene.fog = new FogExp2(BG, 0.04)

  const camera = new PerspectiveCamera(46, 1, 0.1, 80)
  camera.position.set(0, 0, 12)
  const ptr = new Vector2()
  const ptrT = new Vector2()

  const disposables = []

  // --- ember field: gold motes rising full-bleed across the hero. This is the
  //     ONLY thing rendered — no god-rays, no fighter — so the dark theme reads
  //     clean behind the headline. ---
  const EMBERS = 2400
  const RX = 30
  const RY = 20
  const RZ = 16
  const pos = new Float32Array(EMBERS * 3)
  const vel = new Float32Array(EMBERS)
  for (let i = 0; i < EMBERS; i++) {
    pos[i * 3] = (Math.random() - 0.5) * RX
    pos[i * 3 + 1] = (Math.random() - 0.5) * RY
    pos[i * 3 + 2] = -2 - Math.random() * RZ
    vel[i] = 0.4 + Math.random() * 1.4
  }
  const emberGeo = new BufferGeometry()
  emberGeo.setAttribute('position', new BufferAttribute(pos, 3))
  const emberMap = emberSprite()
  disposables.push(emberMap)
  const emberMat = new PointsMaterial({
    size: 0.17,
    map: emberMap,
    color: GOLD,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0.92,
    sizeAttenuation: true,
  })
  scene.add(new Points(emberGeo, emberMat))
  disposables.push(emberGeo, emberMat)

  // --- reveal / fallback plumbing ---
  let contextLost = false
  let revealed = false
  let okFrames = 0
  const bootAt = performance.now()
  let lastOkAt = bootAt

  const revealLive = () => {
    if (contextLost || revealed || okFrames < 3) return
    revealed = true
    hero.classList.add('void-ready')
    canvas.classList.add('is-live')
  }

  const restoreFallback = () => {
    if (contextLost) return
    contextLost = true
    revealed = false
    okFrames = 0
    stop()
    hero.classList.remove('void-ready')
    canvas.classList.remove('is-live')
  }

  const onContextLost = (e) => {
    e.preventDefault()
    restoreFallback()
  }
  canvas.addEventListener('webglcontextlost', onContextLost, false)

  const onMove = (e) => {
    ptrT.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  const layout = () => {
    const w = mount.clientWidth || window.innerWidth
    const h = mount.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  layout()
  const ro = new ResizeObserver(layout)
  ro.observe(mount)

  let raf = 0
  let running = false
  let t = 0

  const frame = () => {
    if (contextLost) return
    if (gl.isContextLost()) { restoreFallback(); return }

    raf = requestAnimationFrame(frame)
    t += 0.016

    // gentle pointer parallax around the centre of the field
    ptr.lerp(ptrT, 0.05)
    camera.position.x += (ptr.x * 1.4 - camera.position.x) * 0.04
    camera.position.y += (-ptr.y * 0.9 - camera.position.y) * 0.04
    camera.lookAt(0, 0, -4)

    const arr = emberGeo.attributes.position.array
    for (let i = 0; i < EMBERS; i++) {
      arr[i * 3 + 1] += vel[i] * 0.016
      arr[i * 3] += Math.sin((t + i) * 0.3) * 0.002
      if (arr[i * 3 + 1] > RY / 2) {
        arr[i * 3 + 1] = -RY / 2
        arr[i * 3] = (Math.random() - 0.5) * RX
        arr[i * 3 + 2] = -2 - Math.random() * RZ
      }
    }
    emberGeo.attributes.position.needsUpdate = true

    try {
      renderer.render(scene, camera)
      if (gl.isContextLost()) { restoreFallback(); return }
      lastOkAt = performance.now()
      okFrames++
      revealLive()
    } catch {
      restoreFallback()
    }
  }

  const start = () => {
    if (running || contextLost) return
    running = true
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  const inView = () => {
    const r = hero.getBoundingClientRect()
    return r.bottom > 0 && r.top < window.innerHeight
  }

  const onVisibility = () => {
    if (document.hidden) stop()
    else if (inView()) start()
  }

  const vis = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !document.hidden) start()
      else stop()
    },
    { threshold: 0.05 },
  )
  vis.observe(hero)
  document.addEventListener('visibilitychange', onVisibility)

  // Stall watchdog — context loss doesn't always fire on soft GPU stalls.
  const watchdog = setInterval(() => {
    if (!running || contextLost) return
    if (gl.isContextLost()) { restoreFallback(); return }
    const now = performance.now()
    if (revealed && okFrames > 0 && now - lastOkAt > 1200) restoreFallback()
    if (!revealed && running && okFrames === 0 && now - bootAt > 3000) restoreFallback()
  }, 400)

  return () => {
    clearInterval(watchdog)
    stop()
    canvas.removeEventListener('webglcontextlost', onContextLost, false)
    ro.disconnect()
    vis.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pointermove', onMove)
    for (const d of disposables) d?.dispose?.()
    renderer.dispose()
    canvas.remove()
    hero.classList.remove('void-ready')
  }
}

function emberSprite() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,250,235,1)')
  grd.addColorStop(0.3, 'rgba(245,196,81,0.85)')
  grd.addColorStop(1, 'rgba(245,196,81,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
}
