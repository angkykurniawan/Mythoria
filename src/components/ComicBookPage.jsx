import React, { useRef } from 'react';
import { Download, Printer, Sparkles, BookOpen, Layers, GitBranch, Compass } from 'lucide-react';

export default function ComicBookPage({
  pageNumber = 1,
  pageTitle = 'Halaman 1: Awal Mula Naskah',
  manifestation = null,
  inkType = 'emas',
  allPanels = [],
  layoutType = '5-panel',
  onLayoutChange = () => {},
  branching = null,
  onSelectBranch = () => {},
  onOpenFullBookModal = () => {}
}) {
  const comicPageRef = useRef(null);

  // Default branching options jika belum disetel
  const defaultBranching = branching || [
    {
      id: 'opt-a',
      label: 'Terbang Menembus Awan Menuju Santiago Bernabeu Madrid',
      targetPage: pageNumber + 1
    },
    {
      id: 'opt-b',
      label: 'Kembali Menguji Sistem Baling-Baling di Laboratorium',
      targetPage: pageNumber + 2
    }
  ];

  // Ekspor / Unduh Halaman Tunggal sebagai PNG
  const handleDownloadPage = () => {
    if (!comicPageRef.current) return;

    try {
      const svgElement = comicPageRef.current.querySelector('svg');
      if (!svgElement) {
        alert('Gagal mendeteksi elemen visual komik.');
        return;
      }

      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1700;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, 1200, 1700);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Mythoria_Komik_Halaman_${pageNumber}.png`;
        downloadLink.href = pngUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const customSentence = manifestation?.sentence || "Profesor memperkenalkan pesawat mirip bajaj buatannya kepada anaknya yang ragu.";

  return (
    <div className="w-full flex flex-col items-center my-6">
      
      {/* BILAH KONTROL ATAS LEMBAR KOMIK */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 border-3 border-black p-3 shadow-[4px_4px_0_#000] mb-4 text-white">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide text-yellow-300">
              LEMBAR KOMIK RESMI: {pageTitle}
            </h3>
            <p className="text-xs text-neutral-400">
              Format Standar Manga/Komik Cetak (Multi-Panel dengan Balon Dialog Dinamis)
            </p>
          </div>
        </div>

        {/* TOMBOL AKSI UNDUH & CETAK */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenFullBookModal}
            className="px-2.5 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0_#000]"
            title="Unduh seluruh buku komik dari awal sampai akhir"
          >
            <BookOpen className="w-4 h-4" />
            UNDUH BUKU UTUH
          </button>

          <button
            onClick={handleDownloadPage}
            className="comic-button-primary px-2.5 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black shadow-[2px_2px_0_#000]"
            title="Unduh halaman komik ini dalam format gambar resolusi tinggi"
          >
            <Download className="w-4 h-4" />
            UNDUH HALAMAN (PNG)
          </button>

          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer bg-white hover:bg-neutral-100 text-black border-2 border-black shadow-[2px_2px_0_#000]"
            title="Cetak atau simpan lembar halaman ini sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            CETAK
          </button>
        </div>
      </div>

      {/* BILAH PILIHAN TATA LETAK GRID KOMIK */}
      <div className="w-full max-w-3xl flex items-center justify-between gap-2 bg-yellow-100 border-3 border-black px-3 py-2 shadow-[3px_3px_0_#000] mb-3">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-900">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Variasi Grid Komik:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onLayoutChange('5-panel')}
            className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black transition cursor-pointer ${
              layoutType === '5-panel'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            🖼️ 5-Panel Dinamis
          </button>

          <button
            onClick={() => onLayoutChange('4-panel')}
            className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black transition cursor-pointer ${
              layoutType === '4-panel'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            🔲 4-Panel Grid (2x2)
          </button>

          <button
            onClick={() => onLayoutChange('3-panel')}
            className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black transition cursor-pointer ${
              layoutType === '3-panel'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            🎞️ 3-Panel Sinematik
          </button>
        </div>
      </div>

      {/* LEMBAR HALAMAN KOMIK (ASPECT RATIO BUKU KOMIK ASLI) */}
      <div 
        ref={comicPageRef}
        id={`comic-page-${pageNumber}`}
        className="comic-book-sheet w-full max-w-3xl bg-sky-200 border-4 border-black p-3 sm:p-4 shadow-[10px_10px_0_#000] relative select-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
          backgroundSize: '12px 12px'
        }}
      >
        {/* SVG RENDERER FULL PAGE KOMIK */}
        <svg 
          id={`comic-page-svg-${pageNumber}`}
          viewBox="0 0 600 850" 
          className="w-full h-auto bg-sky-100 border-3 border-black shadow-[4px_4px_0_#000]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="60%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>

            <linearGradient id="yellowBajaj" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            <linearGradient id="windshieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="labGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            <filter id="comicShadow" x="-5%" y="-5%" width="115%" height="115%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#000" />
            </filter>
          </defs>

          {/* LATAR KERTAS KOMIK */}
          <rect width="600" height="850" fill="#f0f9ff" />

          {/* ======================================================== */}
          {/* PILIHAN LAYOUT 1: DINAMIS 5-PANEL (DEFAULT REFERENSI)    */}
          {/* ======================================================== */}
          {layoutType === '5-panel' && (
            <g id="layout-5-panel">
              {/* PANEL 1: ATAS PANORAMA */}
              <g id="panel-1" transform="translate(18, 18)">
                <rect width="564" height="235" fill="url(#skyGrad)" stroke="#000" strokeWidth="3" />
                <polygon points="0,170 564,130 564,235 0,235" fill="#cbd5e1" stroke="#000" strokeWidth="2" />
                <line x1="0" y1="170" x2="564" y2="130" stroke="#000" strokeWidth="3" />
                <line x1="280" y1="150" x2="250" y2="235" stroke="#fff" strokeWidth="4" strokeDasharray="15 10" />

                {/* Profesor Panel 1 */}
                <g transform="translate(15, 65)">
                  <circle cx="35" cy="45" r="14" fill="#94a3b8" stroke="#000" strokeWidth="2" />
                  <circle cx="25" cy="55" r="12" fill="#94a3b8" stroke="#000" strokeWidth="2" />
                  <circle cx="85" cy="45" r="14" fill="#94a3b8" stroke="#000" strokeWidth="2" />
                  <circle cx="95" cy="55" r="12" fill="#94a3b8" stroke="#000" strokeWidth="2" />
                  <circle cx="60" cy="50" r="28" fill="#fed7aa" stroke="#000" strokeWidth="2.5" />
                  <circle cx="48" cy="48" r="11" fill="#fff" stroke="#000" strokeWidth="3" />
                  <circle cx="72" cy="48" r="11" fill="#fff" stroke="#000" strokeWidth="3" />
                  <line x1="59" y1="48" x2="61" y2="48" stroke="#000" strokeWidth="3" />
                  <circle cx="50" cy="48" r="4" fill="#000" />
                  <circle cx="74" cy="48" r="4" fill="#000" />
                  <ellipse cx="60" cy="55" rx="6" ry="4" fill="#fb923c" stroke="#000" strokeWidth="1.5" />
                  <path d="M42,62 Q60,56 78,62 Q60,72 42,62" fill="#e2e8f0" stroke="#000" strokeWidth="2" />
                  <path d="M35,78 L85,78 L95,145 L25,145 Z" fill="#f8fafc" stroke="#000" strokeWidth="2.5" />
                  <polygon points="50,78 70,78 65,115 55,115" fill="#f472b6" stroke="#000" strokeWidth="1.5" />
                  <path d="M85,85 Q115,85 130,100" fill="none" stroke="#f8fafc" strokeWidth="14" strokeLinecap="round" />
                  <path d="M85,85 Q115,85 130,100" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="132" cy="100" r="7" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                </g>

                {/* Bum Panel 1 */}
                <g transform="translate(180, 100)">
                  <circle cx="28" cy="25" r="19" fill="#1e293b" stroke="#000" strokeWidth="2" />
                  <circle cx="28" cy="30" r="16" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <rect x="15" y="24" width="11" height="9" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="30" y="24" width="11" height="9" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
                  <circle cx="23" cy="28" r="2.5" fill="#000" />
                  <circle cx="38" cy="28" r="2.5" fill="#000" />
                  <path d="M22,38 Q28,35 34,38" fill="none" stroke="#000" strokeWidth="2" />
                  <path d="M12,46 L44,46 L48,85 L8,85 Z" fill="#facc15" stroke="#000" strokeWidth="2" />
                  <rect x="14" y="85" width="28" height="15" fill="#1e3a8a" stroke="#000" strokeWidth="2" />
                </g>

                {/* Pesawat Bajaj Kuning Panel 1 */}
                <g transform="translate(290, 20)">
                  <path d="M130,12 L190,8 L200,28 L140,28 Z" fill="#ef4444" stroke="#000" strokeWidth="2" />
                  <path d="M40,110 C35,60 80,25 150,25 C210,25 240,65 240,130 C240,165 200,180 140,180 C80,180 45,150 40,110 Z" fill="url(#yellowBajaj)" stroke="#000" strokeWidth="3" />
                  <path d="M55,95 C60,50 95,38 145,38 C175,38 195,55 195,100 C185,115 70,115 55,95 Z" fill="url(#windshieldGrad)" stroke="#000" strokeWidth="2.5" />
                  <path d="M75,55 Q130,48 175,70" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" />
                  <circle cx="50" cy="120" r="10" fill="#f87171" stroke="#000" strokeWidth="2" />
                  <circle cx="115" cy="132" r="12" fill="#ef4444" stroke="#000" strokeWidth="2.5" />
                  <ellipse cx="60" cy="165" rx="20" ry="16" fill="#1e293b" stroke="#000" strokeWidth="3" />
                  <polygon points="170,130 255,115 250,140 165,145" fill="#ef4444" stroke="#000" strokeWidth="2.5" />
                  <path d="M140,165 L160,185 L260,160 L245,150" fill="#fef08a" stroke="#000" strokeWidth="2.5" />
                </g>

                {/* Drone Kucing Robot */}
                <g transform="translate(265, 45)">
                  <rect x="0" y="10" width="28" height="22" rx="6" fill="#ef4444" stroke="#000" strokeWidth="2" />
                  <circle cx="14" cy="21" r="8" fill="#38bdf8" stroke="#000" strokeWidth="1.5" />
                  <ellipse cx="14" cy="0" rx="14" ry="2" fill="#94a3b8" stroke="#000" strokeWidth="1" />
                </g>

                {/* SFX Panel 1 */}
                <g transform="translate(320, 25)">
                  <text x="0" y="0" fontFamily="Impact, Arial Black, sans-serif" fontSize="16" fill="#1e293b" letterSpacing="1.5" transform="rotate(-6)">
                    DDD ... DDTT .....
                  </text>
                  <text x="-20" y="20" fontFamily="Impact, Arial Black, sans-serif" fontSize="15" fill="#334155" letterSpacing="1.5" transform="rotate(-6)">
                    DDD ... DDTT .....
                  </text>
                </g>

                {/* Balon Ucapan Panel 1 */}
                <g transform="translate(65, 12)">
                  <polygon points="45,45 55,65 35,45" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <rect x="0" y="0" width="165" height="48" rx="20" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <text x="82" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8.5" fontWeight="900" fill="#000">
                    BAGAIMANA, BUM?
                  </text>
                  <text x="82" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="800" fill="#000">
                    PESAWAT BUATAN AYAH
                  </text>
                  <text x="82" y="41" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="800" fill="#000">
                    KEREN SEKALI, BUKAN?
                  </text>
                </g>
              </g>

              {/* PANEL 2: LAB KONTROL */}
              <g id="panel-2" transform="translate(18, 268)">
                <rect width="275" height="175" fill="url(#labGrad)" stroke="#000" strokeWidth="3" />
                <rect x="0" y="90" width="275" height="85" fill="#1e293b" stroke="#000" strokeWidth="2" />
                <circle cx="110" cy="85" r="6" fill="#ef4444" stroke="#000" strokeWidth="1" />
                <circle cx="130" cy="85" r="6" fill="#facc15" stroke="#000" strokeWidth="1" />
                <circle cx="150" cy="85" r="6" fill="#10b981" stroke="#000" strokeWidth="1" />
                <circle cx="170" cy="85" r="6" fill="#3b82f6" stroke="#000" strokeWidth="1" />

                {/* Profesor Lab */}
                <g transform="translate(15, 45)">
                  <circle cx="35" cy="40" r="24" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <circle cx="28" cy="38" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <circle cx="45" cy="38" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <circle cx="30" cy="38" r="3" fill="#000" />
                  <circle cx="47" cy="38" r="3" fill="#000" />
                  <circle cx="50" cy="52" r="4" fill="#e11d48" stroke="#000" strokeWidth="1.5" />
                  <path d="M15,64 L55,64 L50,110 L10,110 Z" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                </g>

                {/* Bum Lab */}
                <g transform="translate(130, 60)">
                  <circle cx="35" cy="25" r="20" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <rect x="22" y="18" width="12" height="10" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
                  <circle cx="29" cy="23" r="3" fill="#000" />
                  <path d="M30,32 Q36,36 42,32" fill="none" stroke="#000" strokeWidth="2" />
                  <path d="M15,45 L55,45 L60,100 L10,100 Z" fill="#facc15" stroke="#000" strokeWidth="2" />
                </g>

                {/* Balon Ucapan Panel 2 */}
                <g transform="translate(110, 10)">
                  <polygon points="40,42 35,55 50,42" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="0" y="0" width="125" height="44" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="62" y="15" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="900" fill="#000">
                    APANYA YANG KEREN?
                  </text>
                  <text x="62" y="26" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="800" fill="#000">
                    MALAH MIRIP BAJAJ
                  </text>
                  <text x="62" y="37" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="800" fill="#000">
                    BEGITU.
                  </text>
                </g>
              </g>

              {/* PANEL 3: LAPTOP PLAN */}
              <g id="panel-3" transform="translate(307, 268)">
                <rect width="275" height="175" fill="#67e8f9" stroke="#000" strokeWidth="3" />
                <rect x="15" y="20" width="190" height="75" fill="#0891b2" stroke="#000" strokeWidth="2" />
                <rect x="25" y="30" width="170" height="55" fill="#ecfeff" stroke="#000" strokeWidth="1.5" />

                <g transform="translate(30, 48)">
                  <circle cx="45" cy="35" r="22" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <circle cx="38" cy="32" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <circle cx="54" cy="32" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <polygon points="5,80 40,70 50,95 15,105" fill="#facc15" stroke="#000" strokeWidth="2" />
                </g>

                <g transform="translate(170, 70)">
                  <circle cx="30" cy="20" r="18" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <path d="M22,26 Q30,22 38,26" fill="none" stroke="#000" strokeWidth="2" />
                  <path d="M12,38 L48,38 L52,85 L8,85 Z" fill="#facc15" stroke="#000" strokeWidth="2" />
                </g>

                <g transform="translate(10, 8)">
                  <polygon points="50,45 60,60 40,45" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="0" y="0" width="125" height="46" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="62" y="15" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="900" fill="#000">
                    BAGAIMANA KALAU
                  </text>
                  <text x="62" y="26" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="800" fill="#000">
                    KAMU UJI COBA PESAWAT
                  </text>
                  <text x="62" y="37" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="800" fill="#000">
                    INI BERSAMA KAK AMMAR?
                  </text>
                </g>
              </g>

              {/* PANEL 4: COCKPIT */}
              <g id="panel-4" transform="translate(18, 458)">
                <rect width="365" height="235" fill="#38bdf8" stroke="#000" strokeWidth="3" />
                <g transform="translate(-40, 30)">
                  <path d="M30,190 C30,110 80,50 150,50 C180,50 190,80 185,190 Z" fill="url(#yellowBajaj)" stroke="#000" strokeWidth="3" />
                </g>

                <g transform="translate(125, 80)">
                  <circle cx="45" cy="35" r="25" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <circle cx="36" cy="32" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <circle cx="54" cy="32" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <path d="M35,46 Q45,55 55,46" fill="#e11d48" stroke="#000" strokeWidth="1.5" />
                  <path d="M22,60 L75,60 L85,140 L10,140 Z" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                </g>

                <g transform="translate(10, 10)">
                  <polygon points="55,38 75,55 65,38" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="0" y="0" width="130" height="40" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="65" y="16" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900" fill="#000">
                    KALI INI PASTI BERHASIL,
                  </text>
                  <text x="65" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800" fill="#000">
                    PERCAYA SAMA AYAH!
                  </text>
                </g>
              </g>

              {/* PANEL 5: BUM SHOCK */}
              <g id="panel-5" transform="translate(397, 458)">
                <rect width="185" height="235" fill="#f8fafc" stroke="#000" strokeWidth="3" />
                <line x1="92" y1="117" x2="10" y2="10" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />
                <line x1="92" y1="117" x2="175" y2="10" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />

                <g transform="translate(25, 15)">
                  <rect x="0" y="0" width="135" height="44" rx="18" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <text x="67" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900" fill="#000">
                    KE STADION
                  </text>
                  <text x="67" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900" fill="#000">
                    SANTIAGO BERNABEU?
                  </text>
                </g>

                <g transform="translate(15, 115)">
                  <circle cx="18" cy="18" r="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="18" y="24" textAnchor="middle" fontFamily="Impact, Arial Black, sans-serif" fontSize="16" fill="#000">
                    ??
                  </text>
                </g>

                <g transform="translate(55, 105)">
                  <circle cx="45" cy="35" r="28" fill="#fed7aa" stroke="#000" strokeWidth="2.5" />
                  <rect x="25" y="28" width="16" height="14" rx="3" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <rect x="48" y="28" width="16" height="14" rx="3" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <ellipse cx="45" cy="50" rx="5" ry="7" fill="#e11d48" stroke="#000" strokeWidth="1.5" />
                  <path d="M20,68 L70,68 L75,120 L15,120 Z" fill="#facc15" stroke="#000" strokeWidth="2.5" />
                </g>
              </g>
            </g>
          )}

          {/* ======================================================== */}
          {/* PILIHAN LAYOUT 2: 4-PANEL GRID (2x2 KOTAK KLASIK)        */}
          {/* ======================================================== */}
          {layoutType === '4-panel' && (
            <g id="layout-4-panel">
              {/* PANEL 1: KIRI ATAS */}
              <g transform="translate(18, 18)">
                <rect width="275" height="335" fill="url(#skyGrad)" stroke="#000" strokeWidth="3" />
                <polygon points="0,220 275,180 275,335 0,335" fill="#cbd5e1" stroke="#000" strokeWidth="2" />
                
                {/* Profesor & Kendaraan Mini */}
                <g transform="translate(15, 120)">
                  <circle cx="50" cy="40" r="25" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <circle cx="42" cy="38" r="9" fill="#fff" stroke="#000" strokeWidth="2" />
                  <circle cx="58" cy="38" r="9" fill="#fff" stroke="#000" strokeWidth="2" />
                  <path d="M30,65 L70,65 L75,140 L25,140 Z" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                </g>
                <g transform="translate(120, 100)">
                  <path d="M20,80 C15,40 50,20 100,20 C140,20 150,50 150,90 Z" fill="url(#yellowBajaj)" stroke="#000" strokeWidth="2" />
                  <circle cx="35" cy="85" r="8" fill="#ef4444" />
                </g>
                {/* Balon Ucapan */}
                <g transform="translate(15, 15)">
                  <rect width="180" height="45" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
                  <polygon points="40,43 30,55 50,43" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="90" y="20" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    BAGAIMANA, BUM?
                  </text>
                  <text x="90" y="32" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    PESAWAT AYAH KEREN KAN?
                  </text>
                </g>
              </g>

              {/* PANEL 2: KANAN ATAS */}
              <g transform="translate(307, 18)">
                <rect width="275" height="335" fill="url(#labGrad)" stroke="#000" strokeWidth="3" />
                <rect x="0" y="160" width="275" height="175" fill="#1e293b" stroke="#000" strokeWidth="2" />
                <circle cx="80" cy="190" r="8" fill="#ef4444" />
                <circle cx="110" cy="190" r="8" fill="#facc15" />
                <circle cx="140" cy="190" r="8" fill="#10b981" />

                {/* Bum Mencibir */}
                <g transform="translate(80, 110)">
                  <circle cx="45" cy="35" r="25" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <rect x="30" y="28" width="12" height="10" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="48" y="28" width="12" height="10" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
                  <path d="M35,46 Q45,40 55,46" fill="none" stroke="#000" strokeWidth="2" />
                  <path d="M20,60 L70,60 L75,140 L15,140 Z" fill="#facc15" stroke="#000" strokeWidth="2" />
                </g>

                <g transform="translate(20, 15)">
                  <rect width="200" height="45" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
                  <polygon points="90,43 80,55 100,43" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="100" y="20" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    AH, BIASA SAJA, YAH.
                  </text>
                  <text x="100" y="32" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    MALAH MIRIP BAJAJ BEGITU!
                  </text>
                </g>
              </g>

              {/* PANEL 3: KIRI BAWAH */}
              <g transform="translate(18, 368)">
                <rect width="275" height="335" fill="#67e8f9" stroke="#000" strokeWidth="3" />
                {/* Mesin Bajaj Bergetar */}
                <g transform="translate(20, 80)">
                  <path d="M30,140 C25,70 70,30 140,30 C200,30 220,70 220,150 Z" fill="url(#yellowBajaj)" stroke="#000" strokeWidth="2.5" />
                  <circle cx="45" cy="140" r="14" fill="#ef4444" stroke="#000" strokeWidth="2" />
                  <circle cx="110" cy="155" r="15" fill="#ef4444" stroke="#000" strokeWidth="2.5" />
                </g>
                <text x="40" y="280" fontFamily="Impact, Arial Black, sans-serif" fontSize="18" fill="#1e293b" letterSpacing="2">
                  DDD ... DDTT ....
                </text>
                <g transform="translate(15, 15)">
                  <rect width="210" height="42" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="105" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    KALI INI PASTI BERHASIL!
                  </text>
                  <text x="105" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    TERBANG KE SPANYOL BERSAMA AYAH!
                  </text>
                </g>
              </g>

              {/* PANEL 4: KANAN BAWAH */}
              <g transform="translate(307, 368)">
                <rect width="275" height="335" fill="#f8fafc" stroke="#000" strokeWidth="3" />
                <line x1="137" y1="167" x2="10" y2="10" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />
                <line x1="137" y1="167" x2="265" y2="10" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />

                <g transform="translate(85, 110)">
                  <circle cx="45" cy="35" r="30" fill="#fed7aa" stroke="#000" strokeWidth="2.5" />
                  <rect x="25" y="26" width="16" height="14" rx="3" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="49" y="26" width="16" height="14" rx="3" fill="#fff" stroke="#000" strokeWidth="2" />
                  <ellipse cx="45" cy="52" rx="6" ry="8" fill="#e11d48" stroke="#000" strokeWidth="1.5" />
                  <path d="M15,70 L75,70 L80,150 L10,150 Z" fill="#facc15" stroke="#000" strokeWidth="2.5" />
                </g>

                <g transform="translate(30, 120)">
                  <circle cx="20" cy="20" r="18" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="20" y="26" textAnchor="middle" fontFamily="Impact, Arial Black, sans-serif" fontSize="18" fill="#000">
                    ??
                  </text>
                </g>

                <g transform="translate(35, 15)">
                  <rect width="180" height="42" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="90" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    KE STADION SANTIAGO BERNABEU?
                  </text>
                  <text x="90" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    BENARAN BISA TERBANG?!
                  </text>
                </g>
              </g>
            </g>
          )}

          {/* ======================================================== */}
          {/* PILIHAN LAYOUT 3: 3-PANEL SINEMATIK (HORIZONTAL STACK)   */}
          {/* ======================================================== */}
          {layoutType === '3-panel' && (
            <g id="layout-3-panel">
              {/* PANEL 1: ATAS SINEMATIK */}
              <g transform="translate(18, 18)">
                <rect width="564" height="215" fill="url(#skyGrad)" stroke="#000" strokeWidth="3" />
                <polygon points="0,150 564,110 564,215 0,215" fill="#cbd5e1" stroke="#000" strokeWidth="2" />
                {/* Kendaraan & Karakter Panorama */}
                <g transform="translate(20, 50)">
                  <circle cx="45" cy="40" r="24" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <circle cx="38" cy="38" r="9" fill="#fff" stroke="#000" strokeWidth="2" />
                  <circle cx="52" cy="38" r="9" fill="#fff" stroke="#000" strokeWidth="2" />
                  <path d="M25,65 L65,65 L70,120 L20,120 Z" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                </g>
                <g transform="translate(180, 20)">
                  <path d="M40,100 C35,50 80,20 140,20 C200,20 230,50 230,110 Z" fill="url(#yellowBajaj)" stroke="#000" strokeWidth="2.5" />
                  <path d="M120,8 L180,5 L190,20 L130,20 Z" fill="#ef4444" />
                </g>
                <text x="320" y="55" fontFamily="Impact, Arial Black, sans-serif" fontSize="16" fill="#1e293b">
                  DDD ... DDTT ....
                </text>
                <g transform="translate(60, 10)">
                  <rect width="180" height="42" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <polygon points="40,40 30,50 50,40" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="90" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    BABAK 1: PESAWAT BAJAJ SIAP TERBANG!
                  </text>
                  <text x="90" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    "BAGAIMANA, BUM? KEREN SEKALI BUKAN?"
                  </text>
                </g>
              </g>

              {/* PANEL 2: TENGAH SINEMATIK */}
              <g transform="translate(18, 248)">
                <rect width="564" height="215" fill="url(#labGrad)" stroke="#000" strokeWidth="3" />
                <rect x="0" y="100" width="564" height="115" fill="#1e293b" stroke="#000" strokeWidth="2" />
                {/* Lab Control Wall */}
                <rect x="180" y="40" width="200" height="70" fill="#ecfeff" stroke="#000" strokeWidth="2" />
                <g transform="translate(80, 50)">
                  <circle cx="35" cy="30" r="20" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <path d="M15,50 L55,50 L60,110 L10,110 Z" fill="#facc15" stroke="#000" strokeWidth="2" />
                </g>
                <g transform="translate(390, 50)">
                  <circle cx="45" cy="30" r="22" fill="#fed7aa" stroke="#000" strokeWidth="2" />
                  <path d="M25,52 L65,52 L70,110 L20,110 Z" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                </g>
                <g transform="translate(40, 12)">
                  <rect width="210" height="42" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="105" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    "APANYA YANG KEREN? MALAH MIRIP BAJAJ!"
                  </text>
                  <text x="105" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    BUM MENOLAK DENGAN RAGU.
                  </text>
                </g>
                <g transform="translate(300, 12)">
                  <rect width="220" height="42" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
                  <text x="110" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="900">
                    "KALI INI PASTI BERHASIL, PERCAYA AYAH!"
                  </text>
                  <text x="110" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="800">
                    KITA AKAN MENEMBUS SAMUDRA KE SPANYOL!
                  </text>
                </g>
              </g>

              {/* PANEL 3: BAWAH SINEMATIK */}
              <g transform="translate(18, 478)">
                <rect width="564" height="235" fill="#f8fafc" stroke="#000" strokeWidth="3" />
                <line x1="282" y1="117" x2="20" y2="20" stroke="#000" strokeWidth="2" strokeDasharray="8 6" />
                <line x1="282" y1="117" x2="540" y2="20" stroke="#000" strokeWidth="2" strokeDasharray="8 6" />
                <g transform="translate(240, 60)">
                  <circle cx="45" cy="35" r="30" fill="#fed7aa" stroke="#000" strokeWidth="2.5" />
                  <rect x="25" y="26" width="16" height="14" rx="3" fill="#fff" stroke="#000" strokeWidth="2" />
                  <rect x="49" y="26" width="16" height="14" rx="3" fill="#fff" stroke="#000" strokeWidth="2" />
                  <ellipse cx="45" cy="52" rx="6" ry="8" fill="#e11d48" stroke="#000" strokeWidth="1.5" />
                  <path d="M15,70 L75,70 L80,140 L10,140 Z" fill="#facc15" stroke="#000" strokeWidth="2.5" />
                </g>
                <text x="70" y="130" fontFamily="Impact, Arial Black, sans-serif" fontSize="26" fill="#000">
                  ??
                </text>
                <g transform="translate(160, 15)">
                  <rect width="240" height="42" rx="16" fill="#fff" stroke="#000" strokeWidth="2.5" />
                  <text x="120" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8.5" fontWeight="900">
                    KE STADION SANTIAGO BERNABEU DI MADRID?!
                  </text>
                  <text x="120" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="800">
                    PETUALANGAN BESAR BARU SAJA DIMULAI!
                  </text>
                </g>
              </g>
            </g>
          )}

          {/* ======================================================== */}
          {/* NOMOR HALAMAN BUKU KOMIK DI SUDUT KANAN BAWAH */}
          {/* ======================================================== */}
          <g id="page-number-badge" transform="translate(545, 805)">
            <circle cx="18" cy="18" r="20" fill="#38bdf8" stroke="#000" strokeWidth="3" filter="url(#comicShadow)" />
            <circle cx="18" cy="18" r="16" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
            <text 
              x="18" 
              y="24" 
              textAnchor="middle" 
              fontFamily="Impact, Arial Black, sans-serif" 
              fontSize="17" 
              fill="#ffffff"
              stroke="#000"
              strokeWidth="0.8"
            >
              {pageNumber}
            </text>
          </g>

          <text x="25" y="820" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="900" fill="#0f172a" letterSpacing="1">
            MYTHORIA COMIC CHRONICLES • BABAK {pageNumber}
          </text>
        </svg>

        {/* ======================================================== */}
        {/* PILIHAN JALUR CERITA DI AKHIR HALAMAN (BRANCHING)        */}
        {/* ======================================================== */}
        <div className="mt-3 bg-yellow-100 border-3 border-black p-3.5 shadow-[4px_4px_0_#000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
            <span className="font-black text-xs uppercase text-black flex items-center gap-1.5 tracking-wider">
              <Compass className="w-4 h-4 text-red-600" />
              PILIH TAKDIRMU (JALUR KELANJUTAN NASKAH):
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black text-yellow-300">
              Interaktif
            </span>
          </div>

          <p className="text-xs font-bold text-neutral-800 mb-2.5">
            Naskah mencapai titik persimpangan! Tentukan pilihanmu untuk membuka lembaran cabang berikutnya:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => onSelectBranch(defaultBranching[0]?.targetPage || (pageNumber + 1))}
              className="p-3 text-xs text-left flex items-start gap-2.5 bg-yellow-300 hover:bg-yellow-400 border-3 border-black shadow-[3px_3px_0_#000] cursor-pointer transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="text-xl shrink-0">🅰️</span>
              <div>
                <div className="font-black uppercase text-xs text-black leading-snug">
                  {defaultBranching[0]?.label || "Terbang Menuju Madrid (Uji Coba Pesawat)"}
                </div>
                <span className="text-[11px] font-extrabold text-amber-950 underline mt-1 inline-block">
                  ➔ Buka Halaman {defaultBranching[0]?.targetPage || (pageNumber + 1)}
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelectBranch(defaultBranching[1]?.targetPage || (pageNumber + 2))}
              className="p-3 text-xs text-left flex items-start gap-2.5 bg-cyan-300 hover:bg-cyan-400 border-3 border-black shadow-[3px_3px_0_#000] cursor-pointer transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="text-xl shrink-0">🅱️</span>
              <div>
                <div className="font-black uppercase text-xs text-black leading-snug">
                  {defaultBranching[1]?.label || "Kembali Menguji Mesin di Laboratorium"}
                </div>
                <span className="text-[11px] font-extrabold text-cyan-950 underline mt-1 inline-block">
                  ➔ Buka Halaman {defaultBranching[1]?.targetPage || (pageNumber + 2)}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* KOTAK RINGKASAN NASKAH PENULIS DI BAWAH HALAMAN */}
        <div className="mt-3 bg-white border-3 border-black p-3 shadow-[3px_3px_0_#000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-1.5">
            <span className="font-black text-xs uppercase text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Naskah Penulis yang Diwujudkan ke Halaman Ini:
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-yellow-200">
              Tinta: {inkType.toUpperCase()}
            </span>
          </div>
          <p className="font-bold text-xs text-neutral-800 italic leading-relaxed">
            "{customSentence}"
          </p>
          {manifestation?.storyOutcome && (
            <p className="text-[11px] font-medium text-neutral-700 mt-1 border-t border-neutral-300 pt-1">
              <strong className="text-black font-black">Konsekuensi Nyata:</strong> {manifestation.storyOutcome}
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
