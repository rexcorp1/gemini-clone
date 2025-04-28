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
const dropdownItemsDesktop = modelDropdownMenu?.querySelectorAll('.dropdown-item[role^="menuitem"]') || [];
const dropdownItemsMobile = modelBottomSheet.querySelectorAll('.dropdown-item[role^="menuitem"]');

// --- Variabel State ---
let isMobile = window.innerWidth <= 960;
let isSidenavOpen = !isMobile;
let isSidenavCollapsed = !isMobile;
let isBottomSheetOpen = false;
let isGenerating = false;
let isChatStarted = !chatContentWrapper.querySelector('.welcome-message-container');
// Default model (pastikan sesuai dengan salah satu case di handleDropdownItemClick)
let currentModel = 'gemini-2.0-flash';
let currentChatHistory = []; // Untuk menyimpan histori percakapan API

// --- Konfigurasi API ---
// API Key DIHAPUS dari sini! Akan ditangani oleh backend Vercel.

// --- Fungsi UI: Sidebar, Bottom Sheet, Dropdown, Resize ---
function closeModelDropdown() {
    modelDropdownMenu?.classList.remove('show');
    modeSwitcherButton.classList.remove('open');
    modeSwitcherButton.setAttribute('aria-expanded', 'false');
}

function closeModelBottomSheet() {
    if (!isSidenavOpen && isMobile) {
         document.body.style.overflow = '';
    } else if (!isMobile) {
        document.body.style.overflow = '';
    }
    modelBottomSheet.classList.remove('show');
    bottomSheetScrim.classList.remove('visible');
    modeSwitcherButton.setAttribute('aria-expanded', 'false');
    if (sidebarModeSwitcherButton) sidebarModeSwitcherButton.setAttribute('aria-expanded', 'false');
    isBottomSheetOpen = false;
}

function applySidenavState() {
    const shouldBeOpen = isSidenavOpen;
    const shouldBeCollapsed = isSidenavCollapsed;

    if (isMobile) {
        sidebar.classList.toggle('open', shouldBeOpen);
        sidebarScrim.classList.toggle('visible', shouldBeOpen);
        menuToggleButton.setAttribute('aria-expanded', shouldBeOpen.toString());
        sidebar.classList.remove('collapsed');
        document.body.style.overflow = shouldBeOpen ? 'hidden' : '';
        sidebar.style.transition = 'transform 0.3s ease';
    } else {
        sidebar.classList.remove('open');
        sidebar.classList.toggle('collapsed', shouldBeCollapsed);
        sidebarScrim.classList.remove('visible');
        menuToggleButton.setAttribute('aria-expanded', (!shouldBeCollapsed).toString());
        document.body.style.overflow = '';
        sidebar.style.transition = 'width 0.3s ease';
    }
     closeModelDropdown();
     closeModelBottomSheet();
}

function openModelBottomSheet() {
    if (!isMobile) return;
    modelBottomSheet.classList.add('show');
    bottomSheetScrim.classList.add('visible');
    modeSwitcherButton.setAttribute('aria-expanded', 'true');
    if (sidebarModeSwitcherButton) sidebarModeSwitcherButton.setAttribute('aria-expanded', 'true');
    isBottomSheetOpen = true;
    document.body.style.overflow = 'hidden';
}

 function openModelDropdown() {
     if (isMobile) return;
     modelDropdownMenu?.classList.add('show');
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
            sidebar.style.transition = 'transform 0.3s ease';
            closeModelDropdown();
        } else {
            isSidenavOpen = true;
            isSidenavCollapsed = true;
            sidebar.style.transition = 'width 0.3s ease';
            closeModelBottomSheet();
        }
        applySidenavState();
    }
     closeModelDropdown();
     closeModelBottomSheet();
}

// --- Fungsi UI: Pesan & Welcome Message ---
function removeWelcomeMessage() {
    const welcomeContainer = chatContentWrapper.querySelector('.welcome-message-container');
    if (welcomeContainer) {
        welcomeContainer.remove();
        isChatStarted = true;
    }
}

