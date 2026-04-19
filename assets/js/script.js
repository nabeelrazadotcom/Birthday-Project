// ========================= STATE =========================
let current = "s1";
document.body.dataset.screen = current;

let countdownTimer = null;
let timeCounterTimer = null;
let noEscaped = 0;

let blownCount = 0;
let blowSequenceTimer = null;
const TOTAL_CANDLES = 3;
let cakeButtonMode = "blow";

let world = "daydream";
let secretWorldActive = false;
let previousWorldBeforeSecret = "daydream";

// ========================= HELPERS =========================
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function getCenterRect(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function setUseHref(svgEl, symbolId) {
  if (!svgEl) return;
  const use = svgEl.querySelector("use");
  if (!use) return;
  use.setAttribute("href", symbolId);
}

function markTick(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.classList.remove("tick");
  void box.offsetWidth;
  box.classList.add("tick");
  clearTimeout(box._tickTimer);
  box._tickTimer = setTimeout(() => box.classList.remove("tick"), 580);
}

// ========================= PETALS =========================
(function createPetals() {
  const bg = document.getElementById("petalsBg");
  if (!bg) return;
  bg.innerHTML = "";
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "petal";
    const sz = 6 + Math.random() * 12;
    p.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${sz}px;height:${sz}px;
      animation-duration:${5 + Math.random() * 9}s;
      animation-delay:${Math.random() * 8}s;
      opacity:${0.18 + Math.random() * 0.28};
      filter: blur(${Math.random() * 0.8}px);
    `;
    bg.appendChild(p);
  }
})();

// ========================= WORLD (THEME) =========================
function applyWorld(nextWorld, opts = {}) {
  world = nextWorld;
  document.documentElement.setAttribute("data-world", nextWorld);
  localStorage.setItem("world", nextWorld);

  const lbl = document.getElementById("themeLbl");
  const sub = document.getElementById("themeSub");
  const icon = document.getElementById("themeIcon");

  if (lbl)
    lbl.textContent = nextWorld === "starlit" ? "Back to Day" : "Enter Night";
  if (sub)
    sub.textContent =
      nextWorld === "starlit" ? "Starlit World" : "Daydream World";
  if (icon)
    setUseHref(icon, nextWorld === "starlit" ? "#ico-star" : "#ico-portal");

  if (opts.portalPoint) {
    playWorldPortal(opts.portalPoint.x, opts.portalPoint.y, nextWorld);
  }
}

function toggleTheme() {
  const btn = document.getElementById("themeBtn");
  const rect = btn
    ? btn.getBoundingClientRect()
    : { left: innerWidth / 2, top: 18, width: 1, height: 1 };
  const pt = getCenterRect(rect);

  // If the secret world is active, toggling returns to the previous base world.
  if (secretWorldActive) {
    secretWorldActive = false;
    applyWorld(previousWorldBeforeSecret, { portalPoint: pt });
    return;
  }

  applyWorld(world === "starlit" ? "daydream" : "starlit", { portalPoint: pt });
}

function playWorldPortal(x, y, nextWorld) {
  const portal = document.getElementById("worldPortal");
  if (!portal) return;

  portal.style.setProperty("--x", `${x}px`);
  portal.style.setProperty("--y", `${y}px`);
  portal.setAttribute("data-to", nextWorld);

  portal.classList.remove("play");
  // Force reflow so repeated toggles retrigger the animation.
  void portal.offsetWidth;
  portal.classList.add("play");

  window.setTimeout(() => portal.classList.remove("play"), 900);
}

(function initWorldFromStorage() {
  const saved = localStorage.getItem("world");
  if (saved === "daydream" || saved === "starlit" || saved === "aquaria") {
    world = saved;
    document.documentElement.setAttribute("data-world", saved);
  } else {
    document.documentElement.setAttribute("data-world", world);
  }
  applyWorld(world, { portalPoint: null });
})();

// ========================= SCREEN NAVIGATION =========================
function navigateTo(targetId, anim, triggerEl = null) {
  const cur = document.getElementById(current);
  const tgt = document.getElementById(targetId);
  if (!cur || !tgt) return;

  if (triggerEl && typeof triggerEl.getBoundingClientRect === "function") {
    const rect = triggerEl.getBoundingClientRect();
    const x = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
    const y = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;
    document.documentElement.style.setProperty("--nav-origin-x", x);
    document.documentElement.style.setProperty("--nav-origin-y", y);
    if (triggerEl.classList && triggerEl.classList.contains("btn-main")) {
      triggerEl.classList.add("is-launching");
      setTimeout(() => triggerEl.classList.remove("is-launching"), 760);
    }
  }

  if (current === "s4" && targetId !== "s4") {
    stopFireworks();
    const fw = document.getElementById("fw-canvas");
    if (fw) fw.style.display = "none";
  }

  document.body.dataset.screen = targetId;

  cur.classList.add("leaving");
  if (anim === "button-zoom") cur.classList.add("zoom-leave");
  cur.classList.remove("active");

  tgt.classList.add("active");
  tgt.classList.add("entering");
  if (anim) tgt.setAttribute("data-anim", anim);

  window.setTimeout(() => {
    cur.classList.remove("leaving");
    cur.classList.remove("zoom-leave");
    tgt.classList.remove("entering");
    current = targetId;

    if (targetId === "s2") startCountdown();
    if (targetId === "s4") resetCakeScene();
    if (targetId === "s5") initGame();
    if (targetId === "sf") {
      startHeartRain();
      startTimeCounter();
    }
  }, 520);
}

// ========================= RIPPLE EFFECT =========================
function ripple(x, y, color) {
  const ov = document.getElementById("rippleOverlay");
  if (!ov) return;
  const c = document.createElement("div");
  c.className = "ripple-circle";
  const sz = 92;
  c.style.cssText = `width:${sz}px;height:${sz}px;left:${x - sz / 2}px;top:${y - sz / 2}px;background:${color}`;
  ov.appendChild(c);
  setTimeout(() => c.remove(), 1000);
}

// ========================= COUNTDOWN =========================
function startCountdown() {
  // EDIT: Change year to the current birthday year if needed.
  const birthday = new Date(2026, 4, 5, 0, 0, 0);

  if (countdownTimer) clearInterval(countdownTimer);

  function tick() {
    const diff = birthday - Date.now();
    if (diff <= 0) {
      const grid = document.getElementById("cdGrid");
      if (grid) {
        grid.innerHTML =
          '<div class="bday-now df" style="grid-column:1/-1"><span class="bday-now-ico" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ico-sparkle"></use></svg></span>Today is your day</div>';
      }
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    [
      ["cdD", "cdBoxD", d],
      ["cdH", "cdBoxH", h],
      ["cdM", "cdBoxM", m],
      ["cdS", "cdBoxS", s],
    ].forEach(([numId, boxId, value]) => {
      const el = document.getElementById(numId);
      if (!el) return;
      const nextValue = String(value).padStart(2, "0");
      if (el.textContent !== nextValue) {
        el.textContent = nextValue;
        markTick(boxId);
      }
    });
  }

  tick();
  countdownTimer = setInterval(tick, 1000);
}

// ========================= NO BUTTON (SCREEN 3) =========================
function getNoSafeBounds(btn) {
  const wrap = document.getElementById("ynWrap");
  const pad = 10;
  const btnW = btn.offsetWidth || 120;
  const btnH = btn.offsetHeight || 48;
  const wrapW = wrap ? wrap.clientWidth : 320;
  const wrapH = wrap ? wrap.clientHeight : 180;

  return {
    left: pad,
    top: pad,
    right: Math.max(pad, wrapW - btnW - pad),
    bottom: Math.max(pad, wrapH - btnH - pad),
  };
}

function moveNoButton(btn, opts = {}) {
  const bounds = getNoSafeBounds(btn);
  const tries = 10;
  const avoidX = typeof opts.avoidX === "number" ? opts.avoidX : null;
  const avoidY = typeof opts.avoidY === "number" ? opts.avoidY : null;
  const minDist = typeof opts.minDist === "number" ? opts.minDist : 140;

  let best = { x: bounds.left, y: bounds.top, d: -1 };
  for (let i = 0; i < tries; i++) {
    const x =
      bounds.left + Math.random() * Math.max(1, bounds.right - bounds.left);
    const y =
      bounds.top + Math.random() * Math.max(1, bounds.bottom - bounds.top);
    const d =
      avoidX == null || avoidY == null
        ? 9999
        : Math.hypot(x - avoidX, y - avoidY);
    if (d > best.d) best = { x, y, d };
    if (d >= minDist) break;
  }

  btn.style.left = `${best.x}px`;
  btn.style.top = `${best.y}px`;
  btn.style.bottom = "auto";

  btn.classList.add("is-running");
  clearTimeout(btn._runT);
  btn._runT = setTimeout(() => btn.classList.remove("is-running"), 260);
}

function armNoButton() {
  const btn = document.getElementById("noBtn");
  const wrap = document.getElementById("ynWrap");
  if (!btn || !wrap) return;

  // Make sure it starts visible near the Yes button, inside bounds.
  btn.style.opacity = "1";
  btn.style.transform = "";

  const approxX = wrap.clientWidth * 0.72;
  const approxY = wrap.clientHeight * 0.76;

  // Wait a frame so layout is stable.
  requestAnimationFrame(() => {
    moveNoButton(btn, { avoidX: approxX, avoidY: approxY, minDist: 40 });
  });
}

function runAway(e) {
  e.preventDefault();
  const btn = document.getElementById("noBtn");
  if (!btn) return;

  noEscaped++;
  const txt = document.getElementById("noTxt");

  const wrap = document.getElementById("ynWrap");
  const rect = wrap ? wrap.getBoundingClientRect() : { left: 0, top: 0 };
  const avoidX =
    "clientX" in e ? e.clientX - rect.left : wrap ? wrap.clientWidth / 2 : 160;
  const avoidY =
    "clientY" in e ? e.clientY - rect.top : wrap ? wrap.clientHeight / 2 : 90;
  moveNoButton(btn, { avoidX, avoidY, minDist: 170 });

  if (txt) {
    if (noEscaped === 3) txt.textContent = "Nope";
    if (noEscaped === 6) txt.textContent = "...";
    if (noEscaped === 9) txt.textContent = "Still no";
  }
}

function onYes() {
  const noBtn = document.getElementById("noBtn");
  if (noBtn) {
    noBtn.style.opacity = "0";
    noBtn.style.transform = "scale(0.8)";
  }
  ripple(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "rgba(34,211,238,0.45)",
  );
  setTimeout(() => navigateTo("s4", "curtain"), 650);
}

// ========================= PHOTO CLICK - SECRET WORLD =========================
function photoClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const pt = getCenterRect(rect);

  if (!secretWorldActive) {
    secretWorldActive = true;
    previousWorldBeforeSecret = world === "aquaria" ? "daydream" : world;
    applyWorld("aquaria", { portalPoint: pt });
    ripple(pt.x, pt.y, "rgba(34,211,238,0.55)");
  } else {
    secretWorldActive = false;
    applyWorld(previousWorldBeforeSecret, { portalPoint: pt });
    ripple(pt.x, pt.y, "rgba(255,77,125,0.55)");
  }
}

// ========================= BALLOON POP =========================
function popBalloon(el) {
  el.style.transform = "scale(1.3)";
  el.style.transition = "transform 0.1s ease, opacity 0.3s ease";
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "scale(0)";
  }, 100);
  setTimeout(() => el.remove(), 420);
}

// ========================= CANDLES =========================
blownCount = 0;
function extinguishCandle(i) {
  const c = document.getElementById("c" + i);
  if (!c || c.classList.contains("out")) return;
  c.classList.add("out");
  blownCount++;

  const hint = document.getElementById("blowHint");
  if (hint) {
    hint.textContent =
      blownCount < TOTAL_CANDLES
        ? `${TOTAL_CANDLES - blownCount} candle${TOTAL_CANDLES - blownCount > 1 ? "s" : ""} left`
        : "";
  }
  if (blownCount === TOTAL_CANDLES) onAllBlown();
}

function resetCakeScene() {
  clearTimeout(blowSequenceTimer);
  blownCount = 0;
  cakeButtonMode = "blow";
  for (let i = 0; i < TOTAL_CANDLES; i++) {
    const candle = document.getElementById("c" + i);
    if (candle) candle.classList.remove("out");
  }
  const blowBtn = document.getElementById("blowBtn");
  if (blowBtn) {
    blowBtn.disabled = false;
    blowBtn.classList.remove("is-next");
    blowBtn.innerHTML =
      '<span class="btn-ico" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ico-sparkle"></use></svg></span>Click to blow the candles';
  }
  const hint = document.getElementById("blowHint");
  if (hint)
    hint.textContent = "Tap the button and let the glow melt into the night.";
  const heading = document.getElementById("cakeHeading");
  if (heading) {
    heading.textContent = "Click once and let the candles surrender.";
    heading.classList.remove("is-celebrating");
  }
  const kicker = document.getElementById("cakeKicker");
  if (kicker) kicker.textContent = "Make a wish";
  const screen = document.getElementById("s4");
  if (screen) screen.classList.remove("celebration-night");
  stopFireworks();
  const fw = document.getElementById("fw-canvas");
  if (fw) fw.style.display = "none";
}

function handleCakeButton() {
  if (cakeButtonMode === "next") {
    const blowBtn = document.getElementById("blowBtn");
    navigateTo("s5", "letter-rise", blowBtn);
    return;
  }
  blowCandles();
}

function blowCandles() {
  const blowBtn = document.getElementById("blowBtn");
  if (blowBtn && blowBtn.disabled) return;
  if (blowBtn) {
    blowBtn.disabled = true;
    blowBtn.innerHTML =
      '<span class="btn-ico" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ico-star"></use></svg></span>Watch the magic';
  }

  let idx = 0;
  function next() {
    extinguishCandle(idx);
    idx++;
    if (idx < TOTAL_CANDLES) blowSequenceTimer = setTimeout(next, 220);
  }
  next();
}

function onAllBlown() {
  const hint = document.getElementById("blowHint");
  if (hint) hint.textContent = "The sky is lit up just for you.";
  const blowBtn = document.getElementById("blowBtn");
  cakeButtonMode = "next";
  if (blowBtn) {
    blowBtn.disabled = false;
    blowBtn.classList.add("is-next");
    blowBtn.innerHTML =
      '<span class="btn-ico" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><use href="#ico-arrow"></use></svg></span>Let\'s move on';
  }
  const heading = document.getElementById("cakeHeading");
  if (heading) {
    heading.textContent = "Happy Birthday";
    heading.classList.add("is-celebrating");
  }
  const kicker = document.getElementById("cakeKicker");
  if (kicker) kicker.textContent = "Tonight is yours";
  const screen = document.getElementById("s4");
  if (screen) screen.classList.add("celebration-night");
  launchFireworks();
}

// ========================= FIREWORKS =========================
let fwParticles = [];
let fwShells = [];
let fwFrame = null;
let fwRunning = false;
let fwLaunchTimer = null;

function launchFireworks() {
  const canvas = document.getElementById("fw-canvas");
  if (!canvas) return;
  stopFireworks();
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  fwParticles = [];
  fwShells = [];
  fwRunning = true;

  function burst(x, y, colorSet) {
    const colors = colorSet || [
      "#ff4d7d",
      "#ffb703",
      "#22d3ee",
      "#34d399",
      "#a78bfa",
      "#ffffff",
    ];
    const count = 84;
    for (let i = 0; i < count; i++) {
      const angle = ((Math.PI * 2) / count) * i;
      const speed = 1.8 + Math.random() * 4.8;
      fwParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.6 + Math.random() * 2.8,
        decay: 0.011 + Math.random() * 0.012,
        trail: [],
      });
    }
  }

  function queueShell() {
    if (!fwRunning) return;
    const palette = [
      ["#ff4d7d", "#ff8fab", "#ffd166", "#ffffff"],
      ["#22d3ee", "#60a5fa", "#a78bfa", "#ffffff"],
      ["#ffb703", "#fb7185", "#f9fafb", "#f97316"],
    ];
    fwShells.push({
      x: 90 + Math.random() * (canvas.width - 180),
      y: canvas.height + 12,
      targetY: 90 + Math.random() * (canvas.height * 0.34),
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(7.8 + Math.random() * 1.8),
      colorSet: palette[Math.floor(Math.random() * palette.length)],
      color: "#ffffff",
    });
    fwLaunchTimer = setTimeout(queueShell, 420 + Math.random() * 260);
  }
  queueShell();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fwShells = fwShells.filter((shell) => shell.y > shell.targetY);
    fwShells.forEach((shell) => {
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shell.x, shell.y + 12);
      ctx.lineTo(shell.x, shell.y + 28);
      ctx.stroke();
      ctx.fillStyle = shell.color;
      ctx.beginPath();
      ctx.arc(shell.x, shell.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      shell.x += shell.vx;
      shell.y += shell.vy;
      shell.vy += 0.05;
      if (shell.y <= shell.targetY) {
        burst(shell.x, shell.y, shell.colorSet);
        shell.y = -999;
      }
    });

    fwParticles = fwParticles.filter((p) => p.alpha > 0);
    fwParticles.forEach((p) => {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 4) p.trail.shift();
      ctx.globalAlpha = p.alpha * 0.45;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size * 0.5);
      ctx.beginPath();
      p.trail.forEach((t, index) => {
        if (index === 0) ctx.moveTo(t.x, t.y);
        else ctx.lineTo(t.x, t.y);
      });
      ctx.stroke();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045;
      p.vx *= 0.986;
      p.alpha -= p.decay;
    });
    ctx.globalAlpha = 1;

    if (fwRunning) fwFrame = requestAnimationFrame(draw);
  }
  draw();
}

function stopFireworks() {
  fwRunning = false;
  if (fwFrame) cancelAnimationFrame(fwFrame);
  if (fwLaunchTimer) clearTimeout(fwLaunchTimer);
  fwFrame = null;
  fwLaunchTimer = null;
  fwParticles = [];
  fwShells = [];
}

// ========================= MEMORY GAME =========================
const gameIcons = ["rose", "heart", "sparkle", "star"];
let flipped = [];
let matched = 0;
let canFlip = true;

function shuffle(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

function iconSvg(name, cls = "game-ico") {
  const map = {
    rose: "#ico-rose",
    heart: "#ico-heart",
    sparkle: "#ico-sparkle",
    star: "#ico-star",
  };
  const href = map[name] || "#ico-sparkle";
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="${href}"></use></svg>`;
}

function initGame() {
  const grid = document.getElementById("gameGrid");
  if (!grid) return;
  grid.innerHTML = "";
  flipped = [];
  matched = 0;
  canFlip = true;
  const status = document.getElementById("gStatus");
  if (status) status.textContent = "";
  const openBtn = document.querySelector(".letter-finale");
  if (openBtn) openBtn.classList.remove("show");

  const deck = shuffle([...gameIcons, ...gameIcons]);
  deck.forEach((key) => {
    const card = document.createElement("div");
    card.className = "g-card";
    card.dataset.key = key;
    card.innerHTML = `<div class="g-inner"><div class="g-face">${iconSvg("sparkle", "game-ico game-ico-face")}</div><div class="g-back">${iconSvg(key)}</div></div>`;
    card.addEventListener("click", () => flipCard(card));
    grid.appendChild(card);
  });
}

function flipCard(card) {
  if (!canFlip) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched"))
    return;
  card.classList.add("flipped");
  flipped.push(card);
  if (flipped.length === 2) {
    canFlip = false;
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flipped;
  const status = document.getElementById("gStatus");
  if (!a || !b) return;

  if (a.dataset.key === b.dataset.key) {
    a.classList.add("matched");
    b.classList.add("matched");
    matched++;
    flipped = [];
    canFlip = true;
    if (matched === 4) {
      if (status)
        status.textContent = "You found them all. Your letter is ready.";
      const openBtn = document.querySelector(".letter-finale");
      if (openBtn) openBtn.classList.add("show");
    }
  } else {
    if (status) status.textContent = "Not a match - try again.";
    setTimeout(() => {
      a.classList.remove("flipped");
      b.classList.remove("flipped");
      flipped = [];
      canFlip = true;
      if (status) status.textContent = "";
    }, 1050);
  }
}

// ========================= LOVE LETTER =========================
function showLetter() {
  const ov = document.getElementById("letterOverlay");
  if (ov) ov.classList.add("show");
}

function closeLetter() {
  const ov = document.getElementById("letterOverlay");
  if (ov) ov.classList.remove("show");
  navigateTo("sf", "bloom");
}

// ========================= HEARTS RAIN =========================
function startHeartRain() {
  const rain = document.getElementById("heartRain");
  if (!rain) return;
  rain.innerHTML = "";

  for (let i = 0; i < 24; i++) {
    const h = document.createElement("div");
    h.className = "fh";
    h.innerHTML = `<svg class="ico fh-ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-heart"></use></svg>`;
    const size = 12 + Math.random() * 18;
    const hue = 330 + Math.random() * 55;
    h.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${size}px;height:${size}px;
      animation-duration:${4 + Math.random() * 6}s;
      animation-delay:${Math.random() * 5}s;
      filter: hue-rotate(${hue}deg) saturate(1.25);
    `;
    rain.appendChild(h);
  }
}

// ========================= TIME COUNTER =========================
function startTimeCounter() {
  // EDIT: Change this to your actual relationship start date.
  const start = new Date(2025, 9, 21); // Jan 1, 2023 - change this

  if (timeCounterTimer) clearInterval(timeCounterTimer);

  function tick() {
    const diff = Date.now() - start;
    const totalH = Math.floor(diff / 3600000);
    const y = Math.floor(totalH / 8760);
    const mo = Math.floor((totalH % 8760) / 730);
    const d = Math.floor(((totalH % 8760) % 730) / 24);
    const h = totalH % 24;
    const elY = document.getElementById("tcY");
    const elMo = document.getElementById("tcMo");
    const elD = document.getElementById("tcD");
    const elH = document.getElementById("tcH");
    if (elY) elY.textContent = y;
    if (elMo) elMo.textContent = mo;
    if (elD) elD.textContent = d;
    if (elH) elH.textContent = h;
  }

  tick();
  timeCounterTimer = setInterval(tick, 60000);
}
