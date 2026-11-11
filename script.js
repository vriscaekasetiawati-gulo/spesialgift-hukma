/* ====== KONFIGURASI ====== */
const SECRET = "20032026";      // 20-03-2026 (hanya angka)
const LOAD_MS = 5200;           // lama loading

const $ = s => document.querySelector(s);
const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
};
window.ph = name => { const d = document.createElement('div'); d.className = 'ph'; d.textContent = '📷 taruh ' + name + ' di folder assets'; return d; };

/* ====== EMOJI MELAYANG ====== */
setInterval(() => {
  const e = document.createElement('span');
  e.className = 'fl'; e.textContent = ['💙','🌻','✨','💙','🌼'][Math.random() * 5 | 0];
  e.style.left = Math.random() * 100 + '%'; e.style.fontSize = (14 + Math.random() * 22) + 'px';
  e.style.animationDuration = (6 + Math.random() * 6) + 's';
  $('#floaters').appendChild(e); setTimeout(() => e.remove(), 12000);
}, 550);

/* ====== SOUND (WebAudio, nuansa "aurora": chime lembut + pad + echo) ====== */
let ac, master;
function initAudio() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = .55;
  const dly = ac.createDelay(); dly.delayTime.value = .32;
  const fb = ac.createGain(); fb.gain.value = .45;
  dly.connect(fb); fb.connect(dly); master.connect(dly); dly.connect(ac.destination); master.connect(ac.destination);
}
function tone(f, t, dur, type = 'sine', vol = .18) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
}
function auroraLoading() {
  const t0 = ac.currentTime, sc = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.5];
  [261.63, 329.63, 392].forEach(f => tone(f, t0, LOAD_MS / 1000, 'triangle', .05)); // pad
  for (let i = 0; i < 18; i++) tone(sc[(i * 7 + (i >> 2)) % sc.length], t0 + i * .27, 1.6, 'sine', .14);
}
const sfxClick = () => { if (!ac) return; tone(880, ac.currentTime, .12, 'sine', .15); };
const sfxError = () => { if (!ac) return; tone(180, ac.currentTime, .3, 'sawtooth', .12); tone(140, ac.currentTime + .12, .3, 'sawtooth', .12); };
const sfxOk = () => { if (!ac) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, ac.currentTime + i * .09, 1, 'sine', .16)); };

/* ====== ALUR: START -> LOADING -> GATE ====== */
$('#startBtn').addEventListener('click', () => {
  initAudio(); ac.resume(); auroraLoading(); show('#loading');
  const t0 = performance.now(), fill = $('#barFill'), pct = $('#pct');
  (function step(now) {
    const p = Math.min((now - t0) / LOAD_MS, 1);
    fill.style.width = p * 100 + '%'; pct.textContent = Math.round(p * 100) + '%';
    if (p < 1) requestAnimationFrame(step); else { sfxClick(); show('#gate'); $('#code').focus({ preventScroll: true }); }
  })(t0);
});