function addWelcomeMessage() {
    if (!chatContentWrapper.querySelector('.message-container') && !chatContentWrapper.querySelector('.welcome-message-container')) {
        const welcomeContainer = document.createElement('div');
        welcomeContainer.classList.add('welcome-message-container');
        const heading = document.createElement('h1');
        heading.textContent = 'Hello, Guest';
        welcomeContainer.appendChild(heading);
        chatContentWrapper.insertBefore(welcomeContainer, chatContentWrapper.firstChild);
        isChatStarted = false;
    }
}

function addMessage(text, sender, isError = false) {
    if (!isChatStarted && sender === 'user') {
        removeWelcomeMessage();
    }

    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', sender === 'user' ? 'user-query' : 'model-response');

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('message-content-wrapper');

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');

    if (isError) {
        textDiv.style.color = 'red';
        textDiv.style.fontStyle = 'italic';
        textDiv.textContent = text; // Tampilkan error sebagai teks biasa
    } else if (sender === 'ai') {
        // --- Integrasi Markdown Parser ---
        // Pastikan library marked dan DOMPurify sudah di-load di HTML
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            try {
                // 1. Parse Markdown ke HTML
                const rawHtml = marked.parse(text);
                // 2. Sanitize HTML (PENTING!)
                const cleanHtml = DOMPurify.sanitize(rawHtml);
                // 3. Set innerHTML
                textDiv.innerHTML = cleanHtml;
            } catch (parseError) {
                console.error("Markdown parsing/sanitizing error:", parseError);
                // Fallback ke teks biasa jika parsing gagal
                textDiv.textContent = text;
                textDiv.style.fontStyle = 'italic';
                textDiv.title = "Could not render Markdown.";
            }
        } else {
            console.warn("marked.js or DOMPurify.js not loaded. Displaying raw text.");
            textDiv.textContent = text; // Fallback jika library tidak ada
        }
        // --- Akhir Integrasi Markdown ---
    } else {
        // Untuk user, tetap tampilkan sebagai teks biasa
        textDiv.textContent = text;
    }

    contentWrapper.appendChild(textDiv);

    if (sender === 'ai') {
        const bubble = document.createElement('div'); bubble.classList.add('message-bubble');
        const avatar = document.createElement('div'); avatar.classList.add('message-avatar');
        avatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px); content-visibility: visible;"><defs><clipPath id="__lottie_element_48"><rect width="32" height="32" x="0" y="0"></rect></clipPath><g id="__lottie_element_55"><g transform="matrix(0.9999992251396179,-0.001229780144058168,0.001229780144058168,0.9999992251396179,16,16)" opacity="1" style="display: block;"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill="url(#__lottie_element_58)" fill-opacity="1" d=" M0.027000000700354576,14 C0.47999998927116394,6.489999771118164 6.489999771118164,0.47999998927116394 14,0.027000000700354576 C14,0.027000000700354576 14,-0.027000000700354576 14,-0.027000000700354576 C6.489999771118164,-0.47999998927116394 0.47999998927116394,-6.489999771118164 0.027000000700354576,-14 C0.027000000700354576,-14 -0.027000000700354576,-14 -0.027000000700354576,-14 C-0.47999998927116394,-6.489999771118164 -6.489999771118164,-0.47999998927116394 -14,-0.027000000700354576 C-14,-0.027000000700354576 -14,0.027000000700354576 -14,0.027000000700354576 C-6.489999771118164,0.47999998927116394 -0.47999998927116394,6.489999771118164 -0.027000000700354576,14 C-0.027000000700354576,14 0.027000000700354576,14 0.027000000700354576,14z"></path></g></g></g><linearGradient id="__lottie_element_58" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-9.222999572753906" y1="8.489999771118164" x2="10.461999893188477" y2="-8.211999893188477"><stop offset="0%" stop-color="rgb(33,123,254)"></stop><stop offset="14%" stop-color="rgb(20,133,252)"></stop><stop offset="27%" stop-color="rgb(7,142,251)"></stop><stop offset="52%" stop-color="rgb(84,143,253)"></stop><stop offset="78%" stop-color="rgb(161,144,255)"></stop><stop offset="89%" stop-color="rgb(175,148,254)"></stop><stop offset="100%" stop-color="rgb(189,153,254)"></stop></linearGradient><linearGradient id="__lottie_element_62" spreadMethod="pad" gradientUnits="userSpaceOnUse" x1="-4.002999782562256" y1="4.630000114440918" x2="8.092000007629395" y2="-7.886000156402588"><stop offset="0%" stop-color="rgb(33,123,254)"></stop><stop offset="14%" stop-color="rgb(20,133,252)"></stop><stop offset="27%" stop-color="rgb(7,142,251)"></stop><stop offset="52%" stop-color="rgb(84,143,253)"></stop><stop offset="78%" stop-color="rgb(161,144,255)"></stop><stop offset="89%" stop-color="rgb(175,148,254)"></stop><stop offset="100%" stop-color="rgb(189,153,254)"></stop></linearGradient><mask id="__lottie_element_55_1" mask-type="alpha"><use xlink:href="#__lottie_element_55"></use></mask></defs><g clip-path="url(#__lottie_element_48)"><g mask="url(#__lottie_element_55_1)" style="display: block;"><g transform="matrix(1,0,0,1,16,16)" opacity="1"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill="url(#__lottie_element_62)" fill-opacity="1" d=" M0,-16 C8.830400466918945,-16 16,-8.830400466918945 16,0 C16,8.830400466918945 8.830400466918945,16 0,16 C-8.830400466918945,16 -16,8.830400466918945 -16,0 C-16,-8.830400466918945 -8.830400466918945,-16 0,-16z"></path></g></g></g></g></svg>`;
        bubble.appendChild(avatar);

        const actions = document.createElement('div'); actions.classList.add('message-actions');
        actions.innerHTML = `<button class="icon-button" aria-label="Like response"><span class="material-symbols-outlined">thumb_up</span></button><button class="icon-button" aria-label="Dislike response"><span class="material-symbols-outlined">thumb_down</span></button><button class="icon-button" aria-label="Share & export"><span class="material-symbols-outlined">share</span></button><button class="icon-button" aria-label="More options"><span class="material-symbols-outlined">more_vert</span></button>`;
        contentWrapper.appendChild(actions);

        bubble.appendChild(contentWrapper);
        messageContainer.appendChild(bubble);
    } else {
        messageContainer.appendChild(contentWrapper);
    }

    chatContentWrapper.appendChild(messageContainer);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}


