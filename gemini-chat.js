// --- Firebase Configuration ---
// Ganti dengan konfigurasi Firebase project kamu!
const firebaseConfig = {
    apiKey: "AIzaSyDsJE-CEu2JcEbcuZvNRMTPsSgepknoH-A",
    authDomain: "gemini-clone-6784a.firebaseapp.com",
    projectId: "gemini-clone-6784a",
    storageBucket: "gemini-clone-6784a.firebasestorage.app",
    messagingSenderId: "887785035794",
    appId: "1:887785035794:web:acd3409e097bea445320cb",
    measurementId: "G-1Q6LGMHY7P"
  };

  // --- Variabel State ---
// ... (variabel state lainnya) ...
// let currentLoadingMessageElement = null; // <<< GANTI NAMA VARIABEL INI
let currentLoadingBubbleElement = null; // Untuk menyimpan elemen bubble AI yang sedang loading
let currentAbortController = null; // Untuk membatalkan fetch


// Initialize Firebase (Gunakan sintaks v8/compat)
let app, auth, db;
try {
    if (typeof firebase === 'undefined') {
        throw new Error("Firebase SDK (compat version) not loaded. Check script tags in HTML.");
    }

    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    console.log("Firebase Initialized Successfully (v8 Compat)");
} catch (error) {
    console.error("Firebase Initialization Error:", error);
    alert("Gagal menginisialisasi fitur utama. Silakan refresh halaman.");
    auth = null;
    db = null;
}


// --- Konstanta Elemen DOM ---
const menuToggleButton = document.getElementById('menu-toggle-button');
const sidebar = document.getElementById('sidebar');
const sidebarScrim = document.getElementById('sidebar-scrim');
const chatArea = document.getElementById('chat-area');
const chatHistory = document.getElementById('chat-history');
const chatContentWrapper = chatHistory.querySelector('.chat-content-wrapper');
const newChatButton = document.getElementById('new-chat-button');
const inputArea = document.getElementById('input-area');
const promptTextarea = document.getElementById('prompt-textarea');
const micButton = inputArea.querySelector('.mic-button');
const sendButton = inputArea.querySelector('.send-button');
const stopButton = inputArea.querySelector('.stop-button');
const modeSwitcherButton = document.getElementById('mode-switcher-button');
const sidebarModeSwitcherButton = document.getElementById('sidebar-mode-switcher-button');
const modelDropdownMenu = document.getElementById('model-dropdown-menu');
const modelBottomSheet = document.getElementById('model-bottom-sheet');
const bottomSheetScrim = document.getElementById('bottom-sheet-scrim');
const selectedModeText = document.getElementById('selected-mode-text');
const sidebarSelectedModeText = document.getElementById('sidebar-selected-mode-text');
const sidebarNewChatButton = document.getElementById('sidebar-new-chat-button');
const mobileNewChatButtonHeader = document.getElementById('mobile-new-chat-button-header');
const dropdownItemsDesktop = modelDropdownMenu?.querySelectorAll('.dropdown-item[role^="menuitem"]') || [];
const dropdownItemsMobile = modelBottomSheet.querySelectorAll('.dropdown-item[role^="menuitem"]');
const welcomeHeading = document.getElementById('welcome-heading');
const recentChatsList = document.getElementById('recent-chats-list');

// --- Konstanta Elemen Auth ---
const authButtonDesktop = document.getElementById('auth-button-desktop');
const userProfileImgDesktop = document.getElementById('user-profile-img-desktop');
const loginIconDesktop = document.getElementById('login-icon-desktop');
const authButtonMobile = document.getElementById('auth-button-mobile');
const userProfileImgMobile = document.getElementById('user-profile-img-mobile');
const loginIconMobile = document.getElementById('login-icon-mobile');

// --- Konstanta Elemen Auth Popup ---
const authPopupMenu = document.getElementById('auth-popup-menu');
const popupDefaultAvatar = document.getElementById('popup-default-avatar'); // Pastikan ID ini ada di HTML
const popupUserAvatar = document.getElementById('popup-user-avatar');
const popupUserName = document.getElementById('popup-user-name');
const popupUserEmail = document.getElementById('popup-user-email');
const popupSigninButton = document.getElementById('popup-signin-button');
const popupSignoutButton = document.getElementById('popup-signout-button');


// --- Variabel State ---
let isMobile = window.innerWidth <= 960;
let isSidenavOpen = !isMobile;
let isSidenavCollapsed = !isMobile;
let isBottomSheetOpen = false;
let isGenerating = false;
let isChatStarted = !chatContentWrapper.querySelector('.welcome-message-container');
let currentModel = 'gemini-2.0-flash';
let currentChatHistory = [];

// --- Variabel State Auth & Firestore ---
let currentUser = null;
let isLoggedIn = false;
let currentChatId = null;
let unsubscribeChatsListener = null;
let isAuthPopupOpen = false;

