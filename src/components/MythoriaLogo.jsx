import React from 'react';

// Komponen Vektor Logo Resmi Mythoria: Grimoire of Reality
// 100% Mandiri (Self-Contained SVG), Dijamin Tidak Pernah Gagal Memuat / 404
export default function MythoriaLogo({ 
  className = 'w-12 h-12', 
  showText = false, 
  textClassName = '',
  withBorder = true
}) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <div className={`${withBorder ? 'border-3 border-black rounded-full bg-yellow-300 p-0.5 shadow-[3px_3px_0_#000]' : ''} inline-flex items-center justify-center shrink-0 overflow-hidden`}>
        <svg
          viewBox="0 0 256 256"
          className={`${className} shrink-0 block`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="mythoria-logo-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="5" dy="5" stdDeviation="0" floodColor="#000000" />
            </filter>
          </defs>

          {/* Latar Belakang Lingkaran Komik Pop-Art Kuning & Merah */}
          <circle cx="128" cy="128" r="116" fill="#fde047" stroke="#000000" strokeWidth="8" filter="url(#mythoria-logo-shadow)" />
          <circle cx="128" cy="128" r="102" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="10 8" />

          {/* Strip Film Seluloid 35mm Melengkung (Elemen Sinema Jadul) */}
          <path d="M 40 160 C 70 80, 180 80, 216 160" fill="none" stroke="#000000" strokeWidth="26" strokeLinecap="round" />
          <path d="M 40 160 C 70 80, 180 80, 216 160" fill="none" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" />
          
          {/* Lubang Sprocket Film 35mm */}
          <circle cx="56" cy="144" r="3" fill="#000000" />
          <circle cx="76" cy="122" r="3" fill="#000000" />
          <circle cx="100" cy="108" r="3" fill="#000000" />
          <circle cx="128" cy="102" r="3" fill="#000000" />
          <circle cx="156" cy="108" r="3" fill="#000000" />
          <circle cx="180" cy="122" r="3" fill="#000000" />
          <circle cx="200" cy="144" r="3" fill="#000000" />

          {/* Buku / Grimoire Realitas Kuno (Sampul Tebal Komik) */}
          <g filter="url(#mythoria-logo-shadow)">
            {/* Sampul Luar Belakang (Merah Crimson) */}
            <path d="M 48 184 L 128 204 L 208 184 L 208 96 L 128 116 L 48 96 Z" fill="#b91c1c" stroke="#000000" strokeWidth="7" strokeLinejoin="round" />

            {/* Lembaran Kertas Komik Kiri (Putih-Gading) */}
            <path d="M 54 104 C 84 108, 114 116, 126 122 L 126 196 C 104 190, 74 182, 54 178 Z" fill="#ffffff" stroke="#000000" strokeWidth="6" strokeLinejoin="round" />
            <line x1="68" y1="126" x2="112" y2="134" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <line x1="68" y1="142" x2="112" y2="150" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <line x1="68" y1="158" x2="100" y2="164" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

            {/* Lembaran Kertas Komik Kanan (Putih-Kuningan) */}
            <path d="M 202 104 C 172 108, 142 116, 130 122 L 130 196 C 152 190, 182 182, 202 178 Z" fill="#fef9c3" stroke="#000000" strokeWidth="6" strokeLinejoin="round" />
            <line x1="144" y1="134" x2="188" y2="126" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <line x1="144" y1="150" x2="188" y2="142" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <line x1="156" y1="164" x2="188" y2="158" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

            {/* Tulang Tengah Buku (Spine) */}
            <line x1="128" y1="116" x2="128" y2="204" stroke="#000000" strokeWidth="7" />
          </g>

          {/* Pena Bulu Ajaib (Pena Emas Pengubah Realitas) */}
          <g transform="rotate(35 150 70)">
            <path d="M 148 24 C 160 38, 168 65, 142 96 L 140 120 L 136 120 L 138 96 C 122 75, 130 45, 148 24 Z" fill="#f59e0b" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="135,118 141,118 138,136" fill="#000000" />
            <line x1="138" y1="118" x2="138" y2="132" stroke="#ffffff" strokeWidth="2" />
          </g>

          {/* Kilatan Bintang Komik */}
          <polygon points="186,46 192,58 204,64 192,70 186,82 180,70 168,64 180,58" fill="#fbbf24" stroke="#000000" strokeWidth="3" />
          <polygon points="64,68 68,76 76,80 68,84 64,92 60,84 52,80 60,76" fill="#ef4444" stroke="#000000" strokeWidth="3" />

          {/* Huruf Inisial "M" Komik Retro */}
          <g transform="translate(112, 198)">
            <rect x="-4" y="-2" width="36" height="24" fill="#000000" rx="4" />
            <text x="14" y="16" fontFamily="Arial, Impact, sans-serif" fontWeight="900" fontSize="18" fill="#fde047" textAnchor="middle">M</text>
          </g>
        </svg>
      </div>

      {showText && (
        <div className={textClassName}>
          <div className="font-black text-base sm:text-lg tracking-tight leading-none text-black">
            MYTHORIA
          </div>
          <div className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
            Grimoire of Reality
          </div>
        </div>
      )}
    </div>
  );
}
