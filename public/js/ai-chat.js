// floak AI Chat - Groq Integration

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

let isChatOpen = false;
let isLoading = false;
let conversation = [];

function toggleChat() {
    const chat = document.getElementById('aiChat');
    isChatOpen = !isChatOpen;
    chat.classList.toggle('active');
    if (isChatOpen) {
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
    }
}

function addMessage(text, isUser = false) {
    const container = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user' : 'ai'}`;
    message.innerHTML = text.replace(/\n/g, '<br>');
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    if (!GROQ_API_KEY || GROQ_API_KEY.length < 10) {
        addMessage('❌ Please set a valid Groq API key!');
        return;
    }

    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || isLoading) return;

    // User message
    addMessage(message, true);
    input.value = '';
    conversation.push({ role: 'user', content: message });

    // Loading
    isLoading = true;
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('chatInput').disabled = true;
    addMessage('🌤️ floak AI is thinking... ⚡');

    try {
        const systemPrompt = `You are floak AI 🌤️ - a super-fast, friendly learning assistant for students.
        Answer in simple, clear language. Use bullet points for lists. Be encouraging!
        Focus on: study help, coding (HTML/CSS/JS/Python), math, exam prep, organization tips.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversation.slice(-8)
                ],
                max_tokens: 1200,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        // Remove loading message
        document.getElementById('chatMessages').lastChild.remove();
        addMessage(reply);
        conversation.push({ role: 'assistant', content: reply });

    } catch (error) {
        console.error('AI Chat Error:', error);
        addMessage('❌ Sorry! Check your connection or try again. 😊');
    } finally {
        isLoading = false;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('chatInput').disabled = false;
        document.getElementById('chatInput').focus();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('aiToggle').onclick = toggleChat;
    const heroAiToggle = document.getElementById('heroAiToggle');
    if (heroAiToggle) heroAiToggle.onclick = toggleChat;
    
    document.getElementById('chatInput').onkeypress = function(e) {
        if (e.key === 'Enter') sendMessage();
    };
    
    document.getElementById('sendBtn').onclick = sendMessage;
});
