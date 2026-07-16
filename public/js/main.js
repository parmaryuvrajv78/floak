// main.js | floak Website - Production Ready v2.1
// Complete vanilla JS: Loader, Mobile Menu, Smooth Scroll, Animations, Header Effects + GAME SUPPORT
// Bug-fixed: Study/Game card navigation | 2026 Production

(function() {
    'use strict';

    // 🌟 CONFIGURATION
    const CONFIG = {
        LOADER_DELAY: 1500,
        SCROLL_THRESHOLD: 100,
        OBSERVER: {
            THRESHOLD: 0.1,
            ROOT_MARGIN: '0px 0px -50px 0px'
        },
        HEADER: {
            SCROLL_BG: 'rgba(255, 255, 255, 0.98)',
            SCROLL_SHADOW: 'none',
            IDLE_BG: 'rgba(255, 255, 255, 0.94)',
            IDLE_SHADOW: 'none'
        },
        // 🎮 GAMIFIED PRACTICE
        GAME_CONFIG: {
            STUDY_PAGE: 'https://note-provider.vercel.app/index.html',
            GAME_PAGE: 'game.html',
            STORAGE_KEY_STUDY: 'floak_study_last_visit',
            STORAGE_KEY_GAME: 'floak_game_last_visit'
        },
        CONTACT_TOPICS: [
            {
                label: 'Feedback',
                topic: 'Feedback',
                placeholder: 'Tell me what should feel clearer, faster, or more useful.',
                status: 'Selected: Feedback'
            },
            {
                label: 'Collab',
                topic: 'Collaboration',
                placeholder: 'Share the project idea, timeline, and what kind of help you need.',
                status: 'Selected: Collaboration'
            },
            {
                label: 'Support',
                topic: 'Support',
                placeholder: 'Describe the issue, page, device, and what you expected to happen.',
                status: 'Selected: Support'
            }
        ],
        ROADMAP: [
            'Study workflow improvements',
            'Android app releases',
            'Progress analytics'
        ],
        CONSOLE_STATES: [
            {
                label: 'Today',
                title: 'Physics revision sprint',
                progress: 76,
                note: 'Notes, revision cards, and practice tasks ready.',
                miniLabel: 'Notes',
                miniTitle: 'Topic ready',
                miniNote: "Kirchhoff's law revision card saved.",
                tasks: '4 tasks',
                due: 'Before 8:30 PM',
                prompt: 'Build a 30-minute study plan for tomorrow.'
            },
            {
                label: 'Focus',
                title: 'Math practice cycle',
                progress: 58,
                note: 'Quadratic equations and revision cards queued.',
                miniLabel: 'Notes',
                miniTitle: 'Formula sheet',
                miniNote: 'Saved 12 key identities for quick recall.',
                tasks: '6 tasks',
                due: 'Before 7:00 PM',
                prompt: 'Create five quiz questions from my weak topics.'
            },
            {
                label: 'Review',
                title: 'Exam prep dashboard',
                progress: 84,
                note: 'Previous mistakes converted into practice prompts.',
                miniLabel: 'Plan',
                miniTitle: 'High priority',
                miniNote: 'Thermodynamics and organic chemistry need review.',
                tasks: '3 tasks',
                due: 'Tomorrow',
                prompt: 'Summarize my revision into a checklist.'
            }
        ]
    };

    // 🎯 ELEMENTS CACHE
    function getElements() {
        return {
            loader: document.getElementById('loader'),
            mobileMenu: document.getElementById('mobileMenu'),
            navLinks: document.querySelector('.nav-links'),
            appDrawer: document.getElementById('appDrawer'),
            appDrawerBackdrop: document.getElementById('appDrawerBackdrop')
        };
    }

    let ELEMENTS = getElements();

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function renderDynamicContactContent() {
        const tabs = document.getElementById('contactTabs');
        const roadmap = document.getElementById('roadmapSignals');

        if (tabs && !tabs.dataset.rendered) {
            tabs.innerHTML = CONFIG.CONTACT_TOPICS.map((item, index) => `
                <button class="contact-tab${index === 0 ? ' active' : ''}" type="button" data-contact-topic="${item.topic}">
                    ${item.label}
                </button>
            `).join('');
            tabs.dataset.rendered = 'true';
        }

        if (roadmap && !roadmap.dataset.rendered) {
            roadmap.innerHTML = `
                <h3>Roadmap Signals</h3>
                ${CONFIG.ROADMAP.map((item) => `
                    <div>
                        <span></span>
                        <p>${item}</p>
                    </div>
                `).join('')}
            `;
            roadmap.dataset.rendered = 'true';
        }
    }

    function getContactTopic(topic) {
        return CONFIG.CONTACT_TOPICS.find((item) => item.topic === topic) || CONFIG.CONTACT_TOPICS[0];
    }

    function updateContactCopy(topic) {
        const selected = getContactTopic(topic);
        const message = document.getElementById('contactMessage');
        const status = document.getElementById('contactStatus');
        if (message) message.placeholder = selected.placeholder;
        if (status) status.textContent = selected.status;
    }

    function updateConsoleState(state) {
        setText('consoleLabel', state.label);
        setText('consoleTitle', state.title);
        setText('consoleNote', state.note);
        setText('consoleMiniLabel', state.miniLabel);
        setText('consoleMiniTitle', state.miniTitle);
        setText('consoleMiniNote', state.miniNote);
        setText('consoleTaskCount', state.tasks);
        setText('consoleDueTime', state.due);
        setText('consolePrompt', state.prompt);

        const progress = document.getElementById('consoleProgress');
        if (progress) progress.style.width = `${state.progress}%`;
    }

    function initDynamicConsole() {
        if (document.body.dataset.consoleBound) return;
        document.body.dataset.consoleBound = 'true';
        let index = 0;
        updateConsoleState(CONFIG.CONSOLE_STATES[index]);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        window.setInterval(() => {
            index = (index + 1) % CONFIG.CONSOLE_STATES.length;
            updateConsoleState(CONFIG.CONSOLE_STATES[index]);
        }, 4500);
    }

    function initActiveNavigation() {
        if (document.body.dataset.activeNavBound || typeof IntersectionObserver === 'undefined') return;
        document.body.dataset.activeNavBound = 'true';
        const links = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
        const sections = links
            .map((link) => document.querySelector(link.getAttribute('href')))
            .filter(Boolean);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((link) => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                });
            });
        }, {
            rootMargin: '-35% 0px -55% 0px',
            threshold: 0
        });

        sections.forEach((section) => observer.observe(section));
    }

    // 🎮 STUDY DASHBOARD CARD HANDLER
    function initStudyCard() {
        const cards = document.querySelectorAll('.feature-card.elevate');
        for (let card of cards) {
            const title = card.querySelector('h3');
            if (title && title.textContent.includes('Study Dashboard')) {
                if (card.dataset.studyBound) return;
                card.dataset.studyBound = 'true';
                
                card.style.cursor = 'pointer';
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', 'Open Study Dashboard');
                
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.setItem(CONFIG.GAME_CONFIG.STORAGE_KEY_STUDY, JSON.stringify({
                        page: 'Study Dashboard',
                        timestamp: new Date().toISOString()
                    }));
                    window.location.href = CONFIG.GAME_CONFIG.STUDY_PAGE;
                });
                
                // Hover effects
                
                console.log('📚 Study Dashboard card activated');
                break;
            }
        }
    }

    // 🎮 GAMIFIED PRACTICE CARD HANDLER
    function initGameCard() {
        const cards = document.querySelectorAll('.feature-card.elevate');
        for (let card of cards) {
            const title = card.querySelector('h3');
            if (title && title.textContent.includes('Gamified Practice')) {
                if (card.dataset.gameBound) return;
                card.dataset.gameBound = 'true';
                
                card.style.cursor = 'pointer';
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', 'Open Gamified Practice');
                
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.setItem(CONFIG.GAME_CONFIG.STORAGE_KEY_GAME, JSON.stringify({
                        page: 'Gamified Practice',
                        timestamp: new Date().toISOString()
                    }));
                    window.location.href = CONFIG.GAME_CONFIG.GAME_PAGE;
                });
                
                // Hover effects
                
                console.log('🎮 Gamified Practice card activated');
                break;
            }
        }
    }

    function toggleAppDrawer(open = null) {
        const drawer = document.getElementById('appDrawer');
        const backdrop = document.getElementById('appDrawerBackdrop');
        if (!drawer || !backdrop) return;

        const isOpen = drawer.classList.contains('active');
        const shouldOpen = open === null ? !isOpen : open;

        drawer.classList.toggle('active', shouldOpen);
        backdrop.classList.toggle('active', shouldOpen);
        document.body.classList.toggle('app-drawer-open', shouldOpen);
        drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        ELEMENTS.navLinks?.classList.remove('active');

        if (shouldOpen) loadAppDownloads();
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return 'APK file';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }
        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }

    function renderAppDownloads(apps) {
        const list = document.getElementById('appDownloadList');
        if (!list) return;

        setText('liveToolsCount', String(2 + apps.length));

        if (!apps.length) {
            list.innerHTML = '<p class="drawer-empty">No Android apps uploaded yet.</p>';
            return;
        }

        list.innerHTML = apps.map((app) => `
            <article class="download-card">
                <div class="download-app-info">
                    <img class="download-app-logo" src="/icon.png" alt="" aria-hidden="true">
                    <div>
                        <span class="download-badge">APK</span>
                        <h3>${app.title}</h3>
                        <p>${formatBytes(app.size)} updated ${new Date(app.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <a href="${app.url}" download>Download</a>
            </article>
        `).join('');
    }

    let appDownloadsRequest = null;

    async function loadAppDownloads(force = false) {
        const list = document.getElementById('appDownloadList');
        if (!list) return;
        if (!force && list.dataset.loaded === 'true') return;
        if (appDownloadsRequest) return appDownloadsRequest;

        list.innerHTML = '<p class="drawer-empty">Loading apps...</p>';
        appDownloadsRequest = (async () => {
            try {
            const response = await fetch('/api/apps');
            if (!response.ok) throw new Error('Unable to load apps');
            const data = await response.json();
            renderAppDownloads(data.apps || []);
            list.dataset.loaded = 'true';
            } catch (error) {
                list.innerHTML = '<p class="drawer-empty">Unable to load Android apps.</p>';
            } finally {
                appDownloadsRequest = null;
            }
        })();

        return appDownloadsRequest;
    }

    function initContactWorkflow() {
        renderDynamicContactContent();
        const form = document.getElementById('contactForm');
        const topicInput = document.getElementById('contactTopic');
        const status = document.getElementById('contactStatus');
        if (!form || !topicInput || form.dataset.contactBound) return;

        form.dataset.contactBound = 'true';
        updateContactCopy(topicInput.value);

        document.querySelectorAll('.contact-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                const topic = tab.dataset.contactTopic || 'Feedback';
                topicInput.value = topic;
                document.querySelectorAll('.contact-tab').forEach((item) => {
                    item.classList.toggle('active', item === tab);
                });
                updateContactCopy(topic);
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName')?.value.trim() || 'Website visitor';
            const email = document.getElementById('contactEmail')?.value.trim() || '';
            const message = document.getElementById('contactMessage')?.value.trim() || '';
            const topic = topicInput.value || 'Feedback';
            if (message.length < 12) {
                if (status) status.textContent = 'Add a little more detail so the message is useful.';
                return;
            }
            const subject = `floak ${topic} - ${name}`;
            const body = [
                `Name: ${name}`,
                `Email: ${email}`,
                `Topic: ${topic}`,
                '',
                message
            ].join('\n');

            localStorage.setItem('floak_contact_draft', JSON.stringify({
                name,
                email,
                topic,
                message,
                updatedAt: new Date().toISOString()
            }));
            window.location.href = `mailto:parmaryuvrajv78@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            if (status) status.textContent = 'Email draft prepared in your mail app.';
        });
    }

    // 🚀 MAIN INITIALIZATION
    function init() {
        ELEMENTS = getElements();
        
        hideLoader();
        bindMobileMenu();
        bindSmoothScroll();
        initScrollAnimations();
        bindHeaderScroll();
        bindAppDrawerEvents();
        renderDynamicContactContent();
        initDynamicConsole();
        initActiveNavigation();
        initContactWorkflow();
        loadAppDownloads();
        // 🎯 ACTIVATE FEATURE CARDS
        initStudyCard();
        initGameCard();
        
        console.log('🌤️ floak Main JS v2.1 Loaded - Study + Game cards active! 🚀');
    }

    // [Keep all other functions exactly the same...]
    function hideLoader() {
        if (ELEMENTS.loader) {
            setTimeout(() => {
                ELEMENTS.loader.classList.add('hidden');
            }, CONFIG.LOADER_DELAY);
        }
    }

    function bindMobileMenu() {
        if (ELEMENTS.mobileMenu?.dataset.menuBound) return;
        if (ELEMENTS.mobileMenu) ELEMENTS.mobileMenu.dataset.menuBound = 'true';
        ELEMENTS.mobileMenu?.addEventListener('click', (e) => {
            e.stopPropagation();
            ELEMENTS.navLinks?.classList.toggle('active');
        });
    }

    function bindSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            if (anchor.dataset.scrollBound) return;
            anchor.dataset.scrollBound = 'true';
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const header = document.querySelector('.header');
                    const headerOffset = header ? header.offsetHeight + 28 : 96;
                    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                    ELEMENTS.navLinks?.classList.remove('active');
                }
            });
        });
    }

    function initScrollAnimations() {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, CONFIG.OBSERVER);
        document.querySelectorAll('.elevate').forEach(el => {
            observer.observe(el);
        });
    }

    function bindHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        let ticking = false;
        function updateHeader() {
            if (window.scrollY > CONFIG.SCROLL_THRESHOLD) {
                header.style.background = CONFIG.HEADER.SCROLL_BG;
                header.style.boxShadow = CONFIG.HEADER.SCROLL_SHADOW;
            } else {
                header.style.background = CONFIG.HEADER.IDLE_BG;
                header.style.boxShadow = CONFIG.HEADER.IDLE_SHADOW;
            }
            ticking = false;
        }
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        });
    }

    function bindAppDrawerEvents() {
        if (document.body.dataset.appDrawerEventsBound) return;
        document.body.dataset.appDrawerEventsBound = 'true';

        const openButtons = [
            document.getElementById('appDrawerToggle'),
            document.getElementById('appDrawerSectionToggle')
        ];

        openButtons.forEach((button) => {
            button?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleAppDrawer(true);
            });
        });

        document.getElementById('appDrawerClose')?.addEventListener('click', () => toggleAppDrawer(false));
        document.getElementById('appDrawerBackdrop')?.addEventListener('click', () => toggleAppDrawer(false));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') toggleAppDrawer(false);
        });
    }

    // 🎬 DOM READY
    function onDomReady() {
        init();
        const observer = new MutationObserver(() => {
            ELEMENTS = getElements();
            initStudyCard();
            initGameCard();
            bindMobileMenu();
            bindAppDrawerEvents();
            initContactWorkflow();
            initActiveNavigation();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDomReady);
    } else {
        onDomReady();
    }
})();
