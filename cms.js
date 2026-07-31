/* ============================================================
   RitmixLove — CMS content loader
   Loads content/site.json and renders all editable fields.
   Interaction scripts (script.js, youtube.js) load after render.
   ============================================================ */
(function () {
  "use strict";

  const CONTENT_URL = "content/site.json";
  const INTERACTION_SCRIPTS = ["script.js", "youtube.js"];

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const escapeHtml = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );

  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(Number(s) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  };

  const STEP_ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v12H9l-4 4V5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="2.5" stroke="currentColor" stroke-width="1.7"/><circle cx="18" cy="16" r="2.5" stroke="currentColor" stroke-width="1.7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  const PLAY_ICONS =
    '<svg class="icon-play" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg>' +
    '<svg class="icon-pause" viewBox="0 0 24 24" fill="none"><path d="M9 5h3v14H9zM15 5h3v14h-3z" fill="currentColor"/></svg>';

  const MUSIC_NOTE_SVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.8"/></svg>';

  const YT_SVG =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5a2.5 2.5 0 00-1.8 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 001.8-1.8C23 15.2 23 12 23 12zm-13 3.5v-7l6 3.5-6 3.5z"/></svg>';

  const WA_FAB_SVG =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';

  const SOCIAL_SVGS = {
    instagram:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    youtube:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" stroke-width="1.7"/><path d="M10 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor"/></svg>',
    tiktok:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 4c.5 2.5 2 4 4.5 4.2v3c-1.7 0-3.2-.5-4.5-1.4V15a5.5 5.5 0 11-5.5-5.5v3A2.5 2.5 0 1011 15V4h3z" fill="currentColor"/></svg>',
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.body.appendChild(s);
    });
  }

  function setText(el, text) {
    if (el) el.textContent = text == null ? "" : String(text);
  }

  function setHtml(el, html) {
    if (el) el.innerHTML = html;
  }

  function setHref(el, url) {
    if (el && url != null) el.setAttribute("href", url);
  }

  function setSrc(el, src) {
    if (el && src != null) el.setAttribute("src", src);
  }

  function brandHtml(brand, logo, size) {
    const name = escapeHtml(brand.name || "RitmixLove");
    const sub = escapeHtml(brand.sub || "");
    const logoSrc = escapeHtml(logo || brand.logo || "LOGO.png");
    return (
      '<img src="' + logoSrc + '" alt="" class="brand__logo" width="' + size + '" height="' + size + '" />' +
      '<span class="brand__text">' + name + '<span class="brand__text--sub">' + sub + "</span></span>"
    );
  }

  function navLinksHtml(items) {
    return (items || [])
      .map((item) => '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a>")
      .join("");
  }

  /* ---------- Meta / document ---------- */
  function applyMeta(c) {
    const m = c.meta || {};
    if (m.title) document.title = m.title;
    if (m.lang) document.documentElement.lang = m.lang;
    const desc = $('meta[name="description"]');
    if (desc && m.description) desc.setAttribute("content", m.description);
    const theme = $('meta[name="theme-color"]');
    if (theme && m.themeColor) theme.setAttribute("content", m.themeColor);
  }

  /* ---------- Header / nav ---------- */
  function applyHeader(c) {
    const brand = c.brand || {};
    const logo = (c.images && c.images.logo) || brand.logo || "LOGO.png";
    const orderBtn = (c.buttons && c.buttons.orderNav) || {};

    const brandLink = $(".brand:not(.brand--footer)");
    if (brandLink) {
      setHref(brandLink, brand.homeUrl || "#home");
      brandLink.setAttribute("aria-label", (brand.name || "RitmixLove") + (brand.sub || "") + ", на главную");
      setHtml(brandLink, brandHtml(brand, logo, 38));
    }

    const nav = $(".nav-links");
    if (nav) setHtml(nav, navLinksHtml(c.nav));

    const navCta = $(".nav-cta");
    if (navCta) {
      setHref(navCta, orderBtn.url || "#");
      setHtml(navCta, MUSIC_NOTE_SVG + " " + escapeHtml(orderBtn.label || "Заказать песню"));
    }

    const mobile = $("#mobileMenu");
    if (mobile) {
      const mobileLinks = navLinksHtml(c.nav);
      const mobileCta =
        '<a href="' +
        escapeHtml(orderBtn.url || "#") +
        '" target="_blank" rel="noopener" class="btn btn--primary">' +
        escapeHtml(orderBtn.label || "Заказать песню") +
        "</a>";
      setHtml(mobile, mobileLinks + mobileCta);
    }
  }

  /* ---------- Hero ---------- */
  function applyHero(c) {
    const hero = c.hero || {};
    const buttons = c.buttons || {};
    const images = c.images || {};
    const section = $(".hero");

    if (section && images.heroBackground) {
      section.style.backgroundImage = 'url("' + images.heroBackground.replace(/"/g, "") + '")';
    }

    const content = $(".hero__content");
    if (!content) return;

    const primary = buttons.heroPrimary || {};
    const secondary = buttons.heroSecondary || {};
    const chips = (hero.chips || [])
      .map((chip) => '<li class="chip">' + escapeHtml(chip) + "</li>")
      .join("");

    setHtml(
      content,
      '<span class="eyebrow reveal">' +
        escapeHtml(hero.eyebrow || "") +
        "</span>" +
        '<h1 class="hero__title reveal">' +
        escapeHtml(hero.title || "") +
        "<br />" +
        '<span class="hero__title--accent">' +
        escapeHtml(hero.titleAccent || "") +
        "</span>" +
        "</h1>" +
        '<p class="hero__subtitle reveal">' +
        escapeHtml(hero.subtitle || "") +
        "</p>" +
        '<div class="hero__actions reveal">' +
        '<a href="' +
        escapeHtml(primary.url || "#") +
        '" class="btn btn--primary">' +
        escapeHtml(primary.label || "") +
        "</a>" +
        '<a href="' +
        escapeHtml(secondary.url || "#") +
        '" class="btn btn--ghost">' +
        escapeHtml(secondary.label || "") +
        "</a>" +
        "</div>" +
        '<ul class="chips reveal" aria-label="Ключевые преимущества">' +
        chips +
        "</ul>"
    );
  }

  /* ---------- Advantages ---------- */
  function applyAdvantages(c) {
    const grid = $("#cms-advantages");
    if (!grid) return;
    setHtml(
      grid,
      (c.advantages || [])
        .map(
          (item) =>
            '<article class="adv-card reveal">' +
            '<span class="adv-card__icon">' +
            escapeHtml(item.icon || "") +
            "</span>" +
            '<h3 class="adv-card__title">' +
            escapeHtml(item.title || "") +
            "</h3>" +
            '<p class="adv-card__text">' +
            escapeHtml(item.text || "") +
            "</p>" +
            "</article>"
        )
        .join("")
    );
  }

  /* ---------- Categories ---------- */
  function applyCategories(c) {
    const cat = c.categories || {};
    const head = $("#cms-categories-head");
    if (head) {
      setHtml(
        head,
        '<h2 class="section__title">' +
          escapeHtml(cat.title || "") +
          ' <span class="grad-text">' +
          escapeHtml(cat.titleAccent || "") +
          "</span></h2>"
      );
    }

    const grid = $("#cms-categories");
    if (!grid) return;
    setHtml(
      grid,
      (cat.items || [])
        .map(
          (item) =>
            '<article class="cat-card reveal" data-glow>' +
            '<span class="cat-card__icon">' +
            escapeHtml(item.icon || "") +
            "</span>" +
            '<h3 class="cat-card__title">' +
            escapeHtml(item.title || "") +
            "</h3>" +
            '<p class="cat-card__text">' +
            escapeHtml(item.text || "") +
            "</p>" +
            "</article>"
        )
        .join("")
    );
  }

  /* ---------- Portfolio / tracks ---------- */
  function applyPortfolio(c) {
    const p = c.portfolio || {};
    const head = $("#cms-portfolio-head");
    if (head) {
      setHtml(
        head,
        '<h2 class="section__title">' +
          escapeHtml(p.title || "") +
          ' <span class="grad-text">' +
          escapeHtml(p.titleAccent || "") +
          "</span></h2>"
      );
    }

    const list = $("#worksList");
    if (list) {
      setHtml(
        list,
        (p.tracks || [])
          .map((t, i) => {
            const color = t.color === "blue" ? "blue" : "pink";
            const moreClass = t.hidden ? " track--more" : "";
            const hiddenAttr = t.hidden ? " hidden" : "";
            const dur = Number(t.duration) || 0;
            return (
              '<article class="track track--' +
              color +
              moreClass +
              ' reveal" data-track data-src="' +
              escapeHtml(t.src || "") +
              '" data-duration="' +
              dur +
              '"' +
              hiddenAttr +
              ">" +
              '<div class="track__head">' +
              '<button class="play-btn" aria-label="Слушать ' +
              escapeHtml(t.label || "Пример " + (i + 1)) +
              '">' +
              PLAY_ICONS +
              "</button>" +
              '<div class="track__meta">' +
              '<span class="track__label">' +
              escapeHtml(t.label || "") +
              "</span>" +
              '<h3 class="track__title">' +
              escapeHtml(t.title || "") +
              "</h3>" +
              "</div>" +
              '<div class="track__time"><span class="cur">0:00</span> / <span class="dur">' +
              fmtTime(dur) +
              "</span></div>" +
              "</div>" +
              '<div class="track__wave" role="slider" aria-label="Прогресс воспроизведения" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">' +
              '<div class="track__bars" aria-hidden="true"></div>' +
              '<div class="track__progress"></div>' +
              '<div class="track__handle"></div>' +
              "</div>" +
              "</article>"
            );
          })
          .join("")
      );
    }

    const loadMore = $("#loadMore");
    if (loadMore) setText(loadMore, p.loadMoreLabel || "Слушать больше примеров →");

    const hasHidden = (p.tracks || []).some((t) => t.hidden);
    const moreWrap = $(".works__more");
    if (moreWrap) moreWrap.hidden = !hasHidden;
  }

  /* ---------- YouTube section texts ---------- */
  function applyYoutube(c) {
    const y = c.youtube || {};
    const buttons = c.buttons || {};
    const head = $("#cms-youtube-head");
    if (head) {
      setHtml(
        head,
        '<h2 class="section__title">' +
          escapeHtml(y.title || "") +
          ' <span class="grad-text">' +
          escapeHtml(y.titleAccent || "") +
          "</span></h2>" +
          (y.lead ? '<p class="section__lead">' + escapeHtml(y.lead) + "</p>" : "")
      );
    }

    const status = $("#ytStatus span:last-child") || $("#ytStatus");
    if (status && y.loadingText) {
      const spinner = $("#ytStatus .yt-status__spinner");
      if (spinner && status.id === "ytStatus") {
        /* keep spinner, update text node */
        const spans = $$("#ytStatus span");
        if (spans[1]) setText(spans[1], y.loadingText);
      }
    }

    const sub = $(".yt-cta a");
    const subBtn = buttons.youtubeSubscribe || {};
    if (sub) {
      setHref(sub, subBtn.url || y.channelUrl || "#");
      setHtml(sub, YT_SVG + " " + escapeHtml(subBtn.label || y.subscribeLabel || "YouTube"));
    }
  }

  /* ---------- Pricing ---------- */
  function applyPricing(c) {
    const p = c.pricing || {};
    const head = $("#cms-pricing-head");
    if (head) {
      setHtml(head, '<h2 class="section__title">' + escapeHtml(p.title || "Тарифы") + "</h2>");
    }

    const grid = $("#cms-pricing");
    if (!grid) return;
    const currency = p.currency || "₸";

    setHtml(
      grid,
      (p.packages || [])
        .map((pkg) => {
          const featured = !!pkg.featured;
          const badge = pkg.badge
            ? '<span class="price-card__badge">' + escapeHtml(pkg.badge) + "</span>"
            : "";
          const features = (pkg.features || [])
            .map((f) => "<li><span class=\"check\"></span>" + escapeHtml(f) + "</li>")
            .join("");
          const btnClass = featured ? "btn btn--blue btn--block" : "btn btn--primary btn--block";
          return (
            '<article class="price-card' +
            (featured ? " price-card--featured" : "") +
            ' reveal">' +
            badge +
            '<div class="price-card__head">' +
            '<h3 class="price-card__name">' +
            escapeHtml(pkg.name || "") +
            "</h3>" +
            '<p class="price-card__sub">' +
            escapeHtml(pkg.subtitle || "") +
            "</p>" +
            "</div>" +
            '<ul class="price-card__features">' +
            features +
            "</ul>" +
            '<div class="price-card__foot">' +
            '<div class="price-card__price"><span class="amount">' +
            escapeHtml(pkg.price || "") +
            '</span><span class="currency">' +
            escapeHtml(currency) +
            "</span></div>" +
            '<a href="' +
            escapeHtml(pkg.buttonUrl || "#") +
            '" target="_blank" rel="noopener" class="' +
            btnClass +
            '">' +
            escapeHtml(pkg.buttonLabel || "Заказать") +
            "</a>" +
            "</div>" +
            "</article>"
          );
        })
        .join("")
    );
  }

  /* ---------- Process steps ---------- */
  function applyProcess(c) {
    const proc = c.process || {};
    const head = $("#cms-process-head");
    if (head) {
      setHtml(
        head,
        '<h2 class="section__title">' +
          escapeHtml(proc.title || "") +
          ' <span class="grad-text">' +
          escapeHtml(proc.titleAccent || "") +
          "</span></h2>"
      );
    }

    const stepsEl = $("#cms-steps");
    if (!stepsEl) return;

    const steps = (proc.steps || [])
      .map((s) => {
        const icon = STEP_ICONS[s.icon] || STEP_ICONS.chat;
        return (
          '<article class="step reveal">' +
          '<div class="step__top">' +
          '<div class="step__num">' +
          escapeHtml(s.num || "") +
          "</div>" +
          '<span class="step__icon" aria-hidden="true">' +
          icon +
          "</span>" +
          "</div>" +
          '<h3 class="step__title">' +
          escapeHtml(s.title || "") +
          "</h3>" +
          '<p class="step__text">' +
          escapeHtml(s.text || "") +
          "</p>" +
          "</article>"
        );
      })
      .join("");

    setHtml(stepsEl, '<div class="steps__line" aria-hidden="true"></div>' + steps);
  }

  /* ---------- Reviews ---------- */
  function applyReviews(c) {
    const r = c.reviews || {};
    const head = $("#cms-reviews-head");
    if (head) {
      setHtml(
        head,
        '<h2 class="section__title">' +
          escapeHtml(r.title || "") +
          ' <span class="grad-text">' +
          escapeHtml(r.titleAccent || "") +
          "</span></h2>"
      );
    }

    const track = $("#reviewsTrack");
    if (!track) return;

    setHtml(
      track,
      (r.items || [])
        .map((item) => {
          const stars = "★".repeat(Math.min(5, Math.max(1, Number(item.stars) || 5)));
          const letter = escapeHtml(item.avatarLetter || (item.name || "?").charAt(0));
          const c1 = escapeHtml(item.avatarColor1 || "#ff007a");
          const c2 = escapeHtml(item.avatarColor2 || "#a855f7");
          return (
            '<figure class="review-card">' +
            '<div class="review-card__stars" aria-label="Оценка ' +
            (item.stars || 5) +
            ' из 5">' +
            stars +
            "</div>" +
            '<blockquote class="review-card__text">' +
            escapeHtml(item.text || "") +
            "</blockquote>" +
            '<figcaption class="review-card__person">' +
            '<span class="avatar" style="--a1:' +
            c1 +
            ";--a2:" +
            c2 +
            '">' +
            letter +
            "</span>" +
            '<span class="review-card__who">' +
            '<span class="review-card__name">' +
            escapeHtml(item.name || "") +
            "</span>" +
            '<span class="review-card__loc">' +
            escapeHtml(item.location || "") +
            "</span>" +
            "</span>" +
            "</figcaption>" +
            "</figure>"
          );
        })
        .join("")
    );
  }

  /* ---------- CTA ---------- */
  function applyCta(c) {
    const cta = c.cta || {};
    const buttons = c.buttons || {};
    const title = $(".cta-band__title");
    const sub = $(".cta-band__sub");
    setText(title, cta.title || "");
    setText(sub, cta.subtitle || "");

    const actions = $(".cta-band__actions");
    if (!actions) return;
    const wa = buttons.ctaWhatsapp || {};
    const tg = buttons.ctaTelegram || {};
    setHtml(
      actions,
      '<a href="' +
        escapeHtml(wa.url || "#") +
        '" target="_blank" rel="noopener" class="btn btn--whatsapp">' +
        escapeHtml(wa.label || "WhatsApp") +
        "</a>" +
        '<a href="' +
        escapeHtml(tg.url || "#") +
        '" target="_blank" rel="noopener" class="btn btn--telegram">' +
        escapeHtml(tg.label || "Telegram") +
        "</a>"
    );
  }

  /* ---------- Footer ---------- */
  function applyFooter(c) {
    const f = c.footer || {};
    const brand = c.brand || {};
    const contacts = c.contacts || {};
    const logo = (c.images && c.images.logo) || brand.logo || "LOGO.png";

    const brandLink = $(".brand--footer");
    if (brandLink) {
      setHref(brandLink, brand.homeUrl || "#home");
      setHtml(brandLink, brandHtml(brand, logo, 34));
    }

    setText($(".footer-about"), f.about || "");

    const socials = $(".footer-socials");
    if (socials) {
      setHtml(
        socials,
        '<a href="' +
          escapeHtml(contacts.instagramUrl || "#") +
          '" target="_blank" rel="noopener" class="footer-social" aria-label="Instagram">' +
          SOCIAL_SVGS.instagram +
          "</a>" +
          '<a href="' +
          escapeHtml(contacts.youtubeUrl || "#") +
          '" target="_blank" rel="noopener" class="footer-social" aria-label="YouTube">' +
          SOCIAL_SVGS.youtube +
          "</a>" +
          '<a href="' +
          escapeHtml(contacts.tiktokUrl || "#") +
          '" target="_blank" rel="noopener" class="footer-social" aria-label="TikTok">' +
          SOCIAL_SVGS.tiktok +
          "</a>"
      );
    }

    const cols = $$(".footer-col");
    // nav col (index 1), services (2), contacts (3) — about is 0
    const navCol = cols[1];
    const servicesCol = cols[2];
    const contactsCol = cols[3];

    if (navCol) {
      setHtml(
        navCol,
        '<h4 class="footer-col__title">' +
          escapeHtml(f.navTitle || "Навигация") +
          "</h4>" +
          '<ul class="footer-list">' +
          (f.nav || [])
            .map((item) => "<li><a href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.label) + "</a></li>")
            .join("") +
          "</ul>"
      );
      navCol.setAttribute("aria-label", f.navTitle || "Навигация");
    }

    if (servicesCol) {
      setHtml(
        servicesCol,
        '<h4 class="footer-col__title">' +
          escapeHtml(f.servicesTitle || "Услуги") +
          "</h4>" +
          '<ul class="footer-list">' +
          (f.services || [])
            .map((item) => "<li><a href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.label) + "</a></li>")
            .join("") +
          "</ul>"
      );
      servicesCol.setAttribute("aria-label", f.servicesTitle || "Услуги");
    }

    if (contactsCol) {
      setHtml(
        contactsCol,
        '<h4 class="footer-col__title">' +
          escapeHtml(f.contactsTitle || "Контакты") +
          "</h4>" +
          '<ul class="footer-contacts">' +
          "<li><span aria-hidden=\"true\">📞</span> <a href=\"" +
          escapeHtml(contacts.phoneHref || "#") +
          "\">" +
          escapeHtml(contacts.phone || "") +
          "</a></li>" +
          "<li><span aria-hidden=\"true\">✈️</span> <a href=\"" +
          escapeHtml(contacts.telegramUrl || "#") +
          "\" target=\"_blank\" rel=\"noopener\">" +
          escapeHtml(contacts.telegramHandle || "") +
          "</a></li>" +
          "<li><span aria-hidden=\"true\">✉️</span> <a href=\"" +
          escapeHtml(contacts.emailHref || "#") +
          "\">" +
          escapeHtml(contacts.email || "") +
          "</a></li>" +
          "<li><span aria-hidden=\"true\">📍</span> " +
          escapeHtml(contacts.location || "") +
          "</li>" +
          "<li><span aria-hidden=\"true\">🕒</span> " +
          escapeHtml(contacts.hours || "") +
          "</li>" +
          "</ul>"
      );
    }

    const year = new Date().getFullYear();
    const copyright = (f.copyright || "© {year}").replace("{year}", String(year));
    const bottom = $(".site-footer__bottom");
    if (bottom) {
      setHtml(
        bottom,
        "<span>" +
          escapeHtml(copyright) +
          '</span><span class="site-footer__made">' +
          escapeHtml(f.madeWith || "") +
          "</span>"
      );
    }
  }

  /* ---------- FAB ---------- */
  function applyFab(c) {
    const fab = $(".fab-whatsapp");
    const btn = (c.buttons && c.buttons.fabWhatsapp) || {};
    if (!fab) return;
    setHref(fab, btn.url || (c.contacts && c.contacts.whatsappUrl) || "#");
    fab.setAttribute("aria-label", btn.label || "Написать в WhatsApp");
    // keep SVG + pulse
    if (!fab.querySelector("svg")) {
      setHtml(fab, WA_FAB_SVG + '<span class="fab-whatsapp__pulse" aria-hidden="true"></span>');
    }
  }

  /* ---------- Apply all ---------- */
  function applyContent(c) {
    applyMeta(c);
    applyHeader(c);
    applyHero(c);
    applyAdvantages(c);
    applyCategories(c);
    applyPortfolio(c);
    applyYoutube(c);
    applyPricing(c);
    applyProcess(c);
    applyReviews(c);
    applyCta(c);
    applyFooter(c);
    applyFab(c);
    window.__SITE_CONTENT__ = c;
    document.dispatchEvent(new CustomEvent("cms:ready", { detail: c }));
  }

  async function boot() {
    document.documentElement.classList.add("cms-loading");
    try {
      const res = await fetch(CONTENT_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      applyContent(data);
    } catch (err) {
      console.error("[CMS] Failed to load content:", err);
      document.documentElement.classList.add("cms-fallback");
      // Still expose empty content so scripts can run on static HTML
      document.dispatchEvent(new CustomEvent("cms:ready", { detail: null }));
    } finally {
      document.documentElement.classList.remove("cms-loading");
      document.documentElement.classList.add("cms-ready");
    }

    // Load interaction scripts after content is in the DOM
    for (const src of INTERACTION_SCRIPTS) {
      try {
        await loadScript(src);
      } catch (e) {
        console.error("[CMS] Script load error:", e);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
