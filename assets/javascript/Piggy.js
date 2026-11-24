const EYE_OFFSET_RATIO = 0.05;
const MIN_DISTANCE_RATIO = 0.1;
const MAX_DISTANCE_RATIO = 0.6;

const isPiggyOnMobile = window.matchMedia('(max-aspect-ratio: 1500/1300)');

const eyeElement = document.querySelector('.eyes use');
const piggyElement = document.querySelector('.piggy');

function getEyeMetrics() {
    const rect = eyeElement.getBoundingClientRect();
    const transform = new DOMMatrix(getComputedStyle(eyeElement).transform);
    const piggyWidth = piggyElement.offsetWidth;
    return {
        centerX: rect.left - transform.m41 + rect.width / 2,
        centerY: rect.top - transform.m42 + rect.height / 2,
        maxOffset: piggyWidth * EYE_OFFSET_RATIO,
        minDistance: piggyWidth * MIN_DISTANCE_RATIO,
        maxDistance: piggyWidth * MAX_DISTANCE_RATIO
    };
}

const mouthElement = document.querySelector('.mouth use');
const noseElement = document.querySelector('.nose');
const glassCracksElement = document.querySelector('.glassesCracks');
const ear_L_Elements = document.querySelectorAll(".ear_l");
const ear_R_Elements = document.querySelectorAll(".ear_r");

const noseHitboxElement = document.querySelector('.nose-hitbox');
const glassesHitboxElement = document.querySelector('.glasses-hitbox-1');
const glassesHitboxElement2 = document.querySelector('.glasses-hitbox-2');
const earsHitboxElement = document.querySelector('.ears-hitbox-1');
const earsHitboxElement2 = document.querySelector('.ears-hitbox-2');

let angryTimer = null;
noseHitboxElement.addEventListener('click', function() {
    if (angryTimer) {
        clearTimeout(angryTimer);
    }

    switchEmotion(Emotion.ANGRY);
    angryTimer = setTimeout(function() {
        if (piggyEmotion == Emotion.ANGRY) {
            switchEmotion(Emotion.NEUTRAL);
        }
        angryTimer = null;
    }, 2000);
});

glassesHitboxElement.addEventListener('click', function() {
    doShocked();
});

glassesHitboxElement2.addEventListener('click', function() {
    doShocked();
});

let earTimer = null;
earsHitboxElement.addEventListener('click', function() {
    if (earTimer) {
        clearTimeout(earTimer);
    }

    let className = "wobbleEar";
    ear_L_Elements.forEach(a => {
        a.classList.remove(className);
        void a.parentElement.offsetWidth;

        a.classList.add(className);
        void a.parentElement.offsetWidth;
    });
    earTimer = setTimeout(function() {
        ear_L_Elements.forEach(a => {
            a.classList.remove(className);
            void a.parentElement.offsetWidth;
        });
        earTimer = null;
    }, 500);
});

let earTimer2 = null;
earsHitboxElement2.addEventListener('click', function() {
    if (earTimer2) {
        clearTimeout(earTimer2);
    }

    let className = "wobbleEar";
    ear_R_Elements.forEach(a => {
        a.classList.remove(className);
        void a.parentElement.offsetWidth;

        a.classList.add(className);
        void a.parentElement.offsetWidth;
    });
    earTimer2 = setTimeout(function() {
        ear_R_Elements.forEach(a => {
            a.classList.remove(className);
            void a.parentElement.offsetWidth;
        });
        earTimer2 = null;
    }, 500);
});

let shockedTimer = null;
function doShocked() {
    if (shockedTimer) {
        clearTimeout(shockedTimer);
    }

    glassCracksElement.style.transition = "";
    glassCracksElement.style.opacity = "0.75";
    switchEmotion(Emotion.SHOCKED);

    shockedTimer = setTimeout(function() {
        if (piggyEmotion == Emotion.SHOCKED) {
            switchEmotion(Emotion.NEUTRAL);
        }
        glassCracksElement.style.transition = "opacity 0.5s linear";
        glassCracksElement.style.opacity = "0.0";
        shockedTimer = null;
    }, 1500);
}

// piggy facial features
const Emotion = Object.freeze({
    NEUTRAL: "neutral",
    SMILE: "smile",
    HAPPY: "happy",
    HEARTS: "hearts",
    SAD: "sad",
    DROOLING: "drooling",
    ANGRY: "angry",
    SHOCKED: "shocked"
});
let piggyEmotion = Emotion.NEUTRAL;

// eyes
const eyes_neutral = 'assets/images/Piggy_Full.svg#eyes-neutral';
const eyes_hearts = 'assets/images/Piggy_Full.svg#eyes-hearts';
const eyes_sad = 'assets/images/Piggy_Full.svg#eyes-sad';
const eyes_angry = 'assets/images/Piggy_Full.svg#eyes-angry';
const eyes_drooling = 'assets/images/Piggy_Full.svg#eyes-drooling';
const eyes_shocked = 'assets/images/Piggy_Full.svg#eyes-shocked';

