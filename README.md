# Mythoria: Grimoire of Reality (Edisi Komik Sinema Klasik & Generator AI)

Aplikasi berbasis **React + Express.js + MySQL + Google Gemini AI** yang mensimulasikan sistem grimoire pengubah realitas dengan format **Buku Komik Retro / Sinema Seluloid Film 35mm**, lengkap dengan **Sistem Autentikasi Role-Based (Admin & User)** dan **Generator Komik Multi-Panel Dinamis**.

Setiap naskah yang Anda ketikkan secara nyata diwujudkan menjadi panel komik utuh lengkap dengan balon dialog, efek suara (*SFX*), ilustrasi visual adaptif, dan pilihan cabang cerita (*Choose Your Own Adventure*).

---

## 🔐 Kredensial Akun Pengujian (Masuk Melalui Form Login)

Untuk menjaga tampilan antarmuka tetap bersih dan realistis, tombol akses cepat 1-klik telah dihapus dari layar login. Silakan masukkan kredensial berikut langsung ke dalam formulir login:

| Peran (*Role*) | Username | Password | Deskripsi & Hak Akses |
| :--- | :--- | :--- | :--- |
| **ADMIN (Sutradara)** | `admin` | `admin123` | Hak akses penuh: Membuka tab **👥 Kelola Pengguna**, mendaftarkan akun baru, melihat dan menghapus pengguna terdaftar. |
| **USER DUMMY 1 (Penulis)** | `penulis` | `user123` | Peran penulis: Menuliskan naskah bebas, memilih jenis tinta (Jelaga, Emas, Darah), dan mewujudkan halaman komik baru. |
| **USER DUMMY 2 (Pembaca)** | `pembaca` | `user123` | Peran pembaca/kolektor: Membaca komik, memilih cabang cerita interaktif, serta mengunduh/mencetak lembaran buku komik. |

---

## 📖 Alur Pembuatan Komik (*Comic Generation Pipeline*)

Proses pembuatan komik di Mythoria mengadopsi arsitektur **Agentic Workflow** yang menggabungkan fleksibilitas AI kreatif dengan keandalan sistem tata letak terstruktur:

```text
[Input Naskah & Tinta] 
         ↓
[Sutradara AI / Generator Cerdas Fallback di server.js]
  - Mengekstrak kontinuitas cerita sebelumnya
  - Menyusun 5 panel cerita berurutan (dialogue, speaker, bubble type, SFX)
  - Merancang 2 jalur cabang kelanjutan (Jalur 🅰️ & 🅱️)
         ↓
[Engine Komik SVG Adaptif di ComicBookPage.jsx]
  - Menyesuaikan gradien dan siluet dengan tema (Sci-Fi, Fantasi, Noir, dll.)
  - Membungkus teks dialog otomatis ke dalam balon ucapan (<tspan>)
  - Merender tata letak multi-panel (5-Panel, 4-Panel, atau 3-Panel)
         ↓
[Ekspor / Interaktivitas]
  - Unduh Halaman Tunggal (PNG Resolusi Tinggi 1200x1700)
  - Cetak / Simpan PDF Halaman Komik
  - Buka Halaman Cabang Berikutnya (Choose Your Own Adventure)
```

---

## 🎨 Fitur Utama & Visual Komik Adaptif

1. **Lembar Komik Multi-Panel Dinamis (100% Sesuai Deskripsi):**
   - Dialog, nama tokoh, narasi, dan efek suara otomatis dibuat berdasarkan apa yang Anda tuliskan.
   - **Variasi Grid Layout:**
     - 🖼️ **5-Panel Dinamis**: 1 panel panorama atas pembuka, 2 panel tengah, 2 panel bawah klimaks.
     - 🔲 **4-Panel Grid (2×2)**: Tata letak kotak seimbang klasik.
     - 🎞️ **3-Panel Sinematik**: 3 strip memanjang horizontal bergaya layar lebar.

