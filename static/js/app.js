// Global State
let releaseNotes = [];
let selectedNote = null;
let searchQuery = '';
let relativeTimeInterval = null;
let currentLang = 'en';

// Internationalisation Dictionary
const i18n = {
    en: {
        brandTitle: "AI Hypercomputer",
        brandSubtitle: "Release Notes Portal",
        searchPlaceholder: "Search updates, features, or categories...",
        refreshBtn: "Refresh",
        statusChecking: "Checking feed...",
        statusUpdating: "Updating notes...",
        statusUpdatedJustNow: "Updated just now",
        statusUpdatedAgo: "Updated {time} ago",
        statusCached: "cached",
        statusLive: "live",
        statusFailed: "Failed to load updates",
        sidebarTitle: "Recent Updates",
        noSelectionTitle: "No Update Selected",
        noSelectionText: "Select a release note from the panel to view its full details, documentation, and sharing options.",
        btnShare: "Share on X",
        btnDocs: "View Official Docs",
        btnBack: "Back to List",
        modalTitle: "Draft Post to X (Twitter)",
        modalWarning: "The text will be sent to X Web Intent. You will be able to review and post it there.",
        modalCancel: "Cancel",
        modalSubmit: "Go to X/Twitter",
        modalPlaceholder: "What's happening?",
        translatingContent: "Translating release notes to Russian...",
        tweetTitle: "🚀 Google Cloud AI Hypercomputer Update",
        tweetReadMore: "Read details",
        noUpdatesFound: "No Updates Found",
        noUpdatesMatched: "No release notes matched your filter",
        connectionError: "Connection Error",
        retryBtn: "Retry Connection"
    },
    ru: {
        brandTitle: "AI-гиперкомпьютер",
        brandSubtitle: "Портал примечаний к релизам",
        searchPlaceholder: "Поиск обновлений, функций или категорий...",
        refreshBtn: "Обновить",
        statusChecking: "Проверка ленты...",
        statusUpdating: "Обновление заметок...",
        statusUpdatedJustNow: "Обновлено только что",
        statusUpdatedAgo: "Обновлено {time} назад",
        statusCached: "кэш",
        statusLive: "сеть",
        statusFailed: "Не удалось загрузить обновления",
        sidebarTitle: "Последние обновления",
        noSelectionTitle: "Обновление не выбрано",
        noSelectionText: "Выберите примечание к релизу на панели, чтобы просмотреть его подробности, документацию и параметры публикации.",
        btnShare: "Поделиться в X",
        btnDocs: "Официальные документы",
        btnBack: "Назад к списку",
        modalTitle: "Черновик публикации в X (Twitter)",
        modalWarning: "Текст будет отправлен в веб-интерфейс X. Вы сможете просмотреть и опубликовать его там.",
        modalCancel: "Отмена",
        modalSubmit: "Перейти в X/Twitter",
        modalPlaceholder: "Что нового?",
        translatingContent: "Перевод примечаний к релизу на русский...",
        tweetTitle: "🚀 Обновление Google Cloud AI Hypercomputer",
        tweetReadMore: "Подробнее",
        noUpdatesFound: "Обновления не найдены",
        noUpdatesMatched: "Нет примечаний к релизам, соответствующих вашему фильтру",
        connectionError: "Ошибка подключения",
        retryBtn: "Повторить попытку"
    }
};

// Category dictionary for Russian localization
const categoryTranslations = {
    "feature": "Функция",
    "generally available": "Общая доступность",
    "ga": "Общая доступность",
    "preview": "Предварительная версия",
    "deprecation": "Устарело",
    "change": "Изменение",
    "update": "Обновление",
    "spot vms": "Спотовые ВМ"
};

// DOM Elements
const notesList = document.getElementById('notes-list');
const notesCount = document.getElementById('notes-count');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIconSvg = document.getElementById('refresh-icon-svg');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Detail Pane Elements
const detailPane = document.getElementById('detail-pane');
const appMain = document.querySelector('.app-main');
const detailPlaceholder = document.getElementById('detail-placeholder');
const detailArticle = document.getElementById('detail-article');
const detailDate = document.getElementById('detail-date');
const detailCategories = document.getElementById('detail-categories');
const detailTitle = document.getElementById('detail-title');
const detailBodyHtml = document.getElementById('detail-body-html');
const tweetBtn = document.getElementById('tweet-btn');
const docsBtn = document.getElementById('docs-btn');
const mobileBackBtn = document.getElementById('mobile-back-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charProgress = document.getElementById('char-progress');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalPublishBtn = document.getElementById('modal-publish-btn');

// Language Select Buttons
const langEnBtn = document.getElementById('lang-en-btn');
const langRuBtn = document.getElementById('lang-ru-btn');

// SVG Path Length for Progress Ring (2 * PI * r = 2 * 3.14159 * 9 = 56.54)
const RING_MAX_OFFSET = 56.54;

// Keep track of the active cached status info
let lastUpdatedTimestamp = 0;
let lastIsCached = false;
let lastWarning = null;

/* Initialisation */
window.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
});

