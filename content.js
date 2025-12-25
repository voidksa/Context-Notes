async function checkNote() {
    const url = window.location.href;
    const domain = window.location.hostname;

    const data = await chrome.storage.local.get([url, domain]);

    // Check if we should show or hide the indicator
    if (data[url] || data[domain]) {
        showIndicator();
    } else {
        removeIndicator();
    }
}

function showIndicator() {
    if (document.getElementById('context-note-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'context-note-indicator';
    indicator.innerHTML = '📝';
    indicator.title = "You have a note for this site";
    indicator.addEventListener('click', () => {
        // Optional: Could send message to open popup, but that's complex. 
        // Just visual reminder for now.
    });
    document.body.appendChild(indicator);
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
        checkNote();
    }
});

checkNote();