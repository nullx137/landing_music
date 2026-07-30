/* ============================================================
   RitmixLove — YouTube releases feed
   ------------------------------------------------------------
   Primary:  YouTube Data API v3 (set YOUTUBE.apiKey below).
   Fallback: channel RSS via a public CORS proxy (no key needed).
   Degrade:  styled subscribe prompt if everything is blocked.

   HOW TO ENABLE THE API (recommended, fully dynamic):
     1. Google Cloud Console → create/choose a project.
     2. Enable "YouTube Data API v3".
     3. Create an API key → restrict it by "HTTP referrer" to your
        domain(s) so it can't be reused elsewhere.
     4. Paste it into YOUTUBE.apiKey below.

   The key only reads *public* channel data, which is safe to ship
   client-side when restricted by referrer. New uploads appear as the
   first card automatically — the feed is fetched live on every load.
   ============================================================ */
(function () {
  "use strict";

  const YOUTUBE = {
    apiKey: "",                              // <-- paste your YouTube Data API v3 key here
    handle: "@RitmixLOVE",                   // channel handle (with or without @)
    channelId: "",                           // optional UC… id; skips handle resolution
    channelUrl: "https://www.youtube.com/@RitmixLOVE/",
    maxResults: 12,
    // public CORS proxies tried in order for the no-key RSS fallback
    corsProxies: [
      (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
      (u) => "https://corsproxy.io/?url=" + encodeURIComponent(u),
      (u) => "https://thingproxy.freeboard.io/fetch/" + u,
    ],
  };

  const API_BASE = "https://www.googleapis.com/youtube/v3";
  const RU_DATE = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const $ = (s, c = document) => c.querySelector(s);

  const track = $("#ytTrack");
  if (!track) return; // section not present

  const prevBtn = $("#ytPrev");
  const nextBtn = $("#ytNext");
  const modal = $("#ytModal");
  const modalFrame = $("#ytModalFrame");

  /* ---------- helpers ---------- */
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  function thumbUrl(id, apiThumb) {
    // Prefer API-provided thumbnail, else build from id; maxres may 404 → onerror to hqdefault
    const src = apiThumb || ("https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg");
    const fb = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    return { src, fb };
  }

  function renderSkeletons(n) {
    let html = "";
    for (let i = 0; i < n; i++) {
      html += '<div class="yt-skel"><div class="yt-skel__thumb"></div><div class="yt-skel__lines"><span></span><span></span></div></div>';
    }
    track.innerHTML = html;
  }

  function renderVideos(videos) {
    if (!videos.length) return renderError("На канале пока нет публичных видео.");
    track.innerHTML = videos.map((v) => {
      const t = thumbUrl(v.id, v.thumb);
      return (
        '<article class="yt-card" data-id="' + v.id + '" tabindex="0" role="button" aria-label="Смотреть: ' + escapeHtml(v.title) + '">' +
          '<div class="yt-card__thumb">' +
            '<img src="' + t.src + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + t.fb + "'\" />" +
            '<span class="yt-card__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg></span>' +
          '</div>' +
          '<div class="yt-card__body">' +
            '<h3 class="yt-card__title">' + escapeHtml(v.title) + '</h3>' +
            '<span class="yt-card__date" aria-hidden="true">📅 ' + (v.date || "") + '</span>' +
          '</div>' +
        '</article>'
      );
    }).join("");
    wireCards();
    updateArrows();
  }

  function renderError(message) {
    track.innerHTML =
      '<div class="yt-status yt-status--error">' +
        '<span>' + escapeHtml(message) + '</span>' +
        '<span class="yt-status__hint">Не удалось загрузить ленту прямо сейчас — возможно, доступ ограничен сетью. Подпишитесь на канал, чтобы не пропустить новые релизы.</span>' +
        '<a href="' + YOUTUBE.channelUrl + '" target="_blank" rel="noopener" class="btn btn--youtube">Открыть YouTube-канал</a>' +
      '</div>';
  }

  /* ---------- card interactions ---------- */
  function wireCards() {
    track.querySelectorAll(".yt-card").forEach((card) => {
      const open = () => openModal(card.dataset.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  /* ---------- carousel arrows ---------- */
  function cardStep() {
    const first = track.querySelector(".yt-card");
    if (!first) return 320;
    return first.getBoundingClientRect().width + 18; // 18 = gap
  }
  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    const hasCards = !!track.querySelector(".yt-card");
    prevBtn.disabled = !hasCards || track.scrollLeft <= 4;
    nextBtn.disabled = !hasCards || track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }
  if (prevBtn) prevBtn.addEventListener("click", () => track.scrollBy({ left: -cardStep(), behavior: "smooth" }));
  if (nextBtn) nextBtn.addEventListener("click", () => track.scrollBy({ left: cardStep(), behavior: "smooth" }));
  track.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);

  /* ---------- modal / lightbox ---------- */
  function openModal(id) {
    if (!modal || !modalFrame) return window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
    modalFrame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" ' +
      'title="Видео YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modalFrame.innerHTML = ""; // stops playback
    document.body.style.overflow = "";
  }
  if (modal) {
    $("#ytModalClose").addEventListener("click", closeModal);
    $("#ytModalBackdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  }

  /* ============================================================
     DATA SOURCES
     ============================================================ */

  /* ---- Primary: YouTube Data API v3 ---- */
  async function fetchViaApi() {
    const key = YOUTUBE.apiKey;
    if (!key) return null;

    let channelId = YOUTUBE.channelId;
    let uploadsPlaylist;

    if (!channelId) {
      const handle = YOUTUBE.handle.replace(/^@/, "");
      const chRes = await fetch(API_BASE + "/channels?part=contentDetails,snippet&forHandle=" + encodeURIComponent("@" + handle) + "&key=" + key);
      if (!chRes.ok) throw new Error("channels.list HTTP " + chRes.status);
      const chJson = await chRes.json();
      const ch = chJson.items && chJson.items[0];
      if (!ch) throw new Error("Канал не найден по handle " + YOUTUBE.handle);
      channelId = ch.id;
      uploadsPlaylist = ch.contentDetails && ch.contentDetails.relatedPlaylists && ch.contentDetails.relatedPlaylists.uploads;
    }

    if (!uploadsPlaylist && channelId) {
      uploadsPlaylist = channelId.replace(/^UC/, "UU"); // uploads playlist = UC → UU
    }
    if (!uploadsPlaylist) throw new Error("Не удалось определить плейлист загрузок");

    const plRes = await fetch(API_BASE + "/playlistItems?part=snippet&playlistId=" + uploadsPlaylist + "&maxResults=" + YOUTUBE.maxResults + "&key=" + key);
    if (!plRes.ok) throw new Error("playlistItems.list HTTP " + plRes.status);
    const plJson = await plRes.json();

    return (plJson.items || []).map((it) => {
      const s = it.snippet || {};
      const vId = s.resourceId && s.resourceId.videoId;
      const th = s.thumbnails || {};
      return {
        id: vId,
        title: s.title || "Без названия",
        date: s.publishedAt ? RU_DATE.format(new Date(s.publishedAt)) : "",
        thumb: (th.maxres && th.maxres.url) || (th.standard && th.standard.url) || (th.high && th.high.url) || (th.medium && th.medium.url) || null,
      };
    }).filter((v) => v.id);
  }

  /* ---- Fallback: RSS via CORS proxy (no API key) ---- */
  async function tryProxy(url) {
    let lastErr;
    for (const wrap of YOUTUBE.corsProxies) {
      try {
        const res = await fetch(wrap(url), { headers: { "Accept": "application/xml,text/xml,*/*" } });
        if (res.ok) return await res.text();
        lastErr = new Error("proxy HTTP " + res.status);
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("Все прокси недоступны");
  }

  async function resolveChannelIdNoKey() {
    if (YOUTUBE.channelId) return YOUTUBE.channelId;
    const html = await tryProxy("https://www.youtube.com/" + YOUTUBE.handle);
    const m = html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/channel\/(UC[A-Za-z0-9_-]{22})/);
    if (!m) throw new Error("channelId не найден на странице канала");
    return m[1];
  }

  async function fetchViaRss() {
    const channelId = await resolveChannelIdNoKey();
    const xml = await tryProxy("https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId);
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("RSS parse error");
    const YT_NS = "http://www.youtube.com/xml/schemas/2015";
    const MEDIA_NS = "http://search.yahoo.com/mrss/";
    const entries = Array.from(doc.getElementsByTagName("entry")).slice(0, YOUTUBE.maxResults);
    return entries.map((entry) => {
      const videoIdEl = entry.getElementsByTagNameNS(YT_NS, "videoId")[0];
      let id = videoIdEl ? videoIdEl.textContent : "";
      if (!id) {
        const link = entry.getElementsByTagName("link")[0];
        if (link) { const m = (link.getAttribute("href") || "").match(/[?&]v=([A-Za-z0-9_-]{11})/); if (m) id = m[1]; }
      }
      const title = (entry.getElementsByTagName("title")[0] || {}).textContent || "Без названия";
      const pub = (entry.getElementsByTagName("published")[0] || {}).textContent || "";
      const thumbEl = entry.getElementsByTagNameNS(MEDIA_NS, "thumbnail")[0];
      return {
        id,
        title,
        date: pub ? RU_DATE.format(new Date(pub)) : "",
        thumb: thumbEl ? thumbEl.getAttribute("url") : null,
      };
    }).filter((v) => v.id);
  }

  /* ---------- init ---------- */
  async function init() {
    renderSkeletons(3);
    try {
      let videos = null;
      if (YOUTUBE.apiKey) {
        try { videos = await fetchViaApi(); }
        catch (e) { console.warn("[YouTube] API path failed, falling back to RSS:", e.message); videos = null; }
      }
      if (!videos) videos = await fetchViaRss();
      renderVideos(videos);
    } catch (e) {
      console.warn("[YouTube] Feed unavailable:", e.message);
      renderError("Не удалось загрузить видео с YouTube.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