function setupEventListeners() {
    // Refresh action
    refreshBtn.addEventListener('click', () => loadNotes(true));

    // Search actions
    searchInput.addEventListener('input', handleSearch);
    searchClearBtn.addEventListener('click', clearSearch);

    // Language switch actions
    langEnBtn.addEventListener('click', () => switchLanguage('en'));
    langRuBtn.addEventListener('click', () => switchLanguage('ru'));

    // Modal actions
    tweetBtn.addEventListener('click', openTweetModal);
    modalCloseBtn.addEventListener('click', closeTweetModal);
    modalCancelBtn.addEventListener('click', closeTweetModal);
    modalPublishBtn.addEventListener('click', publishTweet);
    tweetTextarea.addEventListener('input', updateTweetCounter);
    
    // Close modal on clicking outside the card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Mobile navigation
    mobileBackBtn.addEventListener('click', () => {
        appMain.classList.remove('mobile-active-detail');
    });

    // Handle escape key for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('show')) {
            closeTweetModal();
        }
    });
}

/* Switch Language Handler */
function switchLanguage(lang) {
    if (currentLang === lang) return;
    currentLang = lang;

    // Toggle button active classes
    if (lang === 'en') {
        langEnBtn.classList.add('active');
        langRuBtn.classList.remove('active');
    } else {
        langRuBtn.classList.add('active');
        langEnBtn.classList.remove('active');
    }

    // Update static UI text
    updateLanguageUI();

    // Re-render notes lists with localized values
    renderList();

    // Update details view if an item is selected
    if (selectedNote) {
        selectNote(selectedNote);
    }
}

