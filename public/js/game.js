(function() {
    'use strict';

    function findGameCard() {
        const cards = document.querySelectorAll('.feature-card.elevate');
        for (let card of cards) {
            const title = card.querySelector('h3');
            if (title && title.textContent.includes('Gamified Practice')) {
                return card;
            }
        }
        return null;
    }

    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        localStorage.setItem('floak_game_last_visit', JSON.stringify({
            page: 'Gamified Practice',
            timestamp: new Date().toISOString()
        }));
        
        window.location.href = 'game.html';
    }

    function init() {
        const card = findGameCard();
        if (!card) return;

        // Hover animations
        const style = document.createElement('style');
        style.textContent = `
            .feature-card.elevate { transition: all 0.3s ease; }
            .feature-card.elevate:hover { 
                transform: translateY(-8px) !important; 
                box-shadow: 0 20px 40px rgba(59,130,246,0.25) !important;
            }
        `;
        document.head.appendChild(style);

        // Events
        card.style.cursor = 'pointer';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Open Gamified Practice');
        
        card.addEventListener('click', handleClick);
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-8px)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(e);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
