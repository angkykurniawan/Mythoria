# Mythoria: Grimoire of Reality (Edisi Komik Sinema Klasik)

Aplikasi berbasis **React + Express.js + MySQL** yang mensimulasikan sistem buku pengubah realitas dengan gaya **Komik Retro / Sinema Seluloid Film Jadul**, lengkap dengan **Sistem Autentikasi Role-Based (Admin & User)**.

---

## 🔐 Sistem Autentikasi & Akun Bawaan

Aplikasi kini dilengkapi sistem login bertema komik retro dengan 2 peran (*Role*):

### 1. Akun Admin (Sudah Didefinisikan di Sistem):
* **Username:** `admin`
* **Password:** `admin123`
* **Peran:** `admin` (Sutradara Utama)
* **Hak Akses Khusus:** 
  * Membuka tab **"👥 Kelola Pengguna"** untuk mendaftarkan akun baru (Username, Password, Nama, Role).
  * Melihat daftar semua pengguna terdaftar dan menghapus pengguna.

### 2. Akun Dummy untuk User:
* **User 1 (Penulis):**
  * **Username:** `penulis`
  * **Password:** `user123`
  * **Peran:** `user` (Penulis Naskah)
* **User 2 (Pembaca):**
  * **Username:** `pembaca`
  * **Password:** `user123`
  * **Peran:** `user` (Kolektor Komik)

> **Fitur Praktis:** Pada halaman login terdapat tombol **"Akses Cepat Pengujian (1-Klik Masuk)"** untuk memudahkan Anda beralih antara akun Admin dan User dengan sekali klik tanpa mengetik manual.

---

## 🎨 Tampilan & Estetika Komik (Comic UI)
- **Gerbang Masuk Komik:** Tampilan login interaktif dengan balon kata dialog dan kartu karakter.
- **Panel Komik Dinamis:** Setiap kalimat manifestasi menghasilkan panel komik dengan batas garis tinta tebal (*heavy black border*), bayangan tajam (*hard comic shadow*), kotak teks narasi klasik (*caption box*), dan efek suara (*SFX badge* seperti `POW!`, `WHOOSH!`, `CLANG!`).
- **Balon Kata Karakter:** Respons dan interaksi karakter dimunculkan dalam balon kata bergaya buku komik (*comic speech bubbles*).
- **Efek Coretan (Redaction):** Mencoret naskah memicu coretan visual tebal dan menimbulkan robekan realitas (*Reality Scars*).

---

## 🔑 Integrasi Google AI Studio & Model Dinamis
- Pengguna dapat memasukkan **Google AI Studio API Key** pribadi secara langsung melalui tombol **"Pengaturan AI"** pada antarmuka.
- Tombol **"Muat Model"** akan memindai model yang aktif untuk kunci tersebut (misalnya: `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`).
- Anda dapat memilih model yang diinginkan dari menu *dropdown*.

---

## 🗄️ Konfigurasi Database MySQL (`.env`)
File kredensial database berada langsung di direktori utama: [.env](file:///c:/Users/ANG-PC/Downloads/Mythoria/.env).

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mythoria_db

PORT=5000
GEMINI_API_KEY=
```

> **Catatan:** Jika server MySQL lokal/remote Anda belum aktif atau koneksi terhalang firewall/pembatasan host remote, sistem secara otomatis beralih ke mode memori internal sementara sehingga Anda tetap dapat langsung login, menambah user, dan menguji seluruh fitur tanpa error.

---

## 🚀 Cara Menjalankan Aplikasi

Cukup buka satu terminal di folder `Mythoria` ini:

```powershell
npm run dev
```
*(Menjalankan server di port 5000 dan membuka antarmuka komik di `http://localhost:3000` secara bersamaan)*

---

## 📁 Struktur Berkas Proyek
```text
Mythoria/
├── .env                # File konfigurasi kredensial MySQL & Port
├── .env.example        # Template konfigurasi
├── db.js               # Koneksi MySQL, seed user bawaan & in-memory fallback
├── server.js           # Express API backend, auth JWT, & handler Gemini AI
├── schema.sql          # Skema database MySQL (tabel users, manifestations, dll.)
├── vite.config.js      # Konfigurasi Vite & proxy API
├── index.html          # Halaman utama aplikasi
├── package.json        # Dependensi React + Express + Tailwind + JWT + Bcrypt
├── README.md           # Petunjuk penggunaan
└── src/
    ├── App.jsx         # Antarmuka Comic UI, Portal Login, & Kelola Pengguna
    ├── index.css       # Styling Comic UI (Borders, SFX, Bubbles)
    └── main.jsx        # Entry point React
```
