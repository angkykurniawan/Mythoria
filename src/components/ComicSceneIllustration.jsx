import React from 'react';

// Generator Ilustrasi Komik Vektor Retro 35mm
export default function ComicSceneIllustration({ sceneType = 'generic', subject = '', action = '', sentence = '' }) {
  // Tentukan tema visual berdasarkan kata kunci di naskah
  const text = (sentence + ' ' + subject + ' ' + sceneType).toLowerCase();

  let theme = 'action';
  if (text.includes('proyektor') || text.includes('film') || text.includes('35mm')) {
    theme = 'projector';
  } else if (text.includes('kabut') || text.includes('asap') || text.includes('hujan')) {
    theme = 'fog';
  } else if (text.includes('lentera') || text.includes('api') || text.includes('cahaya')) {
    theme = 'lantern';
  } else if (text.includes('gerbang') || text.includes('pintu') || text.includes('dinding')) {
    theme = 'gate';
  } else if (text.includes('bayangan') || text.includes('gelap') || text.includes('sosok')) {
    theme = 'shadow';
  } else if (text.includes('noir') || text.includes('detektif')) {
    theme = 'noir';
  } else if (text.includes('penyihir') || text.includes('sihir') || text.includes('arcane')) {
    theme = 'wizard';
  } else if (text.includes('golem') || text.includes('monster') || text.includes('tanah')) {
    theme = 'golem';
  }

  return (
    <div className="w-full relative overflow-hidden border-3 border-black bg-neutral-900 shadow-[4px_4px_0_#000] my-2 select-none">
      
      {/* Strip Lubang Seluloid Film 35mm Atas */}
      <div className="h-4 bg-black flex items-center justify-between px-2 border-b-2 border-black">
        {[...Array(12)].map((_, i) => (
          <div key={`sprocket-top-${i}`} className="w-2.5 h-2 bg-yellow-100 rounded-xs border border-neutral-700" />
        ))}
      </div>

      {/* Kanvas Ilustrasi Komik (SVG Vektor) */}
      <div className="w-full h-52 sm:h-64 relative bg-neutral-950 flex items-center justify-center overflow-hidden">
        
        {/* Efek Garis Gerak / Speedlines Komik */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="500" y2="250" stroke="#fff" strokeWidth="2" strokeDasharray="15 10" />
          <line x1="500" y1="0" x2="0" y2="250" stroke="#fff" strokeWidth="2" strokeDasharray="15 10" />
          <line x1="250" y1="0" x2="250" y2="250" stroke="#fff" strokeWidth="1" strokeDasharray="8 8" />
          <line x1="0" y1="125" x2="500" y2="125" stroke="#fff" strokeWidth="1" strokeDasharray="8 8" />
        </svg>

        {/* 1. SCENE: PROYEKTOR FILM 35MM MENELAN PENGEJAR */}
        {theme === 'projector' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            {/* Latar Belakang Sorotan Lampu */}
            <defs>
              <radialGradient id="proj-beam" cx="15%" cy="50%" r="80%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="500" height="250" fill="#171717" />
            
            {/* Kerucut Sorotan Lensa Proyektor */}
            <polygon points="85,120 480,20 480,230" fill="url(#proj-beam)" />
            
            {/* Siluet Proyektor 35mm Vintage */}
            <g transform="translate(20, 50)">
              {/* Tripod Kaki Tiga */}
              <line x1="60" y1="120" x2="10" y2="190" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              <line x1="60" y1="120" x2="60" y2="190" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              <line x1="60" y1="120" x2="110" y2="190" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              
              {/* Bodi Kamera Proyektor */}
              <rect x="35" y="60" width="55" height="60" fill="#262626" stroke="#000" strokeWidth="5" rx="3" />
              
              {/* Dua Reel Putar Film Atas & Bawah */}
              <circle cx="45" cy="35" r="24" fill="#525252" stroke="#000" strokeWidth="4" />
              <circle cx="45" cy="35" r="10" fill="#171717" stroke="#000" strokeWidth="3" />
              <circle cx="85" cy="35" r="24" fill="#525252" stroke="#000" strokeWidth="4" />
              <circle cx="85" cy="35" r="10" fill="#171717" stroke="#000" strokeWidth="3" />
              
              {/* Lensa Depan Menyala */}
              <polygon points="90,75 115,65 115,105 90,95" fill="#facc15" stroke="#000" strokeWidth="4" />
              <circle cx="115" cy="85" r="8" fill="#ffffff" />
            </g>

            {/* Pusaran Pita Film Melayang Menghisap Musuh */}
            <path d="M 130 130 Q 250 80 340 140 T 460 110" fill="none" stroke="#000" strokeWidth="14" />
            <path d="M 130 130 Q 250 80 340 140 T 460 110" fill="none" stroke="#fef08a" strokeWidth="8" strokeDasharray="6 4" />

            {/* Siluet Para Pengejar Terhisap Masuk ke Berkas Cahaya */}
            <g transform="translate(350, 80) scale(0.9)">
              {/* Sosok 1 Terdistorsi */}
              <path d="M 30 10 C 25 25, 10 50, 0 80 L 15 80 C 25 55, 35 40, 45 75 L 55 70 C 45 40, 50 20, 30 10 Z" fill="#000000" />
              <circle cx="30" cy="5" r="8" fill="#000" />
            </g>
            <g transform="translate(410, 110) scale(0.7)">
              {/* Sosok 2 Terhisap */}
              <path d="M 25 15 C 20 30, 5 55, -5 85 L 10 85 C 20 60, 30 45, 40 80 L 50 75 C 40 45, 45 25, 25 15 Z" fill="#000000" />
              <circle cx="25" cy="8" r="8" fill="#000" />
            </g>

            {/* Efek Ledakan Cahaya Komik */}
            <polygon points="135,135 145,115 155,130 170,120 160,140 180,150 155,155 150,175 140,155 120,160 130,145 115,135" fill="#ef4444" stroke="#000" strokeWidth="3" />
          </svg>
        )}

        {/* 2. SCENE: KABUT TEBAL / MALAM MISTERIUS */}
        {theme === 'fog' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#09090b" />
            {/* Cahaya Lentera Jalanan */}
            <radialGradient id="lamp-glow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
            </radialGradient>
            <circle cx="100" cy="90" r="130" fill="url(#lamp-glow)" />
            
            {/* Tiang Lampu Kuno */}
            <path d="M 95 60 L 105 60 L 102 230 L 98 230 Z" fill="#27272a" stroke="#000" strokeWidth="3" />
            <polygon points="85,60 115,60 120,75 80,75" fill="#facc15" stroke="#000" strokeWidth="3" />

            {/* Awan Kabut Gelombang Tebal */}
            <path d="M 0 160 Q 120 120 250 170 T 500 150 L 500 250 L 0 250 Z" fill="#27272a" opacity="0.6" />
            <path d="M 0 190 Q 140 150 280 200 T 500 180 L 500 250 L 0 250 Z" fill="#3f3f46" opacity="0.8" />
            
            {/* Mata Merah Misterius di Balik Kabut */}
            <circle cx="340" cy="140" r="4" fill="#ef4444" className="animate-pulse" />
            <circle cx="355" cy="140" r="4" fill="#ef4444" className="animate-pulse" />
          </svg>
        )}

        {/* 3. SCENE: LENTERA TUA / API ZAMRUD */}
        {theme === 'lantern' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#18181b" />
            <radialGradient id="fire-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
            </radialGradient>
            <circle cx="250" cy="120" r="140" fill="url(#fire-glow)" />

            {/* Lentera Minyak Antik di Tengah */}
            <g transform="translate(210, 50)">
              {/* Pegangan Kawat */}
              <path d="M 15 30 Q 40 5 65 30" fill="none" stroke="#000" strokeWidth="5" />
              {/* Tutup Atas */}
              <polygon points="20,40 60,40 50,25 30,25" fill="#78350f" stroke="#000" strokeWidth="4" />
              {/* Kaca Berisi Api Hijau Zamrud */}
              <rect x="22" y="40" width="36" height="55" fill="#a7f3d0" stroke="#000" strokeWidth="4" rx="6" />
              {/* Lidah Api Zamrud */}
              <path d="M 40 85 Q 30 65 40 50 Q 50 65 40 85 Z" fill="#059669" />
              <path d="M 40 80 Q 35 68 40 58 Q 45 68 40 80 Z" fill="#34d399" />
              {/* Alas Besi Lentera */}
              <rect x="15" y="95" width="50" height="20" fill="#78350f" stroke="#000" strokeWidth="4" rx="2" />
            </g>
          </svg>
        )}

        {/* 4. SCENE: GERBANG BESI / KASTIL */}
        {theme === 'gate' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#1e1b4b" />
            {/* Bulan Purnama Merah */}
            <circle cx="250" cy="60" r="45" fill="#f43f5e" stroke="#000" strokeWidth="4" />
            {/* Pilar Batu Gerbang */}
            <rect x="110" y="30" width="50" height="220" fill="#334155" stroke="#000" strokeWidth="6" />
            <rect x="340" y="30" width="50" height="220" fill="#334155" stroke="#000" strokeWidth="6" />
            {/* Jeruji Besi Tajam Terbuka */}
            <line x1="160" y1="50" x2="220" y2="230" stroke="#000" strokeWidth="6" />
            <line x1="185" y1="50" x2="235" y2="230" stroke="#000" strokeWidth="6" />
            <line x1="340" y1="50" x2="280" y2="230" stroke="#000" strokeWidth="6" />
            <line x1="315" y1="50" x2="265" y2="230" stroke="#000" strokeWidth="6" />
          </svg>
        )}

        {/* 5. SCENE: DETEKTIF NOIR */}
        {theme === 'noir' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#18181b" />
            {/* Sorot Lampu Jalan Noir */}
            <polygon points="120,0 20,250 250,250" fill="#fef08a" opacity="0.3" />
            {/* Siluet Detektif Mantel & Topi Fedora */}
            <g transform="translate(180, 50)">
              {/* Topi Fedora */}
              <ellipse cx="70" cy="35" rx="35" ry="8" fill="#000" />
              <path d="M 45 35 C 50 15, 90 15, 95 35 Z" fill="#000" />
              {/* Kerah Mantel Parit */}
              <path d="M 35 70 L 60 50 L 80 50 L 105 70 L 120 180 L 20 180 Z" fill="#000" stroke="#27272a" strokeWidth="2" />
              {/* Asap Rokok Putih */}
              <path d="M 72 48 Q 85 40 80 30 T 95 15" fill="none" stroke="#fff" strokeWidth="3" opacity="0.8" />
            </g>
          </svg>
        )}

        {/* 6. SCENE: PENYIHIR 80-AN */}
        {theme === 'wizard' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#3b0764" />
            {/* Lingkaran Sihir Runic Bercahaya */}
            <circle cx="250" cy="130" r="80" fill="none" stroke="#c084fc" strokeWidth="4" strokeDasharray="8 6" />
            <polygon points="250,60 310,165 190,165" fill="none" stroke="#f472b6" strokeWidth="3" />
            <polygon points="250,200 310,95 190,95" fill="none" stroke="#f472b6" strokeWidth="3" />
            {/* Siluet Jubah & Topi Penyihir */}
            <g transform="translate(210, 50)">
              <polygon points="40,10 70,70 10,70" fill="#000" />
              <ellipse cx="40" cy="70" rx="35" ry="8" fill="#000" />
              <path d="M 15 75 L 65 75 L 75 160 L 5 160 Z" fill="#000" />
            </g>
          </svg>
        )}

        {/* 7. SCENE: STOP-MOTION CLAY GOLEM */}
        {theme === 'golem' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#1c1917" />
            {/* Tembok Hancur / Reruntuhan */}
            <polygon points="80,180 120,130 180,190" fill="#78716c" stroke="#000" strokeWidth="4" />
            <polygon points="320,190 380,140 430,200" fill="#78716c" stroke="#000" strokeWidth="4" />
            {/* Golem Tanah Liat Berotot Tebal */}
            <g transform="translate(190, 40)">
              <rect x="25" y="20" width="70" height="60" fill="#a8a29e" stroke="#000" strokeWidth="6" rx="8" />
              <rect x="40" y="5" width="40" height="25" fill="#78716c" stroke="#000" strokeWidth="5" rx="4" />
              {/* Mata Bersinar Merah */}
              <circle cx="50" cy="18" r="4" fill="#ef4444" />
              <circle cx="70" cy="18" r="4" fill="#ef4444" />
              {/* Lengan Kekar Stop-Motion */}
              <rect x="-10" y="30" width="35" height="90" fill="#78716c" stroke="#000" strokeWidth="6" rx="8" transform="rotate(20 10 30)" />
              <rect x="95" y="30" width="35" height="90" fill="#78716c" stroke="#000" strokeWidth="6" rx="8" transform="rotate(-20 110 30)" />
            </g>
          </svg>
        )}

        {/* 8. SCENE: AKSI DRAMATIS UMUM (ACTION HERO / EXPLOSION) */}
        {theme === 'action' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#171717" />
            {/* Ledakan Bintang Komik Kuning-Merah */}
            <polygon points="250,20 280,80 350,40 330,110 400,125 330,150 360,220 280,180 250,240 210,180 140,220 165,150 90,130 160,110 140,40 210,80" fill="#facc15" stroke="#000" strokeWidth="6" />
            <polygon points="250,50 270,90 320,60 300,110 350,125 300,140 320,190 270,160 250,200 220,160 170,190 190,140 140,125 190,110 170,60 220,90" fill="#ef4444" stroke="#000" strokeWidth="4" />
            
            {/* Siluet Aksi Tengah */}
            <g transform="translate(225, 90)">
              <circle cx="25" cy="10" r="14" fill="#000" />
              <path d="M 25 24 L 25 70 L 5 95 M 25 70 L 45 95 M 25 35 L 5 20 M 25 35 L 50 15" stroke="#000" strokeWidth="8" strokeLinecap="round" />
            </g>
          </svg>
        )}

      </div>

      {/* Strip Lubang Seluloid Film 35mm Bawah */}
      <div className="h-4 bg-black flex items-center justify-between px-2 border-t-2 border-black">
        {[...Array(12)].map((_, i) => (
          <div key={`sprocket-bot-${i}`} className="w-2.5 h-2 bg-yellow-100 rounded-xs border border-neutral-700" />
        ))}
      </div>

    </div>
  );
}
