const canvas = document.getElementById('hearts');
const ctx = canvas.getContext('2d');

function refreshHeartsBackgroundSize() {
    canvas.width = window.visualViewport.width;
    canvas.height = window.visualViewport.height;
}
refreshHeartsBackgroundSize();

// loading screen
window.addEventListener('load', function() {
    errorPage = document.querySelector('.error-page');
    // if error page, then always show the loading screen
    minimumWaitTime = 300;
    // minimumWaitTime = 9999999999;
    if (!errorPage) {
        // minimum wait time
        const minTimer = new Promise(resolve => setTimeout(resolve, minimumWaitTime));
        const pageLoaded = new Promise(resolve => resolve());

        Promise.all([minTimer, pageLoaded]).then(() => {
            // stop eye animation
            const eyes = document.querySelector('.loader_eyes');
            const eyeStyle = getComputedStyle(eyes);
            eyes.style.transform = eyeStyle.transform;
            eyes.classList.remove('loader_eyes_anim');
            void eyes.offsetWidth;
            eyes.style.transform = '';
            //make invisible
            const loader = document.querySelector('.loader');
            loader.classList.add('invisible');
            const mouth = document.querySelector('.loader_mouth');
            mouth.classList.remove('invisible');

            // set content invisible
            const piggy = document.querySelector('.piggy');
            piggy.classList.remove('invisible');
            const content = document.querySelector('.upperContent');

            content.classList.remove('invisible');
            canvas.classList.remove('blurry');

            setTimeout(() => {loader.style.display = 'none';}, 500); 
        });
    }
});

// hearts on the background
const hearts = [];

const heartsAmount = 50;
const heartsSize = 30;
const heartsFallSpeed = 0.4;
const heartsSwaySpeed = 0.01;

function Heart() {
    this.reset = function() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * heartsSize + (heartsSize * 0.4);
        this.speed = Math.random() * heartsFallSpeed + (heartsFallSpeed * 0.5);
        this.opacity = Math.random() * 0.7 + 0.3;
        this.color = '#ffffff';
        this.sway = Math.random() * 1 - 0.5;
        this.swaySpeed = Math.random() * heartsSwaySpeed + (heartsSwaySpeed * 0.5);
        this.angle = 0;
        this.rotation = (Math.random() - 0.5) * 0.3;
    };
    this.reset();
}

for (let i = 0; i < heartsAmount; i++) {
    const h = new Heart();
    h.y = Math.random() * canvas.height;
    hearts.push(h);
}

const heartSpriteCache = new Map();
const SPRITE_SIZE_STEP = 2;
function getHeartSprite(size, color) {
    const dpr = window.devicePixelRatio || 1;
    const bucketedSize = Math.round(size / SPRITE_SIZE_STEP) * SPRITE_SIZE_STEP;
    const key = bucketedSize + '_' + color;
    const cached = heartSpriteCache.get(key);
    if (cached) return cached;
    const padding = bucketedSize * 0.6;
    const boxSize = bucketedSize + padding;
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = boxSize * dpr;
    spriteCanvas.height = boxSize * dpr;
    const sctx = spriteCanvas.getContext('2d');
    sctx.scale(dpr, dpr);
    sctx.translate(boxSize / 2, boxSize / 2);
    sctx.fillStyle = color;
    sctx.beginPath();
    sctx.moveTo(0, -bucketedSize * 0.25);
    sctx.bezierCurveTo(bucketedSize * 0.5, -bucketedSize * 0.75, bucketedSize, -bucketedSize * 0.1, 0, bucketedSize * 0.5);
    sctx.bezierCurveTo(-bucketedSize, -bucketedSize * 0.1, -bucketedSize * 0.5, -bucketedSize * 0.75, 0, -bucketedSize * 0.25);
    sctx.fill();
    heartSpriteCache.set(key, spriteCanvas);
    return spriteCanvas;
}

function drawHeart(x, y, size, color, opacity, rotation) {
    const sprite = getHeartSprite(size, color);
    const dpr = window.devicePixelRatio || 1;
    const drawSize = sprite.width / dpr;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
}

let lastTime = performance.now();
function animate(now) {
    const delta = (now - lastTime) / (1000 / 60);
    lastTime = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hearts.forEach(h => {
        h.angle += h.swaySpeed * delta;
        h.x += Math.sin(h.angle) * h.sway * delta;
        h.y += h.speed * delta;
        h.rotation += 0.005 * delta;
        if (h.y > canvas.height + 30) h.reset();
        drawHeart(h.x, h.y, h.size, h.color, h.opacity, h.rotation);
    });
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
    const scaleX = window.innerWidth / canvas.width;
    const scaleY = window.innerHeight / canvas.height;

    hearts.forEach(h => {
        h.x *= scaleX;
        h.y *= scaleY;
    });
    
    refreshHeartsBackgroundSize();
});

