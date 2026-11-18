# Mythoria: The Manifestation Engine
> **Konsep Inti:** Sistem Buku Kuno yang Mengubah Cerita Menjadi Kenyataan berbalut Estetika Sinema Klasik (*Vintage Cinema Tropes*).

---

## 1. Ringkasan Konsep

**Mythoria** adalah sistem permainan naratif interaktif di mana pemain memegang sebuah grimoire/buku naskah kuno. Setiap kalimat yang ditulis atau dibacakan dari buku ini tidak sekadar menjadi bacaan, melainkan memanipulasi hukum fisika, memanggil entitas, dan mengubah realitas di sekitar pemain. 

Namun, dunia ini terikat pada hukum **Kamera 35mm & Teater Seluloid**: setiap bab memancarkan estetika film zaman dulu (Noir 1940-an, Dark Fantasy 1980-an, B-Horror 1970-an).

---

## 2. Rincian Tiga Fitur Utama (Pilar 1: Manifestation Engine)

### Fitur 1: Sintaks Kata Ajaib (*Sentence / Prompt Crafting*)
Pemain memanipulasi dunia dengan merangkai struktur kalimat baku:
$$\text{Kalimat Manifestasi} = [\text{Subjek}] + [\text{Aksi / Predikat}] + [\text{Modifikasi / Sifat}]$$

* **Subjek (Fokus Objek/Fenomena):**
  * *Contoh:* `Kabut tebal`, `Lentera tua`, `Gerbang besi kuno`, `Bayangan misterius`.
* **Aksi / Predikat (Interaksi Dunia):**
  * *Contoh:* `menelan`, `menyala dengan`, `runtuh menghalangi`, `terbuka menyambut`.
* **Modifikasi / Sifat (Kondisi & Konsekuensi):**
  * *Contoh:* `para pengejar tanpa ampun`, `api zamrud mistis`, `angin malam beraroma nostalgia`.
* **Mekanisme Eksekusi:** Begitu kalimat selesai dirangkai dan distempel dengan pena buku, mesin realitas langsung mengevaluasi efeknya ke lingkungan permainan (membuka jalan buntu, membutakan musuh, menyalakan penerangan).

---

### Fitur 2: Sistem Tinta & Penghapus (*Ink & Redaction*)

Manipulasi realitas membutuhkan media fisik berupa tinta, dan setiap kesalahan penulisan memiliki harga:

1. **Klasifikasi Tinta Hidup (Resource Pool):**
   * **Tinta Jelaga (Soot Ink):** Tinta dasar yang mudah didapat. Efek manifestasinya hanya bertahan sementara (beberapa ronde/menit).
   * **Tinta Emas (Golden Leaf Ink):** Tinta langka bermuatan estetika abadi. Efek manifestasi menjadi **permanen** di dunia nyata.
   * **Tinta Darah (Crimson Sacrifice Ink):** Tinta terlarang. Memberikan amplifikasi kekuatan drastis, namun langsung mengorbankan stabilitas realitas dan memicu glitch.

2. **Coretan Naskah (*Redaction / Cross-Out*):**
   * Pemain dapat mencoret kalimat yang sudah aktif untuk membatalkan tragedi atau kesalahan taktik.
   * **Konsekuensi (*Reality Scar*):** Realitas tidak bisa dihapus tanpa bekas. Setiap pencoretan naskah menyebabkan **Robekan Dimensi / Reality Glitch** (penurunan stabilitas, distorsi audio derak proyektor, atau munculnya anomali bayangan).

---

### Fitur 3: Pemanggilan Karakter Sinema Jadul (*Character Summoning*)

Pemain dapat menulis profil tokoh fiktif untuk mewujudkannya secara fisik sebagai sekutu di dunia nyata:

| Karakter | Era / Arketipe | Kemampuan Kunci | Kuotasi Ikonik |
|---|---|---|---|
| **Detektif Noir Sinis** | 1940s Hardboiled Crime | **Deduksi Jejak:** Menemukan petunjuk tersembunyi, sidik jari, dan memecahkan puzzle kunci. | *"Kota ini membusuk, tapi jejak sepatu di lumpur ini masih segar."* |
| **Penyihir Eksentrik 80-an** | 1980s Dark Fantasy (Animatronik & Synth) | **Uraian Arcanum:** Menerjemahkan inskripsi kuno, rune terlupakan, dan formula magis. | *"Jangan sentuh gulungan itu jika kau masih menyayangi akal sehatmu!"* |
| **Stop-Motion Clay Golem** | Ray Harryhausen Tribute | **Penghancur Brutal:** Menghancurkan barikade fisik, menyerap serangan musuh dengan gerakan patah-patah (*framerate 12 fps*). | *(Suara geraman tanah liat berderak)* |

---

## 3. Arsitektur Data Sederhana (Contoh Objek Game)

```json
{
  "gameState": {
    "realityStability": 85,
    "currentGenre": "NOIR_1940",
    "inkReserve": {
      "soot": 10,
      "gold": 2,
      "crimson": 1
    },
    "activeManifestations": [
      {
        "id": "manif_001",
        "sentence": "Kabut tebal menelan para pengejar tanpa ampun.",
        "inkUsed": "soot",
        "durationTurns": 3,
        "isPermanent": false
      }
    ],
    "realityScarsCount": 1
  }
}
```

---

## 4. Rencana Pengembangan Selanjutnya
1. **Parser Kalimat Dinamis:** Menghubungkan input teks bebas pemain ke *action dispatcher*.
2. **Audio-Visual Vintage Shaders:** Menambahkan efek desisan seluloid 35mm, grain, dan filter monokrom/sepia.
3. **Skenario Bab 1:** Kasus pembunuhan di perpustakaan tua yang melibatkan naskah yang melarikan diri ke kota.
