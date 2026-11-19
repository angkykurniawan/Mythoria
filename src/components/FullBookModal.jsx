import React, { useState } from 'react';
import { BookOpen, Printer, Download, X, Sparkles, Layers } from 'lucide-react';
import MythoriaLogo from './MythoriaLogo';

export default function FullBookModal({
  isOpen,
  onClose,
  pages = [],
  panels = [],
  currentSessionTitle = 'Sesi Komik Mythoria'
}) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Cetak Seluruh Buku ke PDF via Dialog Cetak Browser
  const handlePrintAllPages = () => {
    window.print();
  };

  // Unduh Batch Seluruh Gambar Halaman (PNG)
  const handleDownloadAllPNG = () => {
    setIsExporting(true);
    let delay = 0;

    pages.forEach((page, index) => {
      setTimeout(() => {
        const svgElement = document.getElementById(`comic-page-svg-${page.pageNumber}`) || 
                           document.querySelector(`#comic-page-${page.pageNumber} svg`) ||
                           document.querySelector('svg');

        if (svgElement) {
          try {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svgElement);
            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
              source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
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
              downloadLink.download = `Mythoria_Komik_Halaman_${page.pageNumber}.png`;
              downloadLink.href = pngUrl;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              URL.revokeObjectURL(blobURL);
            };
            image.src = blobURL;
          } catch (e) {
            console.error('Error downloading page', page.pageNumber, e);
          }
        }

        if (index === pages.length - 1) {
          setTimeout(() => setIsExporting(false), 800);
        }
      }, delay);

      delay += 500; // Beri jeda 500ms antar file agar browser tidak memblokir multi-download
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="comic-panel p-5 sm:p-7 bg-white max-w-2xl w-full space-y-4 border-4 border-black shadow-[10px_10px_0_#000] my-8">
        
        {/* HEADER MODAL */}
        <div className="border-b-3 border-black pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MythoriaLogo className="w-12 h-12" withBorder={true} />
            <div>
              <h3 className="font-black text-xl uppercase text-black tracking-tight">
                UNDUH SELURUH BUKU KOMIK ({pages.length} HALAMAN)
              </h3>
              <p className="text-xs font-bold text-neutral-600">
                Ekspor naskah dan gambar komik dari awal sampai akhir sekaligus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-black bg-neutral-100 hover:bg-neutral-200 font-black text-sm flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* RINGKASAN DAFTAR HALAMAN BUKU */}
        <div className="bg-neutral-50 border-2 border-black p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase text-neutral-800 border-b border-neutral-300 pb-1">
            <span>Daftar Lembaran dalam Buku Ini:</span>
            <span className="text-amber-800">{pages.length} Babak Terbit</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {pages.map((p, idx) => {
              const pPanels = panels.filter(panel => (panel.pageNumber || 1) === p.pageNumber);
              return (
                <div 
                  key={p.pageNumber || idx}
                  className="flex items-center justify-between bg-white border border-neutral-300 p-2 text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-300 border border-black rounded-full flex items-center justify-center text-[11px] font-black">
                      {p.pageNumber}
                    </span>
                    <span className="text-neutral-900 truncate max-w-xs">{p.title}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 border border-neutral-400">
                    {pPanels.length} adegan
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* DUA METODE EKSPOR UTAMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          
          {/* OPSI 1: CETAK / SIMPAN KE PDF */}
          <div className="comic-panel p-4 bg-sky-50 border-3 border-black space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-900 font-black text-sm uppercase">
                <Printer className="w-5 h-5 text-sky-600" />
                <span>Simpan Buku ke PDF</span>
              </div>
              <p className="text-xs text-neutral-700 font-medium leading-relaxed mt-1">
                Membuka jendela cetak peramban. Pilih tujuan <strong>"Save as PDF / Simpan sebagai PDF"</strong> untuk mendapatkan 1 file buku komik PDF utuh berhalaman ganda.
              </p>
            </div>

            <button
              onClick={handlePrintAllPages}
              className="w-full comic-button-primary py-2.5 px-3 text-xs font-black bg-sky-400 hover:bg-sky-300 text-black border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>CETAK / SIMPAN PDF BUKU</span>
            </button>
          </div>

          {/* OPSI 2: UNDUH SEMUA GAMBAR PNG */}
          <div className="comic-panel p-4 bg-amber-50 border-3 border-black space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-950 font-black text-sm uppercase">
                <Download className="w-5 h-5 text-amber-600" />
                <span>Unduh Batch PNG</span>
              </div>
              <p className="text-xs text-neutral-700 font-medium leading-relaxed mt-1">
                Mengunduh seluruh halaman komik secara berurutan dalam format gambar resolusi tinggi (1200 × 1700px) langsung ke folder Download Anda.
              </p>
            </div>

            <button
              onClick={handleDownloadAllPNG}
              disabled={isExporting}
              className="w-full comic-button-primary py-2.5 px-3 text-xs font-black bg-amber-400 hover:bg-amber-300 text-black border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'MENGUNDUH BUKU...' : 'UNDUH SEMUA HALAMAN (PNG)'}</span>
            </button>
          </div>

        </div>

        {/* FOOTER MODAL */}
        <div className="border-t-2 border-black pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-black border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
          >
            Tutup Jendela
          </button>
        </div>

      </div>
    </div>
  );
}
