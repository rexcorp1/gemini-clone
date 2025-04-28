# Gemini Chat App (Frontend + Vercel Serverless + Firebase)

Aplikasi web chat sederhana yang terhubung dengan Google Gemini API, menggunakan frontend HTML/CSS/JS, backend aman via Vercel Serverless Function untuk interaksi API Gemini, serta Firebase untuk autentikasi pengguna dan penyimpanan history chat.

## ✨ Fitur

*   Antarmuka chat interaktif.
*   Terhubung langsung ke Google Gemini API (melalui backend Vercel).
*   **Autentikasi Pengguna:** Login/Logout menggunakan Google (via Firebase Authentication).
*   **History Chat Persisten:** Menyimpan dan memuat riwayat percakapan per pengguna (via Firebase Firestore).
*   Menampilkan daftar history chat di sidebar.
*   Pemilihan model Gemini (misalnya Flash, Pro) melalui UI.
*   Menampilkan respons AI dalam format Markdown (termasuk list, tebal, miring, blok kode).
*   Penanganan API Key Gemini yang aman menggunakan Vercel Serverless Function dan Environment Variables.
*   Desain responsif (Sidebar, Bottom Sheet).
*   Dapat dijalankan secara lokal menggunakan Vercel CLI.
*   Siap untuk di-deploy ke Vercel.

## 🛠️ Teknologi yang Digunakan

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   Vanilla JavaScript (ES6+)
    *   [marked.js](https://marked.js.org/) (Untuk parsing Markdown)
    *   [DOMPurify](https://github.com/cure53/DOMPurify) (Untuk sanitasi HTML dari Markdown)
*   **Backend (Serverless API Proxy):**
    *   [Vercel Serverless Functions](https://vercel.com/docs/functions) (Node.js runtime) - Untuk interaksi aman dengan Gemini API.
*   **Backend (BaaS - Backend as a Service):**
    *   [Firebase](https://firebase.google.com/)
        *   **Firebase Authentication:** Untuk login/logout pengguna (Google Sign-In).
        *   **Cloud Firestore:** Database NoSQL untuk menyimpan history chat per pengguna.
*   **API:**
    *   [Google Gemini API](https://ai.google.dev/)
*   **Platform & Tools:**
    *   [Vercel](https://vercel.com/) (Deployment & Hosting)
    *   [Vercel CLI](https://vercel.com/docs/cli) (Local Development)
    *   Git

## 🚀 Pengaturan & Instalasi

1.  **Clone Repository:**
    ```bash
    git clone <URL_REPOSITORY_ANDA>
    cd <NAMA_FOLDER_PROJECT>
    ```

2.  **Setup Project Firebase:**
    *   Buat project baru di [Firebase Console](https://console.firebase.google.com/).
    *   Tambahkan aplikasi Web ke project Firebase Anda.
    *   Aktifkan **Authentication**: Pilih metode Sign-in "Google" (dan/atau metode lain jika diinginkan).
    *   Aktifkan **Firestore Database**: Pilih mode produksi (production mode) dan lokasi server.
    *   **Penting:** Salin konfigurasi Firebase (`firebaseConfig`) untuk aplikasi web Anda dari Project settings > General > Your apps > Web app > SDK setup and configuration > Config.

3.  **Setup Firestore Security Rules:**
    *   Di Firebase Console -> Firestore Database -> Rules, ganti rules default dengan rules yang sesuai untuk mengizinkan user membaca/menulis chat miliknya sendiri (lihat contoh di `gemini-chat.js` atau dokumentasi Firestore). Pastikan rules mengizinkan `get`, `list`, `create`, `update`, `delete` dengan kondisi `request.auth.uid == resource.data.userId` atau `request.auth != null` untuk `list`. **Jangan lupa Publish rules!**

4.  **Install Vercel CLI (jika belum):**
    Ini diperlukan untuk menjalankan server development lokal yang mensimulasikan environment Vercel.
    ```bash
    npm install -g vercel
    ```
    atau
    ```bash
    yarn global add vercel
    ```

## 💻 Pengembangan Lokal

1.  **Masukkan Konfigurasi Firebase:**
    *   Buka file `gemini-chat.js`.
    *   Cari variabel `firebaseConfig` di bagian paling atas.
    *   Tempel (paste) konfigurasi Firebase yang sudah kamu salin dari Firebase Console ke dalam objek `firebaseConfig` ini.

2.  **Dapatkan API Key Gemini:**
    *   Buat API key dari Google AI Studio.

3.  **Buat File `.env`:**
    *   Di *root directory* project, buat file baru bernama `.env`.

4.  **Tambahkan API Key Gemini ke `.env`:**
    *   Buka file `.env` dan tambahkan baris berikut, ganti `AIza...` dengan API key Gemini asli kamu:
      ```.env
      GEMINI_API_KEY=AIza...MASUKKAN_API_KEY_ASLI_ANDA...
      ```

5.  **Tambahkan `.env` ke `.gitignore`:**
    *   Pastikan file `.gitignore` di root project berisi baris berikut agar API key tidak ter-commit:
      ```gitignore
      # Environment variables
      .env

      # Dependencies (jika menggunakan npm/yarn)
      node_modules/
      ```

6.  **Jalankan Server Development Lokal:**
    *   Buka terminal di root directory project dan jalankan:
      ```bash
      vercel dev
      ```
    *   Aplikasi akan berjalan di `http://localhost:3000` (atau port lain). Serverless function (`/api/chat`) akan aktif dan membaca API key Gemini dari file `.env`. Frontend akan menggunakan `firebaseConfig` untuk terhubung ke Firebase.

## ☁️ Deployment ke Vercel

1.  **Push ke Repository Git:**
    *   Pastikan kode terbaru (termasuk `firebaseConfig` di `gemini-chat.js`) sudah di-push ke repository Git kamu.

2.  **Impor Project di Vercel:**
    *   Login ke dashboard Vercel.
    *   Klik "Add New..." -> "Project".
    *   Pilih repository Git kamu.

3.  **Konfigurasi Environment Variable (HANYA untuk Gemini API Key):**
    *   Setelah project terimpor, pergi ke **Settings -> Environment Variables**.
    *   Tambahkan variabel baru **hanya untuk API Key Gemini**:
        *   **Name:** `GEMINI_API_KEY`
        *   **Value:** Masukkan API key Gemini asli kamu (`AIza...`).
        *   Pilih environment (Production, Preview, Development).
    *   Klik "Save".
    *   **Catatan:** Konfigurasi Firebase (`firebaseConfig`) **tidak perlu** dimasukkan ke Environment Variables Vercel karena sudah ada di kode frontend (`gemini-chat.js`) dan memang dirancang untuk sisi klien.

4.  **Deploy:**
    *   Kembali ke halaman "Deployments" dan trigger deploy baru jika perlu.
    *   Vercel akan men-deploy aplikasi frontend (yang sudah berisi `firebaseConfig`) dan Serverless Function (`/api/chat`) yang akan menggunakan `GEMINI_API_KEY` dari environment Vercel.