// --- Fungsi Inti API (Memanggil Vercel Function) ---
async function callGeminiAPI(prompt, history) {
    // Endpoint sekarang adalah Serverless Function kita di Vercel
    const endpoint = '/api/chat'; // Path relatif ke file di folder /api

    // Data yang dikirim ke serverless function
    const payload = {
        prompt: prompt,
        history: history,
        model: currentModel // Kirim model yang dipilih saat ini
    };

    console.log("Sending to Vercel Function:", endpoint, payload); // Debugging frontend

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // AbortController frontend tidak bisa membatalkan fetch serverless secara efektif
        });

        const data = await response.json(); // Baca respons dari serverless function

        if (!response.ok) {
            // Tangani error yang dikirim balik oleh serverless function
            console.error("Serverless Function Error:", data);
            // Gunakan pesan error dari server jika ada, jika tidak gunakan status text
            throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
        }

        console.log("Vercel Function Success Response:", data); // Debugging frontend

        // Serverless function seharusnya mengembalikan { text: "..." } jika sukses
        if (typeof data.text === 'string') { // Periksa apakah 'text' ada dan berupa string
            return data.text;
        } else {
             // Jika serverless function mengembalikan format lain (seharusnya tidak terjadi)
             console.error("Unexpected success response format from server:", data);
             throw new Error("Received unexpected success response from server.");
        }

    } catch (error) {
        // Tangani network error atau error dari throw di atas
        console.error('Failed to call Vercel Function:', error);
        // Tidak bisa membedakan AbortError dengan mudah lagi
        throw error; // Re-throw untuk ditangani di listener tombol send
    }
}

