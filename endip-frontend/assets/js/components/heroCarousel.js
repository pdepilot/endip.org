import { HERO_IMAGES } from "../config/hero.js";

const INTERVAL_MS = 5000;
const SWIPE_PX = 48;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyHeroImages(root) {
  root.querySelectorAll("[data-hero-image]").forEach((img) => {
    const asset = HERO_IMAGES[img.dataset.heroImage];
    if (!asset) return;
    img.src = asset.src;
    img.srcset = asset.srcset;
    img.sizes = asset.sizes;
    img.draggable = false;
    if (asset.position) img.style.objectPosition = asset.position;
    if (img.closest(".hero-slide.is-active")) img.fetchPriority = "high";
  });
}

export function initHeroCarousel(root = document.querySelector("[data-hero-carousel]")) {
  if (!root || root.dataset.heroReady === "1") return;
  root.dataset.heroReady = "1";

  applyHeroImages(root);

  const slides = [...root.querySelectorAll(".hero-slide")];
  const dots = [...root.querySelectorAll("[data-hero-dot]")];
  const prevBtn = root.querySelector("[data-hero-prev]");
  const nextBtn = root.querySelector("[data-hero-next]");
  const status = root.querySelector("[data-hero-status]");
  if (!slides.length) return;

  let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  let timer = 0;
  let hovering = false;
  let focused = false;

  function announce(i) {
    if (!status) return;
    const title = slides[i].querySelector("h1")?.textContent?.trim() || `Slide ${i + 1}`;
    status.textContent = `${title} (${i + 1} of ${slides.length})`;
  }

  function go(next, { user } = {}) {
    const i = (next + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      const on = n === i;
      slide.classList.toggle("is-active", on);
      slide.toggleAttribute("inert", !on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
    dots.forEach((dot, n) => {
      const on = n === i;
      dot.classList.toggle("is-active", on);
      dot.setAttribute("aria-current", on ? "true" : "false");
    });
    index = i;
    announce(i);
    if (user) restart();
  }

  function play() {
    stop();
    if (reducedMotion() || hovering || focused || document.hidden || slides.length < 2) return;
    timer = window.setInterval(() => go(index + 1), INTERVAL_MS);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  function restart() {
    stop();
    play();
  }

  prevBtn?.addEventListener("click", () => go(index - 1, { user: true }));
  nextBtn?.addEventListener("click", () => go(index + 1, { user: true }));
  dots.forEach((dot, n) => {
    dot.addEventListener("click", () => go(n, { user: true }));
  });

  if (window.matchMedia("(hover: hover)").matches) {
    root.addEventListener("mouseenter", () => {
      hovering = true;
      stop();
    });
    root.addEventListener("mouseleave", () => {
      hovering = false;
      play();
    });
  }
  root.addEventListener("focusin", () => {
    focused = true;
    stop();
  });
  root.addEventListener("focusout", (e) => {
    if (root.contains(e.relatedTarget)) return;
    focused = false;
    play();
  });

  root.addEventListener("keydown", (e) => {
    if (e.target.closest("a, input, textarea, select")) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1, { user: true });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1, { user: true });
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0, { user: true });
    } else if (e.key === "End") {
      e.preventDefault();
      go(slides.length - 1, { user: true });
    }
  });

  let startX = 0;
  let startY = 0;
  root.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    startX = e.clientX;
    startY = e.clientY;
  }, { passive: true });
  root.addEventListener("pointerup", (e) => {
    if (e.target.closest("a, button")) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    go(index + (dx < 0 ? 1 : -1), { user: true });
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else play();
  });

  go(index);
  play();
}
