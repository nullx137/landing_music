/* ============================================================
   RitmixLove — Production · interactions
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  };

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header ---------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = $(".nav-toggle");
  const menu = $("#mobileMenu");
  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
  };
  if (toggle && menu) {
    toggle.addEventListener("click", () =>
      setMenu(toggle.getAttribute("aria-expanded") === "true" ? false : true)
    );
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 980) setMenu(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    const gridParents = ["cards-grid", "works-list", "steps", "pricing-grid"];
    reveals.forEach((el, i) => {
      const parent = el.parentElement;
      if (parent && gridParents.some((c) => parent.classList.contains(c))) {
        el.style.transitionDelay = Math.min((i % 6) * 70, 350) + "ms";
      }
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Category card glow tracking ---------- */
  $$("[data-glow]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ============================================================
     Audio players — real HTML5 audio
     ============================================================ */
  const tracks = $$("[data-track]");
  let activePlayer = null;

  function buildBars(waveEl) {
    const bars = $(".track__bars", waveEl);
    if (!bars || bars.childElementCount) return;
    const count = window.matchMedia("(max-width: 640px)").matches ? 40 : 64;
    let html = "";
    for (let i = 0; i < count; i++) {
      const h = 24 + Math.abs(Math.sin(i * 0.5) * 36 + Math.cos(i * 0.21) * 22) + (i % 5) * 6;
      html += '<i style="--h:' + Math.min(h, 96) + '%"></i>';
    }
    bars.innerHTML = html;
  }

  class TrackPlayer {
    constructor(el) {
      this.el = el;
      this.fallbackDuration = parseInt(el.dataset.duration, 10) || 180;
      this.playing = false;

      this.wave = $(".track__wave", el);
      this.progress = $(".track__progress", el);
      this.handle = $(".track__handle", el);
      this.playBtn = $(".play-btn", el);
      this.curEl = $(".cur", el);
      this.durEl = $(".dur", el);

      buildBars(this.wave);
      this.bars = $$(".track__bars i", el);

      this.audio = new Audio(el.dataset.src || "");
      this.audio.preload = "metadata";

      const setDur = () => {
        if (isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.durEl.textContent = fmtTime(this.audio.duration);
        }
      };
      this.audio.addEventListener("loadedmetadata", setDur);
      this.audio.addEventListener("durationchange", setDur);
      this.audio.addEventListener("timeupdate", () => this.render());
      this.audio.addEventListener("ended", () => { this.audio.currentTime = 0; this.render(); });
      this.audio.addEventListener("play", () => { this.playing = true; this.el.classList.add("playing"); });
      this.audio.addEventListener("pause", () => { this.playing = false; this.el.classList.remove("playing"); });

      this.durEl.textContent = fmtTime(this.fallbackDuration);

      this.playBtn.addEventListener("click", (e) => { e.stopPropagation(); this.toggle(); });
      this.wave.addEventListener("click", (e) => this.seekFromEvent(e));
      this.wave.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { this.seek(Math.max(0, this.audio.currentTime - 5)); e.preventDefault(); }
        if (e.key === "ArrowRight") { this.seek(this.audio.currentTime + 5); e.preventDefault(); }
        if (e.key === " " || e.key === "Enter") { this.toggle(); e.preventDefault(); }
      });
    }

    get duration() {
      return (isFinite(this.audio.duration) && this.audio.duration > 0)
        ? this.audio.duration : this.fallbackDuration;
    }

    toggle() { this.playing ? this.pause() : this.play(); }

    play() {
      if (activePlayer && activePlayer !== this) activePlayer.pause();
      activePlayer = this;
      const p = this.audio.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    }

    pause() {
      this.audio.pause();
      if (activePlayer === this) activePlayer = null;
    }

    seekFromEvent(e) {
      const r = this.wave.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      this.seek(ratio * this.duration);
    }

    seek(time) {
      this.audio.currentTime = Math.min(this.duration, Math.max(0, time));
      if (!this.playing) this.render();
    }

    render() {
      const cur = this.audio.currentTime || 0;
      const ratio = this.duration ? cur / this.duration : 0;
      const pct = ratio * 100;
      this.progress.style.width = pct + "%";
      this.handle.style.left = pct + "%";
      this.curEl.textContent = fmtTime(cur);
      const played = Math.round(ratio * this.bars.length);
      this.bars.forEach((b, i) => b.classList.toggle("played", i < played));
      if (this.wave) this.wave.setAttribute("aria-valuenow", Math.round(ratio * 100));
    }
  }

  const players = tracks.map((t) => new TrackPlayer(t));
  players.forEach((p) => p.render());

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && activePlayer) activePlayer.pause();
  });

  /* ---------- "Слушать больше примеров" — reveal hidden tracks ---------- */
  const loadMore = $("#loadMore");
  if (loadMore) {
    loadMore.addEventListener("click", (e) => {
      e.preventDefault();
      $$(".track--more[hidden]").forEach((t) => {
        t.hidden = false;
        t.style.opacity = "0";
        t.style.transform = "translateY(20px)";
        requestAnimationFrame(() => {
          t.style.opacity = "1";
          t.style.transform = "none";
        });
      });
      loadMore.style.display = "none";
    });
  }

  /* ============================================================
     Reviews carousel
     ============================================================ */
  const track = $("#reviewsTrack");
  if (track) {
    const cards = $$(".review-card", track);
    const prevBtn = $("#reviewPrev");
    const nextBtn = $("#reviewNext");
    const dotsWrap = $("#reviewDots");
    let index = 0;
    let perView = 3;
    let dragStart = null, dragOffset = 0, dragging = false;

    const computePerView = () => {
      const w = window.innerWidth;
      perView = w <= 640 ? 1 : w <= 980 ? 2 : 3;
    };
    const maxIndex = () => Math.max(0, cards.length - perView);

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex(); i++) {
        const b = document.createElement("button");
        b.setAttribute("aria-label", "Перейти к отзыву " + (i + 1));
        b.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(b);
      }
    };

    const update = () => {
      index = Math.min(index, maxIndex());
      const card = cards[0];
      const step = card.getBoundingClientRect().width + 20;
      track.style.transform = `translateX(${-index * step}px)`;
      $$(".reviews-dots button").forEach((d, i) => d.classList.toggle("active", i === index));
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();
    };

    const goTo = (i) => { index = Math.min(Math.max(0, i), maxIndex()); update(); };
    const next = () => { if (index < maxIndex()) { index++; update(); } };
    const prev = () => { if (index > 0) { index--; update(); } };

    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);
    [prevBtn, nextBtn].forEach((b) => b && b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }));

    const onDown = (e) => { dragging = true; dragStart = (e.touches ? e.touches[0].clientX : e.clientX); dragOffset = 0; track.style.transition = "none"; };
    const onMove = (e) => {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      dragOffset = x - dragStart;
      const card = cards[0];
      const step = card.getBoundingClientRect().width + 20;
      track.style.transform = `translateX(${-index * step + dragOffset}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      const card = cards[0];
      const step = card.getBoundingClientRect().width + 20;
      if (Math.abs(dragOffset) > step * 0.2) { dragOffset < 0 ? next() : prev(); }
      else update();
    };

    track.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    track.addEventListener("touchstart", onDown, { passive: true });
    track.addEventListener("touchmove", onMove, { passive: true });
    track.addEventListener("touchend", onUp);
    track.addEventListener("dragstart", (e) => e.preventDefault());

    let auto = setInterval(() => { if (index >= maxIndex()) goTo(0); else next(); }, 5000);
    const carousel = $(".reviews-carousel");
    if (carousel) {
      carousel.addEventListener("mouseenter", () => clearInterval(auto));
      carousel.addEventListener("mouseleave", () => {
        auto = setInterval(() => { if (index >= maxIndex()) goTo(0); else next(); }, 5000);
      });
    }

    const init = () => { computePerView(); buildDots(); index = 0; update(); };
    init();
    let rT;
    window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(init, 150); });
  }
})();