2. **Tema Visual Menyesuaikan Genre Cerita:**
   - 🚀 **Sci-Fi / Antariksa / Mecha**: Langit kosmik, bintang, pesawat tempur, dan tembakan laser.
   - ⚔️ **Fantasi / Sihir / Pedang / Naga**: Semburan api naga, pedang pusaka bercahaya, rune sihir, kastil.
   - 🕵️ **Detektif / Noir**: Suasana kota malam berhujan, siluet fedora & mantel, lampu jalan temaram.
   - 👁️ **Horor / Misteri**: Langit kelam, siluet pohon angker, bayangan dengan mata merah berpijar.
   - 🌊 **Petualangan / Samudra**: Kapal layar menembus gelombang ombak samudra.
   - 💻 **Cyberpunk / Kota Neon**: Grid holografik perspektif dan matahari digital.
   - 💥 **Aksi & Pertarungan**: Benturan energi, ledakan komik retro, dan garis kecepatan (*speedlines*).

3. **Mekanika Tinta Pengubah Realitas:**
   - 🖋️ **Tinta Jelaga**: Tinta sementara biasa (konsumsi 2 tetes).
   - 🌟 **Tinta Emas**: Tinta abadi untuk peristiwa agung dan pemanggilan karakter (konsumsi 1 tetes).
   - 🩸 **Tinta Darah**: Tinta berbahaya yang memicu robekan realitas (*Reality Scar*) dan mengurangi stabilitas dunia cerita.

4. **Cabang Cerita Interaktif (*Choose Your Own Adventure*):**
   - Setiap akhir lembar halaman menyediakan opsi kelanjutan takdir 🅰️ dan 🅱️ yang dibuat secara kontekstual sesuai aksi naskah Anda.

5. **Memori Cerita Berkelanjutan (*Story Context Memory*):**
   - Saat menulis Halaman 2, 3, dan seterusnya, AI secara otomatis membaca jejak narasi babak-babak sebelumnya sehingga alur cerita bersambung secara sinematik (*no continuity errors*).
   - Terdapat kartu ringkasan memori alur di atas formulir penulisan untuk memantau perjalanan naskah.

6. **Bible Karakter & Konsistensi Tokoh (*Character Sheet*):**
   - Penulis dapat menentukan nama, watak, archetype, serta pakaian/warna rambut tokoh utama dan pendamping.
   - Atribut tokoh ini otomatis diwariskan ke setiap dialog, deskripsi adegan AI, dan palet visual karakter SVG.
   - Tersedia preset siap pakai: *Cyber Ronin (Rian & Maya)*, *Detektif Noir (Arthur & Joe)*, *Ksatria Fantasi (Valen & Lyra)*, dan *Profesor Sinema (Aris & Kiki)*.

7. **Opsi Gambar Nyata Berbasis AI (*Hybrid Rendering Mode*):**
   - ⚡ **Mode Vektor Cepat (Bawaan):** Menggunakan renderer prosedural SVG pop-art retro komik, instan, dan 100% hemat kuota.
   - 🎨 **Mode Ilustrasi Nyata AI (Imagen 3):** Memanfaatkan model generasi gambar Google AI Studio untuk melukis adegan klimaks panel menjadi karya seni komik resolusi tinggi dengan tombol 1-klik *Lukis AI Imagen* per panel.

8. **Ekspor Resolusi Tinggi & Cetak:**
   - Konversi SVG langsung ke PNG 1200×1700 piksel melalui Canvas serializer.
   - Dialog cetak browser terintegrasi untuk menyimpan seluruh buku komik ke file PDF utuh.

---

## 🔑 Pengaturan AI & Model Selection

- Anda dapat memasukkan **Google AI Studio API Key** secara langsung melalui tombol **"Pengaturan AI"** di pojok kanan atas.
- Tombol **"Muat Model"** memindai model yang aktif untuk API key Anda (misalnya: `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`).
- **Mode Offline / Cerdas Tanpa Key:** Jika API Key belum dimasukkan atau kuota token habis, sistem otomatis beralih ke generator lokal cerdas (*Intelligent Fallback*) yang menganalisis subjek dan tindakan naskah secara dinamis.

---

## 🗄️ Konfigurasi Database MySQL (`.env`)

