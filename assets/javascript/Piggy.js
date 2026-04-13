const max_eyeOffset = 50;
const staticEyeOffset_X = 0;
const staticEyeOffset_Y = 175;
const minDistanceAway = 100;
const maxDistanceAway = 600;

const eyeElement = document.querySelector('.eyes');
const piggyElement = document.querySelector('.piggy');
let pageCenteredX = window.innerWidth * 0.5;
let pageCenteredY = window.innerHeight * 0.5;

function recalcEyeCenter() {
    const rect = eyeElement.getBoundingClientRect();
    const transform = new DOMMatrix(getComputedStyle(eyeElement).transform);
    const eyes_absoluteTop = rect.top + window.scrollY - transform.m42;
    const eyes_absoluteLeft = rect.left + window.scrollX - transform.m41;
    pageCenteredX = eyes_absoluteLeft + rect.width / 2;
    pageCenteredY = eyes_absoluteTop + rect.height / 2;
}

piggyElement.addEventListener('animationend', recalcEyeCenter, { once: true });

const mouthElement = document.querySelector('.mouth');
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
        void a.offsetWidth;

        a.classList.add(className);
        void a.offsetWidth;
    });
    earTimer = setTimeout(function() {
        ear_L_Elements.forEach(a => {
            a.classList.remove(className);
            void a.offsetWidth;
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
        void a.offsetWidth;

        a.classList.add(className);
        void a.offsetWidth;
    });
    earTimer2 = setTimeout(function() {
        ear_R_Elements.forEach(a => {
            a.classList.remove(className);
            void a.offsetWidth;
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
const eyes_neutral = 'assets/images/eyes/Piggy_Eyes_Neutral.svg';
const eyes_hearts = 'assets/images/eyes/Piggy_Eyes_Hearts.svg';
const eyes_sad = 'assets/images/eyes/Piggy_Eyes_Sad.svg';
const eyes_angry = 'assets/images/eyes/Piggy_Eyes_Angry.svg';
const eyes_drooling = 'assets/images/eyes/Piggy_Eyes_Drooling.svg';
const eyes_shocked = 'assets/images/eyes/Piggy_Eyes_Shocked.svg';

// mouths
const mouth_neutral = 'assets/images/mouth/Piggy_Mouth_Neutral.svg';
const mouth_smile = 'assets/images/mouth/Piggy_Mouth_Smile.svg';
const mouth_happy = 'assets/images/mouth/Piggy_Mouth_Happy.svg';
const mouth_sad = 'assets/images/mouth/Piggy_Mouth_Sad.svg';
const mouth_drooling = 'assets/images/mouth/Piggy_Mouth_Drooling.svg';
const mouth_shocked = 'assets/images/mouth/Piggy_Mouth_Shocked.svg';

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
            el.addEventListener("mouseenter", () => switchEmotion(emotion));
            el.addEventListener("mouseleave", () => switchEmotion(Emotion.NEUTRAL));
        });
    });
}
recallTriggers();

window.resetPiggyEmotion = function() {
    switchEmotion(Emotion.NEUTRAL);
}

// eye movements
window.addEventListener('mousemove', (e) => {
    const cursorX = e.pageX;
    const cursorY = e.pageY;
    const dx = (cursorX - pageCenteredX) + staticEyeOffset_X;
    const dy = (cursorY - pageCenteredY) + staticEyeOffset_Y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    const remapDist = Math.min(Math.max((dist - minDistanceAway) / (maxDistanceAway - minDistanceAway), 0), 1);
    const scale = dist > 0 ? (remapDist * max_eyeOffset) / dist : 0;
    
    const offsetX = dx * scale;
    const offsetY = dy * scale;
    eyeElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    if (piggyEmotion == Emotion.SAD) {
        switchEmotion(Emotion.NEUTRAL);
    }
});
 
document.addEventListener('mouseleave', (event) => {
    eyeElement.style.transform = 'translate(0px, 0px)';
    if (event.clientY <= 0) {
        switchEmotion(Emotion.SAD);
    }
});

function switchEmotion(newEmotion) {
    piggyEmotion = newEmotion;

    switch (piggyEmotion) {
        case Emotion.NEUTRAL:
            eyeElement.src = eyes_neutral;
            mouthElement.src = mouth_neutral;
            removeAnimClasses();
            break;
        case Emotion.SMILE:
            eyeElement.src = eyes_neutral;
            mouthElement.src = mouth_smile;
            removeAnimClasses();
            break;
        case Emotion.HAPPY:
            eyeElement.src = eyes_neutral;
            mouthElement.src = mouth_happy;
            removeAnimClasses();
            break;
        case Emotion.HEARTS:
            eyeElement.src = eyes_hearts;
            mouthElement.src = mouth_happy;
            removeAnimClasses();
            eyeElement.classList.add("hearteyes");
            break;
        case Emotion.SAD:
            eyeElement.src = eyes_sad;
            mouthElement.src = mouth_sad;
            removeAnimClasses();
            break;
        case Emotion.DROOLING:
            eyeElement.src = eyes_drooling;
            mouthElement.src = mouth_drooling;
            removeAnimClasses();
            break;
        case Emotion.ANGRY:
            eyeElement.src = eyes_angry;
            mouthElement.src = mouth_neutral;
            removeAnimClasses();
            noseElement.classList.add("snoutWiggle");
            break;
        case Emotion.SHOCKED:
            eyeElement.src = eyes_shocked;
            mouthElement.src = mouth_shocked;
            removeAnimClasses();
            break;
        default:
            piggyEmotion = Emotion.NEUTRAL;
            break;
    }
}

function removeAnimClasses() {
    eyeElement.classList.remove("hearteyes");
    void eyeElement.offsetWidth;
    noseElement.classList.remove("snoutWiggle");
    void noseElement.offsetWidth;
}