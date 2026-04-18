window.recallTriggers_backgroundEffects = function() {
    const TriggerCyberpunk = document.querySelector(".Trigger_bg_cyberpunk");
    if (TriggerCyberpunk) {
        TriggerCyberpunk.addEventListener("mouseenter", () => {
            const cyberpunkElements = document.querySelectorAll(".cyberpunk");
            cyberpunkElements.forEach(a => {
                a.classList.add("appearOnScreen");
            });
        });

        TriggerCyberpunk.addEventListener('mouseleave', () => {
            const cyberpunkElements = document.querySelectorAll(".cyberpunk");
            cyberpunkElements.forEach(a => {
                a.classList.remove("appearOnScreen");
            });
        })
    }

    const TriggerSims = document.querySelector(".Trigger_bg_sims");
    if (TriggerSims) {
        TriggerSims.addEventListener("mouseenter", () => {
            //otherwise stale elements
            const simsElements = document.querySelectorAll(".sims, .sims-wrapper");
            simsElements.forEach(a => {
                a.classList.add("appearOnScreen");
            });
        });

        TriggerSims.addEventListener('mouseleave', () => {
            const simsElements = document.querySelectorAll(".sims, .sims-wrapper");
            simsElements.forEach(a => {
                a.classList.remove("appearOnScreen");
            });
        })
    }

    const triggerNature = document.querySelector(".Trigger_bg_nature");
    if (triggerNature) {
        triggerNature.addEventListener("mouseenter", () => {
            const natureElements = document.querySelectorAll(".nature");
            natureElements.forEach(a => {
                a.classList.add("onScreen");
            });
            const natureSky = document.querySelector(".naturebackground");
            natureSky.classList.add("appearOnScreen");
        });

        triggerNature.addEventListener('mouseleave', () => {
            const natureElements = document.querySelectorAll(".nature");
            natureElements.forEach(a => {
                a.classList.remove("onScreen");
            });
            const natureSky = document.querySelector(".naturebackground");
            natureSky.classList.remove("appearOnScreen");
        })
    }

    const TriggerBirthday = document.querySelector(".Trigger_bg_birthday");
    if (TriggerBirthday) {
        TriggerBirthday.addEventListener("mouseenter", () => {
            const birthdayElements = document.querySelectorAll(".birthday");
            birthdayElements.forEach(a => {
                a.classList.add("onScreen");
            });
        });

        TriggerBirthday.addEventListener('mouseleave', () => {
            const birthdayElements = document.querySelectorAll(".birthday");
            birthdayElements.forEach(a => {
                a.classList.remove("onScreen");
            });
        })
    }

    const TriggerPink = document.querySelector(".Trigger_bg_pink");
    if (TriggerPink) {
        TriggerPink.addEventListener("mouseenter", () => {
            const pinkElements = document.querySelectorAll(".pink");
            pinkElements.forEach(a => {
                a.classList.add("appearOnScreen");
            });
        });

        TriggerPink.addEventListener('mouseleave', () => {
            const pinkElements = document.querySelectorAll(".pink");
            pinkElements.forEach(a => {
                a.classList.remove("appearOnScreen");
            });
        })
    }
}
recallTriggers_backgroundEffects();