// content switching
function navigateTo(url) {
    fetch(url).then(res => res.text()).then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('.content');

        const incomingLinks = [...newContent.querySelectorAll('link[rel="stylesheet"]')];
        const pendingLinks = incomingLinks.filter(link => {
            const href = link.getAttribute('href');
            return !document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
        });

        function doSwap() {
            const newPiggy = doc.querySelector('.piggy');
            const existingPiggy = document.querySelector('.piggy');
            newPiggy.classList.remove('invisible');
            const newChildren = [...newPiggy.children];
            const existingChildren = [...existingPiggy.children];
            // remove children if missing
            existingChildren.forEach(existingChild => {
                const existingClass = existingChild.getAttribute('class') || "";
                if (!newChildren.some(c => (c.getAttribute('class') || "") === existingClass)) {
                    if (!existingChild.classList.contains('eyes')) {
                        console.log("Piggy Technical | removed piggy part named: " + existingClass);
                        existingChild.remove();
                    }
                }
            });
            // add children if missing
            newChildren.forEach((newChild, index) => {
                const newClass = newChild.getAttribute('class') || "";
                const existing = [...existingPiggy.children].find(c => (c.getAttribute('class') || "") === newClass);
                if (!existing) {
                    if (!newChild.classList.contains('eyes')) {
                        const ref = existingPiggy.children[index] || null;
                        existingPiggy.insertBefore(newChild.cloneNode(true), ref);
                    }
                }
            });
            newPiggy.style.animation = 'none';

            document.querySelector('.content').replaceWith(newContent);
            history.pushState({}, '', url);

            const scripts = newContent.querySelectorAll('script');  
            if (scripts.length === 0) {
                console.log("No new scripts");
                runRecallTriggers();
            } else {
                let scriptsLoaded = 0;
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));

                    if (oldScript.src) {
                        newScript.onload = () => {
                            scriptsLoaded++;
                            if (scriptsLoaded === scripts.length) runRecallTriggers();
                        };
                        newScript.onerror = () => {
                            scriptsLoaded++;
                            if (scriptsLoaded === scripts.length) runRecallTriggers();
                        };
                    } else {
                        newScript.textContent = oldScript.textContent;
                        scriptsLoaded++;
                        if (scriptsLoaded === scripts.length) runRecallTriggers();
                    }

                    oldScript.replaceWith(newScript);
                });
            }
        }

        if (pendingLinks.length === 0) {
            doSwap();
        } else {
            let loaded = 0;
            pendingLinks.forEach(link => {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = link.getAttribute('href');
                newLink.onload = () => {
                    loaded++;
                    if (loaded === pendingLinks.length) doSwap();
                };
                newLink.onerror = () => {
                    loaded++;
                    if (loaded === pendingLinks.length) doSwap();
                };
                document.head.appendChild(newLink);
            });
        }
    });
}

function runRecallTriggers() {
    if (typeof resetPiggyEmotion === 'function') resetPiggyEmotion();
    if (typeof recallTriggers === 'function') recallTriggers();
    if (typeof recallTriggers_Stats === 'function') recallTriggers_Stats();
    attachLinks();
    checkAlreadyHovered();
}

function attachLinks() {
    // don't add 404 error page button to the selectors, force website refresh
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.content a');
        if (!link || link.origin !== window.location.origin) return;
        e.preventDefault();
        navigateTo(link.href);
    });

    document.querySelector('.menu').addEventListener('mousedown', (e) => {
        const btn = e.target.closest('a');
        if (btn) _pressedButton = btn;
    });
}

window.addEventListener('popstate', () => {
    navigateTo(location.href);
});
attachLinks();

function checkAlreadyHovered() {
    const hovered = [...document.querySelectorAll(':hover')];
    if (hovered.length === 0) return;
    const deepest = hovered[hovered.length - 1];

    let el = deepest;
    while (el && el !== document.body) {
        if (el.matches('[class*="Trigger_bg_"]')) {
            el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
        }
        el = el.parentElement;
    }
}

let _pressedButton = null;
document.addEventListener('mouseup', function() {
    if (_pressedButton) {
        const btn = _pressedButton;
        _pressedButton = null;
        if (!btn.matches(':hover')) {
            navigateTo(btn.href);
        }
    }
});