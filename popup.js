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
    const searchInput = document.getElementById('searchInput');

    // Custom Confirm Modal Elements
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmCancel = document.getElementById('confirmCancel');
    const confirmYes = document.getElementById('confirmYes');
    let onConfirmAction = null;

    function showConfirm(message, action) {
        confirmMessage.textContent = message;
        onConfirmAction = action;
        confirmModal.style.display = 'flex';
    }

    function hideConfirm() {
        confirmModal.style.display = 'none';
        onConfirmAction = null;
    }

    confirmCancel.addEventListener('click', hideConfirm);
    confirmYes.addEventListener('click', () => {
        if (onConfirmAction) onConfirmAction();
        hideConfirm();
    });

    // Localization Dictionary
    const translations = {
        en: {
            title: "Context Note",
            thisPage: "This Page",
            entireSite: "Entire Site",
            placeholder: "Write your note here...",
            save: "Save Note",
            delete: "Delete",
            back: "← Back",
            search: "Search notes...",
            confirmDelete: "Are you sure you want to delete this note?",
            saved: "Saved!",
            deleted: "Deleted!",
            saving: "Saving...",
            scopePageTitle: "Note is linked to this specific page URL only",
            scopeSiteTitle: "Note is shared across the entire website domain",
            bold: "Bold",
            italic: "Italic",
            underline: "Underline",
            bulletList: "Bullet List",
            numberedList: "Numbered List",
            copySuccess: "✅",
            emptyList: "No notes found.",
            copyTooltip: "Copy to clipboard",
            deleteTooltip: "Delete note",
            indicatorTitle: "You have a note for this site",
            lastSaved: "Last saved: ",
            viewAllNotes: "View All Notes",
            switchLanguage: "Switch Language",
            emptySaveWarning: "Cannot save an empty note.",
            emptyDeleteWarning: "No note to delete."
        },
        ar: {
            title: "ملاحظات السياق",
            thisPage: "هذه الصفحة",
            entireSite: "الموقع بالكامل",
            placeholder: "اكتب ملاحظتك هنا...",
            save: "حفظ الملاحظة",
            delete: "حذف",
            back: "رجوع →",
            search: "بحث في الملاحظات...",
            confirmDelete: "هل أنت متأكد من حذف هذه الملاحظة؟",
            saved: "تم الحفظ!",
            deleted: "تم الحذف!",
            saving: "جاري الحفظ...",
            scopePageTitle: "الملاحظة مرتبطة برابط هذه الصفحة فقط",
            scopeSiteTitle: "الملاحظة مشتركة عبر جميع صفحات الموقع",
            bold: "عريض",
            italic: "مائل",
            underline: "تسطير",
            bulletList: "قائمة نقطية",
            numberedList: "قائمة رقمية",
            copySuccess: "✅",
            emptyList: "لا توجد ملاحظات.",
            copyTooltip: "نسخ إلى الحافظة",
            deleteTooltip: "حذف الملاحظة",
            indicatorTitle: "لديك ملاحظة لهذا الموقع",
            lastSaved: "آخر حفظ: ",
            viewAllNotes: "عرض جميع الملاحظات",
            switchLanguage: "تغيير اللغة",
            close: "إلغاء",
            emptySaveWarning: "لا يمكن حفظ ملاحظة فارغة.",
            emptyDeleteWarning: "لا توجد ملاحظة لحذفها."
        }
    };

    let currentLang = 'en';
    let currentNoteTimestamp = null;

    // Function to apply translations
    function applyTranslations(lang) {
        currentLang = lang;
        const t = translations[lang];
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Update Text Content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });

        // Update Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) el.setAttribute('placeholder', t[key]);
        });

        // Update Titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (t[key]) el.setAttribute('title', t[key]);
        });

        // Update specific elements that might need dynamic update
        if (notesList.innerHTML.includes('empty-list')) {
            const emptyDiv = notesList.querySelector('.empty-list');
            if (emptyDiv) emptyDiv.textContent = t.emptyList;
        }

        // Update Toggle Button Text
        const langBtn = document.getElementById('langBtn');
        langBtn.textContent = lang === 'ar' ? 'English' : 'العربية';

        // Update Timestamp Text
        updateTimestamp();

        // Refresh List View if active to update tooltips
        if (listView.style.display !== 'none') {
            renderAllNotes(searchInput.value);
        }
    }

    // Load language preference
    const langResult = await chrome.storage.local.get(['appLanguage']);
    if (langResult.appLanguage) {
        applyTranslations(langResult.appLanguage);
    } else {
        applyTranslations('en'); // Default
    }

    // Language Toggle
    const langBtn = document.getElementById('langBtn');
    langBtn.addEventListener('click', async () => {
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        applyTranslations(newLang);
        await chrome.storage.local.set({ appLanguage: newLang });
    });

    // الحصول على الرابط الحالي
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const pageKey = tab.url;
    const domainKey = url.hostname;

    function updateTimestamp(ts) {
        // If ts is explicitly provided (not undefined), update the state
        if (ts !== undefined) {
            currentNoteTimestamp = ts;
        }

        if (!currentNoteTimestamp) {
            timestampEl.innerText = "";
            return;
        }

        const date = new Date(currentNoteTimestamp);
        const prefix = currentLang === 'ar' ? 'آخر حفظ: ' : 'Last saved: ';

        // Always use en-US for numbers to ensure 0-9 digits
        let dateStr = date.toLocaleString('en-US');

        // Replace AM/PM with Arabic equivalents if in Arabic mode
        if (currentLang === 'ar') {
            dateStr = dateStr.replace(/AM/g, 'ص').replace(/PM/g, 'م');
        }

        timestampEl.innerText = `${prefix}${dateStr}`;
    }

    // Helper to set cursor to end
    function focusAndSetCursorToEnd(el) {
        el.focus();
        if (el.innerText.length > 0) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
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

        // Focus and move cursor to end
        setTimeout(() => focusAndSetCursorToEnd(noteInput), 50);
    }

    // View Switching
    allNotesBtn.addEventListener('click', async () => {
        editorView.style.display = 'none';
        listView.style.display = 'flex'; // Changed to flex for full height
        allNotesBtn.style.display = 'none';
        await renderAllNotes();
    });

    backBtn.addEventListener('click', () => {
        listView.style.display = 'none';
        editorView.style.display = 'block';
        allNotesBtn.style.display = 'block';
        loadNote(); // Reload current note
    });

    searchInput.addEventListener('input', (e) => {
        renderAllNotes(e.target.value);
    });

    async function renderAllNotes(filterText = "") {
        const allData = await chrome.storage.local.get(null);
        notesList.innerHTML = "";

        let keys = Object.keys(allData).filter(key => key !== 'appLanguage');

        // Filter keys if search text is present
        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            keys = keys.filter(key => {
                const data = allData[key];
                let content = "";
                if (typeof data === 'object' && data.content !== undefined) {
                    content = data.content;
                } else {
                    content = data;
                }
                // Strip HTML for search
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                const textContent = tempDiv.textContent || tempDiv.innerText || "";

                return key.toLowerCase().includes(lowerFilter) || textContent.toLowerCase().includes(lowerFilter);
            });
        }

        if (keys.length === 0) {
            notesList.innerHTML = `<div class="empty-list">${translations[currentLang].emptyList}</div>`;
            return;
        }

        keys.forEach(key => {
            const data = allData[key];
            let content = "";

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

            // Try to make a pretty title and get domain for icon
            let title = key;
            let domain = "";
            try {
                if (key.startsWith('http')) {
                    const urlObj = new URL(key);
                    title = urlObj.pathname === '/' || urlObj.pathname === '' ? urlObj.hostname : urlObj.pathname;
                    domain = urlObj.hostname;
                } else {
                    // It might be a domain key directly
                    domain = key;
                }
            } catch (e) { }

            // Favicon URL (Google Service)
            const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : 'icon.png';
            const t = translations[currentLang];

            item.innerHTML = `
            <div class="note-icon-container">
                <img src="${faviconUrl}" class="site-icon" onerror="this.src='icon.png'">
            </div>
            <div class="note-content">
                <a href="${key.startsWith('http') ? key : 'https://' + key}" class="note-link" target="_blank" title="${title}">${title}</a>
                <div class="note-preview">${textPreview.substring(0, 60)}${textPreview.length > 60 ? '...' : ''}</div>
            </div>
            <div class="note-actions">
                <button class="action-icon-btn copy-btn" title="${t.copyTooltip}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                <button class="action-icon-btn delete-icon" title="${t.deleteTooltip}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
          `;

            // Add Event Listeners for buttons
            const copyBtn = item.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(textPreview).then(() => {
                    const originalHtml = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    copyBtn.classList.add('success');
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHtml;
                        copyBtn.classList.remove('success');
                    }, 1500);
                });
            });

            const deleteItemBtn = item.querySelector('.delete-icon');
            deleteItemBtn.addEventListener('click', () => {
                showConfirm(translations[currentLang].confirmDelete, async () => {
                    await chrome.storage.local.remove(key);
                    renderAllNotes(searchInput.value); // Re-render with current filter
                });
            });

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

    // Custom Tooltip Logic
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[title], [data-tooltip]');
        if (!target) return;

        // If it has a title, move it to data-tooltip to suppress native tooltip
        if (target.hasAttribute('title')) {
            target.setAttribute('data-tooltip', target.getAttribute('title'));
            target.removeAttribute('title');
        }

        const text = target.getAttribute('data-tooltip');
        if (text) {
            tooltip.textContent = text;
            tooltip.style.display = 'block';

            const rect = target.getBoundingClientRect();
            // Position tooltip
            let top = rect.top - 34; // Above by default
            let left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);

            // Adjust if out of bounds
            if (top < 5) top = rect.bottom + 8;
            if (left < 5) left = 5;
            if (left + tooltip.offsetWidth > window.innerWidth) left = window.innerWidth - tooltip.offsetWidth - 5;

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[title], [data-tooltip]');
        if (target) {
            tooltip.style.display = 'none';
        }
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

        status.innerText = translations[currentLang].saving;
        status.style.display = "inline";
        status.style.color = "#2859C5"; // Blue color for saving

        // Check if empty (or just contains empty tags like <br>)
        if (noteInput.innerText.trim() === "" && !note.includes('<img')) {
            await chrome.storage.local.remove(key);
            updateTimestamp(null);
        } else {
            await chrome.storage.local.set({ [key]: { content: note, updated: ts } });
            updateTimestamp(ts);
        }

        status.innerText = translations[currentLang].saved;
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
        const isEmpty = noteInput.innerText.trim() === "" && !note.includes('<img');

        // Check if note exists
        const result = await chrome.storage.local.get([key]);
        const exists = !!result[key];

        if (isEmpty) {
            if (!exists) {
                // No note and empty -> Warning
                status.innerText = translations[currentLang].emptySaveWarning;
                status.style.display = "inline";
                status.style.color = "red";
                setTimeout(() => { status.style.display = "none"; }, 2000);
                return;
            } else {
                // Note exists but empty -> Delete (Clear)
                await chrome.storage.local.remove(key);
                updateTimestamp(null);
            }
        } else {
            await chrome.storage.local.set({ [key]: { content: note, updated: ts } });
            updateTimestamp(ts);
        }

        status.innerText = translations[currentLang].saved;
        status.style.color = "green";
        status.style.display = "inline";
        setTimeout(() => { status.style.display = "none"; }, 1500);
    });

    // حذف الملاحظة
    deleteBtn.addEventListener('click', async () => {
        const selectedScope = document.querySelector('input[name="scope"]:checked').value;
        const key = selectedScope === 'page' ? pageKey : domainKey;

        // Check if note exists
        const result = await chrome.storage.local.get([key]);
        const exists = !!result[key];
        const isEmpty = noteInput.innerText.trim() === "" && !noteInput.innerHTML.includes('<img');

        if (!exists && isEmpty) {
            status.innerText = translations[currentLang].emptyDeleteWarning;
            status.style.display = "inline";
            status.style.color = "red";
            setTimeout(() => { status.style.display = "none"; }, 2000);
            return;
        }

        showConfirm(translations[currentLang].confirmDelete, async () => {
            await chrome.storage.local.remove(key);
            noteInput.innerHTML = "";
            updateTimestamp(null);
            status.innerText = translations[currentLang].deleted;
            status.style.display = "inline";
            status.style.color = "green";
            setTimeout(() => { status.style.display = "none"; status.innerText = translations[currentLang].saved; }, 1500);
        });
    });
});