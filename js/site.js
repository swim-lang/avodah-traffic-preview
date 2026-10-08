/* Avodah Traffic — interactions
   1. Loader (homepage only): knot rope ties itself on a signal-orange field.
   2. Reveal-on-scroll for sections (staggered fade-up via --d, applied in JS
      so hover transitions stay instant).
   3. Overlay menu for tablet / mobile.
   4. Current-page marker in the primary nav.
   Interior pages reuse 2–4 and reveal their hero on DOMContentLoaded.
*/

(function () {
  "use strict";

  var TRAFFIC_PHONE_DISPLAY = "804-405-2129";
  var TRAFFIC_PHONE_HREF = "+18044052129";
  var GA_MEASUREMENT_ID = "G-JGNZ3SBG6J";

  function trackEvent(name, parameters) {
    if (typeof window.gtag === "function") window.gtag("event", name, parameters || {});
  }

  if (location.hostname === "avodahtraffic.com" || location.hostname === "www.avodahtraffic.com") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
    var analyticsScript = document.createElement("script");
    analyticsScript.async = true;
    analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(analyticsScript);

    // CallRail dynamically replaces the published business number with the
    // Avodah Traffic tracking number on the production domain only.
    var callRailScript = document.createElement("script");
    callRailScript.async = true;
    callRailScript.src = "https://cdn.callrail.com/companies/605726199/62583cd9278a6667f744/12/swap.js";
    document.body.appendChild(callRailScript);
  }

  /* Dev flag: ?flat=1 disables scroll choreography for full-page captures */
  if (new URLSearchParams(location.search).has("flat")) {
    document.documentElement.classList.add("flat");
  }

  /* ---------- current page in nav ---------- */

  var pageName = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".primary-nav a").forEach(function (a) {
    if (a.getAttribute("href") === pageName) a.classList.add("is-current");
  });

  /* ---------- reveals ---------- */

  function staggeredReveal(el) {
    var d = parseFloat(el.style.getPropertyValue("--d")) || 0;
    setTimeout(function () {
      el.classList.add("is-in");
    }, d * 1000);
  }

  function revealHero() {
    document.querySelectorAll(".reveal-load").forEach(staggeredReveal);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          staggeredReveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    io.observe(el);
  });

  /* ---------- loader (homepage only) ---------- */

  var loader = document.getElementById("loader");
  var ropeFill = document.getElementById("ropeFill");

  if (loader && ropeFill) {
    var progress = 0;
    var loaderStart = Date.now();
    var MIN_LOADER_TIME = 250;

    var finishLoading = function () {
      ropeFill.style.width = "100%";
      setTimeout(function () {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        revealHero();
      }, 180);
    };

    var trickle = setInterval(function () {
      progress = Math.min(progress + Math.random() * 6, 90);
      ropeFill.style.width = progress + "%";
    }, 200);

    window.addEventListener("load", function () {
      var remaining = Math.max(MIN_LOADER_TIME - (Date.now() - loaderStart), 0);
      setTimeout(function () {
        clearInterval(trickle);
        finishLoading();
      }, remaining);
    });

    // Safety: never trap the user on the loader
    setTimeout(function () {
      if (!loader.classList.contains("is-done")) {
        clearInterval(trickle);
        finishLoading();
      }
    }, 1500);
  } else {
    // Interior pages: reveal the hero as soon as the DOM is ready.
    if (document.readyState !== "loading") revealHero();
    else document.addEventListener("DOMContentLoaded", revealHero);
  }

  /* ---------- shared interior-page conversion panel ---------- */

  var conversionExcluded = ["index.html", "contact.html", "privacy.html", "disclaimer.html", "viewer.html"];
  var conversionMain = document.querySelector("main");
  if (conversionMain && conversionExcluded.indexOf(pageName) === -1 && !document.querySelector("form[data-preview-form]")) {
    var oldCloser = conversionMain.lastElementChild;
    if (oldCloser && oldCloser.matches(".cta-split, .cta-orange, .cta-call, .cta-cypress, .cta-document, .cta-inset, .cta-slim")) {
      oldCloser.remove();
    }

    var conversionPanel = document.createElement("section");
    conversionPanel.className = "conversion-panel conversion-panel--traffic";
    conversionPanel.setAttribute("aria-labelledby", "conversion-panel-title");
    conversionPanel.innerHTML = [
      '<div class="conversion-panel__intro">',
      '<span class="eyebrow eyebrow--ivory-dim">A useful first contact</span>',
      '<h2 id="conversion-panel-title">Start with the details already on your paperwork.</h2>',
      '<p>Calling is the fastest first step. If calling is not convenient, share these basic facts so Avodah can identify the matter and the deadline.</p>',
      '<a class="btn btn--ivory js-call-link" href="tel:' + TRAFFIC_PHONE_HREF + '"><span class="btn__label">' + TRAFFIC_PHONE_DISPLAY + '</span><span class="btn__chip" aria-hidden="true">&#8594;</span></a>',
      '</div>',
      '<form class="conversion-panel__form" data-preview-form data-intake-form>',
      '<p class="preview-form-notice" tabindex="-1">Checking secure inquiry routing...</p>',
      '<div class="form-trap" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>',
      '<label>Full name<input type="text" name="name" autocomplete="name" maxlength="120" required /></label>',
      '<label>Phone number<input type="tel" name="phone" autocomplete="tel" maxlength="50" required /></label>',
      '<label>Charge or citation<input type="text" name="charge" maxlength="180" required /></label>',
      '<div class="conversion-panel__row"><label>Court or locality<input type="text" name="court" maxlength="160" required /></label><label>Court date<input type="text" name="courtDate" maxlength="80" inputmode="numeric" placeholder="MM / DD / YYYY" /></label></div>',
      '<label class="conversion-panel__consent"><input type="checkbox" name="consent" required /><span>Submitting this form does not create an attorney-client relationship. Do not send confidential details until Avodah confirms it can speak with you.</span></label>',
      '<button class="btn btn--aubergine" type="submit"><span class="btn__label">Send the first details</span><span class="btn__chip" aria-hidden="true">&#8594;</span></button>',
      '</form>'
    ].join("");
    conversionMain.insertAdjacentElement("afterend", conversionPanel);
  }

  /* ---------- inquiry forms ---------- */

  var intakeForms = document.querySelectorAll("form[data-intake-form]");
  var intakeEnabled = false;
  var staticPreviewHost = location.hostname === "swim-lang.github.io" || location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:";

  function setFormNotice(form, message, isError) {
    var notice = form.querySelector(".preview-form-notice");
    if (!notice) return;
    notice.textContent = message;
    notice.setAttribute("role", isError ? "alert" : "status");
    notice.classList.toggle("is-error", Boolean(isError));
    notice.focus();
  }

  function formPayload(form) {
    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) { payload[key] = value; });
    payload.consent = data.has("consent");
    payload.page = location.pathname;
    return payload;
  }

  if (intakeForms.length && !staticPreviewHost) {
    fetch("/api/intake", { method: "GET", headers: { Accept: "application/json" } })
      .then(function (response) { return response.ok ? response.json() : { enabled: false }; })
      .then(function (result) {
        intakeEnabled = result.enabled === true;
        intakeForms.forEach(function (form) {
          var notice = form.querySelector(".preview-form-notice");
          if (notice) notice.textContent = intakeEnabled ? "Your information will be sent to Avodah's intake team. Please do not include confidential documents or a detailed narrative." : "Online inquiries are temporarily unavailable. Please call Avodah Traffic.";
        });
      })
      .catch(function () { intakeEnabled = false; });
  }

  intakeForms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!intakeEnabled) return setFormNotice(form, staticPreviewHost ? "Preview only. No information was sent." : "Online inquiries are temporarily unavailable. Please call Avodah Traffic.", true);
      var payload = formPayload(form);
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      setFormNotice(form, "Sending your inquiry...", false);
      fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
        .then(function (response) { return response.json().catch(function () { return { ok: false, message: "Your inquiry could not be sent. Please call Avodah Traffic directly." }; }).then(function (result) { if (!response.ok || result.ok !== true) throw new Error(result.message || "Your inquiry could not be sent. Please call Avodah Traffic directly."); return result; }); })
        .then(function () { form.reset(); trackEvent("generate_lead", { lead_type: "traffic_inquiry" }); setFormNotice(form, "Thank you. Your inquiry was sent to Avodah's intake team.", false); })
        .catch(function (error) { setFormNotice(form, error.message || "Your inquiry could not be sent. Please call Avodah Traffic directly.", true); })
        .finally(function () { if (submit) submit.disabled = false; });
    });
  });

  /* ---------- phone actions ---------- */

  var headerCall = document.querySelector(".site-header__cta");
  if (headerCall) {
    if (headerCall.tagName !== "A") {
      var headerLink = document.createElement("a");
      Array.from(headerCall.attributes).forEach(function (attribute) { if (attribute.name !== "type") headerLink.setAttribute(attribute.name, attribute.value); });
      headerLink.innerHTML = headerCall.innerHTML;
      headerCall.replaceWith(headerLink);
      headerCall = headerLink;
    }
    headerCall.href = "tel:" + TRAFFIC_PHONE_HREF;
    headerCall.classList.remove("js-preview-call");
    headerCall.classList.add("js-call-link");
    headerCall.removeAttribute("aria-disabled");
    headerCall.removeAttribute("title");
    var headerLabel = headerCall.querySelector(".btn__label");
    if (headerLabel) headerLabel.textContent = TRAFFIC_PHONE_DISPLAY;
  }

  var utilityLink = document.querySelector(".utility-line a");
  if (utilityLink) {
    utilityLink.href = "tel:" + TRAFFIC_PHONE_HREF;
    utilityLink.classList.remove("js-preview-call");
    utilityLink.classList.add("js-call-link");
    utilityLink.removeAttribute("aria-disabled");
    utilityLink.removeAttribute("title");
    utilityLink.textContent = TRAFFIC_PHONE_DISPLAY;
  }

  var mobileCall = document.createElement("a");
  mobileCall.className = "mobile-call-bar js-call-link";
  mobileCall.href = "tel:" + TRAFFIC_PHONE_HREF;
  mobileCall.innerHTML = "<span>" + TRAFFIC_PHONE_DISPLAY + "</span><small>Call Avodah Traffic</small>";
  document.body.appendChild(mobileCall);

  if (document.querySelector(".article-page") && document.querySelector(".primary-nav") && !document.querySelector(".menu-btn")) {
    var articleMenu = document.createElement("button");
    articleMenu.className = "menu-btn";
    articleMenu.setAttribute("aria-label", "Open menu");
    articleMenu.textContent = "Menu";
    document.querySelector(".site-header").appendChild(articleMenu);
  }

  var siteHeader = document.querySelector(".site-header");
  var menuControl = document.querySelector(".menu-btn");
  if (siteHeader && headerCall && !siteHeader.querySelector(".header-actions")) {
    var headerActions = document.createElement("div");
    headerActions.className = "header-actions";
    siteHeader.insertBefore(headerActions, headerCall);
    headerActions.appendChild(headerCall);
    var headerContact = document.createElement("a");
    headerContact.className = "header-contact";
    headerContact.href = "contact.html";
    headerContact.textContent = "Contact";
    headerActions.appendChild(headerContact);
    if (menuControl) headerActions.appendChild(menuControl);
  }

  document.querySelectorAll(".js-preview-call, .js-call-link").forEach(function (control) {
    if (control.tagName !== "A") {
      var callLink = document.createElement("a");
      Array.from(control.attributes).forEach(function (attribute) { if (attribute.name !== "type") callLink.setAttribute(attribute.name, attribute.value); });
      callLink.innerHTML = control.innerHTML;
      control.replaceWith(callLink);
      control = callLink;
    }
    if (control.classList.contains("js-preview-call")) {
      control.classList.remove("js-preview-call");
      control.classList.add("js-call-link");
    }
    control.href = "tel:" + TRAFFIC_PHONE_HREF;
    control.addEventListener("click", function () { trackEvent("click_to_call", { site_section: pageName }); });
  });

  /* ---------- overlay menu (tablet / mobile) ---------- */

  var menuBtn = document.querySelector(".menu-btn");
  var navLinks = document.querySelectorAll(".primary-nav a");

  if (menuBtn && navLinks.length) {
    var overlay = document.createElement("div");
    overlay.className = "menu-overlay";
    overlay.setAttribute("aria-hidden", "true");

    var top = document.createElement("div");
    top.className = "menu-overlay__top";
    top.innerHTML =
      '<img src="assets/wordmark-ivory.svg" alt="Avodah" />' +
      '<button class="menu-overlay__close" aria-label="Close menu">✕</button>';
    overlay.appendChild(top);

    var linksWrap = document.createElement("nav");
    linksWrap.className = "menu-overlay__links";
    navLinks.forEach(function (a, i) {
      var link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent;
      link.style.transitionDelay = 0.06 + i * 0.05 + "s";
      linksWrap.appendChild(link);
    });
    var contact = document.createElement("a");
    contact.href = "contact.html";
    contact.textContent = "Request a Case Review";
    contact.style.transitionDelay = 0.06 + navLinks.length * 0.05 + "s";
    linksWrap.appendChild(contact);
    overlay.appendChild(linksWrap);

    var meta = document.createElement("div");
    meta.className = "menu-overlay__meta";
    meta.textContent = "Est. 2026 · Richmond, Virginia";
    overlay.appendChild(meta);

    document.body.appendChild(overlay);

    var openMenu = function () {
      document.body.classList.add("menu-open");
      overlay.setAttribute("aria-hidden", "false");
    };
    var closeMenu = function () {
      document.body.classList.remove("menu-open");
      overlay.setAttribute("aria-hidden", "true");
    };
    menuBtn.addEventListener("click", openMenu);
    overlay.querySelector(".menu-overlay__close").addEventListener("click", closeMenu);
    linksWrap.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- desktop / mobile preview toggle (client review aid) ---------- */

  if (!document.documentElement.hasAttribute("data-viewer") && window.self === window.top) {
    var toggle = document.createElement("div");
    toggle.className = "device-toggle";
    toggle.innerHTML =
      '<span class="is-active">Desktop</span>' +
      '<a href="viewer.html#' + pageName + '">Mobile</a>';
    document.body.appendChild(toggle);
  }

  /* ---------- insights filter chips (visual only until CMS wiring) ---------- */

  var filters = document.querySelectorAll(".filters .filter");
  if (filters.length) {
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        filters.forEach(function (x) { x.classList.remove("is-active"); });
        f.classList.add("is-active");
      });
    });
  }
})();
