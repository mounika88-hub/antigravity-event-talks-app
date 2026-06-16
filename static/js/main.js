// State Management
let releases = [];
let activeFilter = 'all';
let searchQuery = '';
let currentEditingUpdate = null;

// DOM Elements
const btnRefresh = document.getElementById('btn-refresh');
const spinner = document.getElementById('spinner');
const cacheInfoText = document.getElementById('last-fetched-time');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.badge-filter');
const releaseContainer = document.getElementById('release-container');
const statusMessage = document.getElementById('status-message');
const emptyState = document.getElementById('empty-state');
const btnClearSearch = document.getElementById('btn-clear-search');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const tweetCharCount = document.getElementById('tweet-char-count');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelTweet = document.getElementById('btn-cancel-tweet');
const btnPostTweet = document.getElementById('btn-post-tweet');
const previewUpdateType = document.getElementById('preview-update-type');
const previewUpdateDate = document.getElementById('preview-update-date');
const hashtagChips = document.querySelectorAll('.hashtag-chip');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Refresh feed
    btnRefresh.addEventListener('click', () => fetchReleases(true));
    
    // Search input (Debounced search filter)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchQuery = e.target.value.toLowerCase().trim();
        searchTimeout = setTimeout(applyFiltersAndSearch, 200);
    });

    // Clear search button in empty state
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        applyFiltersAndSearch();
    });

    // Category filter badges
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeFilter = button.getAttribute('data-type');
            applyFiltersAndSearch();
        });
    });

    // Close Modal Events
    btnCloseModal.addEventListener('click', hideTweetModal);
    btnCancelTweet.addEventListener('click', hideTweetModal);
    
    // Close modal when clicking outside the card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            hideTweetModal();
        }
    });

    // Character counter for textarea
    tweetTextarea.addEventListener('input', updateCharCount);

    // Hashtag suggestion chips
    hashtagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            appendHashtag(tag);
        });
    });

    // Post to Twitter/X
    btnPostTweet.addEventListener('click', postTweet);
}

// Fetch Release Notes
async function fetchReleases(refresh = false) {
    try {
        setLoadingState(true);
        const url = refresh ? '/api/releases?refresh=true' : '/api/releases';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' || result.status === 'partial_success') {
            releases = result.data || [];
            updateCacheTimeDisplay(result.last_fetched);
            applyFiltersAndSearch();
        } else {
            showErrorState(result.message || 'Unknown server error fetching release notes.');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showErrorState(error.message || 'Network error occurred while fetching release notes.');
    } finally {
        setLoadingState(false);
    }
}

// UI State Toggles
function setLoadingState(isLoading) {
    if (isLoading) {
        spinner.classList.add('spinning');
        btnRefresh.disabled = true;
        statusMessage.classList.remove('hidden');
        releaseContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        spinner.classList.remove('spinning');
        btnRefresh.disabled = false;
        statusMessage.classList.add('hidden');
        releaseContainer.classList.remove('hidden');
    }
}

function updateCacheTimeDisplay(timestamp) {
    if (!timestamp) {
        cacheInfoText.textContent = 'Never';
        return;
    }
    const date = new Date(timestamp * 1000);
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    cacheInfoText.textContent = date.toLocaleTimeString([], options);
}

// Filter and Search Algorithm (Client-Side)
function applyFiltersAndSearch() {
    const filtered = releases.filter(release => {
        // 1. Filter by Update Type
        const typeMatches = activeFilter === 'all' || 
            release.type.toLowerCase() === activeFilter.toLowerCase();
            
        // 2. Filter by Search Query (Date, Type, HTML Content text, or Plain Text)
        const textToSearch = `${release.date} ${release.type} ${release.plain_text}`.toLowerCase();
        const searchMatches = searchQuery === '' || textToSearch.includes(searchQuery);
        
        return typeMatches && searchMatches;
    });

    renderReleases(filtered);
}