// --- Fungsi Auth Popup ---
function updateAuthPopupContent() {
    if (!authPopupMenu) return;

    if (isLoggedIn && currentUser) {
        authPopupMenu.classList.remove('view-logged-out');
        authPopupMenu.classList.add('view-logged-in');
        if (popupUserAvatar) popupUserAvatar.src = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email || 'U')}&background=random&color=fff`;
        if (popupUserName) popupUserName.textContent = currentUser.displayName || 'User';
        if (popupUserEmail) popupUserEmail.textContent = currentUser.email || '';
    } else {
        authPopupMenu.classList.remove('view-logged-in');
        authPopupMenu.classList.add('view-logged-out');
    }
}

function toggleAuthPopup() {
    if (!authPopupMenu) return;

    if (isAuthPopupOpen) {
        authPopupMenu.classList.remove('show');
        isAuthPopupOpen = false;
    } else {
        updateAuthPopupContent();
        authPopupMenu.classList.add('show');
        isAuthPopupOpen = true;
    }
}

// --- Fungsi UI: Sidebar, Bottom Sheet, Dropdown, Resize ---
function closeModelDropdown() {
    if (modelDropdownMenu) {
        modelDropdownMenu.classList.remove('show');
    }
    if (modeSwitcherButton) {
        modeSwitcherButton.classList.remove('open');
        modeSwitcherButton.setAttribute('aria-expanded', 'false');
    }
}

function closeModelBottomSheet() {
    if (!isSidenavOpen && isMobile) {
         document.body.style.overflow = '';
    } else if (!isMobile) {
        document.body.style.overflow = '';
    }
    if (modelBottomSheet) {
        modelBottomSheet.classList.remove('show');
    }
    if (bottomSheetScrim) {
        bottomSheetScrim.classList.remove('visible');
    }
    if (modeSwitcherButton) {
        modeSwitcherButton.setAttribute('aria-expanded', 'false');
    }
    if (sidebarModeSwitcherButton) {
        sidebarModeSwitcherButton.setAttribute('aria-expanded', 'false');
    }
    isBottomSheetOpen = false;
}

function applySidenavState() {
    const shouldBeOpen = isSidenavOpen;
    const shouldBeCollapsed = isSidenavCollapsed;

    if (isMobile) {
        if (sidebar) sidebar.classList.toggle('open', shouldBeOpen);
        if (sidebarScrim) sidebarScrim.classList.toggle('visible', shouldBeOpen);
        if (menuToggleButton) menuToggleButton.setAttribute('aria-expanded', shouldBeOpen.toString());
        if (sidebar) sidebar.classList.remove('collapsed');
        document.body.style.overflow = shouldBeOpen ? 'hidden' : '';
        if (sidebar) sidebar.style.transition = 'transform 0.3s ease';
    } else {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebar) sidebar.classList.toggle('collapsed', shouldBeCollapsed);
        if (sidebarScrim) sidebarScrim.classList.remove('visible');
        if (menuToggleButton) menuToggleButton.setAttribute('aria-expanded', (!shouldBeCollapsed).toString());
        document.body.style.overflow = '';
        if (sidebar) sidebar.style.transition = 'width 0.3s ease';
    }
     closeModelDropdown();
     closeModelBottomSheet();
}

function openModelBottomSheet() {
    if (!isMobile || !modelBottomSheet || !bottomSheetScrim || !modeSwitcherButton) return;
    modelBottomSheet.classList.add('show');
    bottomSheetScrim.classList.add('visible');
    modeSwitcherButton.setAttribute('aria-expanded', 'true');
    if (sidebarModeSwitcherButton) sidebarModeSwitcherButton.setAttribute('aria-expanded', 'true');
    isBottomSheetOpen = true;
    document.body.style.overflow = 'hidden';
}

 function openModelDropdown() {
     if (isMobile || !modelDropdownMenu || !modeSwitcherButton) return;
     modelDropdownMenu.classList.add('show');
     modeSwitcherButton.classList.add('open');
     modeSwitcherButton.setAttribute('aria-expanded', 'true');
 }

function handleResize() {
    const nowMobile = window.innerWidth <= 960;
    if (nowMobile !== isMobile) {
        isMobile = nowMobile;
        if (isMobile) {
            isSidenavOpen = false;
            isSidenavCollapsed = false;
            if (sidebar) sidebar.style.transition = 'transform 0.3s ease';
            closeModelDropdown();
        } else {
            isSidenavOpen = true;
            isSidenavCollapsed = true;
            if (sidebar) sidebar.style.transition = 'width 0.3s ease';
            closeModelBottomSheet();
        }
        applySidenavState();
    }
     closeModelDropdown();
     closeModelBottomSheet();
}

// --- Fungsi UI: Pesan & Welcome Message ---
function removeWelcomeMessage() {
    const welcomeContainer = chatContentWrapper?.querySelector('.welcome-message-container');
    if (welcomeContainer) {
        welcomeContainer.remove();
        isChatStarted = true;
    }
}

function addWelcomeMessage() {
    if (!chatContentWrapper) return;
    if (!chatContentWrapper.querySelector('.message-container') && !chatContentWrapper.querySelector('.welcome-message-container')) {
        const welcomeContainer = document.createElement('div');
        welcomeContainer.classList.add('welcome-message-container');
        const heading = document.createElement('h1');
        heading.id = 'welcome-heading';
        heading.textContent = isLoggedIn ? `Hello, ${currentUser?.displayName || 'User'}` : 'Hello, Guest';
        welcomeContainer.appendChild(heading);
        chatContentWrapper.insertBefore(welcomeContainer, chatContentWrapper.firstChild);
        isChatStarted = false;
    } else {
        const existingHeading = document.getElementById('welcome-heading');
        if (existingHeading) {
            existingHeading.textContent = isLoggedIn ? `Halo, ${currentUser?.displayName || 'User'}` : 'Hello, Guest';
        }
    }
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// --- MODIFIED addMessage Function ---
function addMessage(content, sender, options = {}) {
    if (!chatContentWrapper || !chatHistory) return;

    if (!isChatStarted && sender === 'user') {
        removeWelcomeMessage();
    }

    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', sender === 'user' ? 'user-query' : 'model-response');

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');

    if (sender === 'ai') {
        // 1. Avatar Area (akan diisi animasi atau ikon statis)
        const avatarArea = document.createElement('div'); // Gunakan div terpisah untuk avatar/animasi
        avatarArea.classList.add('message-avatar'); // Gunakan class avatar yang sudah ada
        // avatarArea.style.marginTop = '3px'; // Sesuaikan margin jika perlu

        // 2. Wrapper Konten (teks pesan dan actions)
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content-wrapper');

        if (options.isLoading) {
            // --- Add Loading Indicator KE DALAM avatarArea ---
            const uniqueGradientId = `ai-loading-gradient-${Date.now()}`;
            avatarArea.innerHTML = `
                <div class="ai-loading-animation-container" style="width: 100%; height: 100%;">
                    <div class="ai-loading-loader"></div>
                    <svg class="ai-loading-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <linearGradient id="${uniqueGradientId}" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-9.223" y1="8.49" x2="10.462" y2="-8.212">
                                <stop offset="0%" stop-color="rgb(33,123,254)"></stop>
                                <stop offset="14%" stop-color="rgb(20,133,252)"></stop>
                                <stop offset="27%" stop-color="rgb(7,142,251)"></stop>
                                <stop offset="52%" stop-color="rgb(84,143,253)"></stop>
                                <stop offset="78%" stop-color="rgb(161,144,255)"></stop>
                                <stop offset="89%" stop-color="rgb(175,148,254)"></stop>
                                <stop offset="100%" stop-color="rgb(189,153,254)"></stop>
                            </linearGradient>
                        </defs>
                        <g transform="matrix(-1,0,0,-1,16,16)">
                            <path fill="url(#${uniqueGradientId})" d=" M0.027,14 C0.48,6.49 6.49,0.48 14,0.027 C14,0.027 14,-0.027 14,-0.027 C6.49,-0.48 0.48,-6.49 0.027,-14 C0.027,-14 -0.027,-14 -0.027,-14 C-0.48,-6.49 -6.49,-0.48 -14,-0.027 C-14,-0.027 -14,0.027 -14,0.027 C-6.49,0.48 -0.48,6.49 -0.027,14 C-0.027,14 0.027,14 0.027,14z"></path>
                        </g>
                    </svg>
                </div>
            `;
            bubble.appendChild(avatarArea); // Tambahkan area avatar (dengan animasi) ke bubble

            // Tambahkan teks "Just a sec..." ke contentWrapper
            const loadingText = document.createElement('span');
            loadingText.classList.add('ai-loading-text');
            loadingText.textContent = 'Just a sec...';
            loadingText.style.padding = '10px 0'; // Beri padding agar sejajar
            contentWrapper.appendChild(loadingText);

            bubble.appendChild(contentWrapper); // Tambahkan contentWrapper ke bubble

            // Simpan elemen BUBBLE untuk diupdate nanti
            currentLoadingBubbleElement = bubble; // SIMPAN BUBBLE
            // --- End Loading Indicator ---

        } else {
             // --- Add Final AI Message Content (Avatar + Text + Actions) ---
             // Ini digunakan saat memuat dari history atau sebagai fallback
            const aiAvatarSvgString = `&lt;div _ngcontent-ng-c2611952735="" class="avatar avatar_primary ng-tns-c2611952735-19 ng-star-inserted" style=""&gt;&lt;div _ngcontent-ng-c2611952735="" class="avatar_primary_model ng-tns-c2611952735-19 is-gpi-avatar"&gt;&lt;div _ngcontent-ng-c2611952735="" lottie-animation="" class="avatar_primary_animation is-gpi-avatar ng-tns-c2611952735-19 ng-star-inserted" data-test-lottie-animation-status="completed"&gt;&lt;svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px); content-visibility: visible;"&gt;&lt;defs&gt;&lt;clipPath id="__lottie_element_48_${Date.now()}"&gt;&lt;rect width="32" height="32" x="0" y="0"&gt;&lt;/rect&gt;&lt;/clipPath&gt;&lt;g id="__lottie_element_55_${Date.now()}"&gt;&lt;g transform="matrix(0.9999992251396179,-0.001229780144058168,0.001229780144058168,0.9999992251396179,16,16)" opacity="1" style="display: block;"&gt;&lt;g opacity="1" transform="matrix(1,0,0,1,0,0)"&gt;&lt;path fill="url(#__lottie_element_58_${Date.now()})" fill-opacity="1" d=" M0.027000000700354576,14 C0.47999998927116394,6.489999771118164 6.489999771118164,0.47999998927116394 14,0.027000000700354576 C14,0.027000000700354576 14,-0.027000000700354576 14,-0.027000000700354576 C6.489999771118164,-0.47999998927116394 0.47999998927116394,-6.489999771118164 0.027000000700354576,-14 C0.027000000700354576,-14 -0.027000000700354576,-14 -0.027000000700354576,-14 C-0.47999998927116394,-6.489999771118164 -6.489999771118164,-0.47999998927116394 -14,-0.027000000700354576 C-14,-0.027000000700354576 -14,0.027000000700354576 -14,0.027000000700354576 C-6.489999771118164,0.47999998927116394 -0.47999998927116394,6.489999771118164 -0.027000000700354576,14 C-0.027000000700354576,14 0.027000000700354576,14 0.027000000700354576,14z"&gt;&lt;/path&gt;&lt;/g&gt;&lt;/g&gt;&lt;/g&gt;&lt;linearGradient id="__lottie_element_58_${Date.now()}" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-9.222999572753906" y1="8.489999771118164" x2="10.461999893188477" y2="-8.211999893188477"&gt;&lt;stop offset="0%" stop-color="rgb(33,123,254)"&gt;&lt;/stop&gt;&lt;stop offset="14%" stop-color="rgb(20,133,252)"&gt;&lt;/stop&gt;&lt;stop offset="27%" stop-color="rgb(7,142,251)"&gt;&lt;/stop&gt;&lt;stop offset="52%" stop-color="rgb(84,143,253)"&gt;&lt;/stop&gt;&lt;stop offset="78%" stop-color="rgb(161,144,255)"&gt;&lt;/stop&gt;&lt;stop offset="89%" stop-color="rgb(175,148,254)"&gt;&lt;/stop&gt;&lt;stop offset="100%" stop-color="rgb(189,153,254)"&gt;&lt;/stop&gt;&lt;/linearGradient&gt;&lt;linearGradient id="__lottie_element_62_${Date.now()}" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-4.002999782562256" y1="4.630000114440918" x2="8.092000007629395" y2="-7.886000156402588"&gt;&lt;stop offset="0%" stop-color="rgb(33,123,254)"&gt;&lt;/stop&gt;&lt;stop offset="14%" stop-color="rgb(20,133,252)"&gt;&lt;/stop&gt;&lt;stop offset="27%" stop-color="rgb(7,142,251)"&gt;&lt;/stop&gt;&lt;stop offset="52%" stop-color="rgb(84,143,253)"&gt;&lt;/stop&gt;&lt;stop offset="78%" stop-color="rgb(161,144,255)"&gt;&lt;/stop&gt;&lt;stop offset="89%" stop-color="rgb(175,148,254)"&gt;&lt;/stop&gt;&lt;stop offset="100%" stop-color="rgb(189,153,254)"&gt;&lt;/stop&gt;&lt;/linearGradient&gt;&lt;mask id="__lottie_element_55_1_${Date.now()}" mask-type="alpha"&gt;&lt;use xlink:href="#__lottie_element_55_${Date.now()}"&gt;&lt;/use&gt;&lt;/mask&gt;&lt;/defs&gt;&lt;g clip-path="url(#__lottie_element_48_${Date.now()})"&gt;&lt;g mask="url(#__lottie_element_55_1_${Date.now()})" style="display: block;"&gt;&lt;g transform="matrix(1,0,0,1,16,16)" opacity="1"&gt;&lt;g opacity="1" transform="matrix(1,0,0,1,0,0)"&gt;&lt;path fill="url(#__lottie_element_62_${Date.now()})" fill-opacity="1" d=" M0,-16 C8.830400466918945,-16 16,-8.830400466918945 16,0 C16,8.830400466918945 8.830400466918945,16 0,16 C-8.830400466918945,16 -16,8.830400466918945 -16,0 C-16,-8.830400466918945 -8.830400466918945,-16 0,-16z"&gt;&lt;/path&gt;&lt;/g&gt;&lt;/g&gt;&lt;/g&gt;&lt;/g&gt;&lt;/svg&gt;&lt;/div&gt;&lt;!----&gt;&lt;!----&gt;&lt;!----&gt;&lt;!----&gt;&lt;/div&gt;&lt;/div&gt;`;
            avatarArea.innerHTML = decodeHtmlEntities(aiAvatarSvgString);
            bubble.appendChild(avatarArea); // Tambahkan area avatar (dengan ikon statis) ke bubble

            const textDiv = document.createElement('div');
            textDiv.classList.add('message-text');
            if (options.isError) {
                textDiv.style.color = 'red';
                textDiv.style.fontStyle = 'italic';
                textDiv.textContent = content; // content adalah teks error
            } else {
                // Terapkan Markdown dan DOMPurify
                if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                    try {
                        const rawHtml = marked.parse(content); // content adalah teks respons AI
                        const cleanHtml = DOMPurify.sanitize(rawHtml);
                        textDiv.innerHTML = cleanHtml;
                    } catch (parseError) {
                        console.error("Markdown parsing/sanitizing error:", parseError);
                        textDiv.textContent = content;
                        textDiv.style.fontStyle = 'italic';
                        textDiv.title = "Could not render Markdown.";
                    }
                } else {
                    console.warn("marked.js or DOMPurify.js not loaded. Displaying raw text.");
                    textDiv.textContent = content;
                }
            }
            contentWrapper.appendChild(textDiv);

            // Tambahkan actions hanya jika bukan error
            if (!options.isError) {
                const actions = document.createElement('div');
                actions.classList.add('message-actions');
                actions.innerHTML = `<button class="icon-button" aria-label="Like response"><span class="material-symbols-outlined">thumb_up</span></button><button class="icon-button" aria-label="Dislike response"><span class="material-symbols-outlined">thumb_down</span></button><button class="icon-button" aria-label="Share & export"><span class="material-symbols-outlined">share</span></button><button class="icon-button" aria-label="More options"><span class="material-symbols-outlined">more_vert</span></button>`;
                contentWrapper.appendChild(actions);
            }

            bubble.appendChild(contentWrapper); // Tambahkan contentWrapper ke bubble
        }

        // 3. Tombol Titik Tiga (Khusus Mobile) - Tambahkan di luar contentWrapper
        const moreButtonMobile = document.createElement('button');
        moreButtonMobile.classList.add('icon-button', 'message-action-more-mobile');
        moreButtonMobile.setAttribute('aria-label', 'More options');
        moreButtonMobile.innerHTML = `<span class="material-symbols-outlined">more_vert</span>`;
        bubble.appendChild(moreButtonMobile); // Tambahkan tombol more mobile ke bubble

        messageContainer.appendChild(bubble); // Tambahkan bubble ke container

    } else {
        // --- Struktur untuk User Query (Tetap Sama) ---
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content-wrapper');
        const textDiv = document.createElement('div');
        textDiv.classList.add('message-text');
        textDiv.textContent = content; // content adalah teks user
        contentWrapper.appendChild(textDiv);
        bubble.appendChild(contentWrapper);
        messageContainer.appendChild(bubble);
    }

    chatContentWrapper.appendChild(messageContainer);
    setTimeout(() => {
        if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 50);
}

