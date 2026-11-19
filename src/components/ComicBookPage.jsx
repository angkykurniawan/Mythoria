import React, { useRef, useMemo, useState } from 'react';
import { Download, Printer, Sparkles, BookOpen, Layers, Compass, RefreshCw, Wand2, Image as ImageIcon, Type, Move, Edit3, RotateCcw } from 'lucide-react';
import MythoriaLogo from './MythoriaLogo';

// Fungsi pembantu pemecah teks ke beberapa baris untuk SVG <tspan>
function wrapSvgText(text, maxChars = 20) {
  if (!text) return [];
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function truncateText(str, max = 45) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

// Deteksi tema visual dari naskah
function detectStoryTheme(manifestation, sentence) {
  if (manifestation?.theme && manifestation.theme !== 'generic') {
    return manifestation.theme;
  }
  const text = ((sentence || '') + ' ' + (manifestation?.visualScene || '') + ' ' + (manifestation?.storyOutcome || '')).toLowerCase();

  if (text.includes('bajaj') || (text.includes('profesor') && text.includes('bum'))) return 'retro_invention';
  if (text.includes('robot') || text.includes('mecha') || text.includes('cyborg') || text.includes('angkasa') || text.includes('alien') || text.includes('planet') || text.includes('laser')) return 'scifi';
  if (text.includes('sihir') || text.includes('naga') || text.includes('pedang') || text.includes('penyihir') || text.includes('mantra') || text.includes('istana') || text.includes('ksatria') || text.includes('kerajaan')) return 'fantasy';
  if (text.includes('detektif') || text.includes('noir') || text.includes('kasus') || text.includes('pistol') || text.includes('malam') || text.includes('hujan')) return 'noir';
  if (text.includes('hantu') || text.includes('seram') || text.includes('kutukan') || text.includes('makam') || text.includes('darah') || text.includes('monster')) return 'horror';
  if (text.includes('laut') || text.includes('kapal') || text.includes('samudra') || text.includes('ombak') || text.includes('pulau') || text.includes('hutan')) return 'adventure';
  if (text.includes('cyber') || text.includes('hacker') || text.includes('neon') || text.includes('matrix') || text.includes('film masa depan') || text.includes('masa depan')) return 'scifi';
  if (text.includes('proyektor') || text.includes('35mm') || text.includes('seluloid')) return 'projector';

  return 'action';
}

// Deteksi ekspresi komik dinamis (tidak flat) berdasarkan dialog, teks & SFX
function getPanelExpression(panel, fallback = 'confident') {
  if (panel?.expression) return panel.expression;
  const dialogues = panel?.dialogues || [];
  const text = (dialogues.map(d => d.text).join(' ') + ' ' + (panel?.sfx || '')).toUpperCase();

  if (text.includes('?!') || text.includes('!?') || text.includes('APA?!') || text.includes('BAGAIMANA') || text.includes('MUSTAHIL') || text.includes('KAU GILA') || text.includes('SIAPA')) {
    return 'shocked';
  }
  if (text.includes('HANCUR') || text.includes('MATI') || text.includes('SIALAN') || text.includes('BERHENTI') || text.includes('AWAS') || text.includes('KURANG AJAR') || text.includes('LAKUKAN') || text.includes('TAK AKAN') || text.includes('SERANG')) {
    return 'furious';
  }
  if (text.includes('LUAR BIASA') || text.includes('BERHASIL') || text.includes('AKHIRNYA') || text.includes('HEBAT') || text.includes('INILAH') || text.includes('LIHAT') || text.includes('KEREN') || text.includes('WAH') || text.includes('YAAAY')) {
    return 'excited';
  }
  if (text.includes('TOLONG') || text.includes('LARI') || text.includes('GAWAT') || text.includes('TAKUT') || text.includes('BAHAYA') || text.includes('ROBEK') || text.includes('MOGOK')) {
    return 'panicked';
  }
  if (text.includes('HEH') || text.includes('TENANG') || text.includes('SUDAH KUDUGA') || text.includes('PASTI') || text.includes('KARENA NASKAH') || text.includes('GILIRANKU')) {
    return 'smirk';
  }
  if (text.includes('HMM') || text.includes('MUNGKIN') || text.includes('PIKIR') || text.includes('SELIDIKI') || text.includes('MENGENAI') || text.includes('ADA YANG') || text.includes('JEBAKAN')) {
    return 'serious';
  }
  return fallback;
}

// Bangun 5 panel komik dinamis dari data manifestasi
function resolveFivePanels(manifestation, sentence, pageNumber, theme) {
  const cleanSentence = (manifestation?.sentence || sentence || 'Realitas tunduk pada goresan naskah').trim();
  const words = cleanSentence.split(/\s+/).filter(Boolean);
  const subjectName = words.slice(0, Math.min(3, words.length)).join(' ') || 'Tokoh Utama';

  if (manifestation?.comicPanels && Array.isArray(manifestation.comicPanels) && manifestation.comicPanels.length >= 3) {
    return manifestation.comicPanels;
  }

  const existing = manifestation?.comicPanels || [];

  const panel1 = existing[0] || {
    panelNumber: 1,
    panelType: 'wide_top',
    sfx: manifestation?.soundEffect || 'KRAAK-WHOOSH!',
    dialogues: [
      {
        speaker: subjectName.toUpperCase(),
        text: cleanSentence.toUpperCase(),
        tail: 'left',
        bubbleType: 'shout'
      }
    ]
  };

  const panel2 = existing[1] || {
    panelNumber: 2,
    panelType: 'mid_left',
    dialogues: [
      {
        speaker: 'Saksi / Kawan',
        text: 'BAGAIMANA BISA HAL INI TERJADI BEGITU SAJA?!',
        tail: 'right',
        bubbleType: 'speech'
      }
    ]
  };

  const panel3 = existing[2] || {
    panelNumber: 3,
    panelType: 'mid_right',
    sfx: 'WHAAAAM!',
    dialogues: [
      {
        speaker: subjectName.toUpperCase(),
        text: manifestation?.panelDialogue ? manifestation.panelDialogue.replace(/^"|"$/g, '').toUpperCase() : 'KARENA NASKAH TELAH MENULISKANNYA SECARA PASTI!',
        tail: 'left',
        bubbleType: 'speech'
      }
    ]
  };

  const panel4 = existing[3] || {
    panelNumber: 4,
    panelType: 'bottom_left',
    sfx: 'BOOOOM!',
    dialogues: [
      {
        speaker: 'Pengamat',
        text: manifestation?.storyOutcome ? manifestation.storyOutcome.slice(0, 45).toUpperCase() : 'KEKUATAN INI BENAR-BENAR MENGUBAH SEGALA HAL!',
        tail: 'left',
        bubbleType: 'shout'
      }
    ]
  };

  const panel5 = existing[4] || {
    panelNumber: 5,
    panelType: 'bottom_right',
    dialogues: [
      {
        speaker: subjectName.toUpperCase(),
        text: 'BABAK INI BARU SAJA DIMULAI... APA LANGKAH BERIKUTNYA?',
        tail: 'center',
        bubbleType: 'thought'
      }
    ]
  };

  return [panel1, panel2, panel3, panel4, panel5];
}

export default function ComicBookPage({
  pageNumber = 1,
  pageTitle = 'Halaman 1: Awal Mula Naskah',
  manifestation = null,
  inkType = 'emas',
  allPanels = [],
  layoutType = '5-panel',
  characterStyle = 'auto',
  characterBible = null,
  renderingMode = 'vector',
  onGeneratePanelImage = () => {},
  generatingImages = {},
  onLayoutChange = () => {},
  branching = null,
  onSelectBranch = () => {},
  onOpenFullBookModal = () => {}
}) {
  const comicPageRef = useRef(null);

  const activeLayout = manifestation?.layoutType || layoutType || '5-panel';
  const customSentence = manifestation?.sentence || "Goresan naskah penulis mulai mengubah realitas di sekitar.";
  const theme = useMemo(() => detectStoryTheme(manifestation, customSentence), [manifestation, customSentence]);
  const panels = useMemo(() => resolveFivePanels(manifestation, customSentence, pageNumber, theme), [manifestation, customSentence, pageNumber, theme]);

  // Deteksi gambar hasil AI Imagen per panel jika tersedia (Hybrid Rendering)
  const getPanelImage = (idx) => {
    return panels[idx]?.aiImageUrl || 
           manifestation?.comicPanels?.[idx]?.aiImageUrl || 
           manifestation?.[`panelImage_${idx + 1}`] || 
           null;
  };

  // Pilihan Tipografi Komik Profesional (Comic Book Lettering)
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem('mythoria_comic_font') || 'Comic Neue');
  const fontOptions = [
    { id: 'Comic Neue', label: '💬 Comic Neue (Jernih & Rapi)', family: "'Comic Neue', cursive, sans-serif" },
    { id: 'Bangers', label: '💥 Bangers (Pop-Art Marvel Retro)', family: "'Bangers', cursive, Impact, sans-serif" },
    { id: 'Boogaloo', label: '🎨 Boogaloo (Kartun Klasik 70s)', family: "'Boogaloo', cursive, sans-serif" },
    { id: 'Patrick Hand', label: '✍️ Patrick Hand (Indie Manga)', family: "'Patrick Hand', cursive, sans-serif" },
    { id: 'system-ui', label: '📐 Standar Sistem', family: "system-ui, -apple-system, sans-serif" }
  ];

  const activeFontFamily = useMemo(() => {
    const opt = fontOptions.find(f => f.id === selectedFont);
    return opt ? opt.family : "'Comic Neue', cursive, sans-serif";
  }, [selectedFont]);

  // State Editor Interaktif Balon Dialog & SFX (Per-Panel Overrides & Offsets)
  const [dialogueOverrides, setDialogueOverrides] = useState({});
  const [bubbleOffsets, setBubbleOffsets] = useState({});
  const [sfxOverrides, setSfxOverrides] = useState({});
  const [sfxOffsets, setSfxOffsets] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);

  const getPanelDialogue = (idx) => {
    if (dialogueOverrides[idx]) return dialogueOverrides[idx];
    return panels[idx]?.dialogues?.[0] || null;
  };

  const getPanelSfx = (idx) => {
    if (sfxOverrides[idx] !== undefined) return sfxOverrides[idx];
    return panels[idx]?.sfx || '';
  };

  // Event handler drag-and-drop balon dan SFX
  const handleDragStart = (e, type, panelIdx) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = type === 'bubble' ? (bubbleOffsets[panelIdx] || { x: 0, y: 0 }) : (sfxOffsets[panelIdx] || { x: 0, y: 0 });
    setDraggingItem({
      type,
      panelIdx,
      startX: e.clientX,
      startY: e.clientY,
      initialX: cur.x,
      initialY: cur.y,
      hasMoved: false
    });
  };

  const handleContainerMouseMove = (e) => {
    if (!draggingItem) return;
    const deltaX = e.clientX - draggingItem.startX;
    const deltaY = e.clientY - draggingItem.startY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      draggingItem.hasMoved = true;
    }

    const svg = comicPageRef.current?.querySelector('svg');
    const rect = svg ? svg.getBoundingClientRect() : { width: 600, height: 850 };
    const scaleRatio = 600 / (rect.width || 600);

    const newX = draggingItem.initialX + (deltaX * scaleRatio);
    const newY = draggingItem.initialY + (deltaY * scaleRatio);

    if (draggingItem.type === 'bubble') {
      setBubbleOffsets(prev => ({
        ...prev,
        [draggingItem.panelIdx]: { x: Math.round(newX), y: Math.round(newY) }
      }));
    } else if (draggingItem.type === 'sfx') {
      setSfxOffsets(prev => ({
        ...prev,
        [draggingItem.panelIdx]: { x: Math.round(newX), y: Math.round(newY) }
      }));
    }
  };

  const handleContainerMouseUp = () => {
    setDraggingItem(null);
  };

  // Penentuan Gaya Karakter Komik (Multi-Gaya: Cyber, Fantasi, Noir, Profesor, Heroine, Aksi)
  const resolvedCharStyle = useMemo(() => {
    const chosen = manifestation?.characterStyle || characterStyle;
    if (chosen && chosen !== 'auto') return chosen;
    if (theme === 'scifi' || theme === 'cyber') return 'scifi';
    if (theme === 'fantasy' || theme === 'wizard' || theme === 'sword') return 'fantasy';
    if (theme === 'noir') return 'noir';
    if (theme === 'retro_invention' || theme === 'inventor') return 'inventor';
    return 'action';
  }, [manifestation, characterStyle, theme]);

  // Deteksi Ekspresi Emosi Dinamis untuk Setiap Panel (Tidak Flat!)
  const exp1 = useMemo(() => getPanelExpression(panels[0], 'excited'), [panels]);
  const exp2 = useMemo(() => getPanelExpression(panels[1], 'shocked'), [panels]);
  const exp3 = useMemo(() => getPanelExpression(panels[2], 'furious'), [panels]);
  const exp4 = useMemo(() => getPanelExpression(panels[3], 'screaming'), [panels]);
  const exp5 = useMemo(() => getPanelExpression(panels[4], 'awakened'), [panels]);

  // Cabang cerita dinamis
  const dynamicBranching = useMemo(() => {
    if (branching && branching.length > 0 && !branching[0].label.includes('Madrid')) {
      return branching;
    }
    if (manifestation?.branchingOptions && manifestation.branchingOptions.length > 0) {
      return manifestation.branchingOptions.map((opt, i) => ({
        id: `opt-${i}`,
        label: opt.label,
        targetPage: pageNumber + (opt.targetOffset || (i + 1))
      }));
    }
    return [
      {
        id: 'opt-a',
        label: `Lanjutkan Aksi Menuntaskan ${customSentence.slice(0, 32)}...`,
        targetPage: pageNumber + 1
      },
      {
        id: 'opt-b',
        label: `Selidiki Dampak Rahasia dan Waspadai Konsekuensi Baru`,
        targetPage: pageNumber + 2
      }
    ];
  }, [branching, manifestation, pageNumber, customSentence]);

  // Ekspor Halaman Tunggal sebagai PNG
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

  // ========================================================
  // RENDER BALON UCAPAN KOMIK DINAMIS (INTERAKTIF & DRAGGABLE)
  // ========================================================
  const renderSpeechBubble = (dialogue, baseX, baseY, width, height, maxChars = 20, panelIdx = 0) => {
    if (!dialogue || !dialogue.text) return null;
    const lines = wrapSvgText(dialogue.text, maxChars);
    const speaker = dialogue.speaker;
    const bubbleType = dialogue.bubbleType || 'speech';
    const tail = dialogue.tail || 'left';

    const offset = bubbleOffsets[panelIdx] || { x: 0, y: 0 };
    const finalX = baseX + offset.x;
    const finalY = baseY + offset.y;

    const textLinesCount = lines.length + (speaker ? 1 : 0);
    const bubbleHeight = Math.max(38, textLinesCount * 12 + 14);
    const bubbleWidth = Math.min(width, Math.max(90, width - 8));

    return (
      <g 
        transform={`translate(${finalX}, ${finalY})`}
        onMouseDown={(e) => handleDragStart(e, 'bubble', panelIdx)}
        onClick={(e) => {
          e.stopPropagation();
          if (!draggingItem?.hasMoved) {
            setEditingItem({
              type: 'bubble',
              panelIdx,
              text: dialogue.text,
              speaker: dialogue.speaker || '',
              bubbleType: dialogue.bubbleType || 'speech',
              tail: dialogue.tail || 'left'
            });
          }
        }}
        className="cursor-move group select-none"
        style={{ pointerEvents: 'all' }}
      >
        {/* Garis batas hover interaktif untuk indikasi bisa digeser/diedit */}
        <rect
          x={-3}
          y={-3}
          width={bubbleWidth + 6}
          height={bubbleHeight + 6}
          rx={bubbleType === 'thought' ? 18 : 14}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="opacity-0 group-hover:opacity-100 transition pointer-events-none"
        />

        {/* Ekor Balon */}
        {bubbleType !== 'thought' && bubbleType !== 'narration' && (
          <polygon
            points={
              tail === 'right'
                ? `${bubbleWidth - 30},${bubbleHeight - 1} ${bubbleWidth - 15},${bubbleHeight + 12} ${bubbleWidth - 45},${bubbleHeight - 1}`
                : tail === 'center'
                ? `${bubbleWidth / 2 - 10},${bubbleHeight - 1} ${bubbleWidth / 2},${bubbleHeight + 12} ${bubbleWidth / 2 + 10},${bubbleHeight - 1}`
                : `30,${bubbleHeight - 1} 20,${bubbleHeight + 12} 45,${bubbleHeight - 1}`
            }
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="2.5"
          />
        )}

        {/* Ekor lingkaran jika thought bubble */}
        {bubbleType === 'thought' && (
          <g>
            <circle cx={bubbleWidth / 2} cy={bubbleHeight + 5} r="4" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx={bubbleWidth / 2 - 3} cy={bubbleHeight + 12} r="2.5" fill="#fff" stroke="#000" strokeWidth="1.5" />
          </g>
        )}

        {/* Badan Balon */}
        <rect
          width={bubbleWidth}
          height={bubbleHeight}
          rx={bubbleType === 'thought' ? 16 : bubbleType === 'narration' ? 4 : 12}
          fill={bubbleType === 'narration' ? '#fef08a' : '#ffffff'}
          stroke="#000000"
          strokeWidth="2.5"
          filter="url(#comicDropShadow)"
        />

        {/* Speaker Name Tag */}
        {speaker && (
          <text
            x={bubbleWidth / 2}
            y={12}
            textAnchor="middle"
            fontFamily={activeFontFamily}
            fontSize="8"
            fontWeight="900"
            fill="#dc2626"
            letterSpacing="0.5"
          >
            [{speaker.toUpperCase()}]
          </text>
        )}

        {/* Teks Dialog Berbasis Font Pilihan */}
        {lines.map((line, i) => (
          <text
            key={i}
            x={bubbleWidth / 2}
            y={(speaker ? 23 : 16) + i * 11.5}
            textAnchor="middle"
            fontFamily={activeFontFamily}
            fontSize="8.5"
            fontWeight={bubbleType === 'shout' ? '900' : '700'}
            fill="#000000"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  // ========================================================
  // RENDER EFEK SUARA KOMIK (SFX) INTERAKTIF & DRAGGABLE
  // ========================================================
  const renderSfx = (sfxText, baseX, baseY, rotation = 0, fontSize = 18, fill = '#fef08a', strokeWidth = 1.2, panelIdx = 0) => {
    if (!sfxText) return null;
    const offset = sfxOffsets[panelIdx] || { x: 0, y: 0 };
    const finalX = baseX + offset.x;
    const finalY = baseY + offset.y;

    return (
      <g
        transform={`translate(${offset.x}, ${offset.y})`}
        onMouseDown={(e) => handleDragStart(e, 'sfx', panelIdx)}
        onClick={(e) => {
          e.stopPropagation();
          if (!draggingItem?.hasMoved) {
            setEditingItem({
              type: 'sfx',
              panelIdx,
              text: sfxText
            });
          }
        }}
        className="cursor-move group select-none"
        style={{ pointerEvents: 'all' }}
      >
        <text
          x={baseX}
          y={baseY}
          fontFamily="'Bangers', cursive, Impact, sans-serif"
          fontSize={fontSize}
          fill={fill}
          stroke="#000"
          strokeWidth={strokeWidth}
          transform={rotation ? `rotate(${rotation} ${baseX} ${baseY})` : undefined}
          letterSpacing="1"
          filter="url(#comicDropShadow)"
        >
          {sfxText}
        </text>
      </g>
    );
  };

  // ========================================================
  // RENDER LATAR BELAKANG KOTA / PANORAMA BERKUALITAS
  // ========================================================
  const renderCitySkyline = (width = 564, height = 235) => (
    <g opacity="0.9">
      {/* Siluet Gedung Pencakar Langit Bertingkat */}
      <rect x="20" y="80" width="55" height="155" fill="#1e293b" stroke="#000" strokeWidth="2" />
      <line x1="47" y1="50" x2="47" y2="80" stroke="#000" strokeWidth="2" />
      <circle cx="47" cy="48" r="3" fill="#ef4444" />
      {/* Jendela Gedung 1 */}
      <rect x="28" y="95" width="8" height="10" fill="#fef08a" />
      <rect x="42" y="95" width="8" height="10" fill="#fef08a" />
      <rect x="56" y="95" width="8" height="10" fill="#38bdf8" />
      <rect x="28" y="115" width="8" height="10" fill="#38bdf8" />
      <rect x="42" y="115" width="8" height="10" fill="#fef08a" />
      <rect x="56" y="115" width="8" height="10" fill="#fef08a" />

      {/* Gedung 2 (Menara Menjulang) */}
      <polygon points="90,100 130,50 170,100 170,235 90,235" fill="#0f172a" stroke="#000" strokeWidth="2" />
      <line x1="130" y1="25" x2="130" y2="50" stroke="#000" strokeWidth="3" />
      <circle cx="130" cy="22" r="4" fill="#38bdf8" />
      <circle cx="130" cy="90" r="12" fill="#fde047" stroke="#000" strokeWidth="2" />

      {/* Gedung 3 */}
      <rect x="190" y="110" width="70" height="125" fill="#334155" stroke="#000" strokeWidth="2" />
      <rect x="200" y="125" width="10" height="12" fill="#fef08a" />
      <rect x="220" y="125" width="10" height="12" fill="#38bdf8" />
      <rect x="240" y="125" width="10" height="12" fill="#fef08a" />

      {/* Jembatan Layang Futuristik Melintas di Udara */}
      <path d="M 0 160 Q 150 130 300 165 T 564 150" fill="none" stroke="#000" strokeWidth="7" />
      <path d="M 0 160 Q 150 130 300 165 T 564 150" fill="none" stroke="#0284c7" strokeWidth="4" />

      {/* Kendaraan / Mobil Terbang Melintas */}
      <g transform="translate(160, 115) scale(0.7)">
        <ellipse cx="30" cy="15" rx="25" ry="8" fill="#f59e0b" stroke="#000" strokeWidth="2" />
        <ellipse cx="32" cy="12" rx="14" ry="5" fill="#67e8f9" stroke="#000" strokeWidth="1" />
        <line x1="5" y1="18" x2="-20" y2="18" stroke="#fde047" strokeWidth="2" strokeDasharray="6 3" />
      </g>
    </g>
  );

  // ========================================================
  // RENDER KARAKTER UTAMA MULTI-GAYA & ULTRA EKSPRESIF
  // Gaya: scifi | fantasy | noir | inventor | female_hero | action
  // Ekspresi: shocked | furious | excited | panicked | smirk | serious | screaming | confident
  // ========================================================
  const renderProtagonist = (x, y, scale = 1, poseOrOptions = 'confident', expressionOverride = null) => {
    let pose = 'confident';
    let expression = 'confident';
    let style = resolvedCharStyle;

    if (typeof poseOrOptions === 'object' && poseOrOptions !== null) {
      pose = poseOrOptions.pose || 'confident';
      expression = poseOrOptions.expression || 'confident';
      style = poseOrOptions.style || resolvedCharStyle;
    } else {
      pose = poseOrOptions || 'confident';
      expression = expressionOverride || 'confident';
    }

    // Penentuan Palet Warna Sesuai Gaya Karakter & Bible Karakter
    let jacketFill = '#2563eb';
    let collarFill = '#dc2626';
    let hairFill = '#0f172a';
    const skinFill = '#fed7aa';

    if (style === 'scifi') {
      jacketFill = '#0f172a';
      collarFill = '#06b6d4';
      hairFill = '#06b6d4';
    } else if (style === 'fantasy') {
      jacketFill = '#b45309';
      collarFill = '#facc15';
      hairFill = '#fde047';
    } else if (style === 'noir') {
      jacketFill = '#18181b';
      collarFill = '#991b1b';
      hairFill = '#27272a';
    } else if (style === 'inventor') {
      jacketFill = '#f8fafc';
      collarFill = '#b45309';
      hairFill = '#78716c';
    } else if (style === 'female_hero') {
      jacketFill = '#581c87';
      collarFill = '#d946ef';
      hairFill = '#a21caf';
    }

    // Selaraskan dengan Bible Karakter jika ditentukan oleh penulis
    if (characterBible?.protagonistAppearance) {
      const app = characterBible.protagonistAppearance.toLowerCase();
      if (app.includes('perak') || app.includes('silver') || app.includes('putih')) hairFill = '#e2e8f0';
      else if (app.includes('emas') || app.includes('pirang') || app.includes('kuning')) hairFill = '#facc15';
      else if (app.includes('merah')) hairFill = '#ef4444';
      else if (app.includes('biru')) hairFill = '#0ea5e9';

      if (app.includes('jubah hitam') || app.includes('hitam') || app.includes('gelap')) {
        jacketFill = '#0f172a';
        collarFill = '#334155';
      } else if (app.includes('putih') || app.includes('jas lab')) {
        jacketFill = '#f8fafc';
        collarFill = '#cbd5e1';
      } else if (app.includes('merah')) {
        jacketFill = '#b91c1c';
        collarFill = '#f59e0b';
      }
    }

    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* Bayangan Karakter */}
        <ellipse cx="40" cy="150" rx="35" ry="8" fill="#000" opacity="0.4" />

        {/* Jubah Fantasi (Hanya untuk Gaya Fantasi) */}
        {style === 'fantasy' && (
          <path d="M 10 70 L -10 145 L 90 145 L 70 70 Z" fill="#991b1b" stroke="#000" strokeWidth="2.5" />
        )}

        {/* Badan & Pakaian */}
        <path d="M 15 70 L 65 70 L 75 145 L 5 145 Z" fill={jacketFill} stroke="#000" strokeWidth="3" />
        
        {/* Detail Pakaian Sesuai Gaya */}
        {style === 'scifi' ? (
          <g>
            <path d="M 22 75 L 22 135 M 58 75 L 58 135" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6 3" />
            <polygon points="32,70 40,88 48,70" fill="#06b6d4" stroke="#000" strokeWidth="1" />
            <rect x="36" y="95" width="8" height="15" fill="#38bdf8" />
          </g>
        ) : style === 'noir' ? (
          <g>
            <polygon points="20,70 40,105 32,70" fill="#27272a" stroke="#000" strokeWidth="1.5" />
            <polygon points="60,70 40,105 48,70" fill="#27272a" stroke="#000" strokeWidth="1.5" />
            <polygon points="37,80 43,80 45,120 40,126 35,120" fill="#b91c1c" stroke="#000" strokeWidth="1" />
          </g>
        ) : style === 'inventor' ? (
          <g>
            <rect x="25" y="80" width="30" height="2" fill="#000" />
            <circle cx="40" cy="90" r="3" fill="#b45309" />
            <circle cx="40" cy="105" r="3" fill="#b45309" />
            <rect x="48" y="100" width="16" height="20" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" />
            <line x1="53" y1="95" x2="53" y2="105" stroke="#ef4444" strokeWidth="2.5" />
          </g>
        ) : (
          <g>
            <polygon points="25,70 40,95 30,70" fill={collarFill} stroke="#000" strokeWidth="1.5" />
            <polygon points="55,70 40,95 50,70" fill={collarFill} stroke="#000" strokeWidth="1.5" />
            <polygon points="32,70 40,90 48,70" fill="#ffffff" stroke="#000" strokeWidth="1" />
          </g>
        )}

        {/* Celana Gelap */}
        <rect x="15" y="145" width="22" height="25" fill="#0f172a" stroke="#000" strokeWidth="2" />
        <rect x="43" y="145" width="22" height="25" fill="#0f172a" stroke="#000" strokeWidth="2" />

        {/* Lengan Pose */}
        {pose === 'pointing' ? (
          <g>
            <path d="M 65 75 Q 95 65 110 50" fill="none" stroke={jacketFill} strokeWidth="14" strokeLinecap="round" />
            <path d="M 65 75 Q 95 65 110 50" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <circle cx="112" cy="48" r="7" fill={skinFill} stroke="#000" strokeWidth="2" />
            <line x1="112" y1="48" x2="124" y2="42" stroke={skinFill} strokeWidth="4" strokeLinecap="round" />
            <line x1="112" y1="48" x2="124" y2="42" stroke="#000" strokeWidth="1" strokeLinecap="round" />
            <path d="M 15 75 L 5 110" stroke={jacketFill} strokeWidth="12" strokeLinecap="round" />
            <path d="M 15 75 L 5 110" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M 15 75 L -2 95 L 12 110" fill="none" stroke={jacketFill} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 15 75 L -2 95 L 12 110" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 65 75 L 82 95 L 68 110" fill="none" stroke={jacketFill} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 65 75 L 82 95 L 68 110" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {/* Leher */}
        <rect x="34" y="56" width="12" height="16" fill={skinFill} stroke="#000" strokeWidth="2" />

        {/* Rambut Belakang */}
        <ellipse cx="40" cy="38" rx="27" ry="24" fill={hairFill} stroke="#000" strokeWidth="2.5" />

        {/* Rambut Kuncir Kuda Heroine */}
        {style === 'female_hero' && (
          <g>
            <path d="M 55 35 Q 80 40 75 75 Q 65 55 55 45" fill={hairFill} stroke="#000" strokeWidth="2.5" />
            <circle cx="56" cy="37" r="4.5" fill="#facc15" stroke="#000" strokeWidth="1.5" />
          </g>
        )}

        {/* Kepala & Wajah */}
        <circle cx="40" cy="40" r="23" fill={skinFill} stroke="#000" strokeWidth="2.5" />

        {/* ======================================================== */}
        {/* FITUR WAJAH & EKSPRESI DINAMIS (TIDAK FLAT)              */}
        {/* ======================================================== */}
        {expression === 'furious' ? (
          <g id="exp-furious">
            {/* Alis Menghujam Marah */}
            <line x1="26" y1="28" x2="38" y2="35" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="54" y1="28" x2="42" y2="35" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mata Tajam Marah Berapi */}
            <polygon points="28,34 37,36 31,41" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="33" cy="37" r="2" fill="#ef4444" />
            <polygon points="52,34 43,36 49,41" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="47" cy="37" r="2" fill="#ef4444" />
            {/* Gigi Mengertak */}
            <rect x="32" y="47" width="16" height="7" rx="1" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <line x1="37" y1="47" x2="37" y2="54" stroke="#000" strokeWidth="1" />
            <line x1="43" y1="47" x2="43" y2="54" stroke="#000" strokeWidth="1" />
            {/* Urat Marah Merah Manga 💢 */}
            <path d="M 52 24 L 58 20 M 58 24 L 52 20 M 51 22 L 59 22 M 55 18 L 55 26" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : expression === 'shocked' ? (
          <g id="exp-shocked">
            {/* Alis Melengkung Tinggi */}
            <path d="M 26 27 Q 32 21 37 26" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M 43 26 Q 48 21 54 27" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            {/* Mata Melotot Putih Lebar & Pupil Titik */}
            <ellipse cx="32" cy="37" rx="6" ry="7" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="32" cy="37" r="1.5" fill="#000" />
            <ellipse cx="48" cy="37" rx="6" ry="7" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="48" cy="37" r="1.5" fill="#000" />
            {/* Mulut Menganga Kaget */}
            <ellipse cx="40" cy="51" rx="5" ry="7" fill="#1e1b4b" stroke="#000" strokeWidth="1.5" />
            <ellipse cx="40" cy="54" rx="3" ry="3" fill="#f43f5e" />
            {/* Tetesan Keringat Dingin Manga 💧 */}
            <path d="M 56 26 Q 59 32 57 35 Q 54 32 56 26 Z" fill="#38bdf8" stroke="#000" strokeWidth="1" />
          </g>
        ) : expression === 'excited' ? (
          <g id="exp-excited">
            {/* Alis Melengkung Ceria */}
            <path d="M 27 28 Q 32 24 37 29" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M 43 29 Q 48 24 53 28" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            {/* Mata Bintang Berbinar Emas ✦ */}
            <polygon points="32,32 34,36 38,37 34,39 32,43 30,39 26,37 30,36" fill="#facc15" stroke="#000" strokeWidth="1" />
            <polygon points="48,32 50,36 54,37 50,39 48,43 46,39 42,37 46,36" fill="#facc15" stroke="#000" strokeWidth="1" />
            {/* Senyum Lebar Bahagia */}
            <path d="M 32 47 Q 40 45 48 47 Q 40 58 32 47 Z" fill="#ef4444" stroke="#000" strokeWidth="1.5" />
            <path d="M 35 48 Q 40 46 45 48" fill="#fff" />
            {/* Rona Merah Manga di Pipi /// */}
            <line x1="22" y1="43" x2="26" y2="46" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="54" y1="46" x2="58" y2="43" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : expression === 'panicked' ? (
          <g id="exp-panicked">
            {/* Bayangan Garis Gelap Kengerian Manga di Dahi */}
            <line x1="32" y1="20" x2="32" y2="30" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
            <line x1="36" y1="18" x2="36" y2="32" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
            <line x1="40" y1="19" x2="40" y2="32" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
            <line x1="44" y1="18" x2="44" y2="30" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
            {/* Alis Panik Menurun ke Luar */}
            <line x1="28" y1="33" x2="37" y2="28" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="43" y1="28" x2="52" y2="33" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            {/* Mata Bergetar */}
            <ellipse cx="33" cy="38" rx="4" ry="5" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="33" cy="38" r="1.5" fill="#000" />
            <ellipse cx="47" cy="38" rx="4" ry="5" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="47" cy="38" r="1.5" fill="#000" />
            {/* Mulut Bergelombang Panik */}
            <path d="M 33 50 Q 36 47 40 51 Q 44 47 47 50" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : expression === 'smirk' ? (
          <g id="exp-smirk">
            {/* Satu Alis Naik Angkuh, Satu Datar */}
            <path d="M 26 27 Q 31 22 36 26" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="43" y1="31" x2="53" y2="30" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            {/* Mata Percaya Diri Menatap Tajam */}
            <ellipse cx="32" cy="38" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="33" cy="38" r="2.5" fill="#0f172a" />
            <ellipse cx="48" cy="38" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="49" cy="38" r="2.5" fill="#0f172a" />
            <circle cx="50" cy="36" r="1" fill="#fff" />
            {/* Senyum Licik / Smirk Naik ke Kanan */}
            <path d="M 33 51 Q 40 53 48 46" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : expression === 'serious' ? (
          <g id="exp-serious">
            {/* Alis Berkerut Rapat */}
            <line x1="27" y1="31" x2="38" y2="32" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="32" x2="53" y2="31" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="39" y1="29" x2="41" y2="34" stroke="#000" strokeWidth="1.5" />
            {/* Mata Fokus Menyempit */}
            <polygon points="28,36 37,35 36,41 29,41" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="33" cy="38" r="2" fill="#0f172a" />
            <polygon points="43,35 52,36 51,41 44,41" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="47" cy="38" r="2" fill="#0f172a" />
            {/* Mulut Garis Rapat Tegas */}
            <line x1="33" y1="49" x2="47" y2="49" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          <g id="exp-confident">
            {/* Alis Tegas Natural */}
            <line x1="27" y1="30" x2="37" y2="31" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="43" y1="31" x2="53" y2="30" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            {/* Mata Manga Jernih */}
            <ellipse cx="32" cy="38" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="33" cy="38" r="2.5" fill="#0f172a" />
            <circle cx="34" cy="36" r="1" fill="#fff" />
            <ellipse cx="48" cy="38" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="49" cy="38" r="2.5" fill="#0f172a" />
            <circle cx="50" cy="36" r="1" fill="#fff" />
            {/* Senyum Percaya Diri */}
            <path d="M 33 50 Q 40 57 47 50" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Aksesori Khusus Sesuai Gaya Karakter */}
        {style === 'scifi' && (
          <g id="cyber-visor">
            <polygon points="42,32 56,32 54,44 43,42" fill="#06b6d4" opacity="0.8" stroke="#22d3ee" strokeWidth="1.5" />
            <circle cx="49" cy="38" r="2" fill="#ffffff" />
            <line x1="56" y1="35" x2="65" y2="33" stroke="#22d3ee" strokeWidth="2" />
          </g>
        )}

        {style === 'noir' && (
          <g id="noir-fedora">
            <ellipse cx="40" cy="22" rx="30" ry="8" fill="#18181b" stroke="#000" strokeWidth="2" />
            <path d="M 22 22 C 22 6 58 6 58 22 Z" fill="#27272a" stroke="#000" strokeWidth="2" />
            <rect x="23" y="16" width="34" height="4" fill="#dc2626" />
          </g>
        )}

        {style === 'inventor' && (
          <g id="inventor-goggles">
            <circle cx="31" cy="22" r="7" fill="#b45309" stroke="#000" strokeWidth="1.5" />
            <circle cx="31" cy="22" r="4" fill="#67e8f9" opacity="0.75" />
            <circle cx="49" cy="22" r="7" fill="#b45309" stroke="#000" strokeWidth="1.5" />
            <circle cx="49" cy="22" r="4" fill="#67e8f9" opacity="0.75" />
            <line x1="38" y1="22" x2="42" y2="22" stroke="#000" strokeWidth="2" />
          </g>
        )}

        {/* Rambut Depan Sesuai Gaya */}
        {style !== 'noir' && (
          <polygon points="17,35 27,20 32,32 40,16 48,32 55,22 63,35" fill={hairFill} stroke="#000" strokeWidth="2" />
        )}
      </g>
    );
  };

  // ========================================================
  // RENDER TOKOH KEDUA / SAKSI (BUM / KAWAN REAKTIF)
  // Ekspresi: shocked | furious | excited | panicked | calm
  // ========================================================
  const renderCompanion = (x, y, scale = 1, expressionOrShocked = 'shocked') => {
    const isShocked = typeof expressionOrShocked === 'boolean' 
      ? expressionOrShocked 
      : (expressionOrShocked === 'shocked' || expressionOrShocked === 'panicked' || expressionOrShocked === 'screaming');
    
    const expression = typeof expressionOrShocked === 'string' 
      ? expressionOrShocked 
      : (expressionOrShocked ? 'shocked' : 'calm');

    let compFill = '#ea580c';
    if (characterBible?.companionAppearance) {
      const ca = characterBible.companionAppearance.toLowerCase();
      if (ca.includes('kuning')) compFill = '#eab308';
      else if (ca.includes('biru')) compFill = '#2563eb';
      else if (ca.includes('merah')) compFill = '#dc2626';
      else if (ca.includes('hijau')) compFill = '#16a34a';
    }

    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* Bayangan */}
        <ellipse cx="35" cy="135" rx="28" ry="7" fill="#000" opacity="0.35" />

        {/* Tubuh & Kaos Karakter Pendamping */}
        <path d="M 15 65 L 55 65 L 60 130 L 10 130 Z" fill={compFill} stroke="#000" strokeWidth="3" />
        <rect x="12" y="130" width="18" height="20" fill="#1e3a8a" stroke="#000" strokeWidth="2" />
        <rect x="40" y="130" width="18" height="20" fill="#1e3a8a" stroke="#000" strokeWidth="2" />

        {/* Lengan Sesuai Reaksi */}
        {expression === 'excited' ? (
          <g>
            <path d="M 15 70 L -2 45 L 8 30" fill="none" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" />
            <path d="M 15 70 L -2 45 L 8 30" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="8" cy="28" r="5" fill="#fed7aa" stroke="#000" strokeWidth="1.5" />
            <path d="M 55 70 L 72 45 L 62 30" fill="none" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" />
            <path d="M 55 70 L 72 45 L 62 30" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="62" cy="28" r="5" fill="#fed7aa" stroke="#000" strokeWidth="1.5" />
          </g>
        ) : isShocked ? (
          <g>
            <path d="M 15 70 L -4 55 L 4 40" fill="none" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" />
            <path d="M 15 70 L -4 55 L 4 40" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="5" cy="38" r="5" fill="#fed7aa" stroke="#000" strokeWidth="1.5" />

            <path d="M 55 70 L 74 55 L 66 40" fill="none" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" />
            <path d="M 55 70 L 74 55 L 66 40" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="65" cy="38" r="5" fill="#fed7aa" stroke="#000" strokeWidth="1.5" />
          </g>
        ) : (
          <g>
            <path d="M 15 70 L 5 105" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" />
            <path d="M 15 70 L 5 105" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M 55 70 L 65 105" stroke="#ea580c" strokeWidth="10" strokeLinecap="round" />
            <path d="M 55 70 L 65 105" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Kepala & Wajah */}
        <circle cx="35" cy="35" r="21" fill="#fed7aa" stroke="#000" strokeWidth="2.5" />

        {/* Rambut Cokelat Ikal */}
        <ellipse cx="35" cy="22" rx="23" ry="15" fill="#78350f" stroke="#000" strokeWidth="2" />
        <circle cx="20" cy="25" r="8" fill="#78350f" stroke="#000" strokeWidth="1.5" />
        <circle cx="50" cy="25" r="8" fill="#78350f" stroke="#000" strokeWidth="1.5" />

        {/* Kacamata Bulat / Kotak Komik */}
        <rect x="20" y="30" width="13" height="11" rx="3" fill="#ffffff" stroke="#000" strokeWidth="2" />
        <rect x="37" y="30" width="13" height="11" rx="3" fill="#ffffff" stroke="#000" strokeWidth="2" />
        <line x1="33" y1="35" x2="37" y2="35" stroke="#000" strokeWidth="2" />

        {/* Mata di Balik Kacamata */}
        {expression === 'excited' ? (
          <g>
            <path d="M 23 35 L 29 35" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M 40 35 L 46 35" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <circle cx="26" cy="35" r={isShocked ? 1.5 : 2.5} fill="#000" />
            <circle cx="43" cy="35" r={isShocked ? 1.5 : 2.5} fill="#000" />
          </g>
        )}

        {/* Mulut Sesuai Ekspresi */}
        {expression === 'excited' ? (
          <path d="M 28 44 Q 35 52 42 44" fill="#ef4444" stroke="#000" strokeWidth="1.5" />
        ) : isShocked ? (
          <ellipse cx="35" cy="46" rx="4" ry="6" fill="#dc2626" stroke="#000" strokeWidth="1.5" />
        ) : (
          <path d="M 30 45 Q 35 48 40 45" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Keringat Dingin Manga di Dahi */}
        {isShocked && (
          <path d="M 56 26 Q 59 32 57 35 Q 54 32 56 26 Z" fill="#38bdf8" stroke="#000" strokeWidth="1" />
        )}
      </g>
    );
  };

  // ========================================================
  // RENDER CLOSE UP WAJAH BESAR (ULTRA EMOSIONAL & DRAMATIS)
  // Ekspresi: furious | shocked | awakened | panicked | smirk | serious
  // ========================================================
  const renderCloseUpFace = (x, y, scale = 1, expression = 'awakened') => {
    let hairFill = '#0f172a';
    if (resolvedCharStyle === 'scifi') hairFill = '#06b6d4';
    if (resolvedCharStyle === 'fantasy') hairFill = '#facc15';
    if (resolvedCharStyle === 'female_hero') hairFill = '#a21caf';
    if (resolvedCharStyle === 'inventor') hairFill = '#78716c';

    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* Garis Fokus / Speedlines Manga Menusuk ke Tengah */}
        <line x1="-10" y1="0" x2="40" y2="30" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="105" y1="0" x2="60" y2="30" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="-15" y1="70" x2="30" y2="60" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="110" y1="70" x2="65" y2="60" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />

        {/* Rambut Belakang */}
        <ellipse cx="48" cy="45" rx="42" ry="38" fill={hairFill} stroke="#000" strokeWidth="3" />

        {/* Muka Besar */}
        <circle cx="48" cy="50" r="35" fill="#fed7aa" stroke="#000" strokeWidth="3" />

        {/* Bayangan Dramatis Sesuai Ekspresi */}
        {(expression === 'furious' || expression === 'panicked') && (
          <g>
            <line x1="30" y1="20" x2="30" y2="42" stroke="#3b82f6" strokeWidth="2" opacity="0.75" />
            <line x1="36" y1="18" x2="36" y2="44" stroke="#3b82f6" strokeWidth="2" opacity="0.75" />
            <line x1="42" y1="17" x2="42" y2="45" stroke="#3b82f6" strokeWidth="2" opacity="0.75" />
            <line x1="48" y1="17" x2="48" y2="45" stroke="#3b82f6" strokeWidth="2" opacity="0.75" />
            <line x1="54" y1="18" x2="54" y2="44" stroke="#3b82f6" strokeWidth="2" opacity="0.75" />
            <line x1="60" y1="20" x2="60" y2="42" stroke="#3b82f6" strokeWidth="2" opacity="0.75" />
          </g>
        )}

        {/* ======================================================== */}
        {/* MATA, ALIS & MULUT CLOSE-UP                              */}
        {/* ======================================================== */}
        {expression === 'furious' ? (
          <g id="cu-furious">
            <line x1="24" y1="34" x2="42" y2="43" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            <line x1="72" y1="34" x2="54" y2="43" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            <polygon points="26,42 42,44 32,53" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <circle cx="34" cy="46" r="3.5" fill="#ef4444" />
            <polygon points="70,42 54,44 64,53" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <circle cx="62" cy="46" r="3.5" fill="#ef4444" />
            <path d="M 48 53 L 45 59 L 51 59" fill="none" stroke="#000" strokeWidth="2" />
            <rect x="36" y="66" width="24" height="10" rx="2" fill="#ffffff" stroke="#000" strokeWidth="2.5" />
            <line x1="42" y1="66" x2="42" y2="76" stroke="#000" strokeWidth="1.5" />
            <line x1="48" y1="66" x2="48" y2="76" stroke="#000" strokeWidth="1.5" />
            <line x1="54" y1="66" x2="54" y2="76" stroke="#000" strokeWidth="1.5" />
            <path d="M 68 22 L 78 14 M 78 22 L 68 14 M 66 18 L 80 18 M 73 10 L 73 24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : expression === 'shocked' ? (
          <g id="cu-shocked">
            <path d="M 26 32 Q 35 22 43 31" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 53 31 Q 61 22 70 32" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="35" cy="46" rx="9" ry="11" fill="#fff" stroke="#000" strokeWidth="3" />
            <circle cx="35" cy="46" r="2.5" fill="#000" />
            <ellipse cx="61" cy="46" rx="9" ry="11" fill="#fff" stroke="#000" strokeWidth="3" />
            <circle cx="61" cy="46" r="2.5" fill="#000" />
            <ellipse cx="48" cy="70" rx="9" ry="12" fill="#1e1b4b" stroke="#000" strokeWidth="2.5" />
            <ellipse cx="48" cy="75" rx="5" ry="5" fill="#f43f5e" />
            <path d="M 74 38 Q 78 46 76 50 Q 72 46 74 38 Z" fill="#38bdf8" stroke="#000" strokeWidth="1.5" />
            <text x="-12" y="38" fontFamily="Impact, Arial Black, sans-serif" fontSize="28" fill="#facc15" stroke="#000" strokeWidth="1.5">
              ?!
            </text>
          </g>
        ) : expression === 'panicked' ? (
          <g id="cu-panicked">
            <line x1="28" y1="42" x2="42" y2="34" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <line x1="54" y1="34" x2="68" y2="42" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="35" cy="48" rx="7" ry="8" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <circle cx="35" cy="48" r="2" fill="#000" />
            <ellipse cx="61" cy="48" rx="7" ry="8" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <circle cx="61" cy="48" r="2" fill="#000" />
            <path d="M 36 68 Q 42 63 48 69 Q 54 63 60 68" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <path d="M 72 35 Q 76 43 74 46 Q 71 43 72 35 Z" fill="#38bdf8" stroke="#000" strokeWidth="1.5" />
          </g>
        ) : expression === 'smirk' ? (
          <g id="cu-smirk">
            <path d="M 26 33 Q 34 25 43 32" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="54" y1="38" x2="69" y2="36" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="35" cy="48" rx="8" ry="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <circle cx="36" cy="48" r="4.5" fill="#0f172a" />
            <circle cx="38" cy="45" r="2" fill="#fff" />
            <ellipse cx="61" cy="48" rx="8" ry="9" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <circle cx="62" cy="48" r="4.5" fill="#0f172a" />
            <circle cx="64" cy="45" r="2" fill="#fff" />
            <path d="M 48 53 L 45 60 L 50 60" fill="none" stroke="#000" strokeWidth="2" />
            <path d="M 38 68 Q 48 76 60 64" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <text x="-8" y="35" fontFamily="Impact, Arial Black, sans-serif" fontSize="26" fill="#38bdf8" stroke="#000" strokeWidth="1">
              HEH
            </text>
          </g>
        ) : (
          <g id="cu-awakened">
            <line x1="27" y1="36" x2="42" y2="38" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="54" y1="38" x2="69" y2="36" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="35" cy="48" rx="8" ry="10" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <polygon points="35,42 37,46 41,48 37,50 35,54 33,50 29,48 33,46" fill="#facc15" stroke="#000" strokeWidth="1" />
            <ellipse cx="61" cy="48" rx="8" ry="10" fill="#fff" stroke="#000" strokeWidth="2.5" />
            <polygon points="61,42 63,46 67,48 63,50 61,54 59,50 55,48 59,46" fill="#facc15" stroke="#000" strokeWidth="1" />
            <path d="M 48 53 L 45 60 L 50 60" fill="none" stroke="#000" strokeWidth="2" />
            <path d="M 38 67 Q 48 74 58 67" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <path d="M -5 30 L 5 40 L 0 45 L 8 55" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 95 30 L 85 40 L 90 45 L 82 55" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Aksesori Close-up Sesuai Gaya */}
        {resolvedCharStyle === 'scifi' && (
          <g>
            <polygon points="50,40 70,39 68,56 52,54" fill="#06b6d4" opacity="0.8" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="60" cy="47" r="3" fill="#fff" />
          </g>
        )}
        {resolvedCharStyle === 'inventor' && (
          <g>
            <circle cx="34" cy="24" r="9" fill="#b45309" stroke="#000" strokeWidth="2" />
            <circle cx="34" cy="24" r="5" fill="#67e8f9" opacity="0.8" />
            <circle cx="62" cy="24" r="9" fill="#b45309" stroke="#000" strokeWidth="2" />
            <circle cx="62" cy="24" r="5" fill="#67e8f9" opacity="0.8" />
            <line x1="43" y1="24" x2="53" y2="24" stroke="#000" strokeWidth="2.5" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full flex flex-col items-center my-6">
      
      {/* BILAH KONTROL ATAS LEMBAR KOMIK */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 border-3 border-black p-3 shadow-[4px_4px_0_#000] mb-4 text-white">
        <div className="flex items-center gap-2.5">
          <MythoriaLogo className="w-9 h-9 shrink-0" withBorder={true} />
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide text-yellow-300">
              LEMBAR KOMIK RESMI: {pageTitle}
            </h3>
            <p className="text-xs text-neutral-400">
              Format Standar Manga/Komik Cetak (100% Karakter Nyata Mengikuti Naskah Cerita)
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

      {/* BILAH INFORMASI FORMAT GRID & GAYA KARAKTER KOMIK */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2 bg-yellow-100 border-3 border-black px-3 py-2 shadow-[3px_3px_0_#000] mb-3">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-900">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Format & Gaya Karakter:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black bg-black text-yellow-300 px-2.5 py-1 border-2 border-black uppercase tracking-wider">
            {activeLayout === '3-panel' ? '🎞️ 3-Panel Sinematik' : activeLayout === '4-panel' ? '🔲 4-Panel Grid (2x2)' : '🖼️ 5-Panel Dinamis'}
          </span>
          <span className="text-xs font-black bg-neutral-900 text-white px-2.5 py-1 border-2 border-black uppercase tracking-wider">
            {resolvedCharStyle === 'scifi' ? '🤖 Cyber / Sci-Fi' :
             resolvedCharStyle === 'fantasy' ? '⚔️ Ksatria Fantasi' :
             resolvedCharStyle === 'noir' ? '🕵️ Detektif Noir' :
             resolvedCharStyle === 'inventor' ? '🧪 Profesor Penemu' :
             resolvedCharStyle === 'female_hero' ? '🧝‍♀️ Heroine Anime' :
             '🥋 Hero Aksi'}
          </span>
        </div>
      </div>

      {/* BILAH HYBRID RENDERING & KONSISTENSI TOKOH */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2 bg-neutral-900 border-3 border-black p-2.5 shadow-[3px_3px_0_#000] mb-3 text-white text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black uppercase text-yellow-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Tokoh Utama: {characterBible?.protagonistName || 'Rian'} & {characterBible?.companionName || 'Maya'}
          </span>
          <span className="text-[10px] bg-neutral-800 border border-neutral-600 px-2 py-0.5 text-neutral-300 font-bold rounded">
            {characterBible?.protagonistArchetype || 'Penjelajah'}
          </span>
        </div>

        {/* Tombol Generate Gambar AI Imagen per Panel */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            Lukis AI Imagen:
          </span>
          {(activeLayout === '3-panel' ? [1, 2, 3] : activeLayout === '4-panel' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]).map(pNum => {
            const isGenerating = generatingImages[`${pageNumber}-${pNum}`];
            const hasImg = !!getPanelImage(pNum - 1);
            return (
              <button
                key={pNum}
                onClick={() => onGeneratePanelImage(pNum, pageNumber, panels[pNum - 1]?.scene || customSentence)}
                disabled={isGenerating}
                className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black cursor-pointer shadow-[1px_1px_0_#000] flex items-center gap-1 transition ${
                  hasImg 
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-black' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
                title={hasImg ? `Panel ${pNum} sudah dilukis AI. Klik untuk melukis ulang!` : `Lukis ilustrasi nyata AI Google Imagen untuk Panel ${pNum}`}
              >
                {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin text-yellow-300" /> : hasImg ? '✓ P' + pNum : '🎨 P' + pNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* BILAH TIPOGRAFI & EDITOR BALON INTERAKTIF */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2.5 bg-yellow-200 border-3 border-black px-3 py-2 shadow-[3px_3px_0_#000] mb-3 text-neutral-900 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black uppercase text-neutral-950 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-red-600" />
            Font Dialog Komik:
          </span>
          <select
            value={selectedFont}
            onChange={(e) => {
              setSelectedFont(e.target.value);
              localStorage.setItem('mythoria_comic_font', e.target.value);
            }}
            className="bg-white border-2 border-black px-2 py-1 text-xs font-black rounded shadow-[2px_2px_0_#000] cursor-pointer focus:outline-none"
          >
            {fontOptions.map(f => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-800 hidden sm:inline flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-blue-700" />
            Klik balon untuk edit teks | Geser (drag) untuk reposisi
          </span>
          {(Object.keys(bubbleOffsets).length > 0 || Object.keys(sfxOffsets).length > 0 || Object.keys(dialogueOverrides).length > 0) && (
            <button
              type="button"
              onClick={() => {
                setBubbleOffsets({});
                setSfxOffsets({});
                setDialogueOverrides({});
                setSfxOverrides({});
              }}
              className="px-2 py-1 text-[10px] font-black uppercase bg-white hover:bg-neutral-100 border border-black cursor-pointer shadow-[1px_1px_0_#000] flex items-center gap-1"
              title="Kembalikan semua posisi balon & teks ke posisi default bawaan"
            >
              <RotateCcw className="w-3 h-3 text-red-600" />
              Reset Posisi
            </button>
          )}
        </div>
      </div>

      {/* LEMBAR HALAMAN KOMIK (ASPECT RATIO BUKU KOMIK ASLI) */}
      <div 
        ref={comicPageRef}
        id={`comic-page-${pageNumber}`}
        className="comic-book-sheet w-full max-w-3xl bg-neutral-900 border-4 border-black p-3 sm:p-4 shadow-[10px_10px_0_#000] relative select-none"
        style={{
          backgroundImage: 'radial-gradient(#525252 1.5px, transparent 1.5px)',
          backgroundSize: '12px 12px'
        }}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >
        {/* SVG RENDERER FULL PAGE KOMIK */}
        <svg 
          id={`comic-page-svg-${pageNumber}`}
          viewBox="0 0 600 850" 
          className="w-full h-auto bg-neutral-100 border-3 border-black shadow-[4px_4px_0_#000]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skyGrad-scifi" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <linearGradient id="skyGrad-fantasy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="60%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#fed7aa" />
            </linearGradient>

            <linearGradient id="skyGrad-noir" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#334155" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="skyGrad-action" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="60%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>

            <filter id="comicDropShadow" x="-5%" y="-5%" width="115%" height="115%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#000" />
            </filter>
          </defs>

          {/* LATAR KERTAS KOMIK */}
          <rect width="600" height="850" fill="#f8fafc" />

          {/* ======================================================== */}
          {/* LAYOUT 1: 5-PANEL DINAMIS (DEFAULT REFERENSI)            */}
          {/* ======================================================== */}
          {activeLayout === '5-panel' && (
            <g id="layout-5-panel">
              {/* PANEL 1: ATAS PANORAMA (ESTABLISHING SHOT DENGAN KARAKTER) */}
              <g id="panel-1" transform="translate(18, 18)">
                <rect width="564" height="235" fill={`url(#skyGrad-${theme})` || '#e0f2fe'} stroke="#000" strokeWidth="3" />
                
                {getPanelImage(0) ? (
                  <image href={getPanelImage(0)} x="0" y="0" width="564" height="235" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    {/* Latar Belakang Panorama Gedung & Kota Masa Depan */}
                    {renderCitySkyline(564, 235)}

                    {/* Tokoh Utama Berdiri Menunjuk ke Cakrawala */}
                    {renderProtagonist(370, 55, 1.05, 'pointing', exp1)}

                    {/* Tokoh Kedua / Kawan Berdiri di Sampingnya Terpesona */}
                    {renderCompanion(470, 75, 0.95, exp1 === 'shocked' ? 'shocked' : 'calm')}
                  </>
                )}

                {/* SFX Panel 1 */}
                {renderSfx(getPanelSfx(0), 270, 45, -5, 18, '#fef08a', 1.2, 0)}

                {/* Kotak Narasi Utama Atas (Tidak Akan Terpotong di Kiri) */}
                <g transform="translate(15, 12)">
                  <rect width="320" height="24" rx="3" fill="#fef08a" stroke="#000" strokeWidth="2" filter="url(#comicDropShadow)" />
                  <text x="12" y="16" textAnchor="start" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="900" fill="#000">
                    {truncateText(manifestation?.comicCaption || `PERISTIWA TERTULIS: ${customSentence.toUpperCase()}`, 48)}
                  </text>
                </g>

                {/* Balon Ucapan Panel 1 Menunjuk ke Tokoh Utama */}
                {getPanelDialogue(0) && renderSpeechBubble(getPanelDialogue(0), 18, 45, 235, 95, 24, 0)}
              </g>

              {/* PANEL 2: MID LEFT (REAKSI KAGET / DEBAT SAKSI) */}
              <g id="panel-2" transform="translate(18, 268)">
                <rect width="275" height="175" fill="#e2e8f0" stroke="#000" strokeWidth="3" />
                {getPanelImage(1) ? (
                  <image href={getPanelImage(1)} x="0" y="0" width="275" height="175" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    {/* Garis Dinding Interior */}
                    <rect x="0" y="100" width="275" height="75" fill="#cbd5e1" stroke="#000" strokeWidth="2" />
                    
                    {/* Tokoh Saksi Kaget Melongo di Sisi Kanan Menghadap Kiri */}
                    {renderCompanion(155, 15, 0.95, exp2)}
                  </>
                )}

                {/* Balon Ucapan */}
                {getPanelDialogue(1) && renderSpeechBubble(getPanelDialogue(1), 10, 12, 170, 75, 18, 1)}
              </g>

              {/* PANEL 3: MID RIGHT (PENJELASAN TOKOH UTAMA DENGAN TEGAS) */}
              <g id="panel-3" transform="translate(307, 268)">
                <rect width="275" height="175" fill="#fef9c3" stroke="#000" strokeWidth="3" />
                {getPanelImage(2) ? (
                  <image href={getPanelImage(2)} x="0" y="0" width="275" height="175" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    {/* Garis Gerak */}
                    <line x1="140" y1="87" x2="260" y2="20" stroke="#f59e0b" strokeWidth="3" strokeDasharray="10 5" opacity="0.6" />
                    
                    {/* Tokoh Utama Berpose Percaya Diri di Kiri */}
                    {renderProtagonist(20, 15, 0.95, 'confident', exp3)}
                  </>
                )}

                {renderSfx(getPanelSfx(2), 175, 150, 0, 16, '#b91c1c', 0.8, 2)}

                {/* Balon Ucapan Menghadap Tokoh */}
                {getPanelDialogue(2) && renderSpeechBubble(getPanelDialogue(2), 105, 12, 165, 80, 18, 2)}
              </g>

              {/* PANEL 4: BOTTOM LEFT (BENTURAN KONSEKUENSI & KEDUA TOKOH) */}
              <g id="panel-4" transform="translate(18, 458)">
                <rect width="365" height="235" fill="#fef3c7" stroke="#000" strokeWidth="3" />
                {getPanelImage(3) ? (
                  <image href={getPanelImage(3)} x="0" y="0" width="365" height="235" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    {/* Siluet Gedung Mini di Kejauhan */}
                    <rect x="30" y="110" width="40" height="125" fill="#94a3b8" stroke="#000" strokeWidth="2" />
                    <rect x="80" y="130" width="35" height="105" fill="#64748b" stroke="#000" strokeWidth="2" />

                    {/* Dua Karakter Bertatapan di Panel 4 */}
                    {renderCompanion(150, 80, 0.95, exp4)}
                    {renderProtagonist(245, 60, 1.05, 'pointing', exp4)}
                  </>
                )}

                {renderSfx(getPanelSfx(3), 25, 195, 0, 22, '#ef4444', 1.0, 3)}

                {getPanelDialogue(3) && renderSpeechBubble(getPanelDialogue(3), 12, 16, 240, 85, 24, 3)}
              </g>

              {/* PANEL 5: BOTTOM RIGHT (CLOSE UP EKSPRESI WAJAH TOKOH UTAMA) */}
              <g id="panel-5" transform="translate(397, 458)">
                <rect width="185" height="235" fill="#f1f5f9" stroke="#000" strokeWidth="3" />
                
                {getPanelImage(4) ? (
                  <image href={getPanelImage(4)} x="0" y="0" width="185" height="235" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  /* Close-Up Wajah Komik Besar dengan Mata & Rambut Nyata */
                  renderCloseUpFace(45, 95, 1.0, exp5)
                )}

                {/* Balon Pikiran Karakter */}
                {getPanelDialogue(4) && renderSpeechBubble(getPanelDialogue(4), 10, 12, 165, 75, 18, 4)}
              </g>
            </g>
          )}

          {/* ======================================================== */}
          {/* LAYOUT 2: 4-PANEL GRID (2x2 DENGAN KARAKTER NYATA)      */}
          {/* ======================================================== */}
          {activeLayout === '4-panel' && (
            <g id="layout-4-panel">
              {/* PANEL 1: KIRI ATAS */}
              <g transform="translate(18, 18)">
                <rect width="275" height="335" fill="#e0f2fe" stroke="#000" strokeWidth="3" />
                {getPanelImage(0) ? (
                  <image href={getPanelImage(0)} x="0" y="0" width="275" height="335" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  renderProtagonist(85, 140, 1.1, 'pointing', exp1)
                )}
                {getPanelDialogue(0) && renderSpeechBubble(getPanelDialogue(0), 15, 15, 245, 90, 24, 0)}
              </g>

              {/* PANEL 2: KANAN ATAS */}
              <g transform="translate(307, 18)">
                <rect width="275" height="335" fill="#f8fafc" stroke="#000" strokeWidth="3" />
                {getPanelImage(1) ? (
                  <image href={getPanelImage(1)} x="0" y="0" width="275" height="335" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  renderCompanion(100, 150, 1.1, exp2)
                )}
                {getPanelDialogue(1) && renderSpeechBubble(getPanelDialogue(1), 15, 15, 245, 90, 24, 1)}
              </g>

              {/* PANEL 3: KIRI BAWAH */}
              <g transform="translate(18, 368)">
                <rect width="275" height="335" fill="#fef9c3" stroke="#000" strokeWidth="3" />
                {getPanelImage(2) ? (
                  <image href={getPanelImage(2)} x="0" y="0" width="275" height="335" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  renderProtagonist(90, 140, 1.1, 'confident', exp3)
                )}
                {getPanelDialogue(2) && renderSpeechBubble(getPanelDialogue(2), 15, 15, 245, 90, 24, 2)}
              </g>

              {/* PANEL 4: KANAN BAWAH */}
              <g transform="translate(307, 368)">
                <rect width="275" height="335" fill="#f1f5f9" stroke="#000" strokeWidth="3" />
                {getPanelImage(3) ? (
                  <image href={getPanelImage(3)} x="0" y="0" width="275" height="335" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  renderCloseUpFace(90, 160, 1.2, exp4)
                )}
                {getPanelDialogue(3) && renderSpeechBubble(getPanelDialogue(3), 15, 15, 245, 90, 24, 3)}
              </g>
            </g>
          )}

          {/* ======================================================== */}
          {/* LAYOUT 3: 3-PANEL SINEMATIK (HORIZONTAL LEBAR)           */}
          {/* ======================================================== */}
          {activeLayout === '3-panel' && (
            <g id="layout-3-panel">
              {/* PANEL 1: ATAS SINEMATIK */}
              <g transform="translate(18, 18)">
                <rect width="564" height="215" fill="#e0f2fe" stroke="#000" strokeWidth="3" />
                {getPanelImage(0) ? (
                  <image href={getPanelImage(0)} x="0" y="0" width="564" height="215" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    {renderCitySkyline(564, 215)}
                    {renderProtagonist(400, 45, 1.05, 'pointing', exp1)}
                    {renderCompanion(490, 65, 0.95, exp1 === 'shocked' ? 'shocked' : 'calm')}
                  </>
                )}
                {getPanelDialogue(0) && renderSpeechBubble(getPanelDialogue(0), 20, 25, 270, 85, 26, 0)}
              </g>

              {/* PANEL 2: TENGAH SINEMATIK */}
              <g transform="translate(18, 248)">
                <rect width="564" height="215" fill="#f8fafc" stroke="#000" strokeWidth="3" />
                {getPanelImage(1) ? (
                  <image href={getPanelImage(1)} x="0" y="0" width="564" height="215" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    {renderCompanion(80, 50, 1.05, exp2)}
                    {renderProtagonist(420, 45, 1.05, 'confident', exp2)}
                  </>
                )}
                {getPanelDialogue(1) && renderSpeechBubble(getPanelDialogue(1), 170, 25, 240, 85, 24, 1)}
              </g>

              {/* PANEL 3: BAWAH SINEMATIK */}
              <g transform="translate(18, 478)">
                <rect width="564" height="235" fill="#fef9c3" stroke="#000" strokeWidth="3" />
                {getPanelImage(2) ? (
                  <image href={getPanelImage(2)} x="0" y="0" width="564" height="235" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  renderCloseUpFace(380, 70, 1.3, exp3)
                )}
                {getPanelDialogue(2) && renderSpeechBubble(getPanelDialogue(2), 20, 25, 280, 85, 26, 2)}
              </g>
            </g>
          )}

          {/* NOMOR HALAMAN BUKU KOMIK DI SUDUT KANAN BAWAH */}
          <g id="page-number-badge" transform="translate(545, 805)">
            <circle cx="18" cy="18" r="20" fill="#38bdf8" stroke="#000" strokeWidth="3" filter="url(#comicDropShadow)" />
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
              onClick={() => onSelectBranch(dynamicBranching[0]?.targetPage || (pageNumber + 1))}
              className="p-3 text-xs text-left flex items-start gap-2.5 bg-yellow-300 hover:bg-yellow-400 border-3 border-black shadow-[3px_3px_0_#000] cursor-pointer transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="text-xl shrink-0">🅰️</span>
              <div>
                <div className="font-black uppercase text-xs text-black leading-snug">
                  {dynamicBranching[0]?.label || "Lanjutkan Langkah Berikutnya"}
                </div>
                <span className="text-[11px] font-extrabold text-amber-950 underline mt-1 inline-block">
                  ➔ Buka Halaman {dynamicBranching[0]?.targetPage || (pageNumber + 1)}
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelectBranch(dynamicBranching[1]?.targetPage || (pageNumber + 2))}
              className="p-3 text-xs text-left flex items-start gap-2.5 bg-cyan-300 hover:bg-cyan-400 border-3 border-black shadow-[3px_3px_0_#000] cursor-pointer transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="text-xl shrink-0">🅱️</span>
              <div>
                <div className="font-black uppercase text-xs text-black leading-snug">
                  {dynamicBranching[1]?.label || "Pilih Jalur Alternatif Tak Terduga"}
                </div>
                <span className="text-[11px] font-extrabold text-cyan-950 underline mt-1 inline-block">
                  ➔ Buka Halaman {dynamicBranching[1]?.targetPage || (pageNumber + 2)}
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

      {/* MODAL EDITOR INTERAKTIF TEKS & BALON DIALOG */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-5 shadow-[8px_8px_0_#000] max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-3 border-black pb-2 mb-4">
              <h3 className="font-black text-sm uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-600" />
                {editingItem.type === 'sfx' ? `Edit Efek Suara (Panel ${editingItem.panelIdx + 1})` : `Edit Balon Ucapan (Panel ${editingItem.panelIdx + 1})`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0_#000]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {editingItem.type === 'dialogue' && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                    Nama Tokoh / Pembicara:
                  </label>
                  <input
                    type="text"
                    value={editingItem.speaker}
                    onChange={(e) => setEditingItem({ ...editingItem, speaker: e.target.value })}
                    className="w-full bg-neutral-100 border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-yellow-50"
                    placeholder="Contoh: TOKOH UTAMA, SAKSI, KAWAN"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                  {editingItem.type === 'sfx' ? 'Teks Efek Suara (Onomatopoeia):' : 'Teks Dialog / Ucapan:'}
                </label>
                {editingItem.type === 'sfx' ? (
                  <input
                    type="text"
                    value={editingItem.text}
                    onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                    className="w-full bg-neutral-100 border-2 border-black p-2 text-sm font-black focus:outline-none focus:bg-yellow-50"
                    placeholder="BOOOM!, KRAAK!, CLANG!"
                  />
                ) : (
                  <textarea
                    rows={3}
                    value={editingItem.text}
                    onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                    className="w-full bg-neutral-100 border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-yellow-50 resize-none"
                    placeholder="Ketik teks dialog baru..."
                  />
                )}
              </div>

              {editingItem.type === 'dialogue' && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                    Gaya / Tipe Balon:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'normal', label: 'Biasa' },
                      { id: 'shout', label: 'Teriak 💥' },
                      { id: 'thought', label: 'Pikiran 💭' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, bubbleType: t.id })}
                        className={`py-1.5 px-2 text-[11px] font-black border-2 border-black cursor-pointer shadow-[2px_2px_0_#000] ${
                          (editingItem.bubbleType || 'normal') === t.id
                            ? 'bg-yellow-400 text-black'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-black uppercase border-2 border-black cursor-pointer shadow-[2px_2px_0_#000]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingItem.type === 'sfx') {
                    setSfxOverrides(prev => ({
                      ...prev,
                      [editingItem.panelIdx]: editingItem.text
                    }));
                  } else {
                    setDialogueOverrides(prev => ({
                      ...prev,
                      [editingItem.panelIdx]: {
                        speaker: editingItem.speaker,
                        text: editingItem.text,
                        type: editingItem.bubbleType || 'normal'
                      }
                    }));
                  }
                  setEditingItem(null);
                }}
                className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase border-2 border-black cursor-pointer shadow-[2px_2px_0_#000]"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}