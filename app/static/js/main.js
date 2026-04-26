window.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const body = document.body;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    const themeToggle = document.querySelector("[data-theme-toggle]");
    const themeLabel = themeToggle ? themeToggle.querySelector(".theme-toggle-label") : null;
    const runtimeClock = document.querySelector("[data-runtime-clock]");
    const coordinates = document.querySelector("[data-coordinates]");
    const cursorShell = document.querySelector(".cursor-shell");
    const pointerLabel = document.querySelector("[data-pointer-label]");

    const updateTheme = (mode) => {
        const isLight = mode === "light";
        root.classList.toggle("theme-light", isLight);
        if (themeToggle) {
            themeToggle.setAttribute("aria-pressed", isLight ? "true" : "false");
        }
        if (themeLabel) {
            themeLabel.textContent = isLight ? "LIGHT MODE" : "DARK MODE";
        }
    };

    const getTheme = () => {
        try {
            const saved = localStorage.getItem("portfolio-theme-v2");
            if (saved === "light" || saved === "dark") {
                return saved;
            }
        } catch (error) {
            /* Ignore storage read issues */
        }
        return "dark";
    };

    updateTheme(getTheme());

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const nextMode = root.classList.contains("theme-light") ? "dark" : "light";
            updateTheme(nextMode);
            try {
                localStorage.setItem("portfolio-theme-v2", nextMode);
            } catch (error) {
                /* Ignore storage write issues */
            }
        });
    }

    const pad = (value, length = 2) => String(value).padStart(length, "0");

    const setClock = () => {
        if (!runtimeClock) return;
        const now = new Date();
        const frame = Math.floor((performance.now() % 1000) / 10);
        runtimeClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}:${pad(frame)}`;
    };

    setClock();
    window.setInterval(setClock, 80);

    window.addEventListener("pointermove", (event) => {
        if (coordinates) {
            coordinates.textContent = `X:${pad(Math.round(event.clientX), 3)} Y:${pad(Math.round(event.clientY), 3)}`;
        }
    });

    const statusValue = document.querySelector("[data-active-section]");
    const sectionAnchors = Array.from(document.querySelectorAll(".section-anchor"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    const setActiveSection = (section) => {
        if (statusValue) {
            statusValue.textContent = section?.dataset.sectionLabel || "Intro";
        }
        navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            link.classList.toggle("is-active", href === `#${section.id}`);
        });
    };

    const observedSections = sectionAnchors.filter((section) => section.id);

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) {
                setActiveSection(visible.target);
            }
        },
        {
            threshold: [0.2, 0.4, 0.6],
            rootMargin: "-20% 0px -35% 0px",
        },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));

    if (sectionAnchors.length > 0) {
        setActiveSection(sectionAnchors[0]);
    }

    // ─── GSAP guard ───────────────────────────────────────────────────────────
    if (!window.gsap || !window.ScrollTrigger || reducedMotion) {
        // Make everything visible so page isn't blank on failure
        document.querySelectorAll(".reveal, .intro-item").forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
        });
        root.classList.add("reduced-motion");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // FIX 1: normalize scroll for consistent mobile behavior
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (isMobile) {
        ScrollTrigger.normalizeScroll(true);
    }

    // ─── Intro animation ──────────────────────────────────────────────────────
    gsap.timeline({ defaults: { ease: "power2.out" } })
        .fromTo(".top-nav",        { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.4 })
        .fromTo(".corner-readout", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
        .fromTo(".section-status", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
        .fromTo(".intro-item",     { opacity: 0, y: 24  }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, "-=0.1");

    // ─── Reveal animations (FIX 2: fromTo + once + looser mobile trigger) ────
    const revealStart = isMobile ? "top 98%" : "top 84%";

    gsap.utils.toArray(".reveal").forEach((element, index) => {
        gsap.fromTo(
            element,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: "power2.out",
                delay: Math.min(index * 0.01, 0.08),
                scrollTrigger: {
                    trigger: element,
                    start: revealStart,
                    once: true,
                },
            }
        );
    });

    // ─── Ticker ───────────────────────────────────────────────────────────────
    const tickerTrack = document.querySelector(".ticker-track");
    if (tickerTrack) {
        gsap.to(tickerTrack, {
            xPercent: -50,
            duration: 28,
            ease: "none",
            repeat: -1,
        });
    }

    // ─── Scroll progress meter ────────────────────────────────────────────────
    gsap.to(".scroll-meter-fill", {
        width: "100%",
        ease: "none",
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.25,
        },
    });

    // ─── Edge signal ──────────────────────────────────────────────────────────
    gsap.to(".edge-signal-core", {
        y: () => Math.max(0, window.innerHeight - 92),
        ease: "none",
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
        },
    });

    // ─── Project stack (desktop only) ─────────────────────────────────────────
    const projectCards = gsap.utils.toArray("[data-stack-card]");
    const projectStack = document.querySelector(".project-stack");
    const projectWrap = document.querySelector(".project-stack-wrap");

    if (projectCards.length > 0) {
        projectCards.forEach((card, index) => {
            gsap.set(card, {
                y: index * 18,
                scale: 1 - index * 0.015,
                zIndex: projectCards.length - index,
            });
        });
    }

    if (projectStack && projectWrap && projectCards.length > 1 && !isMobile) {
        const travel = 110;
        const stackTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: projectWrap,
                start: "top top+=120",
                end: () => `+=${projectCards.length * 300}`,
                scrub: 0.9,
                pin: projectStack,
                invalidateOnRefresh: true,
            },
        });

        projectCards.forEach((card, index) => {
            if (index === projectCards.length - 1) return;

            stackTimeline
                .to(card, { y: -travel, opacity: 0.12, duration: 1, ease: "none" }, index)
                .to(projectCards[index + 1], { y: 0, scale: 1, duration: 1, ease: "none" }, index);
        });
    } else if (isMobile && projectCards.length > 0) {
        // FIX 3: on mobile just fade cards in normally, no pinning
        gsap.fromTo(
            projectCards,
            { opacity: 0, y: 24 },
            {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: projectWrap,
                    start: "top 95%",
                    once: true,
                },
            }
        );
    }

    // ─── Blog rail ────────────────────────────────────────────────────────────
    const blogRail = document.querySelector("[data-blog-rail]");
    const blogTrack = document.querySelector("[data-blog-track]");
    const blogCards = gsap.utils.toArray(".blog-card");

    if (blogRail && blogTrack && blogCards.length) {
        const getBlogDistance = () => Math.max(0, blogTrack.scrollWidth - blogRail.clientWidth);

        gsap.fromTo(
            blogCards,
            { autoAlpha: 0, y: 28 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.09,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#blog",
                    start: isMobile ? "top 90%" : "top 78%",
                    once: true,
                },
            },
        );

        if (!isMobile && getBlogDistance() > 0) {
            gsap.to(blogTrack, {
                x: () => -getBlogDistance(),
                ease: "none",
                scrollTrigger: {
                    trigger: "#blog",
                    start: "top 14%",
                    end: () => `+=${getBlogDistance() + window.innerHeight * 0.45}`,
                    scrub: 0.8,
                    pin: blogRail,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });
        }
    }

    // ─── Profile cards ────────────────────────────────────────────────────────
    const profileCards = gsap.utils.toArray(".profile-card");
    if (profileCards.length) {
        gsap.fromTo(
            profileCards,
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.58,
                ease: "power2.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: "#profile-intel",
                    start: isMobile ? "top 90%" : "top 76%",
                    once: true,
                },
            },
        );
    }

    // ─── Magnetic buttons (desktop only) ──────────────────────────────────────
    if (pointerFine && !reducedMotion) {
        const magnets = Array.from(document.querySelectorAll(".magnetic"));
        magnets.forEach((target) => {
            target.addEventListener("pointermove", (event) => {
                const bounds = target.getBoundingClientRect();
                const x = (event.clientX - bounds.left - bounds.width / 2) * 0.12;
                const y = (event.clientY - bounds.top - bounds.height / 2) * 0.18;
                gsap.to(target, { x, y, duration: 0.25, ease: "power2.out" });
            });
            target.addEventListener("pointerleave", () => {
                gsap.to(target, { x: 0, y: 0, duration: 0.28, ease: "power2.out" });
            });
        });
    }

    // ─── Custom cursor (desktop only) ─────────────────────────────────────────
    if (pointerFine && cursorShell) {
        body.classList.add("has-custom-cursor");
        gsap.set(cursorShell, { autoAlpha: 1 });

        const cursorX = gsap.quickTo(cursorShell, "x", { duration: 0.16, ease: "power2.out" });
        const cursorY = gsap.quickTo(cursorShell, "y", { duration: 0.16, ease: "power2.out" });

        window.addEventListener("pointermove", (event) => {
            cursorX(event.clientX);
            cursorY(event.clientY);
        });

        const hoverTargets = document.querySelectorAll("a, button");
        hoverTargets.forEach((target) => {
            target.addEventListener("mouseenter", () => {
                cursorShell.classList.add("is-link");
                if (pointerLabel) pointerLabel.textContent = "OPEN";
            });
            target.addEventListener("mouseleave", () => {
                cursorShell.classList.remove("is-link");
                if (pointerLabel) pointerLabel.textContent = "TRACK";
            });
        });

        const scanTargets = document.querySelectorAll(".subject-photo, .profile-card, .project-card");
        scanTargets.forEach((target) => {
            target.addEventListener("mouseenter", () => {
                if (pointerLabel) pointerLabel.textContent = "SCAN";
            });
            target.addEventListener("mouseleave", () => {
                if (pointerLabel && !cursorShell.classList.contains("is-link")) {
                    pointerLabel.textContent = "TRACK";
                }
            });
        });
    }

    // ─── ScrollTrigger refresh (FIX 4: delayed load refresh for mobile) ───────
    let refreshTimer;
    const refreshScroll = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 220);
    };

    window.addEventListener("resize", refreshScroll);
    window.addEventListener("orientationchange", refreshScroll);

    window.addEventListener("load", () => {
        setTimeout(() => ScrollTrigger.refresh(), 500);
    });
});