// --- MODIFIED Function untuk Mengupdate Pesan Loading ---
function updateLoadingMessage(newContent, isError = false) {
    const bubbleElement = currentLoadingBubbleElement; // Gunakan variabel yang menyimpan bubble

    if (!bubbleElement) {
        console.warn("Attempted to update loading message, but no bubble element found.");
        // Jika tidak ada elemen loading, tambahkan saja sebagai pesan baru (fallback)
        addMessage(newContent, 'ai', { isError: isError });
        return;
    }

    // 1. Hapus indikator loading (animasi dan teks "Just a sec...")
    const loadingIndicator = bubbleElement.querySelector('.ai-loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
    const loadingText = bubbleElement.querySelector('.ai-loading-text');
     if (loadingText) {
         loadingText.remove();
     }


    // 2. Cari atau buat content wrapper
    let contentWrapper = bubbleElement.querySelector('.message-content-wrapper');
    if (!contentWrapper) {
        console.warn("Could not find content wrapper in loading bubble. Creating a new one.");
        contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content-wrapper');
        // Temukan elemen setelah avatar area (jika ada) atau tambahkan di akhir bubble
        const avatarArea = bubbleElement.querySelector('.message-avatar');
        if (avatarArea && avatarArea.nextElementSibling) {
             bubbleElement.insertBefore(contentWrapper, avatarArea.nextElementSibling);
        } else {
             bubbleElement.appendChild(contentWrapper);
        }
    } else {
         contentWrapper.innerHTML = ''; // Bersihkan isinya ("Just a sec...")
    }


    // 3. Buat dan tambahkan avatar AI statis di awal bubble (jika belum ada)
    let avatarArea = bubbleElement.querySelector('.message-avatar');
    if (!avatarArea) {
        console.warn("Could not find avatar area in loading bubble. Creating a new one.");
        avatarArea = document.createElement('div');
        avatarArea.classList.add('message-avatar');
        bubbleElement.insertBefore(avatarArea, bubbleElement.firstChild); // Tambahkan di awal bubble
    }

    // Isi avatar area dengan SVG statis
    const aiAvatarSvgString = `&lt;div _ngcontent-ng-c2611952735="" class="avatar avatar_primary ng-tns-c2611952735-19 ng-star-inserted" style=""&gt;&lt;div _ngcontent-ng-c2611952735="" class="avatar_primary_model ng-tns-c2611952735-19 is-gpi-avatar"&gt;&lt;div _ngcontent-ng-c2611952735="" lottie-animation="" class="avatar_primary_animation is-gpi-avatar ng-tns-c2611952735-19 ng-star-inserted" data-test-lottie-animation-status="completed"&gt;&lt;svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px); content-visibility: visible;"&gt;&lt;defs&gt;&lt;clipPath id="__lottie_element_48_${Date.now()}"&gt;&lt;rect width="32" height="32" x="0" y="0"&gt;&lt;/rect&gt;&lt;/clipPath&gt;&lt;g id="__lottie_element_55_${Date.now()}"&gt;&lt;g transform="matrix(0.9999992251396179,-0.001229780144058168,0.001229780144058168,0.9999992251396179,16,16)" opacity="1" style="display: block;"&gt;&lt;g opacity="1" transform="matrix(1,0,0,1,0,0)"&gt;&lt;path fill="url(#__lottie_element_58_${Date.now()})" fill-opacity="1" d=" M0.027000000700354576,14 C0.47999998927116394,6.489999771118164 6.489999771118164,0.47999998927116394 14,0.027000000700354576 C14,0.027000000700354576 14,-0.027000000700354576 14,-0.027000000700354576 C6.489999771118164,-0.47999998927116394 0.47999998927116394,-6.489999771118164 0.027000000700354576,-14 C0.027000000700354576,-14 -0.027000000700354576,-14 -0.027000000700354576,-14 C-0.47999998927116394,-6.489999771118164 -6.489999771118164,-0.47999998927116394 -14,-0.027000000700354576 C-14,-0.027000000700354576 -14,0.027000000700354576 -14,0.027000000700354576 C-6.489999771118164,0.47999998927116394 -0.48999998927116394,6.489999771118164 -0.027000000700354576,14 C-0.027000000700354576,14 0.027000000700354576,14 0.027000000700354576,14z"&gt;&lt;/path&gt;&lt;/g&gt;&lt;/g&gt;&lt;/g&gt;&lt;linearGradient id="__lottie_element_58_${Date.now()}" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-9.222999572753906" y1="8.489999771118164" x2="10.461999893188477" y2="-8.211999893188477"&gt;&lt;stop offset="0%" stop-color="rgb(33,123,254)"&gt;&lt;/stop&gt;&lt;stop offset="14%" stop-color="rgb(20,133,252)"&gt;&lt;/stop&gt;&lt;stop offset="27%" stop-color="rgb(7,142,251)"&gt;&lt;/stop&gt;&lt;stop offset="52%" stop-color="rgb(84,143,253)"&gt;&lt;/stop&gt;&lt;stop offset="78%" stop-color="rgb(161,144,255)"&gt;&lt;/stop&gt;&lt;stop offset="89%" stop-color="rgb(175,148,254)"&gt;&lt;/stop&gt;&lt;stop offset="100%" stop-color="rgb(189,153,254)"&gt;&lt;/stop&gt;&lt;/linearGradient&gt;&lt;linearGradient id="__lottie_element_62_${Date.now()}" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-4.002999782562256" y1="4.630000114440918" x2="8.092000007629395" y2="-7.886000156402588"&gt;&lt;stop offset="0%" stop-color="rgb(33,123,254)"&gt;&lt;/stop&gt;&lt;stop offset="14%" stop-color="rgb(20,133,252)"&gt;&lt;/stop&gt;&lt;stop offset="27%" stop-color="rgb(7,142,251)"&gt;&lt;/stop&gt;&lt;stop offset="52%" stop-color="rgb(84,143,253)"&gt;&lt;/stop&gt;&lt;stop offset="78%" stop-color="rgb(161,144,255)"&gt;&lt;/stop&gt;&lt;stop offset="89%" stop-color="rgb(175,148,254)"&gt;&lt;/stop&gt;&lt;stop offset="100%" stop-color="rgb(189,153,254)"&gt;&lt;/stop&gt;&lt;/linearGradient&gt;&lt;mask id="__lottie_element_55_1_${Date.now()}" mask-type="alpha"&gt;&lt;use xlink:href="#__lottie_element_55_${Date.now()}"&gt;&lt;/use&gt;&lt;/mask&gt;&lt;/defs&gt;&lt;g clip-path="url(#__lottie_element_48_${Date.now()})"&gt;&lt;g mask="url(#__lottie_element_55_1_${Date.now()})" style="display: block;"&gt;&lt;g transform="matrix(1,0,0,1,16,16)" opacity="1"&gt;&lt;g opacity="1" transform="matrix(1,0,0,1,0,0)"&gt;&lt;path fill="url(#__lottie_element_62_${Date.now()})" fill-opacity="1" d=" M0,-16 C8.830400466918945,-16 16,-8.830400466918945 16,0 C16,8.830400466918945 8.830400466918945,16 0,16 C-8.830400466918945,16 -16,8.830400466918945 -16,0 C-16,-8.830400466918945 -8.830400466918945,-16 0,-16z"&gt;&lt;/path&gt;&lt;/g&gt;&lt;/g&gt;&lt;/g&gt;&lt;/g&gt;&lt;/svg&gt;&lt;/div&gt;&lt;!----&gt;&lt;!----&gt;&lt;!----&gt;&lt;!----&gt;&lt;/div&gt;&lt;/div&gt;`;
    avatarArea.innerHTML = decodeHtmlEntities(aiAvatarSvgString);


    // 4. Tambahkan teks pesan final ke contentWrapper
    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    if (isError) {
        textDiv.style.color = 'red';
        textDiv.style.fontStyle = 'italic';
        textDiv.textContent = newContent;
    } else {
        // Terapkan Markdown
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            try {
                const rawHtml = marked.parse(newContent);
                const cleanHtml = DOMPurify.sanitize(rawHtml);
                textDiv.innerHTML = cleanHtml;
            } catch (parseError) {
                console.error("Markdown parsing/sanitizing error:", parseError);
                textDiv.textContent = newContent;
                textDiv.style.fontStyle = 'italic';
                textDiv.title = "Could not render Markdown.";
            }
        } else {
            console.warn("marked.js or DOMPurify.js not loaded. Displaying raw text.");
            textDiv.textContent = newContent;
        }
    }
    contentWrapper.appendChild(textDiv);

    // 5. Tambahkan actions ke contentWrapper (jika bukan error)
    if (!isError) {
        const actions = document.createElement('div');
        actions.classList.add('message-actions');
        actions.innerHTML = `
            <button class="icon-button" aria-label="Like response"><span class="material-symbols-outlined">thumb_up</span></button>
            <button class="icon-button" aria-label="Dislike response"><span class="material-symbols-outlined">thumb_down</span></button>
            <button class="icon-button" aria-label="Share & export"><span class="material-symbols-outlined">share</span></button>
            <button class="icon-button" aria-label="More options"><span class="material-symbols-outlined">more_vert</span></button>
        `;
        contentWrapper.appendChild(actions);
    }

    // 6. Tambahkan kembali tombol more mobile jika perlu (opsional, tergantung struktur akhir)
    // Tombol ini sudah ada di bubble, tidak perlu ditambahkan lagi di sini
    // Pastikan struktur HTML di addMessage sudah benar menempatkannya di bubble, bukan contentWrapper

    // Scroll ke bawah lagi
    setTimeout(() => {
        if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 50);

    // Hapus referensi elemen loading
    currentLoadingBubbleElement = null; // RESET VARIABEL
}



// --- Fungsi Inti API (Memanggil Vercel Function) ---
async function callGeminiAPI(prompt, history, signal) { // <<< PASTIKAN ADA 'signal' DI SINI
    const endpoint = '/api/chat';
    const payload = {
        prompt: prompt,
        history: history,
        model: currentModel
    };
    console.log("Sending to Vercel Function:", endpoint, payload);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: signal // <<< PASTIKAN 'signal' DITERUSKAN KE FETCH
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("Serverless Function Error:", data);
            throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
        }
        console.log("Vercel Function Success Response:", data);
        if (typeof data.text === 'string') {
            return data.text;
        } else {
             console.error("Unexpected success response format from server:", data);
             throw new Error("Received unexpected success response from server.");
        }
    } catch (error) {
         if (error.name === 'AbortError') { // <<< Tangani AbortError
            console.log('Fetch aborted in callGeminiAPI');
            throw error; // Lempar ulang error spesifik
        }
        console.error('Failed to call Vercel Function:', error);
        throw error; // Lempar ulang error lainnya
    }
}