// --- Fungsi Reset Chat ---
function resetChat() {
    console.log("Starting new chat...");
    chatContentWrapper.innerHTML = '';
    addWelcomeMessage();
    promptTextarea.value = '';
    promptTextarea.dispatchEvent(new Event('input'));
    currentChatHistory = [];

    // Tombol stop hanya reset UI jika sedang generating
    if (isGenerating) {
        console.log("Resetting UI from generating state during chat reset.");
        isGenerating = false;
        inputArea.classList.remove('is-sending');
        promptTextarea.disabled = false;
        if (micButton) micButton.disabled = false;
        promptTextarea.dispatchEvent(new Event('input'));
        promptTextarea.focus();
    }

    if (isMobile && isSidenavOpen) {
        isSidenavOpen = false;
        applySidenavState();
    }
    isChatStarted = false;
    console.log("Chat reset complete.");
}

// --- Event Listeners ---

// Sidebar & Scrim Listeners
menuToggleButton.addEventListener('click', () => {
    if (isMobile) {
        isSidenavOpen = !isSidenavOpen;
    } else {
        isSidenavCollapsed = !isSidenavCollapsed;
        isSidenavOpen = true;
    }
    applySidenavState();
});

sidebarScrim.addEventListener('click', () => {
    if (isMobile && isSidenavOpen) {
        isSidenavOpen = false;
        applySidenavState();
    }
});

// Modal (Dropdown/Bottom Sheet) Listeners
bottomSheetScrim.addEventListener('click', closeModelBottomSheet);
window.addEventListener('resize', handleResize);

// Input Area Logic
promptTextarea.addEventListener('input', () => {
    promptTextarea.style.height = 'auto';
    let scrollHeight = promptTextarea.scrollHeight;
    const maxHeightStyle = getComputedStyle(promptTextarea).maxHeight;
    const maxHeight = maxHeightStyle && maxHeightStyle !== 'none' ? parseInt(maxHeightStyle, 10) : 200;
    promptTextarea.style.height = (scrollHeight > maxHeight ? maxHeight : scrollHeight) + 'px';
    promptTextarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';

    if (!isGenerating) {
        const hasText = promptTextarea.value.trim().length > 0;
        inputArea.classList.toggle('has-text', hasText);
        sendButton.disabled = !hasText;
        // micButton.disabled = hasText; // Opsional
    }
});

// Tombol Send (Logika API via Vercel Function)
sendButton.addEventListener('click', async () => {
    const messageText = promptTextarea.value.trim();
    if (messageText && !isGenerating) {
        addMessage(messageText, 'user');
        const userMessageForHistory = { role: "user", parts: [{ text: messageText }] };

        promptTextarea.value = '';
        promptTextarea.dispatchEvent(new Event('input'));
        isGenerating = true;
        inputArea.classList.add('is-sending');
        inputArea.classList.remove('has-text');
        promptTextarea.disabled = true;
        sendButton.disabled = true;
        if (micButton) micButton.disabled = true;
        // Tombol stop diaktifkan saat generating
        stopButton.disabled = false;
        stopButton.style.display = 'block'; // Tampilkan tombol stop
        sendButton.style.display = 'none'; // Sembunyikan tombol send

        try {
            // Panggil fungsi yang memanggil Vercel Function
            const aiResponseText = await callGeminiAPI(messageText, currentChatHistory);

            // Tampilkan respons AI (sudah di-parse markdown di addMessage)
            addMessage(aiResponseText, 'ai');

            // Tambahkan ke histori internal
            currentChatHistory.push(userMessageForHistory);
            currentChatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });

        } catch (error) {
            // Tampilkan pesan error dari Vercel Function atau network
             addMessage(`Error: ${error.message}`, 'ai', true);
        } finally {
            // Kembalikan UI state ke normal
            isGenerating = false;
            inputArea.classList.remove('is-sending');
            promptTextarea.disabled = false;
            if (micButton) micButton.disabled = false;
            // Tombol stop dinonaktifkan dan disembunyikan lagi
            stopButton.disabled = true;
            stopButton.style.display = 'none';
            // Tampilkan lagi tombol send (jika textarea kosong, state akan diatur oleh 'input' event)
            sendButton.style.display = 'block';
            promptTextarea.dispatchEvent(new Event('input')); // Update state tombol send/mic
            promptTextarea.focus();
        }
    }
});

