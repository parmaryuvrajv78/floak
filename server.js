require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;
const APPS_DIR = path.join(__dirname, 'public', 'apps');
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || '';
const ADMIN_COOKIE = 'floak_admin';
const ADMIN_SESSION = ADMIN_KEY
    ? crypto.createHash('sha256').update(ADMIN_KEY).digest('hex')
    : '';

fs.mkdirSync(APPS_DIR, { recursive: true });

function cleanApkName(fileName) {
    const baseName = path.basename(fileName || '').trim().toLowerCase();
    const safeName = baseName.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
    if (!safeName || !safeName.endsWith('.apk')) return null;
    return safeName;
}

function requireAdmin(req, res, next) {
    if (!ADMIN_KEY) {
        return res.status(503).json({ error: 'Admin access is not configured' });
    }
    if (req.get('x-admin-key') === ADMIN_KEY || getCookie(req, ADMIN_COOKIE) === ADMIN_SESSION) return next();
    res.status(401).json({ error: 'Invalid admin key' });
}

function getCookie(req, name) {
    const cookies = req.headers.cookie || '';
    const match = cookies
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

function requireAdminPage(req, res, next) {
    if (!ADMIN_KEY) return res.status(503).send('Admin access is not configured.');
    res.setHeader('Cache-Control', 'no-store');
    if (getCookie(req, ADMIN_COOKIE) === ADMIN_SESSION) return next();
    res.redirect('/admin-login');
}

async function getUploadedApps() {
    const entries = await fsp.readdir(APPS_DIR, { withFileTypes: true });
    const apps = await Promise.all(entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.apk'))
        .map(async (entry) => {
            const filePath = path.join(APPS_DIR, entry.name);
            const stats = await fsp.stat(filePath);
            const title = entry.name
                .replace(/\.apk$/i, '')
                .replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase());

            return {
                fileName: entry.name,
                title,
                size: stats.size,
                updatedAt: stats.mtime.toISOString(),
                url: `/apps/${encodeURIComponent(entry.name)}`
            };
        }));

    return apps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// 🔥 Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
            'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
            'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:']
        }
    }
}));
app.use(compression());
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
}));

// 🔥 Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// 🔥 Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/admin-login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!ADMIN_KEY) return res.status(503).send('Admin access is not configured.');
    if (ADMIN_KEY && getCookie(req, ADMIN_COOKIE) === ADMIN_SESSION) {
        return res.redirect('/admin.html');
    }

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>floak Admin Login</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body class="admin-page">
    <main class="admin-shell">
        <header class="admin-header">
            <a href="/" class="admin-back">Back to site</a>
            <h1>Admin Login</h1>
            <p>Enter the private admin key to manage APK uploads.</p>
        </header>
        <section class="admin-card">
            <form method="post" action="/admin-login" class="admin-form">
                <label>
                    Admin key
                    <input type="password" name="adminKey" autocomplete="current-password" required autofocus>
                </label>
                <button type="submit" class="btn-primary">Open Admin Panel</button>
            </form>
        </section>
    </main>
</body>
</html>`);
});

app.post('/admin-login', (req, res) => {
    if (!ADMIN_KEY) return res.status(503).send('Admin access is not configured.');
    if (req.body.adminKey !== ADMIN_KEY) return res.status(401).send('Invalid admin key.');

    const secureCookie = req.secure ? '; Secure' : '';
    res.setHeader(
        'Set-Cookie',
        `${ADMIN_COOKIE}=${encodeURIComponent(ADMIN_SESSION)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secureCookie}`
    );
    res.redirect('/admin.html');
});

app.post('/admin-logout', (req, res) => {
    res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
    res.redirect('/admin-login');
});

app.get('/admin.html', requireAdminPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 🔥 Static files (icons, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 API Routes
app.use('/api/ai', aiRoutes);

app.get('/api/apps', async (req, res) => {
    try {
        res.json({ apps: await getUploadedApps() });
    } catch (error) {
        res.status(500).json({ error: 'Unable to load apps' });
    }
});

app.post('/api/apps/upload', requireAdmin, express.raw({
    type: ['application/vnd.android.package-archive', 'application/octet-stream'],
    limit: '250mb'
}), async (req, res) => {
    try {
        const fileName = cleanApkName(req.get('x-file-name'));
        if (!fileName) {
            return res.status(400).json({ error: 'Upload a valid .apk file' });
        }

        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: 'APK file is empty' });
        }

        await fsp.writeFile(path.join(APPS_DIR, fileName), req.body);
        res.status(201).json({ ok: true, apps: await getUploadedApps() });
    } catch (error) {
        res.status(500).json({ error: 'Unable to upload APK' });
    }
});

app.delete('/api/apps/:fileName', requireAdmin, async (req, res) => {
    try {
        const fileName = cleanApkName(req.params.fileName);
        if (!fileName) {
            return res.status(400).json({ error: 'Invalid APK filename' });
        }

        await fsp.unlink(path.join(APPS_DIR, fileName));
        res.json({ ok: true, apps: await getUploadedApps() });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'APK not found' });
        }
        res.status(500).json({ error: 'Unable to delete APK' });
    }
});

// 🔥 Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', floak: 'Smart Learning. Simple Living. 🌤️' });
});

// 🔥 SPA Routing - MUST BE LAST
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌤️ floak: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});
