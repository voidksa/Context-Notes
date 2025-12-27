
let currentAppLanguage = 'en';

const TRANSLATIONS = {
    en: {
        save: 'Save',
        delete: 'Delete',
        close: 'Cancel',
        confirmDelete: 'Are you sure you want to delete this note?',
        placeholder: 'Write your note here...',
        bold: 'Bold',
        italic: 'Italic',
        underline: 'Underline',
        bulletList: 'Bullet List',
        numberedList: 'Numbered List',
        emptySaveWarning: 'Cannot save an empty note.',
        emptyDeleteWarning: 'No note to delete.',
        indicatorTitle: "You have a note for this site"
    },
    ar: {
        save: 'حفظ',
        delete: 'حذف',
        close: 'إلغاء',
        confirmDelete: 'هل أنت متأكد من حذف هذه الملاحظة؟',
        placeholder: 'اكتب ملاحظتك هنا...',
        bold: 'عريض',
        italic: 'مائل',
        underline: 'تسطير',
        bulletList: 'قائمة نقطية',
        numberedList: 'قائمة رقمية',
        emptySaveWarning: 'لا يمكن حفظ ملاحظة فارغة.',
        emptyDeleteWarning: 'لا توجد ملاحظة لحذفها.',
        indicatorTitle: "لديك ملاحظة لهذا الموقع"
    }
};

async function checkNote() {
    const url = window.location.href;
    const domain = window.location.hostname;

    const data = await chrome.storage.local.get([url, domain, 'appLanguage']);
    currentAppLanguage = data.appLanguage || 'en';

    // Check if we should show or hide the indicator
    if (data[url] || data[domain]) {
        showIndicator();
    } else {
        removeIndicator();
    }
}

function showIndicator() {
    const t = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS.en;
    const indicatorTitle = t.indicatorTitle;

    // Update existing indicator title if it exists
    const existingIndicator = document.getElementById('context-note-indicator');
    if (existingIndicator) {
        existingIndicator.title = indicatorTitle;
        return;
    }

    const indicator = document.createElement('div');
    indicator.id = 'context-note-indicator';
    indicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
    indicator.title = indicatorTitle;
    indicator.addEventListener('click', () => {
        createEditModal();
    });
    document.body.appendChild(indicator);
}

function updateModalLanguage() {
    const modal = document.getElementById('context-note-modal');
    if (!modal) return;

    const t = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS.en;
    const isAr = currentAppLanguage === 'ar';

    modal.dir = isAr ? 'rtl' : 'ltr';

    // Update texts
    const saveBtn = modal.querySelector('.cn-save-btn');
    if (saveBtn) saveBtn.textContent = t.save;

    const deleteBtn = modal.querySelector('.cn-delete-btn');
    if (deleteBtn) deleteBtn.textContent = t.delete;

    const editor = modal.querySelector('.cn-editor');
    if (editor) editor.setAttribute('placeholder', t.placeholder);

    // Update Confirm Overlay
    const confirmMsg = modal.querySelector('.cn-confirm-msg');
    if (confirmMsg) confirmMsg.textContent = t.confirmDelete;

    const confirmCancel = modal.querySelector('.cn-confirm-cancel');
    if (confirmCancel) confirmCancel.textContent = t.close;

    const confirmYes = modal.querySelector('.cn-confirm-yes');
    if (confirmYes) confirmYes.textContent = t.delete;

    // Update Toolbar Titles
    const toolbar = modal.querySelector('.cn-toolbar');
    if (toolbar) {
        const btnMap = {
            'bold': t.bold,
            'italic': t.italic,
            'underline': t.underline,
            'insertUnorderedList': t.bulletList,
            'insertOrderedList': t.numberedList
        };

        toolbar.querySelectorAll('button').forEach(btn => {
            const cmd = btn.dataset.cmd;
            if (btnMap[cmd]) {
                btn.title = btnMap[cmd];
                // Update data-tooltip if it exists (for custom tooltip)
                if (btn.hasAttribute('data-tooltip')) {
                    btn.setAttribute('data-tooltip', btnMap[cmd]);
                }
            }
        });
    }
}

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

