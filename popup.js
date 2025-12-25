document.addEventListener('DOMContentLoaded', async () => {
    const noteInput = document.getElementById('noteInput');
    const saveBtn = document.getElementById('saveBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const status = document.getElementById('status');
    const scopeRadios = document.getElementsByName('scope');

    const timestampEl = document.getElementById('timestamp');
    const allNotesBtn = document.getElementById('allNotesBtn');
    const backBtn = document.getElementById('backBtn');
    const editorView = document.getElementById('editorView');
    const listView = document.getElementById('listView');
    const notesList = document.getElementById('notesList');

    // الحصول على الرابط الحالي
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const pageKey = tab.url;
    const domainKey = url.hostname;

    function updateTimestamp(ts) {
        if (!ts) {
            timestampEl.innerText = "";
            return;
        }
        const date = new Date(ts);
        timestampEl.innerText = `Last saved: ${date.toLocaleString()}`;
    }

    // تحميل الملاحظة الموجودة (إن وجدت)
    async function loadNote() {
        const selectedScope = document.querySelector('input[name="scope"]:checked').value;
        const key = selectedScope === 'page' ? pageKey : domainKey;
        const result = await chrome.storage.local.get([key]);

        let content = "";
        let ts = null;

        if (result[key]) {
            if (typeof result[key] === 'object' && result[key].content !== undefined) {
                // New format
                content = result[key].content;
                ts = result[key].updated;
            } else {
                // Old format (string)
                content = result[key];
            }
        }

        noteInput.innerHTML = content || "";
        updateTimestamp(ts);
    }

    // View Switching
    allNotesBtn.addEventListener('click', async () => {
        editorView.style.display = 'none';
        listView.style.display = 'block';
        allNotesBtn.style.display = 'none';
        await renderAllNotes();
    });

    backBtn.addEventListener('click', () => {
        listView.style.display = 'none';
        editorView.style.display = 'block';
        allNotesBtn.style.display = 'block';
        loadNote(); // Reload current note
    });

    async function renderAllNotes() {
        const allData = await chrome.storage.local.get(null);
        notesList.innerHTML = "";

        const keys = Object.keys(allData);
        if (keys.length === 0) {
            notesList.innerHTML = '<div class="empty-list">No notes found.</div>';
            return;
        }

        keys.forEach(key => {
            const data = allData[key];
            let content = "";
            let ts = null;

            if (typeof data === 'object' && data.content !== undefined) {
                content = data.content;
            } else {
                content = data;
            }

            // Strip HTML for preview
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const textPreview = tempDiv.textContent || tempDiv.innerText || "";

            const item = document.createElement('div');
            item.className = 'note-item';

            // Try to make a pretty title
            let title = key;
            try {
                if (key.startsWith('http')) {
                    const urlObj = new URL(key);
                    title = urlObj.pathname === '/' || urlObj.pathname === '' ? urlObj.hostname : urlObj.pathname;
                }
            } catch (e) { }

            item.innerHTML = `
            <a href="${key}" class="note-link" target="_blank">${title}</a>
            <div class="note-preview">${textPreview.substring(0, 50)}${textPreview.length > 50 ? '...' : ''}</div>
          `;
            notesList.appendChild(item);
        });
    }

    // عند تغيير خيار "الصفحة" أو "الموقع كامل"
    scopeRadios.forEach(r => r.addEventListener('change', loadNote));

    // التحميل الأولي
    loadNote();

    // Toolbar Actions
    document.querySelectorAll('.toolbar button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.getAttribute('data-cmd');
            document.execCommand(cmd, false, null);
            noteInput.focus();
            // Trigger save after formatting
            autoSave();
        });
    });

    // Debounce function for auto-save
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Auto-save function
    const autoSave = debounce(async () => {
        const selectedScope = document.querySelector('input[name="scope"]:checked').value;
        const key = selectedScope === 'page' ? pageKey : domainKey;
        const note = noteInput.innerHTML;
        const ts = Date.now();

        status.innerText = "Saving...";
        status.style.display = "inline";
        status.style.color = "#d97706"; // Amber color for saving

        // Check if empty (or just contains empty tags like <br>)
        if (noteInput.innerText.trim() === "" && !note.includes('<img')) {
            await chrome.storage.local.remove(key);
            updateTimestamp(null);
        } else {
            await chrome.storage.local.set({ [key]: { content: note, updated: ts } });
            updateTimestamp(ts);
        }

        status.innerText = "Saved!";
        status.style.color = "green";
        setTimeout(() => { status.style.display = "none"; }, 1500);
    }, 1000);

    // Trigger auto-save on input
    noteInput.addEventListener('input', autoSave);

    // حفظ الملاحظة (Manual Save)
    saveBtn.addEventListener('click', async () => {
        const selectedScope = document.querySelector('input[name="scope"]:checked').value;
        const key = selectedScope === 'page' ? pageKey : domainKey;
        const note = noteInput.innerHTML;
        const ts = Date.now();

        if (noteInput.innerText.trim() === "" && !note.includes('<img')) {
            await chrome.storage.local.remove(key);
            updateTimestamp(null);
        } else {
            await chrome.storage.local.set({ [key]: { content: note, updated: ts } });
            updateTimestamp(ts);
        }

        status.innerText = "Saved!";
        status.style.display = "inline";
        setTimeout(() => { status.style.display = "none"; }, 1500);
    });

    // حذف الملاحظة
    deleteBtn.addEventListener('click', async () => {
        const selectedScope = document.querySelector('input[name="scope"]:checked').value;
        const key = selectedScope === 'page' ? pageKey : domainKey;
        await chrome.storage.local.remove(key);
        noteInput.innerHTML = "";
        updateTimestamp(null);
        status.innerText = "Deleted!";
        status.style.display = "inline";
        setTimeout(() => { status.style.display = "none"; status.innerText = "Saved!"; }, 1500);
    });
});