Konfigurasi database disimpan pada file [.env](file:///c:/Users/ANG-PC/Downloads/Mythoria/.env):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mythoria_db

PORT=5000
GEMINI_API_KEY=
```

> **Catatan:** Jika server MySQL lokal Anda belum aktif, backend otomatis menggunakan penyimpanan memori internal sementara (*in-memory fallback store*) sehingga aplikasi tetap dapat berjalan normal untuk pengujian.

Skema database lengkap dapat dilihat dan diimpor dari berkas [schema.sql](file:///c:/Users/ANG-PC/Downloads/Mythoria/schema.sql).

---

## 🚀 Cara Menjalankan Aplikasi

1. **Pasang Dependensi:**
   ```powershell
   npm install
   ```

2. **Jalankan Server & Frontend Sekaligus:**
   ```powershell
   npm run dev
   ```
   *(Menjalankan server API di port 5000 dan antarmuka web Vite di `http://localhost:5173` atau `http://localhost:3000`)*

3. **Build untuk Produksi:**
   ```powershell
   npm run build
   ```

---

## 📁 Struktur Berkas Proyek

```text
Mythoria/
├── .env                              # Konfigurasi kredensial database & server
├── .env.example                      # Contoh template konfigurasi
├── db.js                             # Modul database MySQL & in-memory fallback
├── server.js                         # Express backend API, auth JWT, & Sutradara AI
├── schema.sql                        # Skema tabel MySQL (users, manifestations, dll.)
├── vite.config.js                    # Konfigurasi Vite & proxy API
├── package.json                      # Dependensi proyek
├── README.md                         # Dokumentasi & panduan aplikasi
└── src/
    ├── App.jsx                       # State utama, portal login, & input naskah
    ├── index.css                     # Desain styling Comic UI (SFX, bubbles, borders, fonts)
    ├── main.jsx                      # Entry point React
    └── components/
        ├── ComicBookPage.jsx         # Engine komik SVG: drag-and-drop bubble, font komik, AI Imagen
        ├── ComicSceneIllustration.jsx# Kartu ilustrasi panel vektor seluloid 35mm
        ├── FullBookModal.jsx         # Modal ekspor & cetak buku komik utuh ke PDF
        └── MythoriaLogo.jsx          # Komponen logo SVG resmi mandiri (anti-404)
```

---

### 🎨 Fitur Tipografi & Interactive Bubble Editor Baru

1. **✍️ Editor Teks & Posisi Balon Dialog Interaktif**:
   - Klik balon ucapan atau efek suara (SFX) di panel mana saja untuk langsung menyunting teks, nama pembicara, atau tipe balon (Biasa, Teriak 💥, Pikiran 💭) tanpa perlu generate ulang.
   - Fitur **Drag-and-Drop**: Geser posisi balon ucapan dan SFX di dalam panel secara bebas dengan mouse agar tidak menutupi wajah karakter.
   - Tombol **Reset Posisi** untuk mengembalikan posisi balon ke layout default jika diinginkan.
2. **🔤 Pilihan Tipografi Komik Profesional**:
   - Mendukung berbagai gaya font komik dunia nyata:
     - **Bangers (Marvel / Retro Bold Pop-Art)**
     - **Comic Neue (Clean & Crisp Lettering)**
     - **Boogaloo (Retro 70s Cartoon Funky)**
     - **Patrick Hand (Indie Hand-Lettered)**
     - **Klasik Standar (System Sans-serif)**
   - Semua tipografi dialog dan onomatopoeia otomatis menyesuaikan secara realtime di SVG canvas serta ikut ter-render saat diekspor ke format PNG maupun PDF.

---

### 👥 Menu Pengelolaan & Tambah Pengguna (Admin)
- Khusus akun **Sutradara (Admin)**, kini tersedia tombol menu **"👥 Tambah User"** langsung di bilah navigasi atas (*Header*).
- Modal interaktif admin memungkinkan:
  - Mendaftarkan akun pengguna baru (Nama Lengkap, Username, Password, Role: *USER* / *ADMIN*).
  - Melihat seluruh arsip akun yang aktif di sistem secara realtime.
  - Menghapus akun pengguna yang tidak diperlukan lagi.