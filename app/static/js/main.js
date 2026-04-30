window.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const body = document.body;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    // ─── DOM references ──────────────────────────────────────────────────────
    const themeToggle = document.querySelector("[data-theme-toggle]");
    const themeLabel = themeToggle ? themeToggle.querySelector(".theme-toggle-label") : null;
    const runtimeClock = document.querySelector("[data-runtime-clock]");
    const coordinates = document.querySelector("[data-coordinates]");
    const cursorShell = document.querySelector(".cursor-shell");
    const pointerLabel = document.querySelector("[data-pointer-label]");
    const preloader = document.getElementById("preloader");
    const preloaderPct = document.querySelector("[data-preloader-pct]");
    const preloaderStatus = document.querySelector("[data-preloader-status]");
    const trackToggle = document.querySelector("[data-track-toggle]");
    const cornerBrackets = document.querySelector(".corner-brackets");
    const systemLogs = document.querySelector("[data-system-logs]");
    const logsBody = document.querySelector("[data-logs-body]");

    // ─── Theme ───────────────────────────────────────────────────────────────
    const updateTheme = (mode) => {
        const isLight = mode === "light";
        root.classList.toggle("theme-light", isLight);
        if (themeToggle) themeToggle.setAttribute("aria-pressed", isLight ? "true" : "false");
        if (themeLabel) themeLabel.textContent = isLight ? "LIGHT MODE" : "DARK MODE";
    };

    const getTheme = () => {
        try {
            const saved = localStorage.getItem("portfolio-theme-v2");
            if (saved === "light" || saved === "dark") return saved;
        } catch (e) { /* ignore */ }
        return "dark";
    };

    updateTheme(getTheme());

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const nextMode = root.classList.contains("theme-light") ? "dark" : "light";
            updateTheme(nextMode);
            try { localStorage.setItem("portfolio-theme-v2", nextMode); } catch (e) { /* ignore */ }
        });
    }

    // ─── Clock & Coordinates ─────────────────────────────────────────────────
    const pad = (v, len = 2) => String(v).padStart(len, "0");

    const setClock = () => {
        if (!runtimeClock) return;
        const now = new Date();
        const frame = Math.floor((performance.now() % 1000) / 10);
        runtimeClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}:${pad(frame)}`;
    };
    setClock();
    setInterval(setClock, 80);

    window.addEventListener("pointermove", (e) => {
        if (coordinates) coordinates.textContent = `X:${pad(Math.round(e.clientX), 4)} Y:${pad(Math.round(e.clientY), 4)}`;
    });

    // ─── Section Observer ────────────────────────────────────────────────────
    const statusValue = document.querySelector("[data-active-section]");
    const sectionAnchors = Array.from(document.querySelectorAll(".section-anchor"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    const setActiveSection = (section) => {
        if (statusValue) statusValue.textContent = section?.dataset.sectionLabel || "Intro";
        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${section.id}`);
        });
    };

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActiveSection(visible.target);
        },
        { threshold: [0.2, 0.4, 0.6], rootMargin: "-20% 0px -35% 0px" }
    );

    sectionAnchors.filter((s) => s.id).forEach((s) => sectionObserver.observe(s));
    if (sectionAnchors.length > 0) setActiveSection(sectionAnchors[0]);

    // ─── TRACK Toggle + System Logs ──────────────────────────────────────────
    let trackActive = false;
    let logInterval = null;

    const LOG_MESSAGES = [
        { text: "> initializing backend_core..", cls: "" },
        { text: "> handshake established · node_kanpur", cls: "" },
        { text: "> scaling kubernetes clusters [OK]", cls: "log-ok" },
        { text: "> load balancer distribution: 42%", cls: "" },
        { text: "> threat mitigation active", cls: "log-warn" },
        { text: "> reading local_environment vars", cls: "" },
        { text: "> connecting to postgres://primary", cls: "" },
        { text: "> warming redis cache", cls: "" },
        { text: "> grpc gateway listening :50051", cls: "log-ok" },
        { text: "> fastapi server started on :8000", cls: "log-ok" },
        { text: "> jwt token rotation enabled", cls: "" },
        { text: "> websocket channels: 3 active", cls: "" },
        { text: "> ready.", cls: "log-ok" },
    ];

    let logIndex = 0;

    const addLogLine = () => {
        if (!logsBody) return;
        const msg = LOG_MESSAGES[logIndex % LOG_MESSAGES.length];
        const line = document.createElement("p");
        line.className = "log-line" + (msg.cls ? " " + msg.cls : "");
        line.textContent = msg.text;
        logsBody.appendChild(line);
        // Keep max 10 lines
        while (logsBody.children.length > 10) logsBody.removeChild(logsBody.firstChild);
        logIndex++;
    };

    const startLogs = () => {
        if (logInterval) return;
        logIndex = 0;
        if (logsBody) logsBody.innerHTML = "";
        addLogLine();
        logInterval = setInterval(addLogLine, 800);
    };

    const stopLogs = () => {
        if (logInterval) { clearInterval(logInterval); logInterval = null; }
        if (logsBody) logsBody.innerHTML = "";
    };

    const setTrack = (active) => {
        trackActive = active;
        if (trackToggle) {
            trackToggle.classList.toggle("is-active", active);
            const label = trackToggle.querySelector(".track-toggle-label");
            if (label) label.textContent = active ? "TRACK · ON" : "TRACK · OFF";
        }
        if (cornerBrackets) cornerBrackets.classList.toggle("is-visible", active);
        if (systemLogs) systemLogs.classList.toggle("is-visible", active);
        if (active) startLogs(); else stopLogs();
        try { localStorage.setItem("portfolio-track", active ? "on" : "off"); } catch (e) { /* ignore */ }
    };

    if (trackToggle) {
        trackToggle.addEventListener("click", () => setTrack(!trackActive));
        // Restore saved state (default off)
        try {
            if (localStorage.getItem("portfolio-track") === "on" && !isMobile) setTrack(true);
        } catch (e) { /* ignore */ }
    }

    // ─── Project Slider: SLIDER/LIST toggle + Arrows ─────────────────────────
    const projectSection = document.getElementById("projects");
    const sliderWrap = document.querySelector("[data-slider-wrap]");
    const sliderTrack = document.querySelector("[data-slider-track]");
    const slides = Array.from(document.querySelectorAll("[data-slide]"));
    const viewBtns = Array.from(document.querySelectorAll("[data-view]"));
    const arrowPrev = document.querySelector("[data-arrow='prev']");
    const arrowNext = document.querySelector("[data-arrow='next']");
    let currentSlide = 0;
    let currentView = "slider";
    let horizontalST = null;

    const setView = (view) => {
        currentView = view;
        viewBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === view));
        if (projectSection) {
            projectSection.classList.toggle("list-view", view === "list");
        }
        // Kill existing horizontal ScrollTrigger if switching views
        if (horizontalST) { horizontalST.kill(); horizontalST = null; }
        if (sliderTrack) gsap.set(sliderTrack, { x: 0 });

        if (view === "slider" && !isMobile && window.gsap && window.ScrollTrigger) {
            initHorizontalScroll();
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    viewBtns.forEach((btn) => {
        btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    // Arrow navigation
    const scrollToSlide = (index) => {
        if (!slides.length) return;
        currentSlide = Math.max(0, Math.min(index, slides.length - 1));
        if (isMobile && sliderWrap) {
            // Mobile: scroll the native scroll container
            const slideEl = slides[currentSlide];
            sliderWrap.scrollTo({ left: slideEl.offsetLeft - 16, behavior: "smooth" });
        } else if (sliderTrack && sliderWrap) {
            // Desktop: animate track position
            const slideEl = slides[currentSlide];
            const maxScroll = sliderTrack.scrollWidth - sliderWrap.clientWidth;
            const target = Math.min(slideEl.offsetLeft, maxScroll);
            gsap.to(sliderTrack, { x: -target, duration: 0.5, ease: "power2.out" });
        }
    };

    if (arrowPrev) arrowPrev.addEventListener("click", () => scrollToSlide(currentSlide - 1));
    if (arrowNext) arrowNext.addEventListener("click", () => scrollToSlide(currentSlide + 1));

    // ─── Preloader ───────────────────────────────────────────────────────────
    const STATUS_MESSAGES = [
        "> INITIALIZING SYSTEM...",
        "> LOADING DOSSIERS...",
        "> SCANNING EVIDENCE...",
        "> COMPILING ASSETS...",
        "> SYSTEM READY.",
    ];

    const skipPreloader = () => {
        try { return sessionStorage.getItem("preloader-seen") === "1"; } catch (e) { return false; }
    };

    const runPreloader = (onComplete) => {
        if (!preloader || reducedMotion || skipPreloader()) {
            if (preloader) preloader.classList.add("is-done");
            onComplete();
            return;
        }

        let pct = 0;
        let msgIdx = 0;
        const target = 100;

        const tick = () => {
            // Realistic pacing: fast start, slow middle, fast end
            if (pct < 30) pct += Math.random() * 8 + 3;
            else if (pct < 70) pct += Math.random() * 4 + 1;
            else if (pct < 95) pct += Math.random() * 6 + 2;
            else pct += Math.random() * 3 + 1;

            if (pct >= target) pct = target;
            if (preloaderPct) preloaderPct.textContent = Math.floor(pct);

            // Cycle status messages
            const newMsgIdx = Math.min(Math.floor(pct / (100 / STATUS_MESSAGES.length)), STATUS_MESSAGES.length - 1);
            if (newMsgIdx !== msgIdx) {
                msgIdx = newMsgIdx;
                if (preloaderStatus) preloaderStatus.textContent = STATUS_MESSAGES[msgIdx];
            }

            if (pct < target) {
                requestAnimationFrame(tick);
            } else {
                // Done - exit
                setTimeout(() => {
                    preloader.classList.add("is-done");
                    try { sessionStorage.setItem("preloader-seen", "1"); } catch (e) { /* ignore */ }
                    setTimeout(onComplete, 900); // Wait for clip-path animation
                }, 400);
            }
        };

        requestAnimationFrame(tick);
    };

    // ─── GSAP Init (after preloader) ─────────────────────────────────────────
    const initAnimations = () => {
        if (!window.gsap || !window.ScrollTrigger || reducedMotion) {
            document.querySelectorAll(".reveal, .intro-item").forEach((el) => {
                el.style.opacity = "1";
                el.style.transform = "none";
            });
            root.classList.add("reduced-motion");
            return;
        }

        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });

        // ─── Intro animation ─────────────────────────────────────────────────
        gsap.timeline({ defaults: { ease: "power2.out" } })
            .fromTo(".top-nav",        { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.4 })
            .fromTo(".corner-readout", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
            .fromTo(".section-status", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
            .fromTo(".intro-item",     { opacity: 0, y: 24  }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, "-=0.1");

        // ─── Reveal animations ───────────────────────────────────────────────
        const revealStart = isMobile ? "top 95%" : "top 84%";
        gsap.utils.toArray(".reveal").forEach((el) => {
            gsap.fromTo(el,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.55, ease: "power2.out",
                    scrollTrigger: { trigger: el, start: revealStart, once: true },
                }
            );
        });

        // ─── Ticker ──────────────────────────────────────────────────────────
        const tickerTrack = document.querySelector(".ticker-track");
        if (tickerTrack) {
            gsap.to(tickerTrack, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
        }

        // ─── Scroll progress meter ──────────────────────────────────────────
        gsap.to(".scroll-meter-fill", {
            width: "100%", ease: "none",
            scrollTrigger: { trigger: body, start: "top top", end: "bottom bottom", scrub: 0.25 },
        });

        // ─── Edge signal ─────────────────────────────────────────────────────
        gsap.to(".edge-signal-core", {
            y: () => Math.max(0, window.innerHeight - 92), ease: "none",
            scrollTrigger: { trigger: body, start: "top top", end: "bottom bottom", scrub: 0.8 },
        });

        // ─── Horizontal Project Slider (desktop only, slider view) ───────────
        if (!isMobile && currentView === "slider") {
            initHorizontalScroll();
        }

        // ─── Project slides reveal ───────────────────────────────────────────
        if (slides.length) {
            gsap.fromTo(slides,
                { opacity: 0, y: 28 },
                {
                    opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out",
                    scrollTrigger: { trigger: "#projects", start: isMobile ? "top 90%" : "top 78%", once: true },
                }
            );
        }

        // ─── Blog rail ───────────────────────────────────────────────────────
        const blogRail = document.querySelector("[data-blog-rail]");
        const blogTrack = document.querySelector("[data-blog-track]");
        const blogCards = gsap.utils.toArray(".blog-card");

        if (blogRail && blogTrack && blogCards.length) {
            const getBlogDist = () => Math.max(0, blogTrack.scrollWidth - blogRail.clientWidth);

            gsap.fromTo(blogCards,
                { autoAlpha: 0, y: 28 },
                {
                    autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09, ease: "power2.out",
                    scrollTrigger: { trigger: "#blog", start: isMobile ? "top 90%" : "top 78%", once: true },
                }
            );

            if (!isMobile && getBlogDist() > 0) {
                gsap.to(blogTrack, {
                    x: () => -getBlogDist(), ease: "none",
                    scrollTrigger: {
                        trigger: "#blog", start: "top 14%",
                        end: () => `+=${getBlogDist() + window.innerHeight * 0.45}`,
                        scrub: 0.8, pin: blogRail, anticipatePin: 1, invalidateOnRefresh: true,
                    },
                });
            }
        }

        // ─── Profile cards ───────────────────────────────────────────────────
        const profileCards = gsap.utils.toArray(".profile-card");
        if (profileCards.length) {
            gsap.fromTo(profileCards,
                { opacity: 0, y: 28 },
                {
                    opacity: 1, y: 0, duration: 0.58, ease: "power2.out", stagger: 0.12,
                    scrollTrigger: { trigger: "#profile-intel", start: isMobile ? "top 90%" : "top 76%", once: true },
                }
            );
        }

        // ─── Magnetic buttons (desktop only) ─────────────────────────────────
        if (pointerFine && !reducedMotion) {
            Array.from(document.querySelectorAll(".magnetic")).forEach((target) => {
                target.addEventListener("pointermove", (e) => {
                    const b = target.getBoundingClientRect();
                    gsap.to(target, { x: (e.clientX - b.left - b.width / 2) * 0.12, y: (e.clientY - b.top - b.height / 2) * 0.18, duration: 0.25, ease: "power2.out" });
                });
                target.addEventListener("pointerleave", () => {
                    gsap.to(target, { x: 0, y: 0, duration: 0.28, ease: "power2.out" });
                });
            });
        }

        // ─── Custom cursor (desktop only) ────────────────────────────────────
        if (pointerFine && cursorShell) {
            body.classList.add("has-custom-cursor");
            gsap.set(cursorShell, { autoAlpha: 1 });

            const cursorX = gsap.quickTo(cursorShell, "x", { duration: 0.16, ease: "power2.out" });
            const cursorY = gsap.quickTo(cursorShell, "y", { duration: 0.16, ease: "power2.out" });

            window.addEventListener("pointermove", (e) => { cursorX(e.clientX); cursorY(e.clientY); });

            document.querySelectorAll("a, button").forEach((target) => {
                target.addEventListener("mouseenter", () => { cursorShell.classList.add("is-link"); if (pointerLabel) pointerLabel.textContent = "OPEN"; });
                target.addEventListener("mouseleave", () => { cursorShell.classList.remove("is-link"); if (pointerLabel) pointerLabel.textContent = "TRACK"; });
            });

            document.querySelectorAll(".subject-photo, .profile-card, .project-slide").forEach((target) => {
                target.addEventListener("mouseenter", () => { if (pointerLabel) pointerLabel.textContent = "SCAN"; });
                target.addEventListener("mouseleave", () => { if (pointerLabel && !cursorShell.classList.contains("is-link")) pointerLabel.textContent = "TRACK"; });
            });
        }

        // ─── ScrollTrigger refresh ───────────────────────────────────────────
        let refreshTimer;
        const refreshScroll = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 220); };
        window.addEventListener("resize", refreshScroll);
        window.addEventListener("orientationchange", refreshScroll);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        }
        window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()));
    };

    // ─── Horizontal Scroll Init ──────────────────────────────────────────────
    function initHorizontalScroll() {
        if (!sliderTrack || !sliderWrap || !slides.length || isMobile) return;
        if (horizontalST) { horizontalST.kill(); horizontalST = null; }

        const getDistance = () => Math.max(0, sliderTrack.scrollWidth - sliderWrap.clientWidth);

        if (getDistance() <= 0) return;

        gsap.set(sliderTrack, { x: 0 });

        const tween = gsap.to(sliderTrack, {
            x: () => -getDistance(),
            ease: "none",
            scrollTrigger: {
                trigger: sliderWrap,
                start: "top top+=100",
                end: () => `+=${getDistance()}`,
                scrub: 0.8,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            },
        });

        horizontalST = tween.scrollTrigger;
    }

    // ─── Launch ──────────────────────────────────────────────────────────────
    runPreloader(initAnimations);
});