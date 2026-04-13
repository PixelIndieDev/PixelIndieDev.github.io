window.recallTriggers_Stats = function() {
    let card = document.querySelector('picture.stats');
    const intensity = 5;
    const offsetX = 5;
    const offsetY = 5;

    if (card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -intensity;
            const rotateY = ((x - centerX) / centerX) * intensity;

            card.style.transform = `perspective(800px) rotateX(${rotateX + offsetX}deg) rotateY(${rotateY + offsetY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
        });
    }
}
recallTriggers_Stats();