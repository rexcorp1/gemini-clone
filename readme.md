# Gemini Chat App (Frontend + Vercel Serverless)

Aplikasi web chat sederhana yang terhubung dengan Google Gemini API menggunakan frontend HTML/CSS/JS dan backend aman melalui Vercel Serverless Function.

## ✨ Fitur

*   Antarmuka chat interaktif.
*   Terhubung langsung ke Google Gemini API.
*   Pemilihan model Gemini (misalnya Flash, Pro) melalui UI.
*   Menampilkan respons AI dalam format Markdown (termasuk list, tebal, miring, blok kode).
*   Penanganan API Key yang aman menggunakan Vercel Serverless Function dan Environment Variables (tidak terekspos di browser).
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
*   **Backend (Serverless):**
    *   [Vercel Serverless Functions](https://vercel.com/docs/functions) (Node.js runtime)
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

2.  **Install Vercel CLI (jika belum):**
    Ini diperlukan untuk menjalankan server development lokal yang mensimulasikan environment Vercel.
    ```bash
    npm install -g vercel
    ```
    atau
    ```bash
    yarn global add vercel
    ```

## 💻 Pengembangan Lokal

1.  **Dapatkan API Key Gemini:**
    *   Buat API key dari [Google AI Studio](https://aistudio.google.com/app/apikey).

2.  **Buat File `.env`:**
    *   Di *root directory* project, buat file baru bernama `.env`.

3.  **Tambahkan API Key ke `.env`:**
    *   Buka file `.env` dan tambahkan baris berikut, ganti `AIza...` dengan API key asli kamu:
      ```.env
      GEMINI_API_KEY=AIza...MASUKKAN_API_KEY_ASLI_ANDA...
      ```

4.  **Tambahkan `.env` ke `.gitignore`:**
    *   Pastikan file `.gitignore` di root project berisi baris berikut agar API key tidak ter-commit:
      ```gitignore
      # Environment variables
      .env
      ```

5.  **Jalankan Server Development Lokal:**
    *   Buka terminal di root directory project dan jalankan:
      ```bash
      vercel dev
      ```
    *   Aplikasi akan berjalan di `http://localhost:3000` (atau port lain jika 3000 sudah terpakai). Serverless function di folder `api` akan aktif dan membaca API key dari file `.env`.

## ☁️ Deployment ke Vercel

1.  **Push ke Repository Git:**
    *   Pastikan kode terbaru sudah di-push ke repository Git kamu (GitHub, GitLab, Bitbucket).

2.  **Impor Project di Vercel:**
    *   Login ke dashboard Vercel.
    *   Klik "Add New..." -> "Project".
    *   Pilih repository Git kamu. Vercel biasanya akan otomatis mendeteksi project (tidak perlu konfigurasi build khusus untuk project HTML/JS/API sederhana ini).

3.  **Konfigurasi Environment Variable di Vercel:**
    *   Setelah project terimpor, pergi ke **Settings -> Environment Variables**.
    *   Tambahkan variabel baru:
        *   **Name:** `GEMINI_API_KEY`
        *   **Value:** Masukkan API key Gemini asli kamu (`AIza...`).
        *   Pilih environment (biasanya Production, atau bisa juga Preview/Development jika perlu).
    *   Klik "Save".

4.  **Deploy:**
    *   Kembali ke halaman "Deployments" dan trigger deploy baru jika perlu (biasanya otomatis setelah push ke branch utama).
    *   Vercel akan men-deploy aplikasi frontend dan Serverless Function kamu.