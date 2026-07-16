const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`📨 AI Request: ${req.method} ${req.path}`);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: 'Too many AI requests!' }
});

router.use(aiLimiter);

router.post('/chat', async (req, res) => {
    console.log('🔥 AI CHAT CALLED!');
    console.log('GROQ_KEY exists?', !!process.env.GROQ_API_KEY ? '✅ YES' : '❌ NO');
    console.log('Messages:', req.body.messages);
    
    try {
        const { messages, model = 'llama-3.3-70b-versatile' } = req.body;

        if (!messages || !Array.isArray(messages)) {
            console.log('❌ Invalid messages format');
            return res.status(400).json({ error: 'Invalid message format' });
        }

        console.log('🌐 Calling Groq API...');
        
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: `You are floak AI 🌤️ - super-fast student assistant. Answer briefly.`
                    },
                    ...messages.slice(-8)
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        console.log('Groq status:', groqResponse.status);
        
        const data = await groqResponse.json();
        console.log('Groq response:', JSON.stringify(data, null, 2));

        if (!groqResponse.ok) {
            console.error('Groq Error:', data);
            return res.status(groqResponse.status).json({
                error: 'AI service error',
                details: data.error?.message || 'Unknown'
            });
        }

        res.json(data);
        
    } catch (error) {
        console.error('💥 FULL ERROR:', error);
        res.status(500).json({ 
            error: 'Server error',
            details: error.message 
        });
    }
});

module.exports = router;