// mouths
const mouth_neutral = 'assets/images/Piggy_Full.svg#mouth-neutral';
const mouth_smile = 'assets/images/Piggy_Full.svg#mouth-smile';
const mouth_happy = 'assets/images/Piggy_Full.svg#mouth-happy';
const mouth_sad = 'assets/images/Piggy_Full.svg#mouth-sad';
const mouth_drooling = 'assets/images/Piggy_Full.svg#mouth-drooling';
const mouth_shocked = 'assets/images/Piggy_Full.svg#mouth-shocked';

let hoverOverTimer = null;
window.recallTriggers = function() {
    const triggerMap = {
        ".Trigger_heart": Emotion.HEARTS,
        ".Trigger_happy": Emotion.HAPPY,
        ".Trigger_smile": Emotion.SMILE,
        ".Trigger_sad": Emotion.SAD,
        ".Trigger_drooling": Emotion.DROOLING
    };

    Object.entries(triggerMap).forEach(([selector, emotion]) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.addEventListener("mouseenter", () => {
                if (hoverOverTimer) {
                    clearTimeout(hoverOverTimer);
                    hoverOverTimer = null;
                }
                switchEmotion(emotion);
            });

            el.addEventListener("mouseleave", () => {
                if (hoverOverTimer) {
                    clearTimeout(hoverOverTimer);
                }
                hoverOverTimer = setTimeout(() => {
                    if (piggyEmotion === emotion) {
                        switchEmotion(Emotion.NEUTRAL);
                    }
                    hoverOverTimer = null;
                }, 1200);
            });
        });
    });
}
recallTriggers();

window.resetPiggyEmotion = function() {
    switchEmotion(Emotion.NEUTRAL);
}

// eye movements
function updateEyePosition(cursorX, cursorY) {
    const m = getEyeMetrics();
    const dx = cursorX - m.centerX;
    const dy = cursorY - m.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const remapDist = Math.min(Math.max((dist - m.minDistance) / (m.maxDistance - m.minDistance), 0), 1);
    const scale = dist > 0 ? (remapDist * m.maxOffset) / dist : 0;
    eyeElement.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    if (piggyEmotion == Emotion.SAD) switchEmotion(Emotion.NEUTRAL);
}

let mouseX = 0, mouseY = 0, ticking = false, leftWindow = false, eyeAnimFrame = null;
window.addEventListener('mousemove', (e) => {
    if (isPiggyOnMobile.matches) return;
    leftWindow = false;
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!ticking) {
        ticking = true;
        eyeAnimFrame = requestAnimationFrame(() => {
            if (!leftWindow) updateEyePosition(mouseX, mouseY);
            ticking = false;
        });
    }
}, { passive: true });

window.addEventListener('resize', () => {
    if (isPiggyOnMobile.matches || leftWindow || ticking) return;
    ticking = true;
    eyeAnimFrame = requestAnimationFrame(() => {
        updateEyePosition(mouseX, mouseY);
        ticking = false;
    });
});

isPiggyOnMobile.addEventListener('change', (e) => {
    if (e.matches) {
        if (eyeAnimFrame) cancelAnimationFrame(eyeAnimFrame);
        ticking = false;
        eyeElement.style.transform = 'translate(0px, 0px)';
    }
});
 
document.addEventListener('mouseleave', (event) => {
    leftWindow = true;
    if (eyeAnimFrame) cancelAnimationFrame(eyeAnimFrame);
    ticking = false;
    eyeElement.style.transform = 'translate(0px, 0px)';
    if (event.clientY <= 0) switchEmotion(Emotion.SAD);
});

const emotionAssets = {
    [Emotion.NEUTRAL]: { eyes: eyes_neutral, mouth: mouth_neutral },
    [Emotion.SMILE]: { eyes: eyes_neutral, mouth: mouth_smile },
    [Emotion.HAPPY]: { eyes: eyes_neutral, mouth: mouth_happy },
    [Emotion.HEARTS]: { eyes: eyes_hearts, mouth: mouth_happy },
    [Emotion.SAD]: { eyes: eyes_sad, mouth: mouth_sad },
    [Emotion.DROOLING]: { eyes: eyes_drooling, mouth: mouth_drooling },
    [Emotion.ANGRY]: { eyes: eyes_angry, mouth: mouth_neutral },
    [Emotion.SHOCKED]: { eyes: eyes_shocked, mouth: mouth_shocked },
};

function switchEmotion(newEmotion) {
    const cfg = emotionAssets[newEmotion];
    piggyEmotion = cfg ? newEmotion : Emotion.NEUTRAL;
    const { eyes, mouth } = emotionAssets[piggyEmotion];
    eyeElement.setAttribute('href', eyes);
    mouthElement.setAttribute('href', mouth);
    removeAnimClasses();
    if (piggyEmotion === Emotion.HEARTS) eyeElement.parentElement.classList.add('hearteyes');
    if (piggyEmotion === Emotion.ANGRY) noseElement.classList.add('snoutWiggle');
}

function removeAnimClasses() {
    eyeElement.parentElement.classList.remove("hearteyes");
    void eyeElement.offsetWidth;
    noseElement.classList.remove("snoutWiggle");
    void noseElement.parentElement.offsetWidth;
}