// --- Fungsi Reset Chat ---
function resetChat() {
    console.log("Starting new chat...");

    // Cek dan batalkan generasi jika sedang berjalan
    if (isGenerating) {
        console.log("Resetting chat while generation is in progress. Aborting...");
        if (currentAbortController) {
            currentAbortController.abort(); // Batalkan fetch yang sedang berjalan
        }
        // Hapus elemen loading jika masih ada
        if (currentLoadingBubbleElement) { // <<< GUNAKAN VARIABEL BARU
            const bubbleContainer = currentLoadingBubbleElement.closest('.message-container'); // <<< Cari container dari bubble
            if (bubbleContainer) {
                bubbleContainer.remove();
            }
            currentLoadingBubbleElement = null; // <<< RESET VARIABEL BARU
        }
        // Reset state generating secara paksa
        isGenerating = false;
        currentAbortController = null;
    }

    // Lanjutkan reset seperti biasa
    if (chatContentWrapper) chatContentWrapper.innerHTML = '';
    if (promptTextarea) {
        promptTextarea.value = '';
        // Pastikan textarea di-enable jika user login
        promptTextarea.disabled = !isLoggedIn;
        promptTextarea.dispatchEvent(new Event('input')); // Update tombol mic/send
    }
    currentChatHistory = [];
    currentChatId = null;

    document.querySelectorAll('#recent-chats-list li.active-item').forEach(li => li.classList.remove('active-item'));

    // Reset UI tombol stop/send/mic (dilakukan juga oleh event input textarea)
    if (inputArea) inputArea.classList.remove('is-sending');
    if (stopButton) {
        stopButton.style.display = 'none';
        stopButton.disabled = true;
    }
    if (promptTextarea) promptTextarea.dispatchEvent(new Event('input')); // Pastikan tombol benar

    if (isMobile && isSidenavOpen) {
        isSidenavOpen = false;
        applySidenavState();
    }
    isChatStarted = false;
    addWelcomeMessage(); // Tampilkan kembali welcome message
    console.log("Chat reset complete.");
    if (isLoggedIn && promptTextarea) promptTextarea.focus(); // Fokus ke input jika login
}



