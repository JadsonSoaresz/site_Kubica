(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initNav();
    initReveals();
    initStats();
    initTimeline();
    initTilt();
    initForm();
  });

  function initLoader() {
    const loader = document.getElementById("loader");
    if (!loader) return;
    window.addEventListener("load", () => {
      setTimeout(() => loader.classList.add("hidden"), 500);
    });
    // fallback in case load event already fired / is slow
    setTimeout(() => loader.classList.add("hidden"), 2500);
  }

  function initNav() {
    const nav = document.getElementById("nav");
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
      toggle.addEventListener("click", () => {
        links.classList.toggle("open");
        toggle.classList.toggle("active");
      });
      links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => links.classList.remove("open"))
      );
    }
  }

  function initReveals() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    // simple fade-up reveals
    const simple = document.querySelectorAll(".reveal, .reveal-line");
    if (gsap && ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      simple.forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: el.classList.contains("reveal-line") ? i * 0.08 : 0,
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        });
      });

      // 3D card-style reveals
      const cards3d = document.querySelectorAll(".reveal-3d");
      cards3d.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40, rotateX: 12, transformPerspective: 800, transformOrigin: "top center" },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    } else {
      // fallback: IntersectionObserver, no GSAP
      const all = document.querySelectorAll(".reveal, .reveal-line, .reveal-3d");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.transition = "opacity .8s ease, transform .8s ease";
              entry.target.style.opacity = "1";
              entry.target.style.transform = "none";
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      all.forEach((el) => io.observe(el));
    }
  }

  function initStats() {
    const stats = document.querySelectorAll(".stat-num");
    if (!stats.length) return;

    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const isDecimal = String(target).includes(".");
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = isDecimal ? value.toFixed(2) : Math.round(value);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    stats.forEach((el) => io.observe(el));
  }

  function initTimeline() {
    const fill = document.getElementById("timelineFill");
    const timeline = document.querySelector(".timeline");
    if (!fill || !timeline) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (gsap && ScrollTrigger) {
      gsap.to(fill, {
        width: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: timeline,
          start: "top 70%",
          end: "bottom 60%",
          scrub: 0.5,
        },
      });
    }
  }

  function initTilt() {
    const cards = document.querySelectorAll(".product-visual, .card");
    cards.forEach((card) => {
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${py * -10}deg) rotateY(${px * 10}deg)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  function initForm() {
    const form = document.getElementById("contactForm");
    const note = document.getElementById("formNote");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // NOTE: sem backend configurado ainda — conectar a um endpoint
      // (ex: Formspree, EmailJS ou API própria) para envio real.
      if (note) {
        note.textContent = "Mensagem pronta para envio — conecte este formulário a um serviço de e-mail (ex: Formspree/EmailJS) para ativá-lo.";
      }
      form.reset();
    });
  }
})();
