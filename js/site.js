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
      '<button class="btn btn--ivory js-preview-call" type="button"><span class="btn__label">Call now</span><span class="btn__chip" aria-hidden="true">&#8594;</span></button>',
      '</div>',
      '<form class="conversion-panel__form" data-preview-form>',
      '<p class="preview-form-notice" tabindex="-1">Preview only. This form does not transmit or store information.</p>',
      '<label>Full name<input type="text" autocomplete="name" /></label>',
      '<label>Phone number<input type="tel" autocomplete="tel" /></label>',
      '<label>Charge or citation<input type="text" /></label>',
      '<div class="conversion-panel__row"><label>Court or locality<input type="text" /></label><label>Court date<input type="text" inputmode="numeric" placeholder="MM / DD / YYYY" /></label></div>',
      '<label class="conversion-panel__consent"><input type="checkbox" /><span>Submitting this form does not create an attorney-client relationship. Do not send confidential details until Avodah confirms it can speak with you.</span></label>',
      '<button class="btn btn--aubergine" type="submit"><span class="btn__label">Send the first details</span><span class="btn__chip" aria-hidden="true">&#8594;</span></button>',
      '</form>'
    ].join("");
    conversionMain.insertAdjacentElement("afterend", conversionPanel);
  }

  /* ---------- preview-only forms ---------- */

  document.querySelectorAll("form[data-preview-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var notice = form.querySelector(".preview-form-notice");
      if (notice) {
        notice.textContent = "Preview only. No information was sent.";
        notice.setAttribute("role", "status");
        notice.focus();
      }
    });
  });

  /* ---------- preview-only phone actions ---------- */

  var headerCall = document.querySelector(".site-header__cta");
  if (headerCall) {
    if (headerCall.tagName === "A") headerCall.removeAttribute("href");
    headerCall.classList.add("js-preview-call");
    headerCall.setAttribute("aria-disabled", "true");
    headerCall.setAttribute("title", "Preview only. CallRail number pending.");
    var headerLabel = headerCall.querySelector(".btn__label");
    if (headerLabel) headerLabel.textContent = "Call now";
  }

  var utilityLink = document.querySelector(".utility-line a");
  if (utilityLink) {
    utilityLink.removeAttribute("href");
    utilityLink.classList.add("js-preview-call");
    utilityLink.setAttribute("aria-disabled", "true");
    utilityLink.setAttribute("title", "Preview only. CallRail number pending.");
    utilityLink.textContent = "Call Avodah Traffic";
  }

  var mobileCall = document.createElement("button");
  mobileCall.className = "mobile-call-bar js-preview-call";
  mobileCall.type = "button";
  mobileCall.innerHTML = "<span>Call now</span><small>Avodah Traffic · preview number pending</small>";
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

  document.querySelectorAll(".js-preview-call").forEach(function (control) {
    control.addEventListener("click", function (event) {
      event.preventDefault();
      var notice = document.querySelector(".preview-call-notice");
      if (notice) {
        notice.textContent = "Preview only. Avodah's approved CallRail number and routing are still pending.";
        notice.classList.add("is-active");
        notice.setAttribute("role", "status");
        notice.focus();
      } else {
        mobileCall.querySelector("small").textContent = "CallRail routing pending";
      }
    });
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
