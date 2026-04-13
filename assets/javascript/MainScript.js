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
    if (!errorPage) {
        // minimum wait time
        const minTimer = new Promise(resolve => setTimeout(resolve, 500));
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
const colors = ['#ffffff', '#f5ffff', '#eefefe', '#ffffff', '#f0fffe'];

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

function drawHeart(x, y, size, color, opacity, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.25);
    ctx.bezierCurveTo(size * 0.5, -size * 0.75, size, -size * 0.1, 0, size * 0.5);
    ctx.bezierCurveTo(-size, -size * 0.1, -size * 0.5, -size * 0.75, 0, -size * 0.25);
    ctx.fill();
    ctx.restore();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hearts.forEach(h => {
        h.angle += h.swaySpeed;
        h.x += Math.sin(h.angle) * h.sway;
        h.y += h.speed;
        h.rotation += 0.005;
        if (h.y > canvas.height + 30) h.reset();
        drawHeart(h.x, h.y, h.size, h.color, h.opacity, h.rotation);
    });
    requestAnimationFrame(animate);
}
animate();

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
                if (!newChildren.some(c => c.className === existingChild.className)) {
                    if (!existingChild.classList.contains('eyes')) {
                        console.log("removed " + existingChild.className);
                        existingChild.remove();
                    }
                }
            });
            // add children if missing
            newChildren.forEach((newChild, index) => {
                const existing = [...existingPiggy.children].find(c => c.className === newChild.className);
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
    document.querySelectorAll('.content a').forEach(link => {
        if (link.origin !== window.location.origin) return;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.href);
        });
    });

    document.querySelectorAll('.menu > a').forEach(btn => {
        btn.addEventListener('mousedown', function() {
            _pressedButton = this;
        });
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