window.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const body = document.body;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    // Keep in sync with the mobile @media block in styles.css (also covers phones in landscape)
    const mobileQuery = window.matchMedia("(max-width: 900px), (pointer: coarse) and (max-height: 500px)");
    let isMobile = mobileQuery.matches;

    // Smooth scroller (Lenis), created in initAnimations. Everything that scrolls the page
    // goes through scrollToY so it works with or without it.
    let lenis = null;
    const scrollToY = (y, { smooth = true } = {}) => {
        if (lenis) lenis.scrollTo(y, { immediate: !smooth });
        else window.scrollTo({ top: y, behavior: smooth && !reducedMotion ? "smooth" : "auto" });
    };

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
        // The readout is hidden on mobile; skip the DOM writes there
        if (!runtimeClock || isMobile || document.hidden) return;
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
    const navScroller = document.querySelector(".top-nav nav");

    // On mobile the link row scrolls sideways; keep the active link in view
    const revealNavLink = (link) => {
        if (!navScroller || navScroller.scrollWidth <= navScroller.clientWidth) return;
        const navBox = navScroller.getBoundingClientRect();
        const linkBox = link.getBoundingClientRect();
        const left = navScroller.scrollLeft + (linkBox.left - navBox.left) - (navBox.width - linkBox.width) / 2;
        navScroller.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
    };

    let activeSection = null;
    const setActiveSection = (section) => {
        activeSection = section;
        if (statusValue) statusValue.textContent = section?.dataset.sectionLabel || "Intro";
        navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${section.id}`;
            if (active && !link.classList.contains("is-active")) revealNavLink(link);
            link.classList.toggle("is-active", active);
        });
    };

    // Active section = whichever one crosses a thin line across the middle of the screen.
    // A ratio threshold never fires for pinned sections, which are many screens tall.
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const visible = entries.find((e) => e.isIntersecting);
            if (visible) setActiveSection(visible.target);
        },
        { threshold: 0, rootMargin: "-49% 0px -50% 0px" }
    );

    // The last section is short and can't reach the middle line, so the page bottom selects it
    window.addEventListener("scroll", () => {
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom && sectionAnchors.length) setActiveSection(sectionAnchors[sectionAnchors.length - 1]);
    }, { passive: true });

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
        while (logsBody.children.length > 7) logsBody.removeChild(logsBody.firstChild);
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
        // The logs take the BUILD MODE card's spot, so that card steps aside
        document.getElementById("hero")?.classList.toggle("is-tracking", active);
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

    // ─── Page spotlight ──────────────────────────────────────────────────────
    // The whole portfolio sits in shadow and a light glides after the mouse, lighting up
    // whatever is under it. On touch screens (no cursor) it rests over the middle of the
    // screen, where you read, sways gently, and jumps to a tap for a moment. The background
    // network (network.js) reads the same position, so the web glows under the same light.
    const spotlight = document.querySelector("[data-spotlight]");
    const pageLight = (window.portfolioLight = { x: window.innerWidth / 2, y: window.innerHeight * 0.45 });
    if (spotlight) {
        const target = { x: pageLight.x, y: pageLight.y };
        let mouseSteering = false;
        let tapSteering = false;
        let tapTimer;

        window.addEventListener("pointermove", (e) => {
            if (e.pointerType !== "mouse") return;
            mouseSteering = true;
            target.x = e.clientX;
            target.y = e.clientY;
        }, { passive: true });
        window.addEventListener("pointerdown", (e) => {
            if (e.pointerType === "mouse") return;
            tapSteering = true;
            target.x = e.clientX;
            target.y = e.clientY;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { tapSteering = false; }, 2200);
        }, { passive: true });

        // Only repaint the full-screen shadow when the light has actually moved
        let drawnX = -1;
        let drawnY = -1;
        const tick = (time) => {
            if (!mouseSteering && !tapSteering) {
                // Desktop before the mouse moves: a slow sway. Touch: hold still where you read
                // (a constantly moving full-screen layer costs phones frames).
                const sway = reducedMotion || !pointerFine ? 0 : 1;
                target.x = window.innerWidth * (0.5 + 0.22 * Math.sin(time / 3200) * sway);
                target.y = window.innerHeight * (0.46 + 0.08 * Math.sin(time / 2300) * sway);
            }
            const ease = reducedMotion ? 1 : 0.1;
            pageLight.x += (target.x - pageLight.x) * ease;
            pageLight.y += (target.y - pageLight.y) * ease;
            if (Math.abs(pageLight.x - drawnX) > 0.4 || Math.abs(pageLight.y - drawnY) > 0.4) {
                drawnX = pageLight.x;
                drawnY = pageLight.y;
                spotlight.style.setProperty("--spot-x", `${drawnX.toFixed(1)}px`);
                spotlight.style.setProperty("--spot-y", `${drawnY.toFixed(1)}px`);
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // ─── Project Slider: SLIDER/LIST toggle + Arrows ─────────────────────────
    const projectSection = document.getElementById("projects");
    const sliderWrap = document.querySelector("[data-slider-wrap]");
    const sliderTrack = document.querySelector("[data-slider-track]");
    const slides = Array.from(document.querySelectorAll("[data-slide]"));
    const viewBtns = Array.from(document.querySelectorAll("[data-view]"));
    const arrowsPrev = Array.from(document.querySelectorAll("[data-arrow='prev']"));
    const arrowsNext = Array.from(document.querySelectorAll("[data-arrow='next']"));
    const projectCount = document.querySelector("[data-project-count]");
    const projectProgress = document.querySelector("[data-project-progress]");
    let currentSlide = 0;
    let currentView = "slider";
    let horizontalST = null;
    let boardDragging = false;

    // Desktop board: the track sits at a fixed position per open card. With exactly one wide
    // card the track's width is constant, and this spacing always keeps the open card fully
    // inside the frame (first card flush left ... last card flush right).
    const boardDistance = () => (sliderTrack && sliderWrap ? Math.max(0, sliderTrack.scrollWidth - sliderWrap.clientWidth) : 0);
    const boardX = (index) => -(index / Math.max(1, slides.length - 1)) * boardDistance();
    const moveBoard = (immediate = false) => {
        if (!horizontalST || !window.gsap) return;
        gsap.to(sliderTrack, { x: boardX(currentSlide), duration: immediate ? 0 : 0.85, ease: "power3.out", overwrite: true });
    };

    const setActiveSlide = (index) => {
        if (!slides.length) return;
        currentSlide = Math.max(0, Math.min(index, slides.length - 1));
        slides.forEach((slide, i) => slide.classList.toggle("is-active", i === currentSlide));
        if (projectCount) projectCount.textContent = `${pad(currentSlide + 1)} / ${pad(slides.length)}`;
        if (projectProgress) projectProgress.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
        arrowsPrev.forEach((btn) => { btn.disabled = currentSlide === 0; });
        arrowsNext.forEach((btn) => { btn.disabled = currentSlide === slides.length - 1; });
        if (!boardDragging) moveBoard();
    };

    const setView = (view) => {
        currentView = view;
        viewBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === view));
        if (projectSection) {
            projectSection.classList.toggle("list-view", view === "list");
        }
        // Kill existing horizontal ScrollTrigger if switching views
        if (horizontalST) { horizontalST.kill(); horizontalST = null; }
        if (sliderTrack && window.gsap) gsap.set(sliderTrack, { x: 0 });

        if (view === "slider" && !isMobile && window.gsap && window.ScrollTrigger) {
            initHorizontalScroll();
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        setActiveSlide(0);
    };

    viewBtns.forEach((btn) => {
        btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    // Go to a file from any input (arrows, keys, drag, trackpad, click). On the pinned desktop
    // board the page scroll is moved to that file's step too, so scrolling carries on from
    // there. Inside the pin that jump is invisible (the board doesn't move vertically).
    const scrollToSlide = (index) => {
        if (!slides.length) return;
        setActiveSlide(index);
        if (isMobile && sliderWrap) {
            // Mobile: scroll the native scroll container
            const slideEl = slides[currentSlide];
            sliderWrap.scrollTo({ left: slideEl.offsetLeft - 16, behavior: "smooth" });
        } else if (horizontalST) {
            const step = (horizontalST.end - horizontalST.start) / Math.max(1, slides.length - 1);
            const inPin = window.scrollY >= horizontalST.start - 2 && window.scrollY <= horizontalST.end + 2;
            scrollToY(horizontalST.start + step * currentSlide, { smooth: !inPin });
        } else if (sliderTrack && sliderWrap && currentView === "slider") {
            const slideEl = slides[currentSlide];
            const target = Math.min(slideEl.offsetLeft, boardDistance());
            if (window.gsap) gsap.to(sliderTrack, { x: -target, duration: 0.5, ease: "power2.out" });
        }
    };

    arrowsPrev.forEach((btn) => btn.addEventListener("click", () => scrollToSlide(currentSlide - 1)));
    arrowsNext.forEach((btn) => btn.addEventListener("click", () => scrollToSlide(currentSlide + 1)));

    // Clicking a closed file opens it; clicking the open file goes to its live demo (or its
    // source if there's no demo). Hovering only lights a file up (CSS), so nothing shifts
    // under the cursor. Links inside the card keep working as normal.
    if (!pointerFine) {
        document.querySelectorAll(".project-open").forEach((el) => { el.textContent = el.textContent.replace("CLICK", "TAP"); });
    }
    let suppressSlideClick = false;
    slides.forEach((slide, i) => {
        slide.addEventListener("click", (e) => {
            if (suppressSlideClick || e.target.closest("a, button")) return;
            if (i !== currentSlide && currentView !== "list") {
                scrollToSlide(i);
                return;
            }
            const href = slide.dataset.href;
            if (href) window.open(href, "_blank", "noopener");
        });
    });

    // Free movement on the desktop board: mouse drag (with a flick to the next file),
    // sideways trackpad swipes, and the arrow keys while the board is on screen.
    // Touch screens keep their native swipe.
    if (sliderWrap && sliderTrack && slides.length) {
        let pointerId = null;
        let startX = 0;
        let startTrackX = 0;
        let moved = false;

        sliderWrap.addEventListener("pointerdown", (e) => {
            if (!horizontalST || e.button !== 0 || e.pointerType !== "mouse" || e.target.closest("a, button")) return;
            pointerId = e.pointerId;
            startX = e.clientX;
            startTrackX = gsap.getProperty(sliderTrack, "x");
            moved = false;
        });
        sliderWrap.addEventListener("pointermove", (e) => {
            if (e.pointerId !== pointerId) return;
            const dx = e.clientX - startX;
            if (!moved) {
                if (Math.abs(dx) < 6) return;
                moved = true;
                boardDragging = true;
                gsap.killTweensOf(sliderTrack, "x");
                sliderWrap.setPointerCapture(pointerId);
                sliderWrap.classList.add("is-dragging");
            }
            // Slight resistance past either end
            const raw = startTrackX + dx;
            const min = -boardDistance();
            const x = raw > 0 ? raw * 0.3 : raw < min ? min + (raw - min) * 0.3 : raw;
            gsap.set(sliderTrack, { x });
        });
        const endDrag = (e) => {
            if (e.pointerId !== pointerId) return;
            pointerId = null;
            sliderWrap.classList.remove("is-dragging");
            if (!moved) return;
            boardDragging = false;
            suppressSlideClick = true;
            setTimeout(() => { suppressSlideClick = false; }, 60);
            const dx = e.clientX - startX;
            let index = Math.round((-gsap.getProperty(sliderTrack, "x") / Math.max(1, boardDistance())) * (slides.length - 1));
            if (index === currentSlide && Math.abs(dx) > 40) index += dx < 0 ? 1 : -1;
            scrollToSlide(Math.max(0, Math.min(slides.length - 1, index)));
            moveBoard();
        };
        sliderWrap.addEventListener("pointerup", endDrag);
        sliderWrap.addEventListener("pointercancel", endDrag);
        sliderWrap.addEventListener("dragstart", (e) => e.preventDefault());

        let wheelAccum = 0;
        let lastWheelStep = 0;
        sliderWrap.addEventListener("wheel", (e) => {
            if (!horizontalST || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
            e.preventDefault();
            e.stopPropagation();
            wheelAccum += e.deltaX;
            const now = performance.now();
            if (Math.abs(wheelAccum) > 60 && now - lastWheelStep > 380) {
                stepBoardOrSection(wheelAccum > 0 ? 1 : -1);
                wheelAccum = 0;
                lastWheelStep = now;
            }
        }, { passive: false });
    }

    // Arrow keys: step the project board or the learning-logs rail, whichever is on screen
    // ─── Section jumping ─────────────────────────────────────────────────────
    // Left/right moves between sections anywhere on the page (arrow keys, sideways trackpad
    // swipes, sideways finger swipes). On the project board and the learning-logs rail it
    // moves one card at a time first and hands over to the next section at either end.
    // A small "SECTOR" tag confirms where you landed.
    const sectorToast = document.querySelector("[data-sector-toast]");
    let sectorToastTimer;
    let lastSectionJump = 0;
    let blogST = null; // the learning-logs pin, set up in initAnimations
    // Sections with a sideways board: a jump lands inside the board (first card going
    // forward, last card going back) so left/right flows card by card through it
    const pinFor = (section) => (section?.id === "projects" ? horizontalST : section?.id === "blog" ? blogST : null);
    const jumpSection = (dir, { fromTouch = false } = {}) => {
        const now = performance.now();
        if (now - lastSectionJump < 700) return;
        const go = (top) => {
            lastSectionJump = now;
            // Touch: the browser's own smooth scroll (Lenis drops a glide started as a finger lifts)
            if (fromTouch || !lenis) window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
            else lenis.scrollTo(top, { duration: 1.2 });
        };
        // Still on this section's heading, before its board: step into the board first
        const ownPin = pinFor(activeSection);
        if (ownPin && dir > 0 && window.scrollY < ownPin.start - 2) return go(ownPin.start + 1);
        if (ownPin && dir < 0 && window.scrollY > ownPin.end + 2) return go(ownPin.end - 1);

        const list = sectionAnchors.filter((s) => s.id);
        const from = Math.max(0, list.indexOf(activeSection));
        const to = Math.max(0, Math.min(list.length - 1, from + dir));
        if (to === from) return;
        const target = list[to];
        const targetPin = pinFor(target);
        const nav = document.querySelector(".top-nav");
        const offset = target.id === "hero" || !nav ? 0 : nav.getBoundingClientRect().bottom + 12;
        const top = targetPin
            ? (dir > 0 ? targetPin.start + 1 : targetPin.end - 1)
            : Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
        go(top);
        if (sectorToast) {
            sectorToast.textContent = `${dir > 0 ? "→" : "←"}  SECTOR // ${target.dataset.sectionLabel || target.id}`;
            sectorToast.classList.add("is-visible");
            clearTimeout(sectorToastTimer);
            sectorToastTimer = setTimeout(() => sectorToast.classList.remove("is-visible"), 1500);
        }
    };

    // Step the project board; past either end, move on to the neighbouring section
    const stepBoardOrSection = (dir) => {
        const next = currentSlide + dir;
        if (next < 0 || next >= slides.length) jumpSection(dir);
        else scrollToSlide(next);
    };

    const railKeySteppers = [];
    window.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (e.altKey || e.ctrlKey || e.metaKey || (e.target.closest && e.target.closest("input, textarea, select"))) return;
        const dir = e.key === "ArrowRight" ? 1 : -1;
        e.preventDefault();
        if (horizontalST && horizontalST.isActive) {
            stepBoardOrSection(dir);
            return;
        }
        for (const step of railKeySteppers) {
            if (step(dir)) return;
        }
        jumpSection(dir);
    });

    // Sideways trackpad swipe anywhere else on the page. Also stops the browser treating
    // it as back/forward navigation.
    // If the board or the rail is pinned on screen, the swipe moves its cards first.
    let pageWheelX = 0;
    let lastPageWheelStep = 0;
    window.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) { pageWheelX = 0; return; }
        if (e.target.closest && e.target.closest(".top-nav nav")) return;
        e.preventDefault();
        pageWheelX += e.deltaX;
        if (Math.abs(pageWheelX) < 80) return;
        const dir = pageWheelX > 0 ? 1 : -1;
        pageWheelX = 0;
        const now = performance.now();
        if (now - lastPageWheelStep < 380) return;
        lastPageWheelStep = now;
        if (horizontalST && horizontalST.isActive) stepBoardOrSection(dir);
        else if (!railKeySteppers.some((step) => step(dir))) jumpSection(dir);
    }, { passive: false });

    // Sideways finger swipe (not on the sideways scrollers, which handle their own swipes)
    let touchStart = null;
    window.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        const own = e.target.closest && e.target.closest(".project-slider-wrap, .blog-rail, .top-nav nav");
        touchStart = e.touches.length === 1 && !own ? { x: t.clientX, y: t.clientY, time: performance.now() } : null;
    }, { passive: true });
    window.addEventListener("touchend", (e) => {
        if (!touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        const quick = performance.now() - touchStart.time < 650;
        touchStart = null;
        if (quick && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) jumpSection(dx < 0 ? 1 : -1, { fromTouch: true });
    }, { passive: true });

    if (sliderWrap && slides.length) {
        let slideScrollTimer;
        sliderWrap.addEventListener("scroll", () => {
            if (!isMobile) return;
            clearTimeout(slideScrollTimer);
            slideScrollTimer = setTimeout(() => {
                const nearest = slides.reduce((best, slide, i) => {
                    const distance = Math.abs(slide.offsetLeft - sliderWrap.scrollLeft - 16);
                    return distance < best.distance ? { i, distance } : best;
                }, { i: currentSlide, distance: Infinity });
                setActiveSlide(nearest.i);
            }, 80);
        }, { passive: true });
    }

    setActiveSlide(0);

    // Breakpoint flips (rotation, window resize): rebuild the slider for the new layout
    let motionReady = false;
    mobileQuery.addEventListener("change", (e) => {
        isMobile = e.matches;
        if (motionReady) setView(currentView);
    });

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
                    setTimeout(onComplete, 250); // Start the intro while the curtain is still lifting
                }, 400);
            }
        };

        requestAnimationFrame(tick);
    };

    // ─── Text effects ────────────────────────────────────────────────────────
    const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#<>/_";

    // Decode text left to right like an intercepted message. Only used on monospace text,
    // so the width doesn't jump while letters change. Punctuation and spaces stay put.
    const scramble = (el, duration = 0.8) => {
        if (!el || reducedMotion) return;
        const final = el.dataset.text || (el.dataset.text = el.textContent);
        const start = performance.now();
        const frame = (now) => {
            const p = Math.min(1, (now - start) / (duration * 1000));
            const revealed = Math.floor(p * final.length);
            let out = final.slice(0, revealed);
            for (let i = revealed; i < final.length; i++) {
                out += /[a-z0-9]/i.test(final[i]) ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : final[i];
            }
            el.textContent = p < 1 ? out : final;
            if (p < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    };

    // Split each line of a heading into per-letter spans inside a mask; words stay unbreakable
    const splitChars = (heading) => {
        heading.setAttribute("aria-label", heading.textContent.replace(/\s+/g, " ").trim());
        const chars = [];
        heading.querySelectorAll(":scope > span").forEach((line) => {
            const words = line.textContent.trim().split(/\s+/);
            line.textContent = "";
            line.classList.add("split-line");
            line.setAttribute("aria-hidden", "true");
            words.forEach((word, w) => {
                if (w > 0) line.appendChild(document.createTextNode(" "));
                const wordEl = document.createElement("span");
                wordEl.className = "split-word";
                [...word].forEach((c) => {
                    const charEl = document.createElement("span");
                    charEl.className = "split-char";
                    charEl.textContent = c;
                    wordEl.appendChild(charEl);
                    chars.push(charEl);
                });
                line.appendChild(wordEl);
            });
        });
        return chars;
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

        // Weighted wheel scrolling that glides to a stop. Touch keeps native scrolling (Lenis
        // leaves it alone by default). Driven by GSAP's ticker so Lenis and ScrollTrigger
        // update on the same frame, which keeps pins and scrubs in step.
        if (window.Lenis) {
            lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
            lenis.on("scroll", ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        }

        // In-page links glide to their section and land just under the fixed nav
        const navBar = document.querySelector(".top-nav");
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener("click", (e) => {
                const target = document.getElementById(link.getAttribute("href").slice(1));
                if (!target || !lenis) return;
                e.preventDefault();
                const offset = navBar ? navBar.getBoundingClientRect().bottom + 12 : 0;
                lenis.scrollTo(target, { offset: -offset, duration: 1.4 });
                history.replaceState(null, "", link.getAttribute("href"));
            });
        });

        // ─── Intro ───────────────────────────────────────────────────────────
        const heroName = document.querySelector(".hero-name");
        const nameChars = heroName ? splitChars(heroName) : [];
        const statusChip = document.querySelector(".status-chip");

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
            .fromTo(".top-nav",         { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo(".corner-readout",  { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.35 }, "-=0.3")
            .fromTo(".section-status",  { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.35 }, "<")
            .fromTo(".hero-grid-lines", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.4, duration: 1.2, ease: "expo.out" }, 0.1);
        if (statusChip) {
            intro.fromTo(statusChip, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, onStart: () => scramble(statusChip, 0.7) }, 0.15);
        }
        if (heroName) {
            // Letters rise out of a mask, one after another
            intro.set(heroName, { opacity: 1, y: 0 }, 0.2)
                .fromTo(nameChars, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.95, stagger: 0.035, ease: "expo.out" }, 0.25);
        }
        intro.fromTo(".intro-item:not(.hero-name):not(.status-chip)", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.6);

        // Hero layers drift at different speeds as it scrolls away
        const heroScroll = () => ({ trigger: "#hero", start: "top top", end: "bottom top", scrub: true });
        if (heroName) gsap.to(heroName, { yPercent: -22, ease: "none", scrollTrigger: heroScroll() });
        gsap.to(".hero-grid-lines", { yPercent: 35, ease: "none", scrollTrigger: heroScroll() });
        gsap.to(".floating-card", { yPercent: (i) => -50 - i * 40, ease: "none", scrollTrigger: heroScroll() });

        // ─── Reveal animations ───────────────────────────────────────────────
        const revealStart = isMobile ? "top 92%" : "top 84%";
        // Profile cards and timeline entries have their own entrances below
        gsap.utils.toArray(".reveal:not(.profile-card):not(.timeline-entry)").forEach((el) => {
            gsap.fromTo(el,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.6, ease: "power3.out",
                    scrollTrigger: { trigger: el, start: revealStart, once: true },
                }
            );
        });

        // One-shot "it's on screen now" hook for class-driven effects. IntersectionObserver also
        // reports elements that are already visible after a jump (#contact links, scroll restore),
        // which ScrollTrigger's once-callbacks miss.
        const revealMargin = isMobile ? "0px 0px -8% 0px" : "0px 0px -16% 0px";
        const onReveal = (el, fn) => {
            if (!el) return;
            const io = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) { io.disconnect(); fn(); }
            }, { rootMargin: revealMargin });
            io.observe(el);
        };

        // Section headings: a redaction bar sweeps across and leaves the text behind.
        // The hidden state is only applied here, so headings stay readable if this never runs.
        gsap.utils.toArray(".scene-head h2, .subject-head h2, .contact-panel h2").forEach((heading) => {
            heading.classList.add("redact-armed");
            onReveal(heading, () => heading.classList.add("is-redacted"));
        });

        // Mono labels decode as they arrive
        gsap.utils.toArray(".scene-eyebrow, .subject-case").forEach((label) => {
            onReveal(label, () => scramble(label, 0.8));
        });

        // ─── Ticker ──────────────────────────────────────────────────────────
        // Cruises on its own; scrolling speeds it up (backwards when scrolling up) and tilts it
        const tickerTrack = document.querySelector(".ticker-track");
        if (tickerTrack) {
            const ticker = gsap.to(tickerTrack, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
            const skew = { value: 0 };
            const setSkew = gsap.quickSetter(tickerTrack, "skewX", "deg");
            const clampSkew = gsap.utils.clamp(-8, 8);
            ScrollTrigger.create({
                trigger: body, start: "top top", end: "bottom bottom",
                onUpdate: (self) => {
                    const velocity = gsap.utils.clamp(-3000, 3000, self.getVelocity());
                    gsap.fromTo(ticker, { timeScale: 1 + velocity / 250 }, { timeScale: 1, duration: 1.2, ease: "power2.out", overwrite: true });
                    const nextSkew = clampSkew(velocity / -300);
                    if (Math.abs(nextSkew) > Math.abs(skew.value)) {
                        skew.value = nextSkew;
                        gsap.to(skew, { value: 0, duration: 0.8, ease: "power3", overwrite: true, onUpdate: () => setSkew(skew.value) });
                    }
                },
            });
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
        // Phones keep the native swipe: the cards are taller than the space under the nav,
        // so pinning them would cut off their bottom half.
        if (!isMobile && currentView === "slider") {
            initHorizontalScroll();
        }

        // ─── Project slides ──────────────────────────────────────────────────
        // Files slide in from the right; once on screen, the active file types out its
        // terminal lines and the others dim (CSS keyed off .slides-armed / .is-active)
        if (slides.length) {
            gsap.fromTo(slides,
                { opacity: 0, x: 70 },
                {
                    opacity: 1, x: 0, duration: 0.7, stagger: 0.09, ease: "power3.out",
                    scrollTrigger: { trigger: "#projects", start: isMobile ? "top 85%" : "top 78%", once: true },
                }
            );
            onReveal(sliderWrap, () => sliderWrap.classList.add("slides-armed"));
        }

        // ─── Blog rail ───────────────────────────────────────────────────────
        const blogRail = document.querySelector("[data-blog-rail]");

        // Drag (mouse or finger) and sideways trackpad swipes move the pinned rail too.
        // The rail's position is tied to page scroll, so these scroll the page to the
        // matching point; scrolling and dragging can never disagree.
        const attachRailDrag = (st, getDist) => {
            const range = () => st.end - st.start;
            const clampScroll = (y) => gsap.utils.clamp(st.start, st.end, y);
            let pointerId = null;
            let startX = 0;
            let startScroll = 0;
            let dragged = false;
            let suppressClick = false;

            const down = (e) => {
                if (e.button !== 0) return;
                // Only while the rail is pinned; outside that range a drag would yank the page to it
                if (window.scrollY < st.start - 2 || window.scrollY > st.end + 2) return;
                pointerId = e.pointerId;
                startX = e.clientX;
                startScroll = window.scrollY;
                dragged = false;
            };
            const move = (e) => {
                if (e.pointerId !== pointerId) return;
                const dx = e.clientX - startX;
                if (!dragged) {
                    if (Math.abs(dx) < 6) return;
                    dragged = true;
                    blogRail.setPointerCapture(e.pointerId);
                    blogRail.classList.add("is-dragging");
                }
                scrollToY(clampScroll(startScroll - (dx / Math.max(1, getDist())) * range()), { smooth: false });
            };
            const up = (e) => {
                if (e.pointerId !== pointerId) return;
                pointerId = null;
                blogRail.classList.remove("is-dragging");
                // A drag that ends over a link must not open it
                if (dragged) {
                    suppressClick = true;
                    setTimeout(() => { suppressClick = false; }, 60);
                }
            };
            const click = (e) => {
                if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
            };
            const wheel = (e) => {
                if (!st.isActive || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
                // Keep the page's smooth scroller from also handling this wheel event
                e.preventDefault();
                e.stopPropagation();
                scrollToY(clampScroll(window.scrollY + (e.deltaX / Math.max(1, getDist())) * range()), { smooth: false });
            };
            const noNativeDrag = (e) => e.preventDefault();

            const listeners = [
                ["pointerdown", down], ["pointermove", move], ["pointerup", up], ["pointercancel", up],
                ["click", click, true], ["wheel", wheel, { passive: false }], ["dragstart", noNativeDrag],
            ];
            listeners.forEach(([type, fn, opts]) => blogRail.addEventListener(type, fn, opts));
            return () => listeners.forEach(([type, fn, opts]) => blogRail.removeEventListener(type, fn, opts));
        };
        const blogTrack = document.querySelector("[data-blog-track]");
        const blogCards = gsap.utils.toArray(".blog-card");
        const topNav = document.querySelector(".top-nav");

        if (blogRail && blogTrack && blogCards.length) {
            const getBlogDist = () => Math.max(0, blogTrack.scrollWidth - blogRail.clientWidth);
            const navOffset = () => (topNav ? topNav.getBoundingClientRect().bottom : 0) + 14;

            gsap.fromTo(blogCards,
                { autoAlpha: 0, y: 34, rotation: -1.4 },
                {
                    autoAlpha: 1, y: 0, rotation: 0, duration: 0.62, stagger: 0.09, ease: "power2.out",
                    scrollTrigger: { trigger: "#blog", start: isMobile ? "top 90%" : "top 78%", once: true },
                }
            );

            // Pinned horizontal scrub on desktop and on phones. On a phone the rail pins just
            // under the nav, and only if it fits on screen; otherwise it stays a swipe scroller.
            // matchMedia rebuilds this when the breakpoint flips (rotation, resize).
            // The whole section (heading included) pins under the nav while the cards slide, so
            // the "Learning Logs" heading stays on screen. If heading + cards don't fit the
            // screen, only the cards pin; if even they don't fit, the rail stays a swipe scroller.
            const blogSection = document.getElementById("blog");
            gsap.matchMedia().add({ mobile: mobileQuery.media, any: "all" }, () => {
                if (getBlogDist() <= 0) return;
                const padTop = parseFloat(getComputedStyle(blogSection).paddingTop) || 0;
                const room = window.innerHeight - navOffset() - 12;
                const pinSection = blogSection.offsetHeight - padTop <= room;
                if (!pinSection && blogRail.offsetHeight > room) return;

                blogRail.scrollLeft = 0;
                blogRail.classList.add("is-pinned", "at-start");
                const railTween = gsap.to(blogTrack, {
                    x: () => -getBlogDist(), ease: "none",
                    scrollTrigger: {
                        trigger: pinSection ? blogSection : blogRail,
                        // Section: pin when its heading (just past the top padding) meets the nav
                        start: pinSection ? () => `top+=${padTop - 8} ${navOffset()}px` : () => `top ${navOffset()}px`,
                        end: () => `+=${getBlogDist() + window.innerHeight * 0.45}`,
                        scrub: 0.8, pin: pinSection ? blogSection : blogRail, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
                    },
                    // Edge fades only where there are cards hidden behind them
                    onUpdate() {
                        blogRail.classList.toggle("at-start", this.progress() < 0.02);
                        blogRail.classList.toggle("at-end", this.progress() > 0.98);
                    },
                });
                const detachDrag = attachRailDrag(railTween.scrollTrigger, getBlogDist);

                // Arrow keys glide the rail one card at a time while it's pinned
                const keyStep = (dir) => {
                    const st = railTween.scrollTrigger;
                    if (!st.isActive) return false;
                    // At either end, let the key move on to the neighbouring section
                    if ((dir > 0 && window.scrollY >= st.end - 4) || (dir < 0 && window.scrollY <= st.start + 4)) return false;
                    const gap = parseFloat(getComputedStyle(blogTrack).columnGap) || 0;
                    const cardStep = blogCards[0].offsetWidth + gap;
                    const target = window.scrollY + dir * (cardStep / Math.max(1, getBlogDist())) * (st.end - st.start);
                    scrollToY(gsap.utils.clamp(st.start, st.end, target));
                    return true;
                };
                railKeySteppers.push(keyStep);
                blogST = railTween.scrollTrigger;

                return () => {
                    blogST = null;
                    detachDrag();
                    railKeySteppers.splice(railKeySteppers.indexOf(keyStep), 1);
                    blogRail.classList.remove("is-pinned", "at-start", "at-end", "is-dragging");
                };
            });
        }

        // ─── Profile ─────────────────────────────────────────────────────────
        const profileCards = gsap.utils.toArray(".profile-card");
        if (profileCards.length) {
            gsap.fromTo(profileCards,
                { opacity: 0, y: 28 },
                {
                    opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.12,
                    scrollTrigger: { trigger: "#profile-intel", start: isMobile ? "top 90%" : "top 76%", once: true },
                }
            );
        }

        // Subject photo develops top to bottom, like a scan coming in
        const subjectPhoto = document.querySelector(".subject-photo");
        if (subjectPhoto) {
            gsap.fromTo(subjectPhoto,
                { clipPath: "inset(0% 0% 100% 0%)" },
                { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power2.inOut", delay: 0.2,
                  scrollTrigger: { trigger: subjectPhoto, start: revealStart, once: true } }
            );
        }

        // Highlighted phrases in the report get marked in like a highlighter
        const reportLead = document.querySelector(".report-lead");
        if (reportLead) {
            reportLead.classList.add("marker-armed");
            onReveal(reportLead, () => reportLead.classList.add("is-marked"));
        }

        // Skill tags light up one after another, like an inventory scan
        gsap.utils.toArray(".inventory-tags").forEach((group) => {
            Array.from(group.children).forEach((tag, i) => tag.style.setProperty("--i", i));
            onReveal(group, () => group.classList.add("is-scanning"));
        });

        // ─── Experience timeline ─────────────────────────────────────────────
        // The rail fills with scroll; each entry's node lights once the fill reaches it.
        // Lighting follows the tween's own (smoothed) progress, so node and fill stay in step.
        const timeline = document.querySelector(".timeline");
        if (timeline) {
            const entries = gsap.utils.toArray(".timeline-entry");
            gsap.fromTo(timeline, { "--rail": 0 }, {
                "--rail": 1, ease: "none",
                scrollTrigger: { trigger: timeline, start: "top 62%", end: "bottom 62%", scrub: 0.5 },
                onUpdate() {
                    const filled = this.progress() * timeline.offsetHeight;
                    entries.forEach((entry) => entry.classList.toggle("is-lit", filled >= entry.offsetTop + 18));
                },
            });
            entries.forEach((entry) => {
                gsap.fromTo(entry, { opacity: 0, x: -28 }, {
                    opacity: 1, x: 0, duration: 0.65, ease: "power3.out",
                    scrollTrigger: { trigger: entry, start: revealStart, once: true },
                });
            });
        }

        // ─── About & contact ─────────────────────────────────────────────────
        const aboutLines = gsap.utils.toArray(".about-panel p");
        if (aboutLines.length) {
            gsap.fromTo(aboutLines, { opacity: 0, y: 18 }, {
                opacity: 1, y: 0, duration: 0.65, stagger: 0.14, ease: "power2.out",
                scrollTrigger: { trigger: ".about-panel", start: revealStart, once: true },
            });
        }

        const contactButtons = gsap.utils.toArray(".contact-actions .btn");
        if (contactButtons.length) {
            gsap.fromTo(contactButtons, { opacity: 0, scale: 0.88 }, {
                opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(1.7)",
                scrollTrigger: { trigger: ".contact-actions", start: revealStart, once: true },
            });
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
                // Hovering a project file opens it, so the cursor says where a click will go
                const label = target.dataset.href ? "OPEN FILE" : "SCAN";
                target.addEventListener("mouseenter", () => { if (pointerLabel) pointerLabel.textContent = label; });
                target.addEventListener("mouseleave", () => { if (pointerLabel && !cursorShell.classList.contains("is-link")) pointerLabel.textContent = "TRACK"; });
            });

            document.querySelectorAll(".blog-card").forEach((target) => {
                target.addEventListener("mouseenter", () => { if (pointerLabel) pointerLabel.textContent = blogRail && blogRail.classList.contains("is-pinned") ? "DRAG" : "READ"; });
                target.addEventListener("mouseleave", () => { if (pointerLabel && !cursorShell.classList.contains("is-link")) pointerLabel.textContent = "TRACK"; });
            });
        }

        // ─── ScrollTrigger refresh ───────────────────────────────────────────
        // ScrollTrigger refreshes itself on real resizes. A manual resize listener here would
        // also fire on every mobile address-bar show/hide and make the page jump mid-scroll.
        motionReady = true;

        // A #section link jumps before the pinned sections add their scroll length, which leaves
        // the page short of the target. Jump again now that the layout is final.
        const hashTarget = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (hashTarget) {
            ScrollTrigger.refresh();
            const top = hashTarget.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(hashTarget).scrollMarginTop || 0);
            // Lenis caches the page height; have it re-measure the now-longer page first
            if (lenis) lenis.resize();
            scrollToY(top, { smooth: false });
        }

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        }
        window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()));
    };

    // ─── Horizontal Scroll Init ──────────────────────────────────────────────
    function initHorizontalScroll() {
        if (!sliderTrack || !sliderWrap || !slides.length || isMobile) return;
        if (horizontalST) { horizontalST.kill(); horizontalST = null; }

        if (boardDistance() <= 0) return;

        // Pins just under the nav. Each file gets an equal step of scroll; crossing a step
        // opens the next file and the board glides to it (setActiveSlide -> moveBoard).
        const navBottom = () => (document.querySelector(".top-nav")?.getBoundingClientRect().bottom || 72) + 12;
        const stepLength = () => Math.max(240, window.innerHeight * 0.42);

        horizontalST = ScrollTrigger.create({
            trigger: sliderWrap,
            start: () => `top ${navBottom()}px`,
            end: () => `+=${(slides.length - 1) * stepLength()}`,
            pin: true,
            anticipatePin: 1,
            refreshPriority: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                if (boardDragging) return;
                const nextIndex = Math.round(self.progress * Math.max(0, slides.length - 1));
                if (nextIndex !== currentSlide) setActiveSlide(nextIndex);
            },
            onRefresh: () => moveBoard(true),
        });
        moveBoard(true);
    }

    // ─── Launch ──────────────────────────────────────────────────────────────
    runPreloader(initAnimations);
});