// Tombol Stop (Hanya Reset UI Frontend)
stopButton.addEventListener('click', () => {
    console.log("Stop generation requested (UI only).");
    // Hanya reset state UI, tidak bisa membatalkan proses di server
     if (isGenerating) {
         isGenerating = false; // Set generating ke false
         inputArea.classList.remove('is-sending');
         promptTextarea.disabled = false;
         if (micButton) micButton.disabled = false;
         stopButton.disabled = true;
         stopButton.style.display = 'none';
         sendButton.style.display = 'block';
         promptTextarea.dispatchEvent(new Event('input'));
         promptTextarea.focus();
         // Beri tahu user proses mungkin masih berjalan di server
         addMessage("Generation stopped on client. Server process might have continued.", 'ai', true);
     }
});


// Tombol New Chat Listeners
if (newChatButton) newChatButton.addEventListener('click', resetChat);
if (sidebarNewChatButton) sidebarNewChatButton.addEventListener('click', resetChat);

// Kirim dengan Enter (hanya di non-mobile)
promptTextarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !sendButton.disabled && !isMobile) {
        event.preventDefault();
        sendButton.click();
    }
});

// Fungsi untuk handle klik tombol mode switcher
function handleModeSwitchClick(event) {
     event.stopPropagation();
     if (isMobile) {
         isBottomSheetOpen ? closeModelBottomSheet() : openModelBottomSheet();
     } else {
         modelDropdownMenu?.classList.contains('show') ? closeModelDropdown() : openModelDropdown();
     }
 }

// Event Listener untuk Tombol Mode Switcher
modeSwitcherButton.addEventListener('click', handleModeSwitchClick);
if (sidebarModeSwitcherButton) sidebarModeSwitcherButton.addEventListener('click', handleModeSwitchClick);

// Logika Klik di Luar Dropdown/Bottom Sheet
 document.addEventListener('click', (event) => {
     const isClickOutsideDropdown = !isMobile && modelDropdownMenu?.classList.contains('show') &&
                                  !modeSwitcherButton.contains(event.target) &&
                                  !(sidebarModeSwitcherButton && sidebarModeSwitcherButton.contains(event.target)) &&
                                  !modelDropdownMenu.contains(event.target);

     if (isClickOutsideDropdown) {
         closeModelDropdown();
     }
 });

