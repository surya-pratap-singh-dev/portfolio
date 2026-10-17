// ─── Background network ──────────────────────────────────────────────────────
// Drifting nodes linked by faint lines, with a few labelled "infrastructure" nodes that pulse,
// request packets hopping between nodes, and a radar ping every few seconds. In dark mode the
// web sits in darkness and a flashlight follows the cursor (or drifts on touch screens).
// Colours come from the theme tokens, so it follows dark/light mode. The web drifts slower
// than the page for depth.
(() => {
    const canvas = document.querySelector("[data-net]");
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The stack behind the projects on this page; ap-south-1 is where the site itself runs
    const LABELS = ["CORE", "FASTAPI", "POSTGRES", "REDIS", "DOCKER", "EC2 · AP-SOUTH-1", "GH-ACTIONS", "MONGODB", "NGINX", "SUPABASE"];
    const MAX_PACKETS = 14;
    const MARGIN = 160;        // nodes live in a field taller than the screen, so wrap-around happens off-screen
    const PARALLAX = 0.12;     // how fast the web moves relative to page scroll
    const POINTER_REACH = 190; // px within which nodes link to the cursor
    const PING_EVERY = 6500;   // ms between radar pings

    let width = 0;
    let height = 0;
    let nodes = [];
    let links = [];      // node pairs linked this frame, as [a, b]
    let packets = [];    // requests travelling along links
    let lastSpawn = 0;
    let linkDist = 150;
    let colors = { accent: "255,46,46", line: "105,112,127", label: "162,168,180" };
    const pointer = { x: 0, y: 0, strength: 0, active: false };
    const light = { x: 0, y: 0, tx: 0, ty: 0, ready: false };
    let pings = [];
    let lastPing = 0;
    let isLight = false;

    // Normalise any CSS colour to "r,g,b" by letting the canvas parse it
    const toRgb = (value, fallback) => {
        ctx.fillStyle = fallback;
        ctx.fillStyle = value || fallback;
        const parsed = ctx.fillStyle;
        if (parsed[0] === "#") {
            return [1, 3, 5].map((i) => parseInt(parsed.slice(i, i + 2), 16)).join(",");
        }
        return parsed.replace(/rgba?\(|\)|\s/g, "").split(",").slice(0, 3).join(",");
    };

    const readColors = () => {
        const styles = getComputedStyle(root);
        isLight = root.classList.contains("theme-light");
        colors = {
            accent: toRgb(styles.getPropertyValue("--accent").trim(), "#ff2e2e"),
            line: toRgb(styles.getPropertyValue("--text-dim").trim(), "#69707f"),
            label: toRgb(styles.getPropertyValue("--text-soft").trim(), "#a2a8b4"),
        };
    };

    const seed = () => {
        const fieldHeight = height + MARGIN * 2;
        const count = Math.round(Math.min(68, Math.max(22, (width * fieldHeight) / 26000)));
        const labelled = width < 700 ? 4 : 7;
        linkDist = Math.min(170, Math.max(110, width / 8));
        nodes = Array.from({ length: count }, (_, i) => ({
            x: Math.random() * width,
            y: Math.random() * fieldHeight,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            r: Math.random() * 1.1 + 0.8,
            label: i < labelled ? LABELS[i % LABELS.length] : null,
            phase: Math.random() * 3,
            flash: 0,
            sx: 0,
            sy: 0,
        }));
    };

    const resize = () => {
        const nextWidth = canvas.clientWidth;
        const nextHeight = canvas.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(nextWidth * dpr);
        canvas.height = Math.round(nextHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Re-seed only when the width changes; phone toolbars only change the height
        const reseed = nextWidth !== width;
        width = nextWidth;
        height = nextHeight;
        if (reseed) seed();
    };

    const draw = (time) => {
        const fieldHeight = height + MARGIN * 2;
        const offset = window.scrollY * PARALLAX;
        ctx.clearRect(0, 0, width, height);

        pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;

        // ─── Flashlight ──────────────────────────────────────────────────────
        // In dark mode the web sits mostly in darkness; a light follows the pointer and
        // brings it out. With no pointer (touch screens, cursor outside the window) the
        // light drifts slowly across the screen on its own.
        if (window.portfolioLight) {
            // Shared with the page spotlight (main.js), so content and web light up together
            light.tx = window.portfolioLight.x;
            light.ty = window.portfolioLight.y;
        } else if (pointer.active) {
            light.tx = pointer.x;
            light.ty = pointer.y;
        } else if (!reducedMotion) {
            light.tx = width * (0.5 + 0.38 * Math.sin(time / 5200));
            light.ty = height * (0.5 + 0.3 * Math.sin(time / 3700));
        } else {
            light.tx = width * 0.5;
            light.ty = height * 0.45;
        }
        if (!light.ready) { light.x = light.tx; light.y = light.ty; light.ready = true; }
        const follow = reducedMotion ? 1 : 0.09;
        light.x += (light.tx - light.x) * follow;
        light.y += (light.ty - light.y) * follow;
        const lightR = width < 700 ? 210 : 300;
        // 0 outside the light, 1 at its centre, with a smooth falloff
        const glow = (x, y) => {
            const dx = x - light.x;
            const dy = y - light.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d >= lightR) return 0;
            const t = 1 - d / lightR;
            return t * t * (3 - 2 * t);
        };
        // Brightness of the web away from the light, and how much the light adds
        const dim = isLight ? 0.8 : 0.4;
        const lift = isLight ? 0.9 : 1.6;

        // A faint pool of red light on the background itself (dark mode)
        if (!isLight) {
            const pool = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, lightR * 1.25);
            pool.addColorStop(0, `rgba(${colors.accent},0.05)`);
            pool.addColorStop(1, `rgba(${colors.accent},0)`);
            ctx.fillStyle = pool;
            ctx.fillRect(0, 0, width, height);
        }

        for (const node of nodes) {
            if (!reducedMotion) {
                node.x += node.vx;
                node.y += node.vy;
                if (node.x < 0 || node.x > width) node.vx *= -1;
                node.y = (node.y + fieldHeight) % fieldHeight;
            }
            node.sx = node.x;
            node.sy = (((node.y - offset) % fieldHeight) + fieldHeight) % fieldHeight - MARGIN;
            node.glow = glow(node.sx, node.sy);
        }

        // ─── Links between nearby nodes (tinted red inside the light) ────────
        ctx.lineWidth = 1;
        const maxSq = linkDist * linkDist;
        links = [];
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.sx - b.sx;
                const dy = a.sy - b.sy;
                const distSq = dx * dx + dy * dy;
                if (distSq > maxSq) continue;
                links.push([a, b]);
                const near = 1 - Math.sqrt(distSq) / linkDist;
                const g = (a.glow + b.glow) / 2;
                ctx.strokeStyle = `rgba(${colors.line},${(near * 0.3 * (dim + lift * g)).toFixed(3)})`;
                ctx.beginPath();
                ctx.moveTo(a.sx, a.sy);
                ctx.lineTo(b.sx, b.sy);
                ctx.stroke();
                if (g > 0.08) {
                    ctx.strokeStyle = `rgba(${colors.accent},${(near * g * 0.22).toFixed(3)})`;
                    ctx.stroke();
                }
            }
        }

        // ─── Radar ping ──────────────────────────────────────────────────────
        // Every few seconds a ring sweeps out from one of the stack nodes on screen;
        // each node it passes over flashes.
        if (!reducedMotion) {
            if (time - lastPing > PING_EVERY) {
                const onScreen = nodes.filter((n) => n.label && n.sy > 0 && n.sy < height);
                if (onScreen.length) {
                    const origin = onScreen[(Math.random() * onScreen.length) | 0];
                    pings.push({ x: origin.sx, y: origin.sy, t0: time });
                    origin.flash = 1;
                }
                lastPing = time;
            }
            const maxR = Math.hypot(width, height) * 0.7;
            pings = pings.filter((ping) => {
                const r = (time - ping.t0) * 0.42;
                if (r > maxR) return false;
                const fade = 1 - r / maxR;
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = `rgba(${colors.accent},${(fade * 0.26).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(ping.x, ping.y, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.lineWidth = 1;
                for (const node of nodes) {
                    const d = Math.hypot(node.sx - ping.x, node.sy - ping.y);
                    if (Math.abs(d - r) < 10) node.flash = Math.max(node.flash, 0.85 * fade + 0.15);
                }
                return true;
            });
        }

        // ─── Packets: small requests hopping along links ─────────────────────
        if (!reducedMotion) {
            if (time - lastSpawn > 380 && packets.length < MAX_PACKETS && links.length) {
                lastSpawn = time;
                const [a, b] = links[(Math.random() * links.length) | 0];
                const forward = Math.random() < 0.5;
                packets.push({ from: forward ? a : b, to: forward ? b : a, t: 0, speed: 0.006 + Math.random() * 0.008 });
            }
            packets = packets.filter((packet) => {
                packet.t += packet.speed;
                if (packet.t >= 1) {
                    packet.to.flash = 1;
                    return false;
                }
                const x = packet.from.sx + (packet.to.sx - packet.from.sx) * packet.t;
                const y = packet.from.sy + (packet.to.sy - packet.from.sy) * packet.t;
                const fade = Math.sin(packet.t * Math.PI) * (0.6 + glow(x, y) * 0.6);
                ctx.fillStyle = `rgba(${colors.accent},${(0.16 * fade).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(${colors.accent},${Math.min(1, 0.85 * fade).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, 1.6, 0, Math.PI * 2);
                ctx.fill();
                return true;
            });
        }

        // ─── Links reaching toward the cursor / finger ───────────────────────
        if (pointer.strength > 0.02) {
            for (const node of nodes) {
                const dx = node.sx - pointer.x;
                const dy = node.sy - pointer.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > POINTER_REACH) continue;
                const alpha = (1 - dist / POINTER_REACH) * 0.45 * pointer.strength;
                ctx.strokeStyle = `rgba(${colors.accent},${alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.moveTo(node.sx, node.sy);
                ctx.lineTo(pointer.x, pointer.y);
                ctx.stroke();
            }
        }

        // ─── Nodes; labelled ones get a halo, a pulse ring and their name ────
        ctx.font = "500 9px 'IBM Plex Mono', ui-monospace, monospace";
        ctx.textAlign = "center";
        for (const node of nodes) {
            const g = node.glow;
            if (node.flash > 0.01) {
                // Flash: a quick ring that fades out (packet arrival or radar pass)
                ctx.strokeStyle = `rgba(${colors.accent},${(node.flash * 0.55).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(node.sx, node.sy, 3 + (1 - node.flash) * 9, 0, Math.PI * 2);
                ctx.stroke();
                node.flash *= 0.93;
            }
            if (node.sy < -20 || node.sy > height + 20) continue;
            if (!node.label) {
                const a = Math.min(1, 0.7 * (dim + lift * g) + node.flash * 0.5);
                ctx.fillStyle = `rgba(${g > 0.5 || node.flash > 0.3 ? colors.accent : colors.line},${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(node.sx, node.sy, node.r + g * 1.2, 0, Math.PI * 2);
                ctx.fill();
                continue;
            }
            const lit = 0.6 + g * 0.8;
            const pulse = reducedMotion ? 0.5 : ((time / 1000 + node.phase) % 2.6) / 2.6;
            ctx.strokeStyle = `rgba(${colors.accent},${((1 - pulse) * 0.32 * lit).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, 4 + pulse * 15, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = `rgba(${colors.accent},${(0.12 * lit).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, 9 + g * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(${colors.accent},${Math.min(1, 0.6 * lit).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, 2.6 + g, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(${colors.label},${Math.min(0.95, (isLight ? 0.5 : 0.3) + g * 0.6 + node.flash * 0.3).toFixed(3)})`;
            ctx.fillText(node.label, node.sx, node.sy - 13);
        }
    };

    const loop = (time) => {
        draw(time);
        requestAnimationFrame(loop);
    };

    // ─── Input ───────────────────────────────────────────────────────────────
    let releaseTimer;
    window.addEventListener("pointermove", (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
        clearTimeout(releaseTimer);
        // Touch has no hover: let the links fade shortly after the finger stops
        if (e.pointerType !== "mouse") releaseTimer = setTimeout(() => { pointer.active = false; }, 700);
    }, { passive: true });
    window.addEventListener("pointerdown", (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
        clearTimeout(releaseTimer);
        if (e.pointerType !== "mouse") releaseTimer = setTimeout(() => { pointer.active = false; }, 900);
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { pointer.active = false; });

    // Follow theme switches (the toggle flips a class on <html>)
    new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ["class"] });

    // ─── Start ───────────────────────────────────────────────────────────────
    readColors();
    resize();
    window.addEventListener("resize", () => {
        resize();
        if (reducedMotion) draw(0);
    });

    if (reducedMotion) {
        // Still frame only; redraw on scroll so the parallax position stays right
        draw(0);
        window.addEventListener("scroll", () => draw(0), { passive: true });
    } else {
        requestAnimationFrame(loop);
    }
})();