// --- Fungsi Autentikasi ---
function signInWithGoogle() {
    if (!auth) {
        console.error("Firebase Auth not initialized.");
        alert("Fitur login belum siap. Silakan coba lagi nanti.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login Google berhasil:", result.user?.uid);
        })
        .catch((error) => {
            console.error("Error login Google:", error);
            let message = "Login gagal. Silakan coba lagi.";
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                message = "Login dibatalkan atau jendela ditutup.";
            }
            alert(message);
        });
}

function signOutUser() {
    if (!auth) {
        console.error("Firebase Auth not initialized.");
        return;
    }
    auth.signOut()
        .then(() => {
            console.log("Logout berhasil");
        })
        .catch((error) => {
            console.error("Error logout:", error);
            alert(`Logout gagal: ${error.message}`);
        });
}

// --- Fungsi Firestore ---
function loadRecentChats(userId) {
    if (!db || !userId || !recentChatsList) return;
    console.log(`Loading recent chats for user ${userId}`);
    recentChatsList.innerHTML = '<li>Loading history...</li>';

    if (unsubscribeChatsListener) {
        unsubscribeChatsListener();
        console.log("Previous Firestore listener stopped.");
    }

    const chatsQuery = db.collection('chats')
                         .where('userId', '==', userId)
                         .orderBy('lastUpdatedAt', 'desc')
                         .limit(20);

    unsubscribeChatsListener = chatsQuery.onSnapshot(snapshot => {
        recentChatsList.innerHTML = '';
        if (snapshot.empty) {
          recentChatsList.innerHTML = '<li>No recent chats</li>';
          return;
        }
        snapshot.forEach(doc => {
          const chatData = doc.data();
          const chatId = doc.id;
          const listItem = createChatListItem(chatId, chatData.title);
          recentChatsList.appendChild(listItem);
        });
        if (currentChatId) {
            highlightSidebarItem(currentChatId);
        }
    }, error => {
        console.error("Error getting recent chats:", error);
        recentChatsList.innerHTML = '<li>Error loading history</li>';
        if (error.code === 'permission-denied') {
             recentChatsList.innerHTML = '<li>Error: Insufficient permissions to load history. Check Firestore rules.</li>';
        }
    });
}