/* ====== KARTU 3D (miring ikut jari/mouse) ====== */
const card = $('#card');
function tilt(x, y) { card.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)`; }
addEventListener('pointermove', e => { if ($('#gate').classList.contains('active')) tilt(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); });
addEventListener('deviceorientation', e => { if (e.gamma != null && $('#gate').classList.contains('active')) tilt((e.gamma || 0) / 60, ((e.beta || 45) - 45) / 60); });

/* ====== INPUT KODE ====== */
const inp = $('#code'), err = $('#err');
inp.addEventListener('input', () => {
  const d = inp.value.replace(/\D/g, '').slice(0, 8);
  inp.value = [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('-');
  err.textContent = ''; sfxClick();
});
function submit() {
  const d = inp.value.replace(/\D/g, '');
  if (d === SECRET) {
    sfxOk(); card.classList.add('ok'); // lagu TIDAK otomatis: harus pencet play dulu di player
    setTimeout(() => { show('#main'); document.body.classList.add('in-main'); }, 900);
  } else {
    sfxError(); err.textContent = 'Salah wooy 😝 coba inget lagi!';
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    if (navigator.vibrate) navigator.vibrate(200);
  }
}
$('#go').addEventListener('click', submit);
inp.addEventListener('keydown', e => e.key === 'Enter' && submit());

/* ====== GLOW CURSOR (ala ReactBits) ====== */
const glow = $('#glow'); let gx = innerWidth / 2, gy = innerHeight / 2, px = gx, py = gy;
addEventListener('pointermove', e => {
  px = e.clientX; py = e.clientY; document.body.classList.add('glow-on');
  document.querySelectorAll('.photo').forEach(p => {
    const r = p.getBoundingClientRect();
    p.style.setProperty('--mx', (e.clientX - r.left) + 'px'); p.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});
(function glowLoop() {
  gx += (px - gx) * .14; gy += (py - gy) * .14;
  glow.style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(glowLoop);
})();

/* ====== MUSIK: mp3 dari folder assets, otomatis main setelah kode benar ====== */
const song = $('#song');
const SONG_FILES = ['assets/whut.mp3', 'assets/whut.mp3.mp3', 'assets/WHUT.mp3', 'assets/w.h.u.t.mp3', 'assets/whut.MP3']; // nama file yang dicoba
let songIdx = 0, started = false, wantPlay = false;
song.src = SONG_FILES[0];
const fmt = x => { x = Math.max(0, Math.floor(x || 0)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
const I_PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>';
const I_PAUSE = '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>';
function startSong() { wantPlay = true; song.volume = $('#pVol').value / 100; const p = song.play(); if (p && p.catch) p.catch(() => {}); }
song.addEventListener('canplay', () => { if (wantPlay && song.paused) song.play().catch(() => {}); });
song.addEventListener('playing', () => {
  $('#pPlay').innerHTML = I_PAUSE;
  if (!started) { started = true; $('#cover').classList.add('on'); $('#openGift').disabled = false; }
});
song.addEventListener('pause', () => { $('#pPlay').innerHTML = I_PLAY; });
song.addEventListener('timeupdate', () => {
  const d = song.duration || 0, v = d ? song.currentTime / d * 1000 : 0, sk = $('#pSeek');
  if (!sk.matches(':active')) { sk.value = v; sk.style.setProperty('--v', v / 10 + '%'); }
  $('#pCur').textContent = fmt(song.currentTime); $('#pRem').textContent = '-' + fmt(d - song.currentTime);
});
song.addEventListener('error', () => {
  if (++songIdx < SONG_FILES.length) { song.src = SONG_FILES[songIdx]; song.load(); return; }
  $('#pTitle').textContent = 'W.H.U.T'; $('#pSub').textContent = 'lagu tentang hukma pacar ku sayang';
  $('#openGift').disabled = false;
});
$('#pPlay').addEventListener('click', () => { if (song.paused) startSong(); else { wantPlay = false; song.pause(); } });
$('#pBack').addEventListener('click', () => { song.currentTime = Math.max(0, song.currentTime - 10); });
$('#pFwd').addEventListener('click', () => { if (song.duration) song.currentTime = Math.min(song.duration - .5, song.currentTime + 10); });
$('#pSeek').addEventListener('input', e => { if (song.duration) song.currentTime = e.target.value / 1000 * song.duration; e.target.style.setProperty('--v', e.target.value / 10 + '%'); });
$('#pVol').addEventListener('input', e => { song.volume = e.target.value / 100; e.target.style.setProperty('--v', e.target.value + '%'); });
$('#pVol').style.setProperty('--v', '90%');
$('#openGift').addEventListener('click', () => {
  $('#giftGate').hidden = true; $('#giftContent').hidden = false; initTiltPhotos();
});
function initTiltPhotos() {
  document.querySelectorAll('.photo').forEach(p => {
    p.addEventListener('pointermove', e => {
      const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      p.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
    });
    p.addEventListener('pointerleave', () => p.style.transform = '');
  });
}


/* ====== CIRCULAR CAROUSEL 3D (ring, drag momentum, snap, klik untuk fokus) ====== */
// Isi foto kamu di sini (taruh file-nya di folder assets). Boleh tambah/kurangi.
const CAROUSEL_PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map(i => `assets/kenangan${i}.jpeg`); // otomatis coba .jpeg lalu .jpg
(function carousel() {
  const box = $('#carousel'), ring = $('#ring'), N = CAROUSEL_PHOTOS.length, step = 360 / N;
  const cw = innerWidth < 600 ? 130 : 180, R = (cw / 2) / Math.tan(Math.PI / N) + 24;
  box.style.setProperty('--cw', cw + 'px');
  const cards = CAROUSEL_PHOTOS.map((src, i) => {
    const c = document.createElement('div'); c.className = 'c-card';
    c.style.transform = `translate(-50%,-50%) rotateY(${i * step}deg) translateZ(${R}px)`;
    const img = new Image(); img.src = src; img.alt = 'Kenangan ' + (i + 1); img.draggable = false;
    img.onerror = () => { if (/\.jpeg$/.test(img.src) && !img.dataset.retry) { img.dataset.retry = 1; img.src = src.replace(/\.jpeg$/, '.jpg'); return; } const p = document.createElement('div'); p.className = 'c-ph'; p.textContent = '📷 ' + src.split('/').pop(); img.replaceWith(p); };
    c.appendChild(img); ring.appendChild(c); return c;
  });
  let rot = 0, vel = 0, drag = false, lastX = 0, moved = 0, target = null, lastAct = performance.now();
  const norm = a => ((a % 360) + 540) % 360 - 180;
  box.addEventListener('pointerdown', e => { drag = true; moved = 0; lastX = e.clientX; vel = 0; target = null; lastAct = performance.now(); box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    rot += dx * .35; vel = dx * .35; lastAct = performance.now();
  });
  const up = e => {
    if (!drag) return; drag = false; lastAct = performance.now();
    if (moved < 6) { // klik -> fokus ke foto itu
      const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.c-card'), i = cards.indexOf(c);
      if (i >= 0) { target = rot - norm(i * step + rot); vel = 0; }
    } else if (Math.abs(vel) < .3) target = Math.round(rot / step) * step;
  };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  (function frame() {
    if (!drag) {
      if (target !== null) { rot += (target - rot) * .12; if (Math.abs(target - rot) < .05) { rot = target; target = null; } }
      else if (Math.abs(vel) > .05) { rot += vel; vel *= .95; if (Math.abs(vel) <= .05) { vel = 0; target = Math.round(rot / step) * step; } }
      else if (performance.now() - lastAct > 3000) rot += .12; // melayang pelan saat didiamkan
    }
    ring.style.transform = `translateZ(${-R}px) rotateY(${rot}deg)`;
    cards.forEach((c, i) => {
      const f = (Math.cos(norm(i * step + rot) * Math.PI / 180) + 1) / 2;
      c.style.opacity = .35 + .65 * f; c.style.filter = `brightness(${.5 + .5 * f})`;
    });
    requestAnimationFrame(frame);
  })();
})();


/* ====== BUKET ANGGREK + MELATI (tumbuh dari bawah, tertiup angin) ====== */
(function bloom() {
  const ov = $('#bloom'), root = $('#bRoot'), NS = 'http://www.w3.org/2000/svg';
  const mk = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const cl = x => Math.min(Math.max(x, 0), 1);
  const O = [200, 556], N = 40;
  // posisi kepala bunga [x, y, ukuran] - yang terakhir tampil paling depan
  const HEADS = [[85, 238, .9], [315, 238, .9], [130, 162, .95], [270, 162, .95], [140, 247, .95], [260, 247, .95], [200, 118, .9], [200, 197, 1.08]];
  const jas = `<g fill="#fff" stroke="#f6c3da" stroke-width=".6">${[0, 1, 2, 3, 4].map(k => `<ellipse cx="0" cy="-8" rx="3.6" ry="8.6" transform="rotate(${k * 72})"/>`).join('')}</g><circle r="2.4" fill="#ffd36b"/>`;
  const orc = `<g fill="url(#gPet)" stroke="#f3b3cf" stroke-width=".8"><ellipse cx="0" cy="-17" rx="11" ry="16"/>
    <ellipse cx="-19" cy="-3" rx="18" ry="13" transform="rotate(-12 -19 -3)"/><ellipse cx="19" cy="-3" rx="18" ry="13" transform="rotate(12 19 -3)"/>
    <ellipse cx="-10" cy="15" rx="9" ry="15" transform="rotate(25 -10 15)"/><ellipse cx="10" cy="15" rx="9" ry="15" transform="rotate(-25 10 15)"/></g>
    <ellipse cy="8" rx="6" ry="9" fill="#ff9cc6"/><circle cy="-2" r="3.5" fill="#ffe27a"/>`;
  const leaf = `<path d="M0 0C28-20 86-24 132-2C88 14 30 18 0 0Z" fill="url(#gLeaf)"/><path d="M4 0C45-6 90-8 128-2" stroke="#d9ffe9" stroke-opacity=".55" fill="none"/>`;
  const paper = `<path d="M200 712L108 524Q200 498 292 524Z" fill="url(#gPaper2)"/>
    <path d="M200 712L132 520Q200 506 268 520Z" fill="url(#gPaper)"/>
    <path d="M200 712L158 522M200 712L242 522M200 712L120 526M200 712L280 526" stroke="#f3a6cb" stroke-opacity=".55" stroke-width="1.2" fill="none"/>
    <g transform="translate(200 556)"><path d="M0 0L-16 44L-4 38Z M0 0L16 44L4 38Z" fill="#6cc9ff"/>
    <ellipse cx="-24" cy="-2" rx="24" ry="12" transform="rotate(-18 -24 -2)" fill="#8fdcff"/><ellipse cx="24" cy="-2" rx="24" ry="12" transform="rotate(18 24 -2)" fill="#8fdcff"/>
    <circle r="8" fill="#3fb4f5"/></g>`;
  let stems = [], els = [], raf = 0, t0 = 0, pol = 0;

  function build() {
    root.innerHTML = ''; stems = []; els = [];
    const L0 = mk('g', {}, root), LP = mk('g', {}, root), L2 = mk('g', {}, root), L3 = mk('g', {}, root);
    HEADS.forEach(([hx, hy, sz], i) => {
      const f = (u, k) => { const m = 1 - u, P1 = [O[0] + (hx - O[0]) * .2, O[1] - (O[1] - hy) * .35], P2 = [O[0] + (hx - O[0]) * .85, O[1] - (O[1] - hy) * .8];
        return m * m * m * O[k] + 3 * m * m * u * [P1, 0][0][k] + 3 * m * u * u * P2[k] + u * u * u * [hx, hy][k]; };
      const base = []; for (let j = 0; j <= N; j++) base.push([f(j / N, 0), f(j / N, 1)]);
      const path = mk('path', { fill: 'none', stroke: 'url(#gStem)', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, L0);
      stems.push({ base, path, ph: i * .45, delay: i * .14, ug: 0 });
    });
    const add = (type, par, o) => { const g = mk('g', { visibility: 'hidden' }, par); els.push(Object.assign({ type, g, ph: Math.random() * 6, ts: null, dur: 1.4, dx: 0, dy: 0 }, o)); return g; };
    // daun pengisi di pangkal buket
    [[-165, 1.35], [-140, 1.15], [-115, 1.0], [-65, 1.0], [-40, 1.15], [-15, 1.35]].forEach(([ang, sz], i) => {
      const g = add('leafAbs', L0, { ang, sz, st: 0, u: 0, dur: 1.6, delay: .2 + i * .12 }); g.innerHTML = leaf;
    });
    stems.forEach((s, i) => {
      [[.34, 1, .6], [.52, -1, .5]].forEach(([u, side, sz]) => { const g = add('leaf', L0, { st: i, u, side, sz, sp: 48, dur: 1.5 }); g.innerHTML = leaf; });
      [[.58, -1], [.74, 1], [.9, -1]].forEach(([u, side], j) => {
        const g = add('jas', L2, { st: i, u, side, dx: side * (15 + j * 5), dy: -5, sz: .85 - j * .08, dur: 1.2 });
        g.innerHTML = `<path class="tw" fill="none" stroke="#4fbf86" stroke-width="1.6"/><g class="fw">${jas}</g>`;
      });
      const g = add('orc', L3, { st: i, u: 1, sz: HEADS[i][2], lean: (HEADS[i][0] - 200) * .1, dur: 1.9, delay: .15 });
      g.innerHTML = `<g class="fw">${orc}</g>`;
    });
    const pg = mk('g', { opacity: 0 }, LP); pg.innerHTML = paper; pol = pg;
  }

  function frame(now) {
    const t = (now - t0) / 1000;
    const w = (i, ph) => Math.sin(t * 1.1 + ph) * .9 + Math.sin(t * 2.1 + 1.3 + ph) * .35 + .4;
    pol.setAttribute('opacity', cl(t / .8));
    stems.forEach((s, i) => {
      const wi = w(i, s.ph); s.ug = ease(cl((t - s.delay) / 3.2));
      s.pts = s.base.map(([x, y], j) => { const u = j / N; return [x + wi * 13 * u * u + Math.sin(t * 3 + u * 6 + s.ph) * 1.3 * u, y]; });
      const n = Math.max(1, Math.floor(s.ug * N));
      s.path.setAttribute('d', 'M' + s.pts.slice(0, n + 1).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'));
      s.wi = wi;
    });
    els.forEach(e => {
      const s = stems[e.st || 0];
      if (e.type !== 'leafAbs' && s.ug < e.u - .001) return;
      if (e.ts == null) e.ts = t + (e.delay || 0);
      if (t < e.ts) return;
      const k = back(cl((t - e.ts) / e.dur)), sw = Math.sin(t * 1.5 + e.ph) * 5 + s.wi * 4;
      e.g.setAttribute('visibility', 'visible');
      if (e.type === 'leafAbs') { e.g.setAttribute('transform', `translate(${O[0]} ${O[1] - 4}) rotate(${e.ang + sw * .5}) scale(${k * e.sz})`); return; }
      const fi = Math.min(e.u, 1) * N, i = Math.min(Math.floor(fi), N - 1), f = fi - i, a = s.pts[i], b = s.pts[i + 1];
      const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, th = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      if (e.type === 'leaf') { e.g.setAttribute('transform', `translate(${x} ${y}) rotate(${th + e.side * e.sp + sw * .6}) scale(${k * e.sz})`); return; }
      e.g.setAttribute('transform', `translate(${x} ${y}) rotate(${sw * .5})`);
      const tw = e.g.querySelector('.tw'), fl = e.g.querySelector('.fw');
      if (tw) tw.setAttribute('d', `M0 0Q${e.dx * .5} ${e.dy - 12} ${e.dx} ${e.dy}`);
      const rot = e.type === 'orc' ? e.lean + Math.sin(t * 1.6 + e.ph) * 6 + s.wi * 5 : e.side * 8 + Math.sin(t * 2 + e.ph) * 7;
      fl.setAttribute('transform', `translate(${e.dx} ${e.dy}) rotate(${rot}) scale(${k * e.sz})`);
    });
    if (t > 4.4) ov.classList.add('show');
    raf = requestAnimationFrame(frame);
  }
  let tick = 0;
  function open() {
    build(); ov.classList.remove('show'); ov.hidden = false; document.body.classList.add('bloom-open'); t0 = performance.now(); raf = requestAnimationFrame(frame);
    const imgs = [...document.querySelectorAll('#polaroid img')]; let c = 0;
    clearInterval(tick); tick = setInterval(() => { imgs[c].classList.remove('on'); c = (c + 1) % imgs.length; imgs[c].classList.add('on'); }, 3500);
  }
  function close() { cancelAnimationFrame(raf); clearInterval(tick); ov.hidden = true; ov.classList.remove('show'); document.body.classList.remove('bloom-open'); }
  $('#k2').addEventListener('click', open);
  $('#bloomClose').addEventListener('click', close);
  addEventListener('keydown', e => e.key === 'Escape' && !ov.hidden && close());
})();


/* ====== SURAT 3D (Kenangan 3) ====== */
(function letter() {
  const ov = $('#letter'), card = $('#ltCard'), scene = $('#ltScene');
  const open = () => { ov.hidden = false; card.classList.remove('idle'); card.style.animation = ''; card.style.translate = ''; card.style.rotate = ''; card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); $('#ltText').scrollTop = 0; setTimeout(() => card.classList.add('idle'), 50); };
  const close = () => { ov.hidden = true; card.classList.remove('idle'); };
  $('#k3').addEventListener('click', open);
  $('#letterClose').addEventListener('click', close);
  addEventListener('keydown', e => e.key === 'Escape' && !ov.hidden && close());
  // miring ikut kursor (mouse) / geser jari di luar area tulisan
  const tilt = (x, y) => { const r = scene.getBoundingClientRect(); const px = (x / innerWidth - .5), py = (y / innerHeight - .5);
    card.style.setProperty('--ry', (px * 34).toFixed(1) + 'deg'); card.style.setProperty('--rx', (-py * 22).toFixed(1) + 'deg'); };
  ov.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { card.classList.remove('idle'); card.style.animation = 'none'; card.style.translate = 'none'; card.style.rotate = 'none'; tilt(e.clientX, e.clientY); } });
  ov.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
})();