// Logika Item Dropdown/Bottom Sheet (Update Model API)
function handleDropdownItemClick(item) {
    const value = item.dataset.value; // Misal: "2.0 Flash"
    const role = item.getAttribute('role');
    console.log("Selected:", value, "Role:", role);

    if (role === 'menuitemradio') {
        // 1. Update UI
        const allRadioItems = document.querySelectorAll('.dropdown-item[role="menuitemradio"]');
        allRadioItems.forEach(radioItem => {
            radioItem.classList.remove('selected');
            radioItem.setAttribute('aria-checked', 'false');
            const checkmark = radioItem.querySelector('.checkmark-icon');
            if (checkmark) checkmark.style.visibility = 'hidden';
        });

        const correspondingItems = document.querySelectorAll(`.dropdown-item[data-value="${value}"][role="menuitemradio"]`);
        correspondingItems.forEach(corrItem => {
            corrItem.classList.add('selected');
            corrItem.setAttribute('aria-checked', 'true');
            const checkmark = corrItem.querySelector('.checkmark-icon');
            if (checkmark) checkmark.style.visibility = 'visible';
        });

        // 2. Update teks di header
        selectedModeText.textContent = value;
        if (sidebarSelectedModeText) sidebarSelectedModeText.textContent = value;

        // 3. UPDATE MODEL API (Nama model harus sesuai dengan yang didukung API)
        // Pastikan nama model ini valid di Google Generative AI API
        let newModel = 'gemini-1.5-flash-latest'; // Default fallback yang lebih umum
        switch (value) {
            case "2.0 Flash": // Sesuaikan teks ini dengan data-value di HTML Anda
                // Cek nama model yang valid, 'gemini-2.0-flash' mungkin tidak ada
                // Gunakan 'gemini-1.5-flash-latest' atau nama spesifik lain jika ada
                newModel = 'gemini-1.5-flash-latest'; // Ganti jika ada model 2.0 yang valid
                break;
            case "2.5 Flash (experimental)": // Sesuaikan teks ini
                 // Cek nama model preview yang valid
                 newModel = 'gemini-1.5-flash-latest'; // Ganti jika ada nama preview spesifik
                 break;
            case "2.5 Pro (experimental)": // Sesuaikan teks ini
                 // Cek nama model preview yang valid
                newModel = 'gemini-1.5-pro-latest'; // Ganti jika ada nama preview spesifik
                break;
            default:
                console.warn("Model mapping not found for:", value, ". Using default:", newModel);
        }

        if (newModel !== currentModel) {
            currentModel = newModel;
            console.log("API Model changed to:", currentModel);
            resetChat(); // Reset chat saat ganti model
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

// Tambahkan event listener ke semua item di kedua menu
dropdownItemsDesktop.forEach(item => {
    item.addEventListener('click', () => handleDropdownItemClick(item));
});
dropdownItemsMobile.forEach(item => {
    item.addEventListener('click', () => handleDropdownItemClick(item));
});


// --- Inisialisasi Akhir Saat Load ---
applySidenavState();
promptTextarea.dispatchEvent(new Event('input'));
isChatStarted = !chatContentWrapper.querySelector('.welcome-message-container');
addWelcomeMessage();

// Inisialisasi model dan teks header berdasarkan item terpilih awal
const initialSelectedItem = document.querySelector('.dropdown-item.selected[role="menuitemradio"]');
if (initialSelectedItem) {
    const initialValue = initialSelectedItem.dataset.value;
    selectedModeText.textContent = initialValue;
    if (sidebarSelectedModeText) {
        sidebarSelectedModeText.textContent = initialValue;
    }
    // Panggil handler untuk set `currentModel` awal (tanpa reset chat saat load)
    const initialRole = initialSelectedItem.getAttribute('role');
     if (initialRole === 'menuitemradio') {
         let initialModel = 'gemini-1.5-flash-latest'; // Default fallback
         switch (initialValue) {
             case "2.0 Flash": initialModel = 'gemini-1.5-flash-latest'; break; // Sesuaikan
             case "2.5 Flash (experimental)": initialModel = 'gemini-1.5-flash-latest'; break; // Sesuaikan
             case "2.5 Pro (experimental)": initialModel = 'gemini-1.5-pro-latest'; break; // Sesuaikan
             default: console.warn("Initial model mapping not found for:", initialValue);
         }
         currentModel = initialModel;
         console.log("Initial API Model set to:", currentModel);
     }
    closeModelDropdown();
    closeModelBottomSheet();
} else {
    console.warn("No initial selected model found in HTML. Defaulting to:", currentModel);
    // Pastikan teks header sesuai default jika tidak ada item 'selected'
    // Cari item yang data-value-nya cocok dengan currentModel default
    const defaultItem = document.querySelector(`.dropdown-item[data-value="2.0 Flash"]`); // Ganti "2.0 Flash" jika defaultnya beda
    const defaultText = defaultItem ? defaultItem.dataset.value : "Default Model";
    selectedModeText.textContent = defaultText;
     if (sidebarSelectedModeText) sidebarSelectedModeText.textContent = defaultText;
}

// Pastikan tombol stop disembunyikan di awal
stopButton.style.display = 'none';
stopButton.disabled = true;


console.log("Gemini Chat App Initialized (using Vercel Function). Ready.");