async function loadChatDetails(chatId) {
    if (!db || !chatId || !chatContentWrapper) return;
    console.log(`Loading chat details for ${chatId}`);
    chatContentWrapper.innerHTML = '<div class="loading-spinner">Loading messages...</div>';
    currentChatHistory = [];
    currentChatId = chatId;

    try {
        const chatDocRef = db.collection('chats').doc(chatId);
        const docSnap = await chatDocRef.get();

        if (docSnap.exists) {
          const chatData = docSnap.data();
          chatContentWrapper.innerHTML = '';

          if (chatData.messages && Array.isArray(chatData.messages)) {
            chatData.messages.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));

            chatData.messages.forEach(message => {
              addMessage(message.text, message.role); // Memuat dari history, tidak isLoading
            });
            currentChatHistory = chatData.messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));
            isChatStarted = true;
          } else {
            addWelcomeMessage();
            currentChatHistory = [];
          }
          setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; }, 50);
        } else {
          console.log("No such chat document!");
          chatContentWrapper.innerHTML = '<div>Chat not found. Maybe it was deleted?</div>';
          currentChatId = null;
          currentChatHistory = [];
        }
      } catch (error) {
        console.error("Error getting chat details:", error);
        chatContentWrapper.innerHTML = '<div>Error loading chat.</div>';
        currentChatId = null;
        currentChatHistory = [];
      }
}

async function saveMessagesToFirestore(userMsgDb, aiMsgDb) {
    if (!db || !currentUser) {
        console.error("Firestore DB or Current User not available for saving.");
        return;
    }
    const userUid = currentUser.uid;

    const serverTime = firebase.firestore.FieldValue.serverTimestamp();
    const clientTime = new Date();
    const arrayUnion = firebase.firestore.FieldValue.arrayUnion;

    const userMessageForDbWithTimestamp = { ...userMsgDb, timestamp: clientTime };
    const aiMessageForDbWithTimestamp = { ...aiMsgDb, timestamp: clientTime };

    try {
        if (currentChatId) {
            console.log(`Updating chat ${currentChatId}`);
            const chatDocRef = db.collection('chats').doc(currentChatId);
            await chatDocRef.update({
                messages: arrayUnion(userMessageForDbWithTimestamp, aiMessageForDbWithTimestamp),
                lastUpdatedAt: serverTime
            });
            console.log("Messages added to existing chat.");
        } else {
            console.log("Creating new chat");
            const newChatData = {
                userId: userUid,
                title: userMsgDb.text.substring(0, 30) + (userMsgDb.text.length > 30 ? '...' : ''),
                createdAt: serverTime,
                lastUpdatedAt: serverTime,
                messages: [userMessageForDbWithTimestamp, aiMessageForDbWithTimestamp]
            };
            const docRef = await db.collection('chats').add(newChatData);
            currentChatId = docRef.id;
            console.log("New chat created with ID:", currentChatId);
            highlightSidebarItem(currentChatId);
        }
    } catch (error) {
        console.error("Error saving messages to Firestore:", error);
        alert("Gagal menyimpan pesan. Silakan coba lagi.");
        if (!currentChatId && error) {
             currentChatId = null;
        }
    }
}

async function deleteChatFirestore(chatId) {
    if (!db || !chatId) return;
    console.log("Deleting chat:", chatId);
    try {
        await db.collection('chats').doc(chatId).delete();
        console.log("Chat successfully deleted from Firestore!");
        if (currentChatId === chatId) {
            resetChat();
        }
    } catch (error) {
        console.error("Error deleting chat:", error);
        alert("Gagal menghapus chat.");
    }
}


// Helper createChatListItem
function createChatListItem(chatId, title) {
    const listItem = document.createElement('li');
    listItem.classList.add('conversation-item-container');
    listItem.dataset.chatId = chatId;
    listItem.innerHTML = `
        <div class="conversation-content">
          <span class="material-symbols-outlined conversation-icon">notes</span>
          <span class="conversation-title">${title || 'Untitled Chat'}</span>
        </div>
        <div class="conversation-actions">
          <button class="icon-button delete-chat-button" aria-label="Delete chat" data-chat-id="${chatId}">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
    `;
    listItem.addEventListener('click', (event) => {
        if (event.target.closest('.delete-chat-button')) return;
        if (listItem.classList.contains('active-item')) return;
        highlightSidebarItem(chatId);
        loadChatDetails(chatId);
    });
    const deleteButton = listItem.querySelector('.delete-chat-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Yakin ingin menghapus chat "${title || 'Untitled Chat'}"?`)) {
                await deleteChatFirestore(chatId);
            }
        });
    }
    return listItem;
}

// Helper highlightSidebarItem
function highlightSidebarItem(chatId) {
    document.querySelectorAll('#recent-chats-list li').forEach(li => {
        li.classList.toggle('active-item', li.dataset.chatId === chatId);
    });
}


