window.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const body = document.body;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = reducedMotionQuery.matches;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;

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
            /* Ignore localStorage read issues */
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
                /* Ignore localStorage write issues */
            }
        });
    }

    const pad = (value, length = 2) => String(value).padStart(length, "0");

    const setClock = () => {
        if (!runtimeClock) {
            return;
        }
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

    if (reducedMotion) {
        root.classList.add("reduced-motion");
        return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
        root.classList.add("reduced-motion");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const introTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    introTimeline
        .to(".top-nav", { opacity: 1, y: 0, duration: 0.44 })
        .to(".corner-readout", { opacity: 1, y: 0, duration: 0.34 }, "-=0.24")
        .to(".section-status", { opacity: 1, y: 0, duration: 0.38 }, "-=0.24")
        .to(".intro-item", { opacity: 1, y: 0, duration: 0.68, stagger: 0.08 }, "-=0.2");

    gsap.to(".scroll-meter-fill", {
        width: "100%",
        ease: "none",
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
        },
    });

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

    gsap.to(".hero-name", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
        },
    });

    gsap.to(".hero-sub", {
        yPercent: -32,
        opacity: 0.55,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
        },
    });

    gsap.to(".floating-card-a", {
        yPercent: -20,
        xPercent: -8,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.9,
        },
    });

    gsap.to(".floating-card-b", {
        yPercent: -32,
        xPercent: 7,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
        },
    });

    gsap.to(".floating-card-c", {
        yPercent: -45,
        xPercent: -6,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
        },
    });

    gsap.to(".ticker-track", {
        xPercent: -35,
        ease: "none",
        scrollTrigger: {
            trigger: ".ticker-scene",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.9,
        },
    });

    gsap.utils.toArray(".reveal").forEach((item) => {
        gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: {
                trigger: item,
                start: "top 82%",
            },
        });
    });

    gsap.from(".subject-head", {
        y: 34,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#profile-intel",
            start: "top 78%",
        },
    });

    gsap.from(".profile-card-subject", {
        x: -36,
        opacity: 0,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#profile-intel",
            start: "top 74%",
        },
    });

    gsap.from(".profile-card-report", {
        y: 30,
        opacity: 0,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#profile-intel",
            start: "top 72%",
        },
    });

    gsap.from(".profile-card-inventory", {
        x: 36,
        opacity: 0,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#profile-intel",
            start: "top 74%",
        },
    });

    gsap.from(".inventory-tags span", {
        y: 18,
        opacity: 0,
        stagger: 0.04,
        duration: 0.45,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".profile-card-inventory",
            start: "top 82%",
        },
    });

    const stackCards = gsap.utils.toArray("[data-stack-card]");

    ScrollTrigger.matchMedia({
        "(min-width: 901px)": () => {
            if (stackCards.length) {
                gsap.set(stackCards, {
                    y: (index) => index * 78,
                    scale: (index) => 1 - index * 0.05,
                    opacity: (index) => (index === 0 ? 1 : 0.48),
                    zIndex: (index) => stackCards.length - index,
                });

                const timeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".project-stack-wrap",
                        start: "top top+=84",
                        end: () => `+=${stackCards.length * 520}`,
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });

                stackCards.forEach((card, index) => {
                    if (index === stackCards.length - 1) {
                        timeline.to(card, { y: 0, scale: 1, opacity: 1, duration: 1 }, index);
                        return;
                    }

                    timeline.to(
                        card,
                        {
                            y: () => -window.innerHeight * 0.55,
                            scale: 0.88,
                            opacity: 0.12,
                            rotateX: 7,
                            duration: 1,
                        },
                        index,
                    );

                    timeline.to(
                        stackCards[index + 1],
                        {
                            y: 0,
                            scale: 1,
                            opacity: 1,
                            duration: 1,
                        },
                        index,
                    );
                });
            }

            const skillsTrack = document.querySelector(".skills-track");
            const skillsPin = document.querySelector(".skills-pin");

            if (skillsTrack && skillsPin) {
                const computeDistance = () => Math.max(0, skillsTrack.scrollWidth - skillsPin.clientWidth);

                gsap.to(skillsTrack, {
                    x: () => -computeDistance(),
                    ease: "none",
                    scrollTrigger: {
                        trigger: skillsPin,
                        start: "top top+=84",
                        end: () => `+=${computeDistance() + 420}`,
                        scrub: 1,
                        pin: true,
                        invalidateOnRefresh: true,
                    },
                });
            }
        },
        "(max-width: 900px)": () => {
            if (stackCards.length) {
                gsap.from(stackCards, {
                    y: 50,
                    opacity: 0,
                    stagger: 0.16,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: "#projects",
                        start: "top 75%",
                    },
                });
            }
        },
    });

    gsap.utils.toArray(".skill-fill").forEach((fill) => {
        const level = Number(fill.dataset.level || 0);
        gsap.to(fill, {
            width: `${Math.max(0, Math.min(level, 100))}%`,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
                trigger: fill,
                start: "top 88%",
            },
        });
    });

    const timelineEntries = gsap.utils.toArray(".timeline-entry");
    timelineEntries.forEach((entry, index) => {
        gsap.from(entry, {
            x: index % 2 === 0 ? -42 : 42,
            opacity: 0,
            duration: 0.74,
            ease: "power2.out",
            scrollTrigger: {
                trigger: entry,
                start: "top 85%",
            },
        });
    });

    gsap.to(".signal-dot", {
        opacity: 0.45,
        repeat: -1,
        yoyo: true,
        duration: 0.72,
        ease: "sine.inOut",
    });

    const statusValue = document.querySelector("[data-active-section]");
    const sections = gsap.utils.toArray(".section-anchor");
    const navLinks = gsap.utils.toArray(".nav-link");

    const setActiveSection = (section) => {
        if (statusValue) {
            statusValue.textContent = section?.dataset.sectionLabel || "Intro";
        }

        navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            link.classList.toggle("is-active", href === `#${section.id}`);
        });
    };

    sections.forEach((section) => {
        ScrollTrigger.create({
            trigger: section,
            start: "top 35%",
            end: "bottom 35%",
            onEnter: () => setActiveSection(section),
            onEnterBack: () => setActiveSection(section),
        });
    });

    if (sections.length > 0) {
        setActiveSection(sections[0]);
    }

    const magneticTargets = gsap.utils.toArray(".magnetic");

    magneticTargets.forEach((target) => {
        const toX = gsap.quickTo(target, "x", { duration: 0.24, ease: "power2.out" });
        const toY = gsap.quickTo(target, "y", { duration: 0.24, ease: "power2.out" });

        target.addEventListener("mousemove", (event) => {
            const bounds = target.getBoundingClientRect();
            const x = event.clientX - bounds.left - bounds.width / 2;
            const y = event.clientY - bounds.top - bounds.height / 2;
            toX(x * 0.17);
            toY(y * 0.22);
        });

        target.addEventListener("mouseleave", () => {
            toX(0);
            toY(0);
        });
    });

    if (pointerFine && cursorShell) {
        body.classList.add("has-custom-cursor");
        gsap.set(cursorShell, { autoAlpha: 1 });

        const cursorX = gsap.quickTo(cursorShell, "x", { duration: 0.18, ease: "power3.out" });
        const cursorY = gsap.quickTo(cursorShell, "y", { duration: 0.18, ease: "power3.out" });

        window.addEventListener("pointermove", (event) => {
            cursorX(event.clientX);
            cursorY(event.clientY);
        });

        const hoverTargets = gsap.utils.toArray("a, button");
        hoverTargets.forEach((target) => {
            target.addEventListener("mouseenter", () => {
                cursorShell.classList.add("is-link");
                if (pointerLabel) {
                    pointerLabel.textContent = "OPEN";
                }
            });

            target.addEventListener("mouseleave", () => {
                cursorShell.classList.remove("is-link");
                if (pointerLabel) {
                    pointerLabel.textContent = "TRACK";
                }
            });
        });

        const scanTargets = gsap.utils.toArray(".subject-photo, .profile-card-report, .project-card");
        scanTargets.forEach((target) => {
            target.addEventListener("mouseenter", () => {
                if (pointerLabel) {
                    pointerLabel.textContent = "SCAN";
                }
            });
            target.addEventListener("mouseleave", () => {
                if (pointerLabel) {
                    pointerLabel.textContent = "TRACK";
                }
            });
        });
    }
});