/* Update Static UI Labels */
function updateLanguageUI() {
    const dict = i18n[currentLang];

    // Header branding
    document.querySelector('.brand-text h1').textContent = dict.brandTitle;
    document.querySelector('.brand-text p').textContent = dict.brandSubtitle;

    // Search input
    searchInput.placeholder = dict.searchPlaceholder;

    // Refresh button
    refreshBtn.querySelector('span').textContent = dict.refreshBtn;

    // Sidebar Title
    document.querySelector('.pane-header h2').textContent = dict.sidebarTitle;

    // Mobile back button
    mobileBackBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        ${dict.btnBack}
    `;

    // Empty Placeholder
    detailPlaceholder.querySelector('h3').textContent = dict.noSelectionTitle;
    detailPlaceholder.querySelector('p').textContent = dict.noSelectionText;

    // Share actions buttons
    tweetBtn.innerHTML = `
        <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        ${dict.btnShare}
    `;
    
    docsBtn.innerHTML = `
        <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        ${dict.btnDocs}
    `;

    // Modal UI
    document.querySelector('.modal-header h3').textContent = dict.modalTitle;
    tweetTextarea.placeholder = dict.modalPlaceholder;
    document.querySelector('.tweet-preview-notice span:not(.notice-bullet)').textContent = dict.modalWarning;
    modalCancelBtn.textContent = dict.modalCancel;
    modalPublishBtn.textContent = dict.modalSubmit;

    // Update relative time strings
    updateStatusDisplay(lastUpdatedTimestamp, lastIsCached, lastWarning);
}

/* Load Notes from API */
async function loadNotes(forceRefresh = false) {
    setLoadingState(true);

    try {
        const url = forceRefresh ? '/api/release-notes?force=true' : '/api/release-notes';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const cacheHit = response.headers.get('X-Cache-Hit') === 'true';

        if (data.status === 'success') {
            releaseNotes = data.notes;
            
            // Save state for translation changes
            lastUpdatedTimestamp = data.updated_at;
            lastIsCached = cacheHit;
            lastWarning = data.warning;

            updateStatusDisplay(data.updated_at, cacheHit, data.warning);
            renderList();

            if (releaseNotes.length > 0) {
                const preselectedId = selectedNote ? selectedNote.id : null;
                const foundNote = releaseNotes.find(n => n.id === preselectedId);
                
                if (foundNote) {
                    selectNote(foundNote);
                } else {
                    selectNote(releaseNotes[0]);
                }
            } else {
                showNoResultsPlaceholder();
            }
        } else {
            showErrorState(data.message || 'Unknown server error parsing release notes.');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showErrorState(`Unable to connect to service: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

/* UI State Helpers */
function setLoadingState(isLoading) {
    const dict = i18n[currentLang];
    if (isLoading) {
        refreshBtn.disabled = true;
        refreshIconSvg.classList.add('spinning');
        statusDot.className = 'status-dot yellow';
        statusText.textContent = dict.statusUpdating;
        
        const shimmers = notesList.querySelector('.shimmer-placeholder');
        if (!shimmers) {
            notesList.innerHTML = `
                <div class="shimmer-placeholder">
                    <div class="shimmer-card">
                        <div class="shimmer-line short"></div>
                        <div class="shimmer-line medium"></div>
                        <div class="shimmer-line long"></div>
                        <div class="shimmer-badge-group">
                            <div class="shimmer-badge"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        refreshBtn.disabled = false;
        refreshIconSvg.classList.remove('spinning');
    }
}

function updateStatusDisplay(updatedTimestamp, isCached, warning) {
    if (relativeTimeInterval) clearInterval(relativeTimeInterval);
    if (!updatedTimestamp) return;

    const dict = i18n[currentLang];
    const updateText = () => {
        const elapsed = Math.round(Date.now() / 1000 - updatedTimestamp);
        let timeStr = dict.statusUpdatedJustNow;
        
        if (elapsed > 5) {
            let label = '';
            if (elapsed < 60) {
                label = `${elapsed}s`;
            } else if (elapsed < 3600) {
                label = `${Math.floor(elapsed / 60)}m`;
            } else {
                label = `${Math.floor(elapsed / 3600)}h`;
            }
            timeStr = dict.statusUpdatedAgo.replace('{time}', label);
        }

        const modeLabel = isCached ? dict.statusCached : dict.statusLive;
        statusText.textContent = warning ? warning : `${timeStr} (${modeLabel})`;
        statusDot.className = warning ? 'status-dot red' : 'status-dot green';
    };

    updateText();
    relativeTimeInterval = setInterval(updateText, 30000);
}

function showErrorState(errorMessage) {
    const dict = i18n[currentLang];
    statusDot.className = 'status-dot red';
    statusText.textContent = dict.statusFailed;
    
    notesList.innerHTML = `
        <div class="detail-placeholder" style="margin: 40px auto; padding: 20px;">
            <div class="placeholder-icon" style="color: #ef4444; opacity: 0.8;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3 style="color: #ef4444;">${dict.connectionError}</h3>
            <p>${errorMessage}</p>
            <button class="btn btn-secondary" onclick="loadNotes(true)" style="margin-top: 15px;">${dict.retryBtn}</button>
        </div>
    `;
    
    detailArticle.classList.add('hidden');
    detailPlaceholder.classList.remove('hidden');
    notesCount.textContent = '0';
}

/* Render Notes List */
function renderList() {
    const filtered = releaseNotes.filter(note => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        
        const titleMatch = note.title.toLowerCase().includes(query);
        const contentMatch = note.content.toLowerCase().includes(query);
        
        // Match English category name or localized category name in search
        const categoryMatch = note.categories.some(cat => {
            const locCat = translateCategory(cat, currentLang);
            return cat.toLowerCase().includes(query) || locCat.toLowerCase().includes(query);
        });
        
        return titleMatch || contentMatch || categoryMatch;
    });

    notesCount.textContent = filtered.length;
    notesList.innerHTML = '';

    if (filtered.length === 0) {
        showNoResultsPlaceholder();
        return;
    }

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = `note-card ${selectedNote && selectedNote.id === note.id ? 'active' : ''}`;
        card.setAttribute('data-id', note.id);
        
        // Extract a clean preview snippet
        const plainText = stripHtml(note.content)
            .replace(/^(Feature|Generally available|Preview|Deprecation|Change|Update):?/i, '')
            .trim();
        const snippet = plainText.length > 90 ? plainText.substring(0, 90) + '...' : plainText;

        // Categories markup
        const categoriesHtml = note.categories.map(cat => {
            const cssClass = getCategoryClass(cat);
            const localizedCatName = translateCategory(cat, currentLang);
            return `<span class="category-badge ${cssClass}">${localizedCatName}</span>`;
        }).join('');

        const localizedDate = formatReleaseDate(note.title, currentLang);

        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">${localizedDate}</span>
                <svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </div>
            <p class="card-preview">${snippet}</p>
            <div class="card-categories">
                ${categoriesHtml}
            </div>
        `;

        card.addEventListener('click', () => {
            selectNote(note);
        });

        notesList.appendChild(card);
    });
}

function showNoResultsPlaceholder() {
    const dict = i18n[currentLang];
    notesList.innerHTML = `
        <div class="detail-placeholder" style="margin: 40px auto; padding: 20px;">
            <h3 style="font-size: 1rem; color: var(--text-secondary);">${dict.noUpdatesFound}</h3>
            <p style="font-size: 0.8rem;">${dict.noUpdatesMatched}: "${searchQuery}"</p>
        </div>
    `;
    
    detailArticle.classList.add('hidden');
    detailPlaceholder.classList.remove('hidden');
}

/* Category styling selector helper */
function getCategoryClass(category) {
    const cat = category.toLowerCase();
    if (cat.includes('feature')) return 'feature';
    if (cat.includes('generally available') || cat.includes('ga')) return 'generally-available';
    if (cat.includes('preview')) return 'preview';
    if (cat.includes('deprecat') || cat.includes('remove') || cat.includes('delete')) return 'deprecation';
    return 'default';
}

/* Date Translator Helper */
function formatReleaseDate(titleStr, lang) {
    if (lang === 'en') return titleStr;
    
    const monthsEn = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthsRu = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    
    const parts = titleStr.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
    if (parts) {
        const monthName = parts[1].toLowerCase();
        const day = parts[2];
        const year = parts[3];
        
        const monthIdx = monthsEn.indexOf(monthName);
        if (monthIdx !== -1) {
            return `${day} ${monthsRu[monthIdx]} ${year} г.`;
        }
    }
    return titleStr;
}

/* Category Translator Helper */
function translateCategory(category, lang) {
    if (lang === 'en') return category;
    const lowerCat = category.toLowerCase();
    return categoryTranslations[lowerCat] || category;
}

/* Select and Display a Release Note */
async function selectNote(note) {
    selectedNote = note;

    // Toggle active class in sidebar DOM cards
    document.querySelectorAll('.note-card').forEach(card => {
        const cardId = card.getAttribute('data-id');
        if (cardId === note.id) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Localize metadata fields
    const localizedDate = formatReleaseDate(note.title, currentLang);
    detailDate.textContent = localizedDate;
    detailTitle.textContent = currentLang === 'en' ? `${note.title} Update` : `Обновление от ${localizedDate}`;
    docsBtn.href = note.link;
    
    // Localize category badges
    detailCategories.innerHTML = note.categories.map(cat => {
        const cssClass = getCategoryClass(cat);
        const localizedCatName = translateCategory(cat, currentLang);
        return `<span class="category-badge ${cssClass}">${localizedCatName}</span>`;
    }).join('');

    // Toggle view elements (display article template structure)
    detailPlaceholder.classList.add('hidden');
    detailArticle.classList.remove('hidden');

    // Load translated HTML body or raw HTML depending on active lang
    if (currentLang === 'en') {
        detailBodyHtml.innerHTML = note.content;
    } else {
        // Load Russian translation
        if (note.translated_content_ru) {
            detailBodyHtml.innerHTML = note.translated_content_ru;
        } else {
            // Render spinner loader
            const dict = i18n[currentLang];
            detailBodyHtml.innerHTML = `
                <div class="translation-loader">
                    <div class="spinner"></div>
                    <span>${dict.translatingContent}</span>
                </div>
            `;
            
            try {
                // Fetch translation from Flask backend
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: note.id,
                        content: note.content,
                        target: 'ru'
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Translation failed');
                }
                
                const data = await response.json();
                if (data.status === 'success') {
                    note.translated_content_ru = data.translated_content;
                    
                    // Double check if the user has not switched to another note in the meantime
                    if (selectedNote && selectedNote.id === note.id) {
                        detailBodyHtml.innerHTML = note.translated_content_ru;
                    }
                } else {
                    throw new Error(data.message);
                }
            } catch (err) {
                console.error("Translation request error:", err);
                // Fallback to English body on error
                if (selectedNote && selectedNote.id === note.id) {
                    detailBodyHtml.innerHTML = note.content;
                }
            }
        }
    }

    // Trigger mobile drawer slide
    if (window.innerWidth <= 900) {
        appMain.classList.add('mobile-active-detail');
    }
}

/* Search Handlers */
function handleSearch(e) {
    searchQuery = e.target.value;
    
    if (searchQuery.trim().length > 0) {
        searchClearBtn.style.display = 'flex';
    } else {
        searchClearBtn.style.display = 'none';
    }
    
    renderList();
}

function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    searchClearBtn.style.display = 'none';
    searchInput.focus();
    renderList();
}

/* Twitter / X Sharing Modal Logic */
function openTweetModal() {
    if (!selectedNote) return;

    const dict = i18n[currentLang];
    const localizedDate = formatReleaseDate(selectedNote.title, currentLang);
    
    // Draft localized Twitter template
    const titleText = `${dict.tweetTitle} (${localizedDate}):\n\n`;
    const footerText = `\n\n${dict.tweetReadMore}: ${selectedNote.link}`;
    const hashtags = `\n\n#GoogleCloud #AI`;
    
    // Determine source text (Cyrillic translation or raw English)
    const contentHtml = currentLang === 'ru' && selectedNote.translated_content_ru 
        ? selectedNote.translated_content_ru 
        : selectedNote.content;

    // Clear HTML tags to construct snippet
    const rawContent = stripHtml(contentHtml)
        .replace(/^(Feature|Generally available|Preview|Deprecation|Change|Update|Функция|Общая доступность|Предварительная версия|Устарело|Изменение|Обновление):?/i, '')
        .replace(/\s+/g, ' ')
        .trim();
        
    // Standard URLs on Twitter are always shortened via t.co taking up 23 characters
    const urlLength = 23;
    const fixedLength = titleText.length + urlLength + footerText.indexOf(':') + 2 + hashtags.length; 
    const maxSnippetLength = 280 - fixedLength - 4; // reserve some buffer space

    let snippetText = rawContent;
    if (snippetText.length > maxSnippetLength) {
        snippetText = snippetText.substring(0, maxSnippetLength).trim() + '...';
    }

    const initialTweet = `${titleText}${snippetText}${footerText}${hashtags}`;
    
    // Set text and show modal
    tweetTextarea.value = initialTweet;
    tweetModal.classList.add('show');
    
    // Focus textarea
    setTimeout(() => tweetTextarea.focus(), 100);
    
    updateTweetCounter();
}

function closeTweetModal() {
    tweetModal.classList.remove('show');
}

function updateTweetCounter() {
    const text = tweetTextarea.value;
    const count = calculateTweetLength(text);
    const remaining = 280 - count;
    
    charCounter.textContent = remaining;
    
    if (remaining < 0) {
        charCounter.className = 'error';
        modalPublishBtn.disabled = true;
    } else if (remaining <= 20) {
        charCounter.className = 'warning';
        modalPublishBtn.disabled = false;
    } else {
        charCounter.className = '';
        modalPublishBtn.disabled = false;
    }

    const ratio = Math.min(count / 280, 1);
    const strokeOffset = RING_MAX_OFFSET - (ratio * RING_MAX_OFFSET);
    charProgress.style.strokeDashoffset = strokeOffset;
    
    if (remaining < 0) {
        charProgress.style.stroke = '#ef4444';
    } else if (remaining <= 20) {
        charProgress.style.stroke = '#f59e0b';
    } else {
        charProgress.style.stroke = 'url(#progress-gradient)';
    }
}

function publishTweet() {
    const text = tweetTextarea.value;
    const count = calculateTweetLength(text);
    
    if (count > 280) {
        return;
    }
    
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
    
    closeTweetModal();
}

/* Tweet character count helper matching Twitter t.co behavior */
function calculateTweetLength(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    let length = text.length;
    
    urls.forEach(url => {
        length = length - url.length + 23;
    });
    
    return length;
}

/* Helper to strip HTML tags from a string */
function stripHtml(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const scripts = tempDiv.getElementsByTagName('script');
    let i = scripts.length;
    while (i--) {
        scripts[i].parentNode.removeChild(scripts[i]);
    }
    const styles = tempDiv.getElementsByTagName('style');
    i = styles.length;
    while (i--) {
        styles[i].parentNode.removeChild(styles[i]);
    }
    
    return tempDiv.textContent || tempDiv.innerText || '';
}
