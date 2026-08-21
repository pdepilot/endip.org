const STAGGER_MS = 70;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mark(el, kind = "up", delay = 0) {
  if (!el || el.dataset.revealReady === "1") return;
  el.dataset.revealReady = "1";
  el.classList.add(kind === "soft" ? "reveal-soft" : kind === "img" ? "reveal-img" : "reveal");
  if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
}

function preparePublicReveals(root) {
  root.querySelectorAll("main .page-hero h1, main .page-hero .lede").forEach((el, i) => {
    mark(el, i === 0 ? "up" : "soft", i * STAGGER_MS);
  });

  root.querySelectorAll("main .section").forEach((section) => {
    const kicker = section.querySelector(".kicker");
    const heading = section.querySelector("h2");
    const lede = section.querySelector(".lede");
    mark(kicker, "soft");
    mark(heading, "up", 40);
    mark(lede, "soft", 80);

    section.querySelectorAll(".grid-3, .grid-2, .grid-4, .how-grid").forEach((group) => {
      [...group.children].forEach((child, i) => {
        if (child.matches("form")) return;
        mark(child, "up", Math.min(i, 5) * STAGGER_MS);
      });
    });

    section.querySelectorAll(".stat-card").forEach((card, i) => {
      if (card.closest(".grid-2, .grid-3")) return;
      mark(card, "up", Math.min(i, 4) * STAGGER_MS);
    });
  });

  root.querySelectorAll("main img").forEach((img) => {
    if (img.closest(".hero, .site-header, .brand, .page-hero")) return;
    const wrap = img.closest(".card-media, .card") || img;
    mark(wrap, "img");
  });
}

function observe(els) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

export function initScrollReveal(root = document) {
  if (document.documentElement.dataset.layout !== "public") return;

  const footer = root.querySelector(".site-footer--signature");
  if (reducedMotion()) {
    root.querySelectorAll(".reveal, .reveal-soft, .reveal-img").forEach((el) => el.classList.add("is-in"));
    footer?.classList.add("is-in");
    return;
  }

  preparePublicReveals(root);
  const items = [...root.querySelectorAll(".reveal, .reveal-soft, .reveal-img")].filter(
    (el) => !el.closest(".hero, .site-header, form")
  );
  observe(items);

  if (footer) {
    const footIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          footer.classList.add("is-in");
          footIo.unobserve(footer);
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.01 }
    );
    footIo.observe(footer);
  }
}
