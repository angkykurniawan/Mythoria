import React from 'react';

// Generator Ilustrasi Komik Vektor Retro 35mm yang 100% Adaptif terhadap Deskripsi
export default function ComicSceneIllustration({ sceneType = 'generic', subject = '', action = '', sentence = '' }) {
  const text = (sentence + ' ' + subject + ' ' + action + ' ' + sceneType).toLowerCase();

  // Deteksi tema visual komik secara cerdas
  let theme = 'action';
  if (text.includes('bajaj') || (text.includes('profesor') && text.includes('bum'))) {
    theme = 'bajaj';
  } else if (text.includes('robot') || text.includes('mecha') || text.includes('cyborg') || text.includes('android')) {
    theme = 'mecha';
  } else if (text.includes('angkasa') || text.includes('alien') || text.includes('planet') || text.includes('galaksi') || text.includes('bintang') || text.includes('laser')) {
    theme = 'scifi';
  } else if (text.includes('naga') || text.includes('dragon')) {
    theme = 'dragon';
  } else if (text.includes('pedang') || text.includes('ksatria') || text.includes('kerajaan') || text.includes('istana')) {
    theme = 'sword';
  } else if (text.includes('sihir') || text.includes('penyihir') || text.includes('mantra') || text.includes('arcane')) {
    theme = 'wizard';
  } else if (text.includes('proyektor') || text.includes('35mm') || text.includes('seluloid')) {
    theme = 'projector';
  } else if (text.includes('detektif') || text.includes('noir') || text.includes('kasus') || text.includes('pistol')) {
    theme = 'noir';
  } else if (text.includes('kabut') || text.includes('asap') || text.includes('hujan') || text.includes('malam')) {
    theme = 'fog';
  } else if (text.includes('lentera') || text.includes('api') || text.includes('cahaya')) {
    theme = 'lantern';
  } else if (text.includes('laut') || text.includes('kapal') || text.includes('samudra') || text.includes('ombak') || text.includes('pulau')) {
    theme = 'ocean';
  } else if (text.includes('cyber') || text.includes('hacker') || text.includes('neon') || text.includes('matrix')) {
    theme = 'cyber';
  } else if (text.includes('hantu') || text.includes('makam') || text.includes('seram') || text.includes('kutukan') || text.includes('darah')) {
    theme = 'horror';
  } else if (text.includes('gerbang') || text.includes('pintu') || text.includes('dinding')) {
    theme = 'gate';
  }

  // Label cuplikan naskah
  const displayLabel = subject || sentence.slice(0, 40) || 'Adegan Nyata';

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
        
        {/* Speedlines Dinamis Komik */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="500" y2="250" stroke="#fff" strokeWidth="2" strokeDasharray="15 10" />
          <line x1="500" y1="0" x2="0" y2="250" stroke="#fff" strokeWidth="2" strokeDasharray="15 10" />
          <line x1="250" y1="0" x2="250" y2="250" stroke="#fff" strokeWidth="1" strokeDasharray="8 8" />
          <line x1="0" y1="125" x2="500" y2="125" stroke="#fff" strokeWidth="1" strokeDasharray="8 8" />
        </svg>

        {/* 1. SCENE: SCI-FI / KOSMIK ANTARIKSA */}
        {theme === 'scifi' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <defs>
              <linearGradient id="scifi-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#030712" />
                <stop offset="60%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
            </defs>
            <rect width="500" height="250" fill="url(#scifi-bg)" />
            {/* Bintang-bintang Antariksa */}
            <circle cx="50" cy="40" r="2" fill="#fff" opacity="0.9" />
            <circle cx="120" cy="80" r="1.5" fill="#38bdf8" opacity="0.8" />
            <circle cx="220" cy="30" r="2.5" fill="#fde047" opacity="0.9" />
            <circle cx="380" cy="60" r="2" fill="#fff" opacity="0.8" />
            <circle cx="450" cy="110" r="1.5" fill="#a855f7" opacity="0.7" />
            <circle cx="310" cy="40" r="1.5" fill="#fff" opacity="0.6" />
            {/* Planet Bercincin */}
            <circle cx="400" cy="70" r="38" fill="#6366f1" stroke="#000" strokeWidth="2" />
            <ellipse cx="400" cy="70" rx="60" ry="12" fill="none" stroke="#a5b4fc" strokeWidth="3" transform="rotate(-18 400 70)" />
            {/* Pesawat Tempur Antariksa Menukik */}
            <g transform="translate(140, 60)">
              <polygon points="120,40 20,10 50,45 20,80" fill="#38bdf8" stroke="#000" strokeWidth="4" />
              <polygon points="110,40 45,25 65,45 45,65" fill="#e0f2fe" stroke="#000" strokeWidth="2" />
              <polygon points="20,40 0,42 0,48 20,50" fill="#f43f5e" stroke="#000" strokeWidth="2" />
              {/* Semburan Api Mesin Jet Plasma */}
              <polygon points="0,45 -50,35 -35,45 -50,55" fill="#facc15" />
              <polygon points="0,45 -25,40 -20,45 -25,50" fill="#ffffff" />
            </g>
            {/* Berkas Tembakan Laser Merah & Biru */}
            <line x1="260" y1="102" x2="480" y2="150" stroke="#f43f5e" strokeWidth="4" strokeDasharray="30 15" />
            <line x1="260" y1="106" x2="480" y2="154" stroke="#fde047" strokeWidth="2" />
          </svg>
        )}

        {/* 2. SCENE: ROBOT / MECHA RAKSASA */}
        {theme === 'mecha' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#0f172a" />
            {/* Siluet Gedung Kota Neon di Belakang */}
            <rect x="30" y="90" width="60" height="160" fill="#1e293b" stroke="#000" strokeWidth="2" />
            <rect x="100" y="120" width="50" height="130" fill="#334155" stroke="#000" strokeWidth="2" />
            <rect x="370" y="80" width="70" height="170" fill="#1e293b" stroke="#000" strokeWidth="2" />
            <rect x="430" y="110" width="50" height="140" fill="#334155" stroke="#000" strokeWidth="2" />
            {/* Badan Mecha Perkasa */}
            <g transform="translate(190, 40)">
              <rect x="25" y="45" width="70" height="80" fill="#3b82f6" stroke="#000" strokeWidth="5" rx="6" />
              <rect x="35" y="15" width="50" height="35" fill="#1d4ed8" stroke="#000" strokeWidth="4" rx="4" />
              {/* Visor Mata Laser Menyala */}
              <rect x="42" y="28" width="36" height="8" fill="#fde047" stroke="#000" strokeWidth="2" />
              {/* Bahu Baja Mecha */}
              <polygon points="25,45 -10,35 -5,75 25,65" fill="#1e40af" stroke="#000" strokeWidth="4" />
              <polygon points="95,45 130,35 125,75 95,65" fill="#1e40af" stroke="#000" strokeWidth="4" />
              {/* Dada Inti Reaktor Arc */}
              <circle cx="60" cy="85" r="16" fill="#06b6d4" stroke="#000" strokeWidth="3" />
              <circle cx="60" cy="85" r="8" fill="#ffffff" />
            </g>
          </svg>
        )}

        {/* 3. SCENE: NAGA PURBA / DRAGON */}
        {theme === 'dragon' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#1c1917" />
            {/* Bulan Purnama Merah Darah */}
            <circle cx="340" cy="80" r="50" fill="#ef4444" stroke="#000" strokeWidth="3" />
            {/* Siluet Sayap & Kepala Naga */}
            <g transform="translate(60, 30)">
              {/* Sayap Berselaput */}
              <path d="M 60 100 Q 140 10 240 50 Q 180 90 200 130 Q 140 100 120 140 Z" fill="#991b1b" stroke="#000" strokeWidth="4" />
              {/* Leher dan Kepala Naga */}
              <path d="M 120 140 Q 160 100 230 110 L 290 85 L 260 110 L 295 115 L 250 135 Z" fill="#7f1d1d" stroke="#000" strokeWidth="4" />
              {/* Mata Kuning Tajam */}
              <circle cx="265" cy="100" r="4" fill="#facc15" stroke="#000" strokeWidth="1" />
              {/* Hembusan Semburan Api Membakar */}
              <path d="M 295 115 Q 380 90 440 130 Q 360 145 295 125 Z" fill="#f97316" stroke="#000" strokeWidth="2" />
              <path d="M 300 118 Q 360 100 400 125 Q 350 135 300 122 Z" fill="#fef08a" />
            </g>
          </svg>
        )}

        {/* 4. SCENE: PEDANG / KSATRIA / BATTLEFIELD */}
        {theme === 'sword' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#18181b" />
            {/* Benteng Istana Kastil Kuno */}
            <polygon points="50,190 50,110 80,110 80,130 110,130 110,110 140,110 140,190" fill="#3f3f46" stroke="#000" strokeWidth="3" />
            {/* Dua Pedang Bersilang Bercahaya */}
            <g transform="translate(250, 115)">
              {/* Kilau Benturan Bintang */}
              <polygon points="0,-35 10,-10 35,0 10,10 0,35 -10,10 -35,0 -10,-10" fill="#fef08a" stroke="#000" strokeWidth="2" />
              {/* Pedang Kiri */}
              <line x1="-90" y1="-70" x2="80" y2="70" stroke="#000" strokeWidth="10" strokeLinecap="round" />
              <line x1="-90" y1="-70" x2="80" y2="70" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
              {/* Pedang Kanan */}
              <line x1="90" y1="-70" x2="-80" y2="70" stroke="#000" strokeWidth="10" strokeLinecap="round" />
              <line x1="90" y1="-70" x2="-80" y2="70" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
            </g>
          </svg>
        )}

        {/* 5. SCENE: SIHIR / PENYIHIR ARCANE */}
        {theme === 'wizard' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#3b0764" />
            {/* Lingkaran Sihir Runic */}
            <circle cx="250" cy="125" r="75" fill="none" stroke="#c084fc" strokeWidth="4" strokeDasharray="8 6" />
            <polygon points="250,55 310,160 190,160" fill="none" stroke="#f472b6" strokeWidth="3" />
            <polygon points="250,195 310,90 190,90" fill="none" stroke="#f472b6" strokeWidth="3" />
            {/* Siluet Jubah & Topi Penyihir */}
            <g transform="translate(210, 45)">
              <polygon points="40,10 70,70 10,70" fill="#000" />
              <ellipse cx="40" cy="70" rx="35" ry="8" fill="#000" />
              <path d="M 15 75 L 65 75 L 75 160 L 5 160 Z" fill="#000" />
            </g>
            <circle cx="340" cy="90" r="14" fill="#a855f7" className="animate-pulse" />
            <circle cx="340" cy="90" r="6" fill="#fff" />
          </svg>
        )}

        {/* 6. SCENE: NOIR / DETEKTIF KOTA MALAM */}
        {theme === 'noir' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#18181b" />
            {/* Sorot Lampu Jalan Kuning */}
            <polygon points="120,0 20,250 250,250" fill="#fef08a" opacity="0.3" />
            {/* Siluet Detektif Mantel & Topi Fedora */}
            <g transform="translate(180, 50)">
              <ellipse cx="70" cy="35" rx="35" ry="8" fill="#000" />
              <path d="M 45 35 C 50 15, 90 15, 95 35 Z" fill="#000" />
              <path d="M 35 70 L 60 50 L 80 50 L 105 70 L 120 180 L 20 180 Z" fill="#000" stroke="#27272a" strokeWidth="2" />
              <path d="M 72 48 Q 85 40 80 30 T 95 15" fill="none" stroke="#fff" strokeWidth="3" opacity="0.8" />
            </g>
          </svg>
        )}

        {/* 7. SCENE: SAMUDRA / LAUT / KAPAL */}
        {theme === 'ocean' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#082f49" />
            {/* Ombak Bergulung */}
            <path d="M 0 160 Q 80 120 160 160 T 320 160 T 480 160 L 500 250 L 0 250 Z" fill="#0369a1" />
            <path d="M 0 190 Q 90 150 180 190 T 360 190 T 500 190 L 500 250 L 0 250 Z" fill="#0284c7" />
            {/* Kapal Layar Menembus Ombak */}
            <g transform="translate(200, 75)">
              <polygon points="20,90 90,90 80,115 10,115" fill="#78350f" stroke="#000" strokeWidth="3" />
              <line x1="50" y1="20" x2="50" y2="90" stroke="#000" strokeWidth="3" />
              <polygon points="50,25 85,55 50,75" fill="#f8fafc" stroke="#000" strokeWidth="2" />
              <polygon points="48,30 20,60 48,70" fill="#e2e8f0" stroke="#000" strokeWidth="2" />
            </g>
          </svg>
        )}

        {/* 8. SCENE: CYBERPUNK / KOTA NEON */}
        {theme === 'cyber' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#09090b" />
            {/* Garis Grid Holografik Perspektif */}
            <line x1="0" y1="250" x2="250" y2="100" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
            <line x1="120" y1="250" x2="250" y2="100" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
            <line x1="250" y1="250" x2="250" y2="100" stroke="#ec4899" strokeWidth="2" opacity="0.6" />
            <line x1="380" y1="250" x2="250" y2="100" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
            <line x1="500" y1="250" x2="250" y2="100" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
            {/* Matahari Digital Cyberpunk */}
            <circle cx="250" cy="90" r="50" fill="#f43f5e" />
            <line x1="190" y1="90" x2="310" y2="90" stroke="#09090b" strokeWidth="4" />
            <line x1="195" y1="102" x2="305" y2="102" stroke="#09090b" strokeWidth="4" />
            <line x1="205" y1="114" x2="295" y2="114" stroke="#09090b" strokeWidth="4" />
          </svg>
        )}

        {/* 9. SCENE: HOROR / KUTUKAN MAKHLUK */}
        {theme === 'horror' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#0a0a0a" />
            {/* Pohon Ranting Kering Seram */}
            <path d="M 50 250 L 70 120 L 40 80 M 70 120 L 90 90 M 70 140 L 110 110" stroke="#27272a" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 450 250 L 430 110 L 460 70 M 430 110 L 400 80" stroke="#27272a" strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Sosok Bayangan Gelap Berjubah */}
            <g transform="translate(210, 40)">
              <path d="M 40 20 C 10 30, 0 80, 0 170 L 80 170 C 80 80, 70 30, 40 20 Z" fill="#171717" stroke="#000" strokeWidth="4" />
              {/* Sepasang Mata Merah Berpijar */}
              <circle cx="30" cy="50" r="5" fill="#ef4444" className="animate-pulse" />
              <circle cx="50" cy="50" r="5" fill="#ef4444" className="animate-pulse" />
            </g>
          </svg>
        )}

        {/* 10. SCENE: PROYEKTOR FILM 35MM */}
        {theme === 'projector' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <defs>
              <radialGradient id="proj-beam" cx="15%" cy="50%" r="80%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="500" height="250" fill="#171717" />
            <polygon points="85,120 480,20 480,230" fill="url(#proj-beam)" />
            <g transform="translate(20, 50)">
              <line x1="60" y1="120" x2="10" y2="190" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              <line x1="60" y1="120" x2="60" y2="190" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              <line x1="60" y1="120" x2="110" y2="190" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              <rect x="35" y="60" width="55" height="60" fill="#262626" stroke="#000" strokeWidth="5" rx="3" />
              <circle cx="45" cy="35" r="24" fill="#525252" stroke="#000" strokeWidth="4" />
              <circle cx="85" cy="35" r="24" fill="#525252" stroke="#000" strokeWidth="4" />
              <polygon points="90,75 115,65 115,105 90,95" fill="#facc15" stroke="#000" strokeWidth="4" />
            </g>
            <path d="M 130 130 Q 250 80 340 140 T 460 110" fill="none" stroke="#fef08a" strokeWidth="8" strokeDasharray="6 4" />
          </svg>
        )}

        {/* 11. SCENE: BAJAJ TERBANG (HANYA MUNCUL JIKA DIMINTA SPESIFIK) */}
        {theme === 'bajaj' && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#e0f2fe" />
            <polygon points="0,180 500,150 500,250 0,250" fill="#94a3b8" />
            <g transform="translate(170, 40)">
              <path d="M30,110 C25,50 70,25 140,25 C200,25 220,65 220,130 Z" fill="#eab308" stroke="#000" strokeWidth="4" />
              <circle cx="45" cy="120" r="12" fill="#ef4444" stroke="#000" strokeWidth="2" />
              <polygon points="150,120 220,105 210,130" fill="#ef4444" stroke="#000" strokeWidth="2" />
            </g>
          </svg>
        )}

        {/* 12. SCENE: AKSI DRAMATIS UMUM (DEFAULT UNTUK TEMA AKSI) */}
        {(theme === 'action' || theme === 'gate' || theme === 'lantern' || theme === 'fog') && (
          <svg viewBox="0 0 500 250" className="w-full h-full">
            <rect width="500" height="250" fill="#171717" />
            <polygon points="250,20 280,80 350,40 330,110 400,125 330,150 360,220 280,180 250,240 210,180 140,220 165,150 90,130 160,110 140,40 210,80" fill="#facc15" stroke="#000" strokeWidth="6" />
            <polygon points="250,50 270,90 320,60 300,110 350,125 300,140 320,190 270,160 250,200 220,160 170,190 190,140 140,125 190,110 170,60 220,90" fill="#ef4444" stroke="#000" strokeWidth="4" />
            <g transform="translate(225, 90)">
              <circle cx="25" cy="10" r="14" fill="#000" />
              <path d="M 25 24 L 25 70 L 5 95 M 25 70 L 45 95 M 25 35 L 5 20 M 25 35 L 50 15" stroke="#000" strokeWidth="8" strokeLinecap="round" />
            </g>
          </svg>
        )}

        {/* BADGE LABEL TEKS CERITA PENULIS DI POJOK ILUSTRASI */}
        <div className="absolute bottom-2 left-2 max-w-[85%] bg-yellow-300/95 border-2 border-black px-2.5 py-1 shadow-[2px_2px_0_#000]">
          <span className="text-[10px] font-black uppercase text-black truncate block tracking-wide">
            🎬 {displayLabel}
          </span>
        </div>

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