async function createEditModal() {
    if (document.getElementById('context-note-modal')) return;

    // Get current language
    const { appLanguage } = await chrome.storage.local.get('appLanguage');
    currentAppLanguage = appLanguage || 'en';
    const isAr = currentAppLanguage === 'ar';
    const t = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS.en;

    const url = window.location.href;
    const domain = window.location.hostname;

    // Determine which note to show (Page has priority over Domain)
    const data = await chrome.storage.local.get([url, domain]);
    let activeKey = data[url] ? url : (data[domain] ? domain : url); // Default to Page if neither (new note)

    let content = "";
    if (data[activeKey]) {
        if (typeof data[activeKey] === 'object' && data[activeKey].content !== undefined) {
            content = data[activeKey].content;
        } else {
            content = data[activeKey];
        }
    }

    const modal = document.createElement('div');
    modal.id = 'context-note-modal';
    modal.dir = isAr ? 'rtl' : 'ltr';
    modal.innerHTML = `
        <div class="cn-modal-content">
            <div class="cn-modal-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${chrome.runtime.getURL('icon.png')}" style="width: 20px; height: 20px;">
                    <span class="cn-modal-title">Context Note</span>
                </div>
                <button class="cn-close-btn">&times;</button>
            </div>
            <div class="cn-toolbar">
                <button data-cmd="bold" title="${t.bold}">B</button>
                <button data-cmd="italic" title="${t.italic}">I</button>
                <button data-cmd="underline" title="${t.underline}">U</button>
                <button data-cmd="insertUnorderedList" title="${t.bulletList}">• List</button>
                <button data-cmd="insertOrderedList" title="${t.numberedList}">1. List</button>
            </div>
            <div class="cn-editor" contenteditable="true" dir="auto" placeholder="${t.placeholder}">${content}</div>
            <div class="cn-modal-footer">
                <div class="cn-status-msg"></div>
                <button class="cn-btn cn-delete-btn">${t.delete}</button>
                <button class="cn-btn cn-save-btn">${t.save}</button>
            </div>
            <div class="cn-confirm-overlay" style="display: none;">
                <div class="cn-confirm-box">
                    <div class="cn-confirm-msg">${t.confirmDelete}</div>
                    <div class="cn-confirm-buttons">
                        <button class="cn-btn cn-confirm-cancel">${t.close}</button>
                        <button class="cn-btn cn-confirm-yes">${t.delete}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.cn-close-btn');
    const saveBtn = modal.querySelector('.cn-save-btn');
    const deleteBtn = modal.querySelector('.cn-delete-btn');
    const editor = modal.querySelector('.cn-editor');
    const toolbar = modal.querySelector('.cn-toolbar');
    const statusMsg = modal.querySelector('.cn-status-msg');

    // Confirm Overlay Elements
    const confirmOverlay = modal.querySelector('.cn-confirm-overlay');
    const confirmCancel = modal.querySelector('.cn-confirm-cancel');
    const confirmYes = modal.querySelector('.cn-confirm-yes');

    // Toolbar Functionality
    toolbar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
            editor.focus();
        });
    });

    const closeModal = () => modal.remove();

    closeBtn.addEventListener('click', closeModal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    saveBtn.addEventListener('click', async () => {
        const curT = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS.en;
        const newContent = editor.innerHTML;
        const ts = Date.now();
        const isEmpty = editor.innerText.trim() === "" && !newContent.includes('<img');

        // Check existence again
        const freshData = await chrome.storage.local.get([activeKey]);
        const exists = !!freshData[activeKey];

        if (isEmpty) {
            if (!exists) {
                // Warning
                statusMsg.textContent = curT.emptySaveWarning;
                statusMsg.style.color = "#ef4444"; // Red
                setTimeout(() => { statusMsg.textContent = ""; }, 2000);
                return;
            } else {
                // Delete
                await chrome.storage.local.remove(activeKey);
            }
        } else {
            await chrome.storage.local.set({ [activeKey]: { content: newContent, updated: ts } });
        }
        closeModal();
    });

    deleteBtn.addEventListener('click', async () => {
        const curT = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS.en;
        const isEmpty = editor.innerText.trim() === "" && !editor.innerHTML.includes('<img');
        const freshData = await chrome.storage.local.get([activeKey]);
        const exists = !!freshData[activeKey];

        if (!exists && isEmpty) {
            statusMsg.textContent = curT.emptyDeleteWarning;
            statusMsg.style.color = "#ef4444"; // Red
            setTimeout(() => { statusMsg.textContent = ""; }, 2000);
            return;
        }

        confirmOverlay.style.display = 'flex';
    });

    confirmCancel.addEventListener('click', () => {
        confirmOverlay.style.display = 'none';
    });

    confirmYes.addEventListener('click', async () => {
        await chrome.storage.local.remove(activeKey);
        closeModal();
    });

    // Focus editor
    setTimeout(() => focusAndSetCursorToEnd(editor), 100);
}

function removeIndicator() {
    const indicator = document.getElementById('context-note-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Listen for changes in storage to update indicator in real-time
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.appLanguage) {
            currentAppLanguage = changes.appLanguage.newValue;
            // Re-run showIndicator to update title if it exists
            const indicator = document.getElementById('context-note-indicator');
            if (indicator) showIndicator();

            // Update Modal Language if open
            updateModalLanguage();
        }
        checkNote();
    }
});

// Custom Tooltip Logic (Global for Indicator and Modal)
const tooltip = document.createElement('div');
tooltip.className = 'cn-tooltip';
document.body.appendChild(tooltip);

document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[title], [data-tooltip]');
    // Ensure we are interacting with our extension elements (indicator or modal)
    if (!target || (!target.closest('#context-note-indicator') && !target.closest('#context-note-modal'))) return;

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

checkNote();