// --- Listener Status Autentikasi ---
if (auth) {
    auth.onAuthStateChanged((user) => {
        const placeholderLoggedIn = "Ask Gemini";
        const placeholderLoggedOut = "Silakan login untuk memulai chat...";

        if (user) {
            console.log("User logged in:", user.uid, user.displayName);
            currentUser = user;
            isLoggedIn = true;

            const profilePicUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=random&color=fff`;
            [authButtonDesktop, authButtonMobile].forEach(button => { if (button) button.classList.add('logged-in'); });
            [userProfileImgDesktop, userProfileImgMobile].forEach(img => { if (img) img.src = profilePicUrl; });

            addWelcomeMessage();
            if (promptTextarea) {
                promptTextarea.disabled = false;
                promptTextarea.placeholder = placeholderLoggedIn;
            }
            if (micButton) micButton.disabled = false;

            loadRecentChats(user.uid);
            updateAuthPopupContent();

        } else {
            console.log("User logged out");
            currentUser = null;
            isLoggedIn = false;
            currentChatId = null;

            [authButtonDesktop, authButtonMobile].forEach(button => { if (button) button.classList.remove('logged-in'); });
            [userProfileImgDesktop, userProfileImgMobile].forEach(img => { if (img) img.src = ""; });

            addWelcomeMessage();
            if (promptTextarea) {
                promptTextarea.disabled = true;
                promptTextarea.placeholder = placeholderLoggedOut;
            }
            if (micButton) micButton.disabled = true;
            if (sendButton) sendButton.disabled = true;
            if (recentChatsList) recentChatsList.innerHTML = '<li>Login untuk melihat history</li>';

            resetChat(); // Reset chat area on logout

            if (unsubscribeChatsListener) {
                unsubscribeChatsListener();
                unsubscribeChatsListener = null;
                console.log("Firestore listener stopped.");
            }
            updateAuthPopupContent();
            if (isAuthPopupOpen) {
                toggleAuthPopup();
            }
        }
        if (promptTextarea) promptTextarea.dispatchEvent(new Event('input'));
    });
} else {
    console.error("Firebase Auth failed to initialize. Login functionality disabled.");
    if (promptTextarea) {
        promptTextarea.disabled = true;
        promptTextarea.placeholder = "Error: Fitur chat tidak tersedia.";
    }
    if (loginIconDesktop) loginIconDesktop.style.color = 'grey';
    if (loginIconMobile) loginIconMobile.style.color = 'grey';
    updateAuthPopupContent();
}


// --- Event Listeners ---
// Sidebar & Scrim, Modal, Resize
if (menuToggleButton) {
    menuToggleButton.addEventListener('click', () => {
        if (isMobile) { isSidenavOpen = !isSidenavOpen; }
        else { isSidenavCollapsed = !isSidenavCollapsed; isSidenavOpen = true; }
        applySidenavState();
    });
}
if (sidebarScrim) {
    sidebarScrim.addEventListener('click', () => { if (isMobile && isSidenavOpen) { isSidenavOpen = false; applySidenavState(); } });
}
if (bottomSheetScrim) {
    bottomSheetScrim.addEventListener('click', closeModelBottomSheet);
}
window.addEventListener('resize', handleResize);

// Input Area Logic
if (promptTextarea) {
    promptTextarea.addEventListener('input', () => {
        // ... (kode resize textarea tetap sama) ...
        promptTextarea.style.height = 'auto';
        let scrollHeight = promptTextarea.scrollHeight;
        const maxHeightStyle = getComputedStyle(promptTextarea).maxHeight;
        const maxHeight = maxHeightStyle && maxHeightStyle !== 'none' ? parseInt(maxHeightStyle, 10) : 200;
        promptTextarea.style.height = (scrollHeight > maxHeight ? maxHeight : scrollHeight) + 'px';
        promptTextarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';


        if (isLoggedIn) {
            const hasText = promptTextarea.value.trim().length > 0;

            if (isGenerating) {
                if (stopButton) {
                    stopButton.style.display = 'inline-flex';
                    stopButton.disabled = false;
                }
                if (sendButton) sendButton.style.display = 'none';
                if (micButton) micButton.style.display = 'none';
            } else if (hasText) {
                if (sendButton) {
                    sendButton.style.display = 'inline-flex';
                    sendButton.disabled = false;
                }
                if (micButton) micButton.style.display = 'none';
                if (stopButton) stopButton.style.display = 'none';
            } else {
                if (micButton) {
                    micButton.style.display = 'inline-flex';
                    micButton.disabled = false;
                }
                if (sendButton) sendButton.style.display = 'none';
                if (stopButton) stopButton.style.display = 'none';
            }
        } else {
            if (micButton) {
                micButton.style.display = 'inline-flex';
                micButton.disabled = true;
            }
            if (sendButton) sendButton.style.display = 'none';
            if (stopButton) stopButton.style.display = 'none';
        }
    });
}


// --- Event Listener Tombol Auth Header ---
[authButtonDesktop, authButtonMobile].forEach(button => {
    if (button) {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleAuthPopup();
        });
    }
});

// --- Event Listener Tombol di dalam Auth Popup ---
if (popupSigninButton) {
    popupSigninButton.addEventListener('click', () => {
        signInWithGoogle();
        toggleAuthPopup();
    });
}
if (popupSignoutButton) {
    popupSignoutButton.addEventListener('click', () => {
        if (confirm("Apakah Anda yakin ingin logout?")) {
            signOutUser();
        }
    });
}

// --- Event Listener untuk Menutup Popup Saat Klik di Luar ---
document.addEventListener('click', (event) => {
     const isClickOutsideDropdown = !isMobile && modelDropdownMenu?.classList.contains('show') &&
                                  modeSwitcherButton && !modeSwitcherButton.contains(event.target) &&
                                  !(sidebarModeSwitcherButton && sidebarModeSwitcherButton.contains(event.target)) &&
                                  !modelDropdownMenu.contains(event.target);
     if (isClickOutsideDropdown) { closeModelDropdown(); }
     if (isAuthPopupOpen && authPopupMenu && !authPopupMenu.contains(event.target) &&
         !(authButtonDesktop && authButtonDesktop.contains(event.target)) &&
         !(authButtonMobile && authButtonMobile.contains(event.target))) {
        toggleAuthPopup();
     }
 });

 if (sendButton) {
    sendButton.addEventListener('click', async () => {
        if (!isLoggedIn || !currentUser) {
            alert("Silakan login terlebih dahulu untuk mengirim pesan.");
            signInWithGoogle();
            return;
        }

        const messageText = promptTextarea.value.trim();
        if (messageText && !isGenerating) {
            addMessage(messageText, 'user'); // Tambahkan pesan user
            const userMessageForHistory = { role: "user", parts: [{ text: messageText }] };
            const userMessageForDb = { role: "user", text: messageText };
            const historyForApi = [...currentChatHistory];

            // --- Mulai Loading ---
            isGenerating = true;
            promptTextarea.value = '';
            promptTextarea.disabled = true;
            promptTextarea.dispatchEvent(new Event('input')); // Update UI (tampilkan tombol stop)
            addMessage(null, 'ai', { isLoading: true }); // <<< TAMBAHKAN INDIKATOR LOADING (Ini akan membuat bubble loading)
            // --- Akhir Loading ---

            currentAbortController = new AbortController(); // Buat controller baru

            try {
                // Panggil API dengan signal
                const aiResponseText = await callGeminiAPI(messageText, historyForApi, currentAbortController.signal); // <<< PANGGIL DENGAN SIGNAL

                // --- Update Pesan Loading dengan Sukses ---
                updateLoadingMessage(aiResponseText); // <<< UPDATE PESAN LOADING
                // --- Akhir Update ---

                const aiMessageForHistory = { role: "model", parts: [{ text: aiResponseText }] };
                const aiMessageForDb = { role: "model", text: aiResponseText };

                // Simpan ke Firestore setelah respons diterima dan ditampilkan
                await saveMessagesToFirestore(userMessageForDb, aiMessageForDb);

                // Update history lokal
                currentChatHistory.push(userMessageForHistory);
                currentChatHistory.push(aiMessageForHistory);

            } catch (error) {
                 if (error.name === 'AbortError') {
                    console.log('Fetch aborted by user.');
                    // --- Update Pesan Loading dengan Pesan Stop ---
                    updateLoadingMessage("Generation stopped.", true); // <<< UPDATE DENGAN PESAN STOP
                    // --- Akhir Update ---
                } else {
                    console.error("Error during API call or processing:", error);
                    // --- Update Pesan Loading dengan Error ---
                    updateLoadingMessage(`Error: ${error.message}`, true); // <<< UPDATE DENGAN PESAN ERROR
                    // --- Akhir Update ---
                }
            } finally {
                isGenerating = false;
                currentAbortController = null; // Hapus controller
                if (promptTextarea) {
                    promptTextarea.disabled = false;
                    promptTextarea.dispatchEvent(new Event('input')); // Update UI (sembunyikan stop, tampilkan mic/send)
                    promptTextarea.focus();
                }
                // currentLoadingBubbleElement sudah direset di updateLoadingMessage
            }
        }
    });
}


// Tombol Stop
if (stopButton) {
    stopButton.addEventListener('click', () => {
        if (isGenerating && currentAbortController) {
            console.log("Stop generation requested. Aborting fetch...");
            currentAbortController.abort(); // Kirim sinyal abort ke fetch
            // Tombol stop akan dinonaktifkan/disembunyikan di blok finally sendButton
            // Kita bisa langsung disable di sini untuk feedback cepat
            stopButton.disabled = true;
        } else {
            console.log("Stop button clicked but not generating or no controller.");
        }
    });
}


// Tombol New Chat
function handleNewChatClick() {
    if (!isLoggedIn) {
        alert("Silakan login untuk memulai chat baru.");
        signInWithGoogle();
        return;
    }
    resetChat();
}
if (newChatButton) newChatButton.addEventListener('click', handleNewChatClick);
if (sidebarNewChatButton) sidebarNewChatButton.addEventListener('click', handleNewChatClick);
if (mobileNewChatButtonHeader) mobileNewChatButtonHeader.addEventListener('click', handleNewChatClick);


// Kirim dengan Enter
if (promptTextarea) {
    promptTextarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey && sendButton && !sendButton.disabled && !isMobile && isLoggedIn) {
            event.preventDefault();
            sendButton.click();
        }
    });
}

// Mode Switcher & Dropdown/Bottom Sheet Logic
function handleModeSwitchClick(event) {
     event.stopPropagation();
     if (isMobile) {
         isBottomSheetOpen ? closeModelBottomSheet() : openModelBottomSheet();
     } else {
         modelDropdownMenu?.classList.contains('show') ? closeModelDropdown() : openModelDropdown();
     }
 }
if (modeSwitcherButton) modeSwitcherButton.addEventListener('click', handleModeSwitchClick);
if (sidebarModeSwitcherButton) sidebarModeSwitcherButton.addEventListener('click', handleModeSwitchClick);
function handleDropdownItemClick(item) {
    const value = item.dataset.value;
    const role = item.getAttribute('role');
    console.log("Selected:", value, "Role:", role);

    if (role === 'menuitemradio') {
        document.querySelectorAll('.dropdown-item[role="menuitemradio"]').forEach(radioItem => {
            const isSelected = radioItem.dataset.value === value;
            radioItem.classList.toggle('selected', isSelected);
            radioItem.setAttribute('aria-checked', isSelected.toString());
            const checkmark = radioItem.querySelector('.checkmark-icon');
            if (checkmark) checkmark.style.visibility = isSelected ? 'visible' : 'hidden';
        });
        if (selectedModeText) selectedModeText.textContent = value;
        if (sidebarSelectedModeText) sidebarSelectedModeText.textContent = value;

        let newModel = 'gemini-2.0-flash';
        switch (value) {
            case "2.0 Flash": newModel = 'gemini-2.0-flash'; break;
            case "2.5 Flash (experimental)": newModel = 'gemini-2.5-flash-preview-04-17'; break;
            case "2.5 Pro (experimental)": newModel = 'gemini-2.5-pro-preview-03-25'; break;
            default: console.warn("Model mapping not found for:", value);
        }
        if (newModel !== currentModel) {
            currentModel = newModel;
            console.log("API Model changed to:", currentModel);
            if (isLoggedIn) resetChat(); // Reset chat saat model berubah
        } else {
             console.log("Model already set to:", currentModel);
        }
    } else if (value === 'Gemini Advanced') {
        console.log("Upgrade button clicked");
        alert("Membuka halaman upgrade Gemini Advanced (simulasi).");
        return;
    } else {
        console.log(value + " clicked");
        alert("Fitur " + value + " diaktifkan (simulasi).");
    }
    if (isMobile) { closeModelBottomSheet(); } else { closeModelDropdown(); }
}
dropdownItemsDesktop.forEach(item => item.addEventListener('click', () => handleDropdownItemClick(item)));
dropdownItemsMobile.forEach(item => item.addEventListener('click', () => handleDropdownItemClick(item)));


// --- Inisialisasi Akhir Saat Load ---
applySidenavState();
isChatStarted = !chatContentWrapper?.querySelector('.welcome-message-container');
const initialSelectedItem = document.querySelector('.dropdown-item.selected[role="menuitemradio"]');
if (initialSelectedItem) {
    const initialValue = initialSelectedItem.dataset.value;
    if (selectedModeText) selectedModeText.textContent = initialValue;
    if (sidebarSelectedModeText) sidebarSelectedModeText.textContent = initialValue;
    let initialModel = 'gemini-2.0-flash';
    switch (initialValue) {
        case "2.0 Flash": initialModel = 'gemini-2.0-flash'; break;
        case "2.5 Flash (experimental)": initialModel = 'gemini-2.5-flash-preview-04-17'; break;
        case "2.5 Pro (experimental)": initialModel = 'gemini-2.5-pro-preview-03-25'; break;
        default: console.warn("Initial model mapping not found for:", initialValue);
    }
    currentModel = initialModel;
    console.log("Initial API Model set to:", currentModel);
    closeModelDropdown();
    closeModelBottomSheet();
} else {
    console.warn("No initial selected model found in HTML. Defaulting to:", currentModel);
    const defaultItem = document.querySelector(`.dropdown-item[data-value="2.0 Flash"]`);
    const defaultText = defaultItem ? defaultItem.dataset.value : "2.0 Flash";
    if (selectedModeText) selectedModeText.textContent = defaultText;
     if (sidebarSelectedModeText) sidebarSelectedModeText.textContent = defaultText;
}

if (stopButton) {
    stopButton.style.display = 'none';
    stopButton.disabled = true;
}
if (promptTextarea) promptTextarea.dispatchEvent(new Event('input'));


console.log("Gemini Chat App Initialized (with Auth Compat). Waiting for Auth state...");
