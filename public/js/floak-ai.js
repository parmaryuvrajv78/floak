/**
 * 🌤️ floak AI - Backend API Version (COMPLETE)
 * Secure proxy to /api/ai/chat
 */

class FloakAI {
    constructor() {
        this.isOpen = false;
        this.isLoading = false;
        this.conversation = [];
        this.maxHistory = 8;
        this.API_URL = '/api/ai/chat'; // Backend proxy
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.makeAIAccessible();
        this.addWelcomeMessage();
        console.log('🌤️ floak AI Backend - Ready!');
    }

    /** 🔥 CONTROLLED AI ACCESS - Specific banners only */
    makeAIAccessible() {
        const aiBanners = [
            '#aiToggle',
            '#heroAiToggle', 
            '.ai-card',
            '.ai-access'
        ];
        
        aiBanners.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el._aiHandler) return;
                
                el._aiHandler = true;
                el.style.cursor = 'pointer';
                el.style.transition = 'all 0.2s ease';
                
                el.addEventListener('mouseenter', () => {
                    el.style.transform = 'scale(1.02)';
                    el.style.opacity = '0.8';
                });
                
                el.addEventListener('mouseleave', () => {
                    el.style.transform = 'scale(1)';
                    el.style.opacity = '1';
                });
                
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.openWithWelcome();
                });
            });
        });
    }

    bindEvents() {
        // Toggle buttons
        document.getElementById('aiToggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        document.getElementById('heroAiToggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Chat input
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        sendBtn?.addEventListener('click', () => this.sendMessage());
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            const chat = document.getElementById('aiChat');
            if (this.isOpen && 
                chat &&
                !chat.contains(e.target) &&
                !document.getElementById('aiToggle')?.contains(e.target) &&
                !document.getElementById('heroAiToggle')?.contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        const chat = document.getElementById('aiChat');
        if (!chat) return;
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            chat.classList.add('active');
            setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
        } else {
            chat.classList.remove('active');
        }
    }

    close() {
        document.getElementById('aiChat')?.classList.remove('active');
        this.isOpen = false;
    }

    openWithWelcome() {
        if (!this.isOpen) {
            this.toggle();
            setTimeout(() => {
                this.addMessage('🚀 Quick AI Access! What would you like to learn?', false);
                document.getElementById('chatInput')?.focus();
            }, 300);
        } else {
            document.getElementById('chatInput')?.focus();
        }
    }

    addMessage(text, isUser = false) {
        const container = document.getElementById('chatMessages');
        if (!container) return null;
        const message = document.createElement('div');
        
        message.className = `message ${isUser ? 'user' : 'ai'}`;
        message.innerHTML = this.formatMessage(text);
        
        container.appendChild(message);
        container.scrollTop = container.scrollHeight;
        
        return message;
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            // Math equations
            .replace(/\$(.+?)\$/g, '<span class="math-inline">$1</span>')
            .replace(/\$(\$[^$]+\$\$)/g, '<div class="math-display">$1</div>');
    }

    addWelcomeMessage() {
        const welcome = `
            <strong>🌤️ Welcome to floak AI!</strong><br><br>
            📚 Study explanations<br>
            💻 Coding help<br>
            🧮 Math problems<br>
            📝 Study organization<br><br>
            <em>⚡ Super-fast responses and smart help</em>
        `;
        this.addMessage(welcome, false);
    }

    addLoadingMessage() {
        const msg = this.addMessage('🌤️ floak AI is thinking... ⚡', false);
        msg.classList.add('loading');
        return msg;
    }

    showError(message) {
        this.addMessage(message, false);
    }

    async sendMessage() {
        if (this.isLoading) return;

        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // User message
        this.addMessage(message, true);
        input.value = '';
        this.conversation.push({ role: 'user', content: message });

        this.isLoading = true;
        const sendBtn = document.getElementById('sendBtn');
        const inputEl = document.getElementById('chatInput');
        
        sendBtn.disabled = true;
        inputEl.disabled = true;
        const loadingMsg = this.addLoadingMessage();

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: this.conversation,
                    model: 'llama-3.3-70b-versatile'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices[0]?.message?.content || 'Sorry, try again! 😊';

            loadingMsg.remove();
            this.addMessage(reply, false);
            this.conversation.push({ role: 'assistant', content: reply });

        } catch (error) {
            console.error('floak AI Error:', error);
            loadingMsg.remove();
            this.showError(`Error: ${error.message}. Please try again! 😊`);
        } finally {
            this.isLoading = false;
            sendBtn.disabled = false;
            inputEl.disabled = false;
            inputEl.focus();
        }
    }

    clearChat() {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        this.addWelcomeMessage();
        this.conversation = [];
    }
}

// 🌤️ Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.floakAI = new FloakAI();
    });
} else {
    window.floakAI = new FloakAI();
}

// Global functions for onclick handlers
function toggleFloakAI() {
    window.floakAI?.toggle();
}
window.toggleChat = toggleFloakAI;
