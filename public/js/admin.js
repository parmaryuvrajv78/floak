(function() {
    'use strict';

    const form = document.getElementById('apkUploadForm');
    const fileInput = document.getElementById('apkFile');
    const statusEl = document.getElementById('adminStatus');
    const listEl = document.getElementById('adminAppList');
    const refreshButton = document.getElementById('refreshApps');

    function setStatus(message, tone = 'neutral') {
        statusEl.textContent = message;
        statusEl.dataset.tone = tone;
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

    function getHeaders(fileName) {
        return {
            'Content-Type': 'application/octet-stream',
            'x-file-name': fileName
        };
    }

    function renderApps(apps) {
        if (!apps.length) {
            listEl.innerHTML = '<p>No APK files uploaded yet.</p>';
            return;
        }

        listEl.innerHTML = apps.map((app) => `
            <article class="admin-app-row">
                <div>
                    <h3>${app.title}</h3>
                    <p>${app.fileName} · ${formatBytes(app.size)} · ${new Date(app.updatedAt).toLocaleString()}</p>
                </div>
                <div class="admin-row-actions">
                    <a href="${app.url}" download>Download</a>
                    <button type="button" data-delete-apk="${app.fileName}">Remove</button>
                </div>
            </article>
        `).join('');
    }

    async function loadApps() {
        listEl.innerHTML = '<p>Loading APK files...</p>';
        try {
            const response = await fetch('/api/apps');
            if (!response.ok) throw new Error('Unable to load APK files');
            const data = await response.json();
            renderApps(data.apps || []);
        } catch (error) {
            listEl.innerHTML = '<p>Unable to load APK files.</p>';
        }
    }

    async function uploadApk(file) {
        const response = await fetch('/api/apps/upload', {
            method: 'POST',
            headers: getHeaders(file.name),
            body: file
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        renderApps(data.apps || []);
    }

    async function deleteApk(fileName) {
        const response = await fetch(`/api/apps/${encodeURIComponent(fileName)}`, {
            method: 'DELETE'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Delete failed');
        renderApps(data.apps || []);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const file = fileInput.files[0];
        if (!file || !file.name.toLowerCase().endsWith('.apk')) {
            setStatus('Please choose a valid APK file.', 'error');
            return;
        }

        setStatus('Uploading APK...', 'neutral');
        try {
            await uploadApk(file);
            fileInput.value = '';
            setStatus('APK uploaded successfully.', 'success');
        } catch (error) {
            setStatus(error.message, 'error');
        }
    });

    listEl.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-delete-apk]');
        if (!button) return;

        const fileName = button.dataset.deleteApk;
        setStatus(`Removing ${fileName}...`, 'neutral');
        try {
            await deleteApk(fileName);
            setStatus('APK removed.', 'success');
        } catch (error) {
            setStatus(error.message, 'error');
        }
    });

    refreshButton.addEventListener('click', loadApps);
    loadApps();
})();