// Render release cards in the container
function renderReleases(data) {
    releaseContainer.innerHTML = '';
    
    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');

    data.forEach(item => {
        const card = document.createElement('article');
        card.className = 'release-card';
        card.id = `card-${item.id}`;
        
        // Define badge class name
        const typeClass = item.type.toLowerCase();
        let badgeClass = 'badge-type-general';
        if (['feature', 'change', 'issue', 'deprecation'].includes(typeClass)) {
            badgeClass = `badge-type-${typeClass}`;
        }
        
        card.innerHTML = `
            <div class="release-card-header">
                <div class="release-meta">
                    <span class="badge ${badgeClass}">${item.type}</span>
                    <span class="release-date">${item.date}</span>
                </div>
            </div>
            <div class="release-card-body">
                ${item.content_html}
            </div>
            <div class="release-card-footer">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="card-link" title="Open official release notes">
                    <span>Source Doc</span>
                    <svg class="card-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
                <button class="btn btn-twitter btn-card-tweet" data-id="${item.id}" title="Select and Tweet this update">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Tweet</span>
                </button>
            </div>
        `;
        
        // Add event listener to the Tweet button
        const btnTweet = card.querySelector('.btn-card-tweet');
        btnTweet.addEventListener('click', () => showTweetModal(item));

        releaseContainer.appendChild(card);
    });
}

// Show Error Message
function showErrorState(message) {
    releaseContainer.innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" style="color: var(--color-issue);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h3>Error Loading Releases</h3>
            <p>${message}</p>
            <button onclick="window.location.reload()" class="btn btn-secondary">Retry Page Load</button>
        </div>
    `;
}

// Modal and Tweeting Operations
function showTweetModal(item) {
    currentEditingUpdate = item;
    
    // Set preview badge details
    previewUpdateType.textContent = item.type;
    previewUpdateType.className = `preview-badge badge-type-${item.type.toLowerCase()}`;
    previewUpdateDate.textContent = item.date;
    
    // Prepare initial tweet text with auto-truncation
    const tweetText = generateDefaultTweet(item);
    tweetTextarea.value = tweetText;
    
    // Open modal
    tweetModal.classList.add('active');
    updateCharCount();
    
    // Put cursor at the start of textarea or end
    tweetTextarea.focus();
}

function hideTweetModal() {
    tweetModal.classList.remove('active');
    currentEditingUpdate = null;
}

// Generate default tweet text template respecting Twitter character limit
function generateDefaultTweet(item) {
    // 280 Character limit
    const tagPrefix = `New BigQuery ${item.type} (${item.date}):\n`;
    
    // Prepare link (shortened representation is ~23 chars on Twitter for t.co, but we'll include full URL characters here for simplicity)
    const linkSuffix = `\n\nNotes: ${item.link}\n#BigQuery`;
    
    // Total character count available for text body
    const totalFixedLength = tagPrefix.length + linkSuffix.length;
    const maxBodyLength = 280 - totalFixedLength - 5; // minus padding
    
    let bodyText = item.plain_text;
    
    if (bodyText.length > maxBodyLength) {
        // Truncate at word boundary
        bodyText = bodyText.substring(0, maxBodyLength);
        const lastSpace = bodyText.lastIndexOf(' ');
        if (lastSpace > 0) {
            bodyText = bodyText.substring(0, lastSpace);
        }
        bodyText += '...';
    }
    
    return `${tagPrefix}${bodyText}${linkSuffix}`;
}

// Update Character count display and warning states
function updateCharCount() {
    const currentLength = tweetTextarea.value.length;
    tweetCharCount.textContent = `${currentLength} / 280`;
    
    // Reset classes
    tweetCharCount.className = 'char-count';
    btnPostTweet.disabled = false;
    
    if (currentLength > 280) {
        tweetCharCount.classList.add('error');
        btnPostTweet.disabled = true;
    } else if (currentLength >= 250) {
        tweetCharCount.classList.add('warning');
    }
    
    if (currentLength === 0) {
        btnPostTweet.disabled = true;
    }
}

// Append hashtag suggestion to text area if space permits
function appendHashtag(tag) {
    const text = tweetTextarea.value;
    
    // Avoid double tagging
    if (text.includes(tag)) {
        return;
    }
    
    // Append tag neatly
    const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
    const newText = text + separator + tag;
    
    if (newText.length <= 280) {
        tweetTextarea.value = newText;
        updateCharCount();
    } else {
        // Briefly flash character counter in red to indicate overflow
        tweetCharCount.classList.add('error');
        setTimeout(() => {
            updateCharCount();
        }, 500);
    }
}

// Launch Twitter share intent in new tab
function postTweet() {
    const tweetText = tweetTextarea.value.trim();
    if (!tweetText || tweetText.length > 280) return;
    
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    
    hideTweetModal();
}
