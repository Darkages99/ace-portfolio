// ---------------------------------------------------------------------------
//  ACE — media pipeline (build-time, runs once; never at runtime).
//  Reads raw reels/photos/logo from ./assets, writes web-ready,
//  performance-first assets into public/assets.
//
//  Pass 1 (default):  posters (.webp) + H.264 .mp4 loops + logo cutout.
//  Pass 2 (FULL=1):   also emits VP9 .webm (smaller) for the <source> ladder.
//
//  Why H.264 first: universal decode on every phone (perf #1 = no decode jank);
//  VP9/AV1 added as the smaller, capability-gated <source> on top.
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const FULL = process.env.FULL === '1'
const root = resolve(process.cwd())
const SRC = join(root, 'assets')
const OUT = join(root, 'public', 'assets')
mkdirSync(OUT, { recursive: true })

const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + args.join(' '))
}

// width used for delivery. Reels render inside phone-frames / contained panels,
// never full-bleed, so 540w is sharp enough and keeps bytes tiny. Hero a touch bigger.
const W_REEL = 540
const W_HERO = 720

// 5–8s highlight loops. Windows picked from the contact sheets.
// audio:false everywhere except the testimonial (directive: no narration on training reels).
const CLIPS = [
  // name              source file              start  dur  width    audio  note
  { name: 'hero-spar',     file: 'Cinematic 2.mp4',     start: 30.0, dur: 7,  w: W_HERO },          // continuous mitt sparring
  { name: 'boxing',        file: 'Cinematic 2.mp4',     start: 3.2,  dur: 6,  w: W_REEL },          // Programs: STRIKING
  { name: 'bag-power',     file: 'Training 1.mp4',      start: 19.0, dur: 6,  w: W_REEL },          // Programs: POWER (heavy bag)
  { name: 'group-class',   file: 'Training 4.mp4',      start: 0.3,  dur: 7,  w: W_REEL },          // Vault: DISCIPLINE (group)
  { name: 'conditioning',  file: 'Training 3.mp4',      start: 0.3,  dur: 6,  w: W_REEL },          // Vault: CONSISTENCY
  { name: 'skip',          file: 'Cinematic 1.mp4',     start: 0.5,  dur: 5,  w: W_REEL },          // Vault: EVOLUTION (rope)
  { name: 'proof-trophy',  file: 'Training 2.mp4',      start: 0.5,  dur: 6,  w: W_REEL },          // Proof B-roll (trophies)
  { name: 'ceremony',      file: 'Training 2.mp4',      start: 28.0, dur: 7,  w: W_REEL },          // Proof (award ceremony)
  // testimonial: crop IG chrome (top ~7% play btn/timer, bottom ~9% handle/tags), keep audio.
  { name: 'testimonial',   file: 'ONLY TESTIMONIAL.mp4', start: 0.0, dur: 15, w: W_REEL, audio: true, crop: 'crop=in_w:in_h*0.84:0:in_h*0.07' },
]

function scaleVf(w, extra) {
  // even dimensions required by yuv420p
  const s = `scale=${w}:-2`
  return extra ? `${extra},${s}` : s
}

for (const c of CLIPS) {
  const src = join(SRC, c.file)
  if (!existsSync(src)) { console.warn('SKIP missing', c.file); continue }
  const vf = scaleVf(c.w, c.crop)

  // poster (first frame of the window), webp
  ff(['-ss', String(c.start), '-i', src, '-frames:v', '1', '-vf', vf,
      '-q:v', '78', join(OUT, `${c.name}.webp`)])

  // H.264 mp4 loop
  const aArgs = c.audio ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an']
  ff(['-ss', String(c.start), '-i', src, '-t', String(c.dur), '-vf', vf,
      '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-profile:v', 'high',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ...aArgs,
      join(OUT, `${c.name}.mp4`)])

  if (FULL) {
    // VP9 webm (smaller; broad support). 2-pass-ish single pass crf.
    ff(['-ss', String(c.start), '-i', src, '-t', String(c.dur), '-vf', vf,
        '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1',
        ...(c.audio ? ['-c:a', 'libopus', '-b:a', '96k'] : ['-an']),
        join(OUT, `${c.name}.webm`)])
  }
  console.log('clip', c.name)
}

// --- Ghost fighter: hero hologram sprite sheet + still WebP fallback ---
// 6×6 grid @ 6fps = 36 frames / 6s loop. Single texture upload — no VideoTexture.
const GHOST_COLS = 6
const GHOST_ROWS = 6
const GHOST_FPS = 6
const GHOST_DUR = GHOST_COLS * GHOST_ROWS / GHOST_FPS
const GHOST_W = 240

const ghostSrc = join(SRC, 'Cinematic 2.mp4')
if (existsSync(ghostSrc)) {
  const ghostKey = `colorkey=0x000000:0.18:0.08,scale=${GHOST_W}:-2`
  const ghostStart = 30.0
  const stillVf = `colorkey=0x000000:0.18:0.08,scale=${W_HERO}:-2`
  const sheetVf = `${ghostKey},fps=${GHOST_FPS},tile=${GHOST_COLS}x${GHOST_ROWS}`

  ff(['-ss', String(ghostStart), '-i', ghostSrc, '-frames:v', '1', '-vf', stillVf,
      '-q:v', '78', join(OUT, 'ghost-fighter.webp')])
  ff(['-ss', String(ghostStart), '-i', ghostSrc, '-frames:v', '1', '-vf', stillVf,
      join(OUT, 'ghost-fighter.png')])

  ff(['-ss', String(ghostStart), '-i', ghostSrc, '-t', String(GHOST_DUR), '-vf', sheetVf,
      '-frames:v', '1', '-q:v', '82', join(OUT, 'ghost-fighter-sprites.webp')])
  console.log(`ghost-fighter (still webp + ${GHOST_COLS}x${GHOST_ROWS} sprite sheet)`)
} else {
  console.warn('SKIP ghost-fighter — missing Cinematic 2.mp4')
}

// --- Logo: cut the solid-black background → transparent assets ---
// Display imgs use the small webp (~28KB); the favicon a tiny png. The 512px
// png is kept as the master cutout (handy for OG / large renders).
const logo = join(SRC, 'logo.jpg')
if (existsSync(logo)) {
  // colorkey black; small blend feathers the anti-aliased gold edges.
  ff(['-i', logo, '-vf', 'colorkey=0x000000:0.16:0.06,scale=512:-1', join(OUT, 'logo.png')])
  ff(['-i', join(OUT, 'logo.png'), '-vf', 'scale=256:-1', '-q:v', '88', join(OUT, 'logo.webp')])
  ff(['-i', join(OUT, 'logo.png'), '-vf', 'scale=64:-1', join(OUT, 'favicon.png')])
  console.log('logo cutout (png master + webp + favicon)')
}

console.log(`\nDone (${FULL ? 'FULL: mp4+webm' : 'pass1: mp4 only'}). Output → public/assets`)
