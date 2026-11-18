import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Settings, 
  Sparkles, 
  Feather, 
  Skull, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Film, 
  Trash2, 
  BookOpen, 
  UserCheck, 
  Users, 
  UserPlus, 
  ShieldAlert, 
  User, 
  LogOut, 
  Lock, 
  PlusCircle, 
  Layers, 
  Link as LinkIcon,
  AlertOctagon,
  Download,
  Printer,
  Compass,
  GitBranch
} from 'lucide-react';
import ComicSceneIllustration from './components/ComicSceneIllustration';
import ComicBookPage from './components/ComicBookPage';
import FullBookModal from './components/FullBookModal';

export default function App() {
  // Autentikasi Pengguna & Sesi
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mythoria_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('mythoria_token') || '');

  // Form Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modal Konfirmasi Logout / Disclaimer
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Pengaturan API & Model
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mythoria_gemini_api_key') || '');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [hasServerApiKey, setHasServerApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState('');

  // Status Token Limit & Popup Quota Habis
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Status Permainan & Realitas
  const [stability, setStability] = useState(100);
  const [inkJelaga, setInkJelaga] = useState(15);
  const [inkGold, setInkGold] = useState(5);
  const [inkBlood, setInkBlood] = useState(2);

  // Navigasi Tab
  const [activeTab, setActiveTab] = useState('write');

  // Manajemen Halaman Buku
  const [pages, setPages] = useState([{ id: 1, pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitleInput, setNewPageTitleInput] = useState('');
  const [showDeletePageModal, setShowDeletePageModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);
  const [pageActionNotice, setPageActionNotice] = useState('');

  // Variasi Grid Komik & Jalur Cerita Bercabang (Choose Your Own Adventure)
  const [pageLayouts, setPageLayouts] = useState({});
  const [pageBranches, setPageBranches] = useState({
    1: [
      { id: 'opt-a', label: 'Terbang Menembus Awan Menuju Santiago Bernabeu Madrid', targetPage: 2 },
      { id: 'opt-b', label: 'Kembali Menguji Sistem Baling-Baling di Laboratorium', targetPage: 3 }
    ]
  });
  const [showFullBookModal, setShowFullBookModal] = useState(false);

  // Input Naskah Bebas Penulis & Dropdown Pembantu
  const [customSentence, setCustomSentence] = useState('Proyektor film 35mm menelan para pengejar tanpa ampun.');
  const [helperSubject, setHelperSubject] = useState('Proyektor film 35mm');
  const [helperAction, setHelperAction] = useState('menelan');
  const [helperModifier, setHelperModifier] = useState('para pengejar tanpa ampun');
  const [showHelperDropdowns, setShowHelperDropdowns] = useState(false);
  const [inkType, setInkType] = useState('jelaga');
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Panel Komik
  const [panels, setPanels] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [scars, setScars] = useState([]);

  // Data Pengguna (Untuk Role Admin)
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [userManageMessage, setUserManageMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSystemAiConfig();
    fetchPages();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin' && authToken) {
      fetchUsersList();
    }
  }, [currentUser, authToken]);

  const fetchSystemAiConfig = async () => {
    try {
      const res = await fetch('/api/settings/ai');
      if (res.ok) {
        const data = await res.json();
        setHasServerApiKey(data.hasApiKey);
        if (data.selectedModel) setSelectedModel(data.selectedModel);
      }
    } catch {
      // Offline fallback
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages/default-session');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.pages && data.pages.length > 0) {
          setPages(data.pages);
          if (!data.pages.some(p => p.pageNumber === currentPage)) {
            setCurrentPage(data.pages[0].pageNumber);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat halaman:', err);
    }
  };

  const handleCreatePage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const nextNum = pages.length > 0 ? Math.max(...pages.map(p => p.pageNumber || 0)) + 1 : 1;
    const titleToUse = newPageTitleInput.trim() || `Halaman ${nextNum}: Babak Baru Naskah`;

    let createdPage = {
      id: Date.now(),
      sessionId: 'default-session',
      pageNumber: nextNum,
      title: titleToUse,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'default-session',
          title: titleToUse
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.page) {
          createdPage = data.page;
        }
      }
    } catch (err) {
      console.warn('[Halaman Baru] Sesi lokal aktif:', err);
    }

    // Selalu perbarui state secara mulus tanpa melempar alert error JSON
    setPages(prev => [...prev, createdPage]);
    setCurrentPage(createdPage.pageNumber);
    setNewPageTitleInput('');
    setShowNewPageModal(false);
  };

  const handleDeletePageClick = (pageNumber) => {
    setPageToDelete(pageNumber);
    setShowDeletePageModal(true);
  };

  const confirmDeletePage = async () => {
    if (pageToDelete === null || pageToDelete === undefined) return;
    const targetPageNum = Number(pageToDelete);

    try {
      await fetch(`/api/pages/default-session/${targetPageNum}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Gagal menghapus halaman di backend, lanjut lokal:', e);
    }

    // 1. Hapus semua panel/adegan pada halaman yang dihapus
    setPanels(prev =>
      prev.filter(p => Number(p.pageNumber ?? p.page_number ?? 1) !== targetPageNum)
    );

    // 2. Hapus semua karakter yang dipanggil pada halaman yang dihapus
    setCharacters(prev =>
      prev.filter(c => Number(c.pageNumber ?? c.page_number ?? 1) !== targetPageNum)
    );

    // 3. Hapus semua bekas luka realitas (glitch/scars) pada halaman yang dihapus
    setScars(prev =>
      prev.filter(s =>
        Number(s.pageNumber ?? -1) !== targetPageNum &&
        !(s.description || '').includes(`Halaman ${targetPageNum}`)
      )
    );

    // 4. Hapus pengaturan variasi grid/layout milik halaman yang dihapus
    setPageLayouts(prev => {
      const next = { ...prev };
      delete next[targetPageNum];
      return next;
    });

    // 5. Hapus pengaturan cabang cerita (branching) milik halaman ini & bersihkan referensi targetnya
    const remainingAfterDelete = pages.filter(p => Number(p.pageNumber) !== targetPageNum);
    const fallbackTargetPage = remainingAfterDelete.length > 0
      ? Number(remainingAfterDelete[0].pageNumber)
      : 1;

    setPageBranches(prev => {
      const next = {};
      Object.entries(prev).forEach(([key, branchList]) => {
        const pageKey = Number(key);
        if (pageKey === targetPageNum) return; // Hapus detail cabang milik halaman ini
        next[pageKey] = (branchList || []).map(opt =>
          Number(opt.targetPage) === targetPageNum
            ? { ...opt, targetPage: fallbackTargetPage }
            : opt
        );
      });
      return next;
    });

    // 6. Perbarui daftar halaman dan halaman aktif
    if (remainingAfterDelete.length === 0) {
      // Jika cuma 1 halaman tersisa, reset halaman 1 menjadi benar-benar kosong & bersih
      setPages([{ id: Date.now(), pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' }]);
      setCurrentPage(1);
      setCustomSentence('');
    } else {
      setPages(remainingAfterDelete);
      if (Number(currentPage) === targetPageNum) {
        const nextActive = Number(remainingAfterDelete[remainingAfterDelete.length - 1].pageNumber);
        setCurrentPage(nextActive);
        setCustomSentence('');
      }
    }

    setPageActionNotice(`Halaman ${targetPageNum} beserta seluruh panel, karakter, glitch, layout, dan cabang ceritanya berhasil dihapus!`);
    setTimeout(() => setPageActionNotice(''), 4500);

    setShowDeletePageModal(false);
    setPageToDelete(null);
  };

  const handleSelectBranch = (targetPageNum) => {
    const num = parseInt(targetPageNum, 10) || 1;
    const exists = pages.some(p => p.pageNumber === num);
    if (!exists) {
      const newPageObj = {
        id: Date.now(),
        sessionId: 'default-session',
        pageNumber: num,
        title: `Halaman ${num}: Babak Cabang Pilihan`,
        createdAt: new Date().toISOString()
      };
      setPages(prev => [...prev, newPageObj]);
    }
    setCurrentPage(num);
  };

  const handleUpdateBranch = (optionIndex, field, value) => {
    setPageBranches(prev => {
      const currentList = prev[currentPage] || [
        { id: 'opt-a', label: 'Terbang Menembus Awan Menuju Santiago Bernabeu Madrid', targetPage: currentPage + 1 },
        { id: 'opt-b', label: 'Kembali Menguji Sistem Baling-Baling di Laboratorium', targetPage: currentPage + 2 }
      ];
      const updated = [...currentList];
      updated[optionIndex] = {
        ...updated[optionIndex],
        [field]: field === 'targetPage' ? parseInt(value, 10) || 1 : value
      };
      return { ...prev, [currentPage]: updated };
    });
  };

  const applyDropdownToSentence = (s, a, m) => {
    const sub = s || helperSubject;
    const act = a || helperAction;
    const mod = m || helperModifier;
    setCustomSentence(`${sub} ${act} ${mod}.`);
  };

  const getPreviousStorySummary = () => {
    const recent = panels.slice(0, 3);
    if (recent.length === 0) return '';
    return recent
      .map(p => `[Hal ${p.pageNumber || 1}]: ${p.comicCaption || p.sentence} (${p.aiStory || ''})`)
      .reverse()
      .join(' -> ');
  };

  // ----------------------------------------------------
  // LOGIN & LOGOUT
  // ----------------------------------------------------
  const handleLogin = async (e, customUsername, customPassword) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoginError('');

    const u = customUsername || loginUsername;
    const p = customPassword || loginPassword;

    if (!u || !p) {
      setLoginError('Harap masukkan username dan password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem('mythoria_user', JSON.stringify(data.user));
        localStorage.setItem('mythoria_token', data.token);
        setLoginUsername('');
        setLoginPassword('');
        fetchSystemAiConfig();
      } else {
        setLoginError(data.error || 'Username atau password salah.');
      }
    } catch (err) {
      setLoginError(`Koneksi ke server gagal: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('mythoria_user');
    localStorage.removeItem('mythoria_token');
    // Bersihkan sesi naskah dan halaman komik sementara
    setPanels([]);
    setCharacters([]);
    setScars([]);
    setPageLayouts({});
    setPageBranches({});
    setPages([{ id: 1, pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' }]);
    setCurrentPage(1);
    setActiveTab('write');
    setShowLogoutModal(false);
  };

  // ----------------------------------------------------
  // MANAJEMEN PENGGUNA (ADMIN ONLY)
  // ----------------------------------------------------
  const fetchUsersList = async () => {
    if (!authToken) return;
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar pengguna:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserManageMessage({ text: '', type: '' });

    if (!newUserName || !newUserUsername || !newUserPassword) {
      setUserManageMessage({ text: 'Semua kolom data pengguna wajib diisi.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newUserName,
          username: newUserUsername,
          password: newUserPassword,
          role: newUserRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUserManageMessage({ text: `Pengguna "${newUserName}" berhasil ditambahkan!`, type: 'success' });
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserRole('user');
        fetchUsersList();
      } else {
        setUserManageMessage({ text: data.error || 'Gagal menambahkan pengguna.', type: 'error' });
      }
    } catch (err) {
      setUserManageMessage({ text: `Kesalahan jaringan: ${err.message}`, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId, targetUsername) => {
    if (!window.confirm(`Hapus pengguna "${targetUsername}" dari arsip naskah?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserManageMessage({ text: `Pengguna "${targetUsername}" telah dihapus.`, type: 'success' });
        fetchUsersList();
      } else {
        alert(data.error || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      alert(`Kesalahan: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // GOOGLE AI STUDIO (ADMIN ONLY)
  // ----------------------------------------------------
  const fetchAvailableModels = async (keyToUse) => {
    const key = keyToUse || apiKey;
    if (!key) {
      setApiStatusMessage('Harap masukkan API Key terlebih dahulu.');
      return;
    }

    setIsLoadingModels(true);
    setApiStatusMessage('Menghubungi Google AI Studio...');

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });

      const data = await res.json();
      if (res.ok && data.models?.length > 0) {
        setAvailableModels(data.models);
        setApiStatusMessage(`Berhasil menemukan ${data.models.length} model aktif.`);
        
        const hasSaved = data.models.some(m => m.id === selectedModel);
        if (!hasSaved && data.models.length > 0) {
          setSelectedModel(data.models[0].id);
        }
      } else {
        setApiStatusMessage(data.error || 'Tidak ada model yang dapat digunakan.');
      }
    } catch (err) {
      setApiStatusMessage(`Gagal memuat model: ${err.message}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveSettings = async () => {
    localStorage.setItem('mythoria_gemini_api_key', apiKey);

    if (authToken && currentUser?.role === 'admin') {
      try {
        const res = await fetch('/api/settings/ai', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ apiKey, selectedModel })
        });
        const data = await res.json();
        if (res.ok) {
          setHasServerApiKey(data.hasApiKey);
          setSelectedModel(data.selectedModel);
        }
      } catch (err) {
        console.warn('Gagal simpan ke server:', err);
      }
    }

    setShowSettingsModal(false);
  };

  // ----------------------------------------------------
  // MANIFESTASI NASKAH
  // ----------------------------------------------------
  const handleManifest = async () => {
    if (!customSentence || !customSentence.trim()) {
      alert('Tuliskan kalimat naskah Anda terlebih dahulu!');
      return;
    }

    if (inkType === 'jelaga' && inkJelaga < 2) {
      alert('Tinta Jelaga habis! Butuh 2 tetes tinta.');
      return;
    }
    if (inkType === 'emas' && inkGold < 1) {
      alert('Tinta Emas habis! Butuh 1 tetes tinta emas.');
      return;
    }
    if (inkType === 'darah' && inkBlood < 1) {
      alert('Tinta Darah habis! Butuh 1 tetes tinta darah.');
      return;
    }

    setIsProcessing(true);

    try {
      const historyContext = getPreviousStorySummary();

      const res = await fetch('/api/manifest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          model: selectedModel,
          sentence: customSentence.trim(),
          pageNumber: currentPage,
          storyHistory: historyContext,
          inkType
        })
      });

      // Deteksi jika Token Limit (429 / QUOTA_EXCEEDED)
      if (res.status === 429) {
        setShowQuotaModal(true);
        setIsProcessing(false);
        return;
      }

      const result = await res.json();

      if (result.error === 'QUOTA_EXCEEDED') {
        setShowQuotaModal(true);
        setIsProcessing(false);
        return;
      }

      if (res.ok && result.data) {
        setPanels(prev => [{ ...result.data, pageNumber: Number(result.data.pageNumber ?? currentPage) }, ...prev]);

        if (inkType === 'jelaga') setInkJelaga(v => Math.max(0, v - 2));
        if (inkType === 'emas') setInkGold(v => Math.max(0, v - 1));
        if (inkType === 'darah') {
          setInkBlood(v => Math.max(0, v - 1));
          setStability(v => Math.max(0, v - 15));
          setScars(prev => [
            { id: Date.now(), pageNumber: Number(currentPage), description: `Tinta Darah di Halaman ${currentPage} memicu robekan ruang!` },
            ...prev
          ]);
        }
      } else {
        alert(result.error || 'Gagal memproses manifestasi naskah.');
      }
    } catch (err) {
      alert(`Terjadi kesalahan sistem: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummon = async (characterType) => {
    if (inkGold < 2) {
      alert('Pemanggilan karakter membutuhkan 2 tetes Tinta Emas!');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/summon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          model: selectedModel,
          characterType,
          pageNumber: currentPage
        })
      });

      if (res.status === 429) {
        setShowQuotaModal(true);
        setIsProcessing(false);
        return;
      }

      const result = await res.json();
      if (result.error === 'QUOTA_EXCEEDED') {
        setShowQuotaModal(true);
        setIsProcessing(false);
        return;
      }

      if (res.ok && result.data) {
        setInkGold(v => Math.max(0, v - 2));
        setCharacters(prev => [{ ...result.data, pageNumber: Number(currentPage) }, ...prev]);

        const summonPanel = {
          id: Date.now(),
          pageNumber: Number(currentPage),
          sentence: `${result.data.name} melangkah keluar dari naskah Halaman ${currentPage}!`,
          inkType: 'emas',
          comicCaption: `TOKOH DARI KELAMNYA SELULOID: ${result.data.name.toUpperCase()}`,
          soundEffect: result.data.soundEffect || 'BAMMM!',
          visualScene: result.data.visualScene,
          aiStory: `${result.data.name} terwujud secara fisik ke dalam ruangan, siap menggunakan keahlian khususnya untuk membantu Anda!`,
          panelDialogue: result.data.dialogue,
          isRedacted: false
        };
        setPanels(prev => [summonPanel, ...prev]);
      } else {
        alert(result.error || 'Gagal memanggil karakter.');
      }
    } catch (err) {
      alert(`Kesalahan pemanggilan: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedact = async (panelId) => {
    try {
      const res = await fetch('/api/redact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ manifestationId: panelId, pageNumber: Number(currentPage) })
      });

      const result = await res.json();
      if (res.ok) {
        setPanels(prev => prev.map(p => p.id === panelId ? { ...p, isRedacted: true } : p));
        setStability(v => Math.max(0, v - 20));
        setScars(prev => [
          { id: Date.now(), pageNumber: Number(currentPage), description: result.glitchDescription },
          ...prev
        ]);
      }
    } catch (err) {
      alert(`Gagal mencoret naskah: ${err.message}`);
    }
  };

  const activePagePanels = panels.filter(p => Number(p.pageNumber ?? p.page_number ?? 1) === Number(currentPage));
  const activePageInfo = pages.find(p => Number(p.pageNumber) === Number(currentPage)) || { title: `Halaman ${currentPage}` };
  const maxPageNumber = pages.length > 0 ? Math.max(...pages.map(p => Number(p.pageNumber) || 0)) : 1;

  // ----------------------------------------------------
  // LAYAR LOGIN
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="comic-panel p-6 sm:p-8 bg-yellow-100 max-w-md w-full border-4 border-black shadow-[8px_8px_0_#000] space-y-5">
          
          <div className="text-center space-y-2 border-b-3 border-black pb-4">
            <div className="flex justify-center mb-1">
              <img src="/logo.svg" alt="Mythoria Logo" className="w-20 h-20 border-3 border-black rounded-full bg-yellow-300 p-1 shadow-[4px_4px_0_#000]" />
            </div>
            <div className="inline-block bg-black text-yellow-300 font-black px-3 py-1 text-xs tracking-widest border-2 border-black rotate-[-2deg]">
              PORTAL MASUK NASKAH
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black">
              MYTHORIA
            </h1>
            <p className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
              Buku Pengubah Realitas Sinematik Klasik
            </p>
          </div>

          <div className="comic-speech-bubble p-3 text-sm font-bold text-neutral-900 leading-snug">
            "Identifikasi diri Anda! Sutradara (Admin) pengendali sistem, atau Tokoh Penulis (User) pencari takdir?"
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-3 text-xs">
            {loginError && (
              <div className="p-2.5 bg-red-100 border-2 border-black text-red-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-xs">{loginError}</span>
              </div>
            )}

            <div>
              <label className="font-black uppercase text-neutral-900 block mb-1">
                Username:
              </label>
              <div className="flex items-center border-2 border-black bg-white shadow-[2px_2px_0_#000]">
                <span className="p-2 text-neutral-500 border-r-2 border-black">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Contoh: admin atau penulis"
                  className="w-full p-2.5 text-sm font-bold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-black uppercase text-neutral-900 block mb-1">
                Password:
              </label>
              <div className="flex items-center border-2 border-black bg-white shadow-[2px_2px_0_#000]">
                <span className="p-2 text-neutral-500 border-r-2 border-black">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full p-2.5 text-sm font-bold focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full comic-button-primary py-3 text-sm font-black flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>MEMERIKSA IDENTITAS...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>BUKA BUKU REALITAS (MASUK)</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t-2 border-black space-y-2">
            <div className="text-[11px] font-black uppercase text-neutral-600 tracking-wider">
              Akses Cepat Pengujian (1-Klik Masuk):
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleLogin(null, 'admin', 'admin123')}
                className="w-full py-2 px-3 bg-red-500 hover:bg-red-600 text-white border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <strong>ADMIN (Sutradara)</strong>
                </span>
                <span className="font-mono text-xs opacity-90">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogin(null, 'penulis', 'user123')}
                className="w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <strong>USER DUMMY 1 (Penulis)</strong>
                </span>
                <span className="font-mono text-xs opacity-90">penulis / user123</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogin(null, 'pembaca', 'user123')}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <strong>USER DUMMY 2 (Pembaca)</strong>
                </span>
                <span className="font-mono text-xs opacity-90">pembaca / user123</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // APLIKASI UTAMA
  // ----------------------------------------------------
  return (
    <div className="min-h-screen text-neutral-900 pb-16">
      
      {/* HEADER KOMIK RETRO */}
      <header className="bg-yellow-400 border-b-4 border-black shadow-[0_4px_0_#000] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Mythoria Logo" className="w-11 h-11 border-3 border-black rounded-full bg-yellow-300 p-0.5 shadow-[3px_3px_0_#000] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-black text-yellow-300 font-black px-2 py-0.5 text-xs tracking-widest border border-black rotate-[-2deg]">
                  EDISI #01
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black flex items-center gap-2">
                  MYTHORIA <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-none border border-black uppercase">Komik Realitas</span>
                </h1>
              </div>
              <p className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
                Sistem Buku Penulis Kenyataan • Sinema Seluloid Zaman Dulu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <div className="comic-panel px-3 py-1.5 flex items-center gap-2 bg-white text-xs">
              {currentUser.role === 'admin' ? (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 border border-black font-black uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> ADMIN
                </span>
              ) : (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 border border-black font-black uppercase flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> USER
                </span>
              )}
              <span className="text-neutral-900 font-extrabold text-sm">{currentUser.name}</span>
            </div>

            <div className="comic-panel px-3 py-1.5 flex items-center gap-1.5 bg-white text-xs">
              <span className="text-neutral-600">STABILITAS:</span>
              <span className={`font-black text-sm ${stability < 40 ? 'text-red-600 animate-pulse' : stability < 75 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {stability}%
              </span>
            </div>

            <div className="comic-panel px-3 py-1.5 flex items-center gap-2.5 bg-white text-sm font-extrabold">
              <span title="Tinta Jelaga (Biasa)">⚫ {inkJelaga}</span>
              <span title="Tinta Emas (Permanen)" className="text-amber-600">🟡 {inkGold}</span>
              <span title="Tinta Darah (Kekuatan Penuh / Resiko)" className="text-red-600">🔴 {inkBlood}</span>
            </div>

            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="comic-button-primary px-3 py-1.5 flex items-center gap-1.5 text-xs font-black"
                title="Kelola API Key Google AI Studio & Model Sistem"
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan AI</span>
              </button>
            )}

            <button 
              onClick={handleLogoutClick}
              className="comic-button-danger px-3 py-1.5 flex items-center gap-1 text-xs font-black cursor-pointer"
              title="Keluar dari akun dan bersihkan sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* BANNER STATUS MODEL AKTIF */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="comic-panel bg-neutral-900 text-yellow-300 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-red-400" />
            <span className="text-xs">MODEL GOOGLE AI STUDIO:</span>
            <span className="bg-yellow-400 text-black px-2 py-0.5 border border-black uppercase font-mono text-xs font-black">
              {selectedModel}
            </span>
          </div>
          <div>
            {hasServerApiKey || apiKey ? (
              <span className="text-emerald-400 flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-4 h-4" /> Sistem AI Siap Digunakan
              </span>
            ) : currentUser.role === 'admin' ? (
              <span className="text-amber-400 flex items-center gap-1 cursor-pointer text-xs" onClick={() => setShowSettingsModal(true)}>
                <AlertTriangle className="w-4 h-4" /> Klik untuk memasukkan API Key Admin
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 text-xs">
                <AlertTriangle className="w-4 h-4" /> Mode Cerita Terpadu Aktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BANNER DISCLAIMER PENGHAPUSAN OTOMATIS SAAT KELUAR */}
      <div className="max-w-6xl mx-auto px-4 mt-3">
        <div className="comic-panel bg-amber-100 border-3 border-black p-3.5 flex items-start gap-3 shadow-[4px_4px_0_#000]">
          <div className="p-2 bg-amber-400 border-2 border-black text-black shrink-0">
            <AlertTriangle className="w-5 h-5 text-black" />
          </div>
          <div className="text-xs">
            <h4 className="font-black uppercase text-amber-950 tracking-wider flex items-center gap-2">
              <span>PERINGATAN PENTING / DISCLAIMER SESI AKTIF:</span>
            </h4>
            <p className="font-bold text-neutral-800 mt-0.5 leading-relaxed">
              Sesi pengerjaan naskah dan pembuatan komik ini bersifat sementara. <strong className="text-red-700 underline">JIKA ANDA KELUAR (LOGOUT) ATAU MENUTUP BROWSER, SELURUH DRAF DAN HALAMAN KOMIK YANG BELUM DIUNDUH AKAN OTOMATIS TERHAPUS / DIRESET</strong> demi keamanan data. Silakan manfaatkan tombol <strong>"UNDUH HALAMAN (PNG)"</strong> di setiap lembar komik sebelum keluar!
            </p>
          </div>
        </div>
      </div>

      {/* BILAH HALAMAN BUKU REALITAS */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="comic-panel p-3 bg-white flex flex-wrap items-center justify-between gap-3 border-3 border-black">
          
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-black uppercase text-neutral-700 flex items-center gap-1 shrink-0 mr-1">
              <Layers className="w-4 h-4 text-amber-600" /> HALAMAN BUKU:
            </span>
            {pages.map((p) => (
              <button
                key={p.pageNumber}
                onClick={() => setCurrentPage(p.pageNumber)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-black transition shrink-0 ${
                  currentPage === p.pageNumber 
                    ? 'bg-yellow-400 text-black shadow-[3px_3px_0_#000] -translate-y-0.5' 
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                📖 Hal {p.pageNumber}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowFullBookModal(true)}
              className="comic-button-primary px-3 py-1.5 text-xs flex items-center gap-1.5 font-black cursor-pointer bg-sky-400 hover:bg-sky-300 text-black border-2 border-black shadow-[2px_2px_0_#000]"
              title="Unduh seluruh buku komik dari awal sampai akhir sekaligus (PDF / Batch PNG)"
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 Unduh Seluruh Buku</span>
            </button>

            <button
              onClick={() => setShowNewPageModal(true)}
              className="comic-button-primary px-3 py-1.5 text-xs flex items-center gap-1.5 font-black cursor-pointer bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0_#000]"
              title="Buka dan buat lembaran halaman baru di Grimoire"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Buka Halaman Baru</span>
            </button>

            <button
              onClick={() => handleDeletePageClick(currentPage)}
              className="comic-button-danger px-3 py-1.5 text-xs flex items-center gap-1.5 font-black cursor-pointer bg-red-600 hover:bg-red-500 text-white border-2 border-black shadow-[2px_2px_0_#000]"
              title={`Hapus Halaman ${currentPage} beserta seluruh adegan naskahnya`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Hal {currentPage}</span>
            </button>
          </div>

        </div>

        {pageActionNotice && (
          <div className="mt-2.5 comic-panel bg-emerald-100 border-3 border-black px-3.5 py-2 flex items-center justify-between text-xs font-black text-emerald-950 shadow-[3px_3px_0_#000]">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              {pageActionNotice}
            </span>
            <button
              onClick={() => setPageActionNotice('')}
              className="px-1.5 py-0.5 border border-black bg-white text-black text-[10px] font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KONTEN UTAMA */}
      <main className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KOLOM KIRI: KONTROL PENULIS NASKAH */}
        <section className="lg:col-span-5 space-y-4">
          
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('write')}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider border-3 border-black transition ${activeTab === 'write' ? 'bg-yellow-400 shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-neutral-100'}`}
            >
              ✍️ Tulis Naskah Bebas
            </button>
            <button
              onClick={() => setActiveTab('summon')}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider border-3 border-black transition ${activeTab === 'summon' ? 'bg-yellow-400 shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-neutral-100'}`}
            >
              🎭 Tokoh Sinema
            </button>
            <button
              onClick={() => setActiveTab('glitches')}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider border-3 border-black transition ${activeTab === 'glitches' ? 'bg-red-500 text-white shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-neutral-100'}`}
              title="Robekan Dimensi"
            >
              ⚡ Glitch ({scars.length})
            </button>

            <button
              onClick={() => setActiveTab('branching')}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider border-3 border-black transition ${activeTab === 'branching' ? 'bg-amber-400 text-black shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-neutral-100'}`}
              title="Atur persimpangan takdir cerita (Choose Your Own Adventure)"
            >
              🧭 Cabang Cerita
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-3 text-xs font-black uppercase tracking-wider border-3 border-black transition ${activeTab === 'users' ? 'bg-purple-600 text-white shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]' : 'bg-purple-100 text-purple-900 hover:bg-purple-200'}`}
              >
                👥 Kelola Pengguna
              </button>
            )}
          </div>

          {/* TAB 1: AREA TULIS BEBAS PENULIS */}
          {activeTab === 'write' && (
            <div className="comic-panel p-5 space-y-4">
              
              <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                <h2 className="font-black text-sm uppercase tracking-wide text-neutral-900 flex items-center gap-1.5">
                  <Feather className="w-4 h-4 text-amber-600" /> Naskah Realitas: Halaman {currentPage}
                </h2>
                <span className="text-xs font-black bg-amber-200 border border-black px-2 py-0.5">
                  {activePageInfo.title}
                </span>
              </div>

              {/* INDIKATOR KONTINUITAS ALUR CERITA SEBELUMNYA */}
              {panels.length > 0 && (
                <div className="p-3 bg-neutral-100 border-2 border-black text-xs space-y-1 shadow-[2px_2px_0_#000]">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-800 tracking-wider">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
                    Terkoneksi ke Alur Sebelumnya:
                  </div>
                  <p className="font-serif italic text-neutral-900 text-xs leading-relaxed line-clamp-2">
                    "{panels[0].comicCaption || panels[0].sentence}" &rarr; {panels[0].aiStory}
                  </p>
                </div>
              )}

              {/* KOTAK INPUT TULISAN BEBAS OLEH PENULIS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-neutral-800 block">
                    Ketik Cerita Anda Sendiri:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelperDropdowns(!showHelperDropdowns)}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <span>{showHelperDropdowns ? 'Tutup Pilihan Ide' : '💡 Bantuan Inspirasi Dropdown'}</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={customSentence}
                  onChange={(e) => setCustomSentence(e.target.value)}
                  placeholder="Tuliskan peristiwa nyata yang ingin Anda wujudkan di lembaran ini..."
                  className="w-full bg-white border-2 border-black p-3 text-sm font-bold leading-relaxed shadow-[3px_3px_0_#000] focus:outline-none"
                />
                <p className="text-xs text-neutral-600 font-semibold">
                  *Sebagai Penulis, Anda bebas mengetik kalimat apa pun. Cerita akan otomatis bersambung dari adegan sebelumnya.
                </p>
              </div>

              {/* BAGIAN DROPDOWN INSPIRASI */}
              {showHelperDropdowns && (
                <div className="p-3 bg-amber-50 border-2 border-black shadow-[2px_2px_0_#000] space-y-2.5">
                  <div className="text-xs font-black uppercase text-amber-900 border-b border-black pb-1">
                    Bantuan Pemilihan Cepat:
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-700 block mb-0.5">
                        Subjek:
                      </label>
                      <select 
                        value={helperSubject} 
                        onChange={(e) => {
                          setHelperSubject(e.target.value);
                          applyDropdownToSentence(e.target.value, helperAction, helperModifier);
                        }}
                        className="w-full bg-white border border-black p-2 text-xs font-bold"
                      >
                        <option value="Proyektor film 35mm">Proyektor film 35mm</option>
                        <option value="Kabut tebal">Kabut tebal</option>
                        <option value="Lentera tua">Lentera tua</option>
                        <option value="Gerbang besi kuno">Gerbang besi kuno</option>
                        <option value="Bayangan misterius">Bayangan misterius</option>
                        <option value="Dinding batu perpustakaan">Dinding batu perpustakaan</option>
                        <option value="Hujan abu dingin">Hujan abu dingin</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-700 block mb-0.5">
                        Aksi:
                      </label>
                      <select 
                        value={helperAction} 
                        onChange={(e) => {
                          setHelperAction(e.target.value);
                          applyDropdownToSentence(helperSubject, e.target.value, helperModifier);
                        }}
                        className="w-full bg-white border border-black p-2 text-xs font-bold"
                      >
                        <option value="menelan">menelan</option>
                        <option value="menyala dengan">menyala dengan</option>
                        <option value="runtuh menghalangi">runtuh menghalangi</option>
                        <option value="terbuka lebar menyambut">terbuka lebar menyambut</option>
                        <option value="membisikkan ramalan ke">membisikkan ramalan ke</option>
                        <option value="membekukan seketika">membekukan seketika</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-neutral-700 block mb-0.5">
                        Modifikasi / Sifat:
                      </label>
                      <select 
                        value={helperModifier} 
                        onChange={(e) => {
                          setHelperModifier(e.target.value);
                          applyDropdownToSentence(helperSubject, helperAction, e.target.value);
                        }}
                        className="w-full bg-white border border-black p-2 text-xs font-bold"
                      >
                        <option value="para pengejar tanpa ampun">para pengejar tanpa ampun</option>
                        <option value="api zamrud bernuansa mistis">api zamrud bernuansa mistis</option>
                        <option value="koridor gelap tanpa jalan keluar">koridor gelap tanpa jalan keluar</option>
                        <option value="angin malam beraroma nostalgia film lawas">angin malam beraroma nostalgia film lawas</option>
                        <option value="rahasia yang terkubur selama seratus tahun">rahasia yang terkubur selama seratus tahun</option>
                        <option value="langkah kaki sosok yang tak terlihat">langkah kaki sosok yang tak terlihat</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tipe Tinta */}
              <div className="pt-2 border-t-2 border-black space-y-2">
                <label className="text-xs font-black uppercase text-neutral-800 block">
                  Pilih Tinta Penulisan:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <label className={`border-2 border-black p-2.5 flex flex-col items-center cursor-pointer transition ${inkType === 'jelaga' ? 'bg-neutral-800 text-white shadow-[2px_2px_0_#000]' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
                    <input type="radio" name="ink" value="jelaga" checked={inkType === 'jelaga'} onChange={() => setInkType('jelaga')} className="hidden" />
                    <span>⚫ Jelaga</span>
                    <span className="text-xs opacity-80 mt-0.5">Sementara</span>
                  </label>

                  <label className={`border-2 border-black p-2.5 flex flex-col items-center cursor-pointer transition ${inkType === 'emas' ? 'bg-amber-400 text-black shadow-[2px_2px_0_#000]' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
                    <input type="radio" name="ink" value="emas" checked={inkType === 'emas'} onChange={() => setInkType('emas')} className="hidden" />
                    <span>🟡 Emas</span>
                    <span className="text-xs opacity-80 mt-0.5">Permanen</span>
                  </label>

                  <label className={`border-2 border-black p-2.5 flex flex-col items-center cursor-pointer transition ${inkType === 'darah' ? 'bg-red-600 text-white shadow-[2px_2px_0_#000]' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
                    <input type="radio" name="ink" value="darah" checked={inkType === 'darah'} onChange={() => setInkType('darah')} className="hidden" />
                    <span>🔴 Darah</span>
                    <span className="text-xs opacity-80 mt-0.5">Ekstrem</span>
                  </label>
                </div>
              </div>

              {/* Tombol Tulis Naskah */}
              <button
                onClick={handleManifest}
                disabled={isProcessing}
                className="w-full comic-button-primary py-3 px-4 text-sm font-black flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>MERANGKAI DAN MENYAMBUNGKAN CERITA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✍️ TULIS DAN WUJUDKAN NYATA!</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: PEMANGGILAN KARAKTER */}
          {activeTab === 'summon' && (
            <div className="comic-panel p-5 space-y-4">
              <div className="border-b-2 border-black pb-2">
                <h2 className="font-black text-sm uppercase tracking-wide text-neutral-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Pemanggilan Arketipe Sinema Lawas
                </h2>
                <p className="text-xs font-bold text-neutral-600 mt-0.5">
                  Memanggil tokoh film jadul ke Halaman {currentPage}. (Biaya: 2 Tinta Emas)
                </p>
              </div>

              <div className="space-y-3">
                <div className="border-2 border-black p-3.5 bg-neutral-50 shadow-[3px_3px_0_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase flex items-center gap-1">
                      🕵️‍♂️ Detektif Noir Sinis
                    </span>
                    <span className="text-xs bg-neutral-900 text-white font-mono px-2 py-0.5 font-bold">1940s NOIR</span>
                  </div>
                  <p className="text-xs text-neutral-800 font-serif italic leading-relaxed">
                    "Kota ini dingin, tapi teka-teki yang ditinggalkan naskah ini jauh lebih beku."
                  </p>
                  <button
                    onClick={() => handleSummon('noir')}
                    disabled={isProcessing}
                    className="w-full comic-button-primary py-2 text-xs font-black"
                  >
                    Panggil Detektif ke Hal {currentPage}
                  </button>
                </div>

                <div className="border-2 border-black p-3.5 bg-purple-50 shadow-[3px_3px_0_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase flex items-center gap-1">
                      🧙‍♂️ Penyihir Eksentrik 80-an
                    </span>
                    <span className="text-xs bg-purple-900 text-white font-mono px-2 py-0.5 font-bold">80s FANTASY</span>
                  </div>
                  <p className="text-xs text-neutral-800 font-serif italic leading-relaxed">
                    "Aksara terlarang ini tidak boleh dibaca sembarangan oleh fana biasa!"
                  </p>
                  <button
                    onClick={() => handleSummon('wizard')}
                    disabled={isProcessing}
                    className="w-full comic-button-primary py-2 text-xs font-black"
                  >
                    Panggil Penyihir ke Hal {currentPage}
                  </button>
                </div>

                <div className="border-2 border-black p-3.5 bg-emerald-50 shadow-[3px_3px_0_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase flex items-center gap-1">
                      🗿 Clay Stop-Motion Golem
                    </span>
                    <span className="text-xs bg-emerald-900 text-white font-mono px-2 py-0.5 font-bold">12 FPS MONSTER</span>
                  </div>
                  <p className="text-xs text-neutral-800 font-serif italic leading-relaxed">
                    Gerakan tanah liat patah-patah penakluk barikade tebal dan pelindung fisik.
                  </p>
                  <button
                    onClick={() => handleSummon('golem')}
                    disabled={isProcessing}
                    className="w-full comic-button-primary py-2 text-xs font-black"
                  >
                    Panggil Golem ke Hal {currentPage}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROBEKAN REALITAS (GLITCHES) */}
          {activeTab === 'glitches' && (
            <div className="comic-panel p-5 space-y-3">
              <div className="border-b-2 border-black pb-2">
                <h2 className="font-black text-sm uppercase tracking-wide text-red-600 flex items-center gap-1.5">
                  <Skull className="w-4 h-4" /> Bekas Luka Naskah (Reality Scars)
                </h2>
                <p className="text-xs font-bold text-neutral-600 mt-0.5">
                  Setiap coretan naskah dan penggunaan tinta darah meninggalkan retakan abadi pada alam nyata.
                </p>
              </div>

              {scars.length === 0 ? (
                <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-400 text-center text-xs font-bold text-emerald-800">
                  Belum ada robekan realitas. Realitas masih berjalan stabil dan selaras dengan naskah.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {scars.map((scar) => (
                    <div key={scar.id} className="p-3 bg-red-50 border-2 border-black shadow-[2px_2px_0_#000] text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-700 font-black uppercase text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" /> ANOMALI SELULOID TERJADI:
                      </div>
                      <p className="font-bold text-neutral-900 text-xs leading-relaxed">{scar.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KELOLA PENGGUNA (ADMIN KHUSUS) */}
          {activeTab === 'users' && currentUser.role === 'admin' && (
            <div className="comic-panel p-5 space-y-4">
              <div className="border-b-2 border-black pb-2">
                <h2 className="font-black text-sm uppercase tracking-wide text-purple-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-700" /> Pengelolaan Pengguna (Hak Akses Admin)
                </h2>
                <p className="text-xs font-bold text-neutral-600 mt-0.5">
                  Sebagai Sutradara Utama (Admin), Anda berwenang mendaftarkan pengguna baru ke sistem naskah.
                </p>
              </div>

              {userManageMessage.text && (
                <div className={`p-3 border-2 border-black text-xs font-bold ${userManageMessage.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                  {userManageMessage.text}
                </div>
              )}

              <form onSubmit={handleAddUser} className="p-4 bg-purple-50 border-2 border-black shadow-[3px_3px_0_#000] space-y-3 text-xs">
                <div className="font-black uppercase text-purple-900 flex items-center gap-1 text-xs">
                  <UserPlus className="w-4 h-4" /> Formulir Tambah Pengguna:
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Contoh: Aktor Pendukung"
                    className="w-full bg-white border-2 border-black p-2 font-bold focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">Username:</label>
                    <input
                      type="text"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      placeholder="username_baru"
                      className="w-full bg-white border-2 border-black p-2 font-bold focus:outline-none text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">Password:</label>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-white border-2 border-black p-2 font-bold focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">Peran / Role:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold focus:outline-none text-xs"
                  >
                    <option value="user">USER (Penulis Naskah)</option>
                    <option value="admin">ADMIN (Sutradara Pengelola)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full comic-button-primary py-2.5 text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>TAMBAHKAN PENGGUNA BARU</span>
                </button>
              </form>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-black uppercase text-neutral-800">
                  <span>Arsip Pengguna Terdaftar ({usersList.length}):</span>
                  <button onClick={fetchUsersList} className="text-purple-700 hover:underline text-xs flex items-center gap-1 font-bold">
                    <RefreshCw className="w-3.5 h-3.5" /> Segarkan
                  </button>
                </div>

                {isLoadingUsers ? (
                  <div className="p-3 text-center text-xs font-bold text-neutral-500">Memuat data pengguna...</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {usersList.map((u) => (
                      <div key={u.id} className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between text-xs">
                        <div>
                          <div className="font-black text-neutral-900 flex items-center gap-2">
                            <span className="text-sm">{u.name}</span>
                            <span className={`text-xs px-2 py-0.5 border border-black font-black uppercase ${u.role === 'admin' ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-900'}`}>
                              {u.role}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-600 font-mono mt-0.5">
                            @{u.username}
                          </div>
                        </div>

                        {u.id !== 1 && u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="comic-button-danger px-2.5 py-1 text-xs flex items-center gap-1"
                            title="Hapus pengguna ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: RANCANG JALUR PILIHAN CERITA (BRANCHING) */}
          {activeTab === 'branching' && (
            <div className="comic-panel p-5 space-y-4">
              <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-sm uppercase tracking-wide text-neutral-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-red-600" /> Rancang Takdir: Halaman {currentPage}
                  </h2>
                  <p className="text-xs font-bold text-neutral-600 mt-0.5">
                    Tentukan 2 pilihan jalur kelanjutan naskah untuk pembaca di akhir halaman ini.
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-yellow-300 border border-black font-black uppercase">
                  Non-Linear
                </span>
              </div>

              {/* FORM PENGATURAN PILIHAN A */}
              <div className="p-3.5 bg-yellow-50 border-2 border-black space-y-2.5 shadow-[2px_2px_0_#000]">
                <div className="flex items-center gap-2 font-black text-xs uppercase text-amber-950">
                  <span className="text-base">🅰️</span>
                  <span>Pilihan Jalur A:</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Teks / Narasi Pilihan:
                  </label>
                  <input
                    type="text"
                    value={(pageBranches[currentPage] || [])[0]?.label || ''}
                    onChange={(e) => handleUpdateBranch(0, 'label', e.target.value)}
                    placeholder="Contoh: Terbang Menuju Madrid"
                    className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-neutral-700 shrink-0">
                    Mengarahkan ke:
                  </label>
                  <select
                    value={(pageBranches[currentPage] || [])[0]?.targetPage || (currentPage + 1)}
                    onChange={(e) => handleUpdateBranch(0, 'targetPage', e.target.value)}
                    className="bg-white border-2 border-black p-1.5 font-black text-xs flex-1 focus:outline-none"
                  >
                    {pages.map((p) => (
                      <option key={p.pageNumber} value={p.pageNumber}>
                        Halaman {p.pageNumber}: {p.title}
                      </option>
                    ))}
                    <option value={maxPageNumber + 1}>
                      + Buat Halaman Baru ({maxPageNumber + 1})
                    </option>
                  </select>
                </div>
              </div>

              {/* FORM PENGATURAN PILIHAN B */}
              <div className="p-3.5 bg-cyan-50 border-2 border-black space-y-2.5 shadow-[2px_2px_0_#000]">
                <div className="flex items-center gap-2 font-black text-xs uppercase text-cyan-950">
                  <span className="text-base">🅱️</span>
                  <span>Pilihan Jalur B:</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Teks / Narasi Pilihan:
                  </label>
                  <input
                    type="text"
                    value={(pageBranches[currentPage] || [])[1]?.label || ''}
                    onChange={(e) => handleUpdateBranch(1, 'label', e.target.value)}
                    placeholder="Contoh: Kembali Menguji Mesin di Laboratorium"
                    className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-neutral-700 shrink-0">
                    Mengarahkan ke:
                  </label>
                  <select
                    value={(pageBranches[currentPage] || [])[1]?.targetPage || (currentPage + 2)}
                    onChange={(e) => handleUpdateBranch(1, 'targetPage', e.target.value)}
                    className="bg-white border-2 border-black p-1.5 font-black text-xs flex-1 focus:outline-none"
                  >
                    {pages.map((p) => (
                      <option key={p.pageNumber} value={p.pageNumber}>
                        Halaman {p.pageNumber}: {p.title}
                      </option>
                    ))}
                    <option value={maxPageNumber + 2}>
                      + Buat Halaman Baru ({maxPageNumber + 2})
                    </option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-neutral-100 border border-neutral-300 text-[11px] font-medium text-neutral-700">
                💡 Pilihan takdir ini akan otomatis terpajang di bagian bawah lembar komik Anda, siap diklik oleh pembaca untuk menjelajahi rute petualangan yang berbeda!
              </div>
            </div>
          )}

        </section>

        {/* KOLOM KANAN: ALUR PANEL KOMIK (TULISAN MUDAH DIBACA & ILUSTRASI REAL) */}
        <section className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between border-b-3 border-black pb-2">
            <div>
              <h2 className="font-black text-xl tracking-tight uppercase flex items-center gap-2 text-black">
                <BookOpen className="w-6 h-6 text-amber-500" />
                Lembaran {activePageInfo.title}
              </h2>
              <p className="text-xs font-bold text-neutral-700 mt-0.5">
                Alur cerita saling menyambung dan divisualisasikan dalam format komik cetak.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold bg-black text-white px-2.5 py-1">
                {activePagePanels.length} ADENGAN
              </span>
            </div>
          </div>

          {activePagePanels.length === 0 ? (
            <div className="comic-panel p-8 text-center bg-white space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-200 border-3 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0_#000]">
                📖
              </div>
              <h3 className="font-black text-lg uppercase text-neutral-900">
                {activePageInfo.title} Masih Kosong
              </h3>
              <p className="text-sm font-bold text-neutral-700 max-w-md mx-auto leading-relaxed">
                Ketikkan naskah Anda di kolom kiri untuk melanjutkan cerita dan mewujudkan lembaran komik baru pada halaman ini.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* LEMBAR HALAMAN KOMIK RESMI (HANYA MUNCUL JIKA HALAMAN MEMILIKI ADENGAN) */}
              <ComicBookPage 
                pageNumber={currentPage}
                pageTitle={activePageInfo.title}
                manifestation={activePagePanels[0]}
                inkType={activePagePanels[0]?.inkType || inkType}
                allPanels={activePagePanels}
                layoutType={pageLayouts[currentPage] || '5-panel'}
                onLayoutChange={(l) => setPageLayouts(prev => ({ ...prev, [currentPage]: l }))}
                branching={pageBranches[currentPage]}
                onSelectBranch={handleSelectBranch}
                onOpenFullBookModal={() => setShowFullBookModal(true)}
              />

              {activePagePanels.map((panel, idx) => (
                <article 
                  key={panel.id || idx}
                  className={`comic-panel p-5 bg-white relative overflow-hidden transition ${panel.isRedacted ? 'opacity-60 bg-neutral-200 line-through' : ''}`}
                >
                  <div className="absolute top-2 right-3 text-4xl font-black text-neutral-200 select-none pointer-events-none">
                    #{activePagePanels.length - idx}
                  </div>

                  {/* KOTAK NARASI KOMIK (MUDAH DIBACA & TEGAS) */}
                  <div className="comic-caption-box p-3 text-neutral-900 mb-2.5 max-w-xl">
                    <span className="text-red-700 mr-2 font-black text-sm">[ADAPUN YANG TERTULIS]:</span>
                    <span className="text-sm font-bold">{panel.comicCaption || panel.sentence}</span>
                  </div>

                  {/* EFEK SUARA KOMIK (SFX) */}
                  {panel.soundEffect && (
                    <div className="my-2">
                      <span className="sfx-badge text-base">
                        💥 {panel.soundEffect}
                      </span>
                    </div>
                  )}

                  {/* ILUSTRASI GAMBAR KOMIK NYATA */}
                  <ComicSceneIllustration 
                    sentence={panel.sentence}
                    subject={panel.subject_part || panel.subject || ''}
                    action={panel.action_part || panel.action || ''}
                    sceneType={panel.sceneType || ''}
                  />

                  {/* PERISTIWA NYATA (TEKS BESAR & SANGAT MUDAH DIBACA) */}
                  <div className="p-3.5 bg-neutral-50 border-2 border-black text-neutral-900 my-2.5 shadow-[2px_2px_0_#000]">
                    <div className="text-xs font-black uppercase text-amber-900 tracking-wider mb-1 flex items-center gap-1">
                      <span>🎬 PERISTIWA NYATA YANG TERJADI:</span>
                    </div>
                    <p className="text-sm font-bold text-black leading-relaxed">
                      {panel.aiStory || panel.visualScene || panel.sentence}
                    </p>
                  </div>

                  {/* BALON KATA DIALOG KARAKTER */}
                  {panel.panelDialogue && (
                    <div className="mb-3.5 mt-2">
                      <div className="comic-speech-bubble p-3 text-sm font-bold text-black inline-block max-w-xl">
                        💬 {panel.panelDialogue}
                      </div>
                    </div>
                  )}

                  {/* FOOTER PANEL & TOMBOL CORET */}
                  <div className="pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase bg-neutral-100 border border-black px-2 py-0.5">
                        Tinta: {panel.inkType?.toUpperCase() || 'JELAGA'}
                      </span>
                      <span className="font-mono text-xs font-bold uppercase bg-yellow-100 border border-black px-2 py-0.5">
                        Halaman {panel.pageNumber || currentPage}
                      </span>
                      {panel.isRedacted && (
                        <span className="text-red-600 font-black uppercase text-xs">
                          [DICORET / DIBATALKAN]
                        </span>
                      )}
                    </div>

                    {!panel.isRedacted && (
                      <button
                        onClick={() => handleRedact(panel.id)}
                        className="comic-button-danger px-3 py-1.5 text-xs flex items-center gap-1 font-black"
                        title="Batalkan peristiwa ini dengan mencoret naskah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Coret Naskah (Redact)</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

        </section>

      </main>

      {/* POPUP MODAL KUOTA TOKEN AI HABIS (LIMIT) */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="comic-panel p-6 sm:p-7 bg-red-100 max-w-md w-full space-y-4 border-4 border-black shadow-[8px_8px_0_#000]">
            
            <div className="border-b-3 border-black pb-3 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-600 text-white border-3 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0_#000] mb-2 animate-bounce">
                ⚠️
              </div>
              <h3 className="font-black text-2xl uppercase text-red-950 tracking-tight">
                KUOTA TOKEN AI HABIS!
              </h3>
              <p className="text-xs font-black text-red-700 uppercase tracking-widest mt-0.5">
                Batas Penggunaan Tercapai (Rate Limit / Quota Exceeded)
              </p>
            </div>

            <div className="comic-speech-bubble p-4 text-sm font-bold text-black leading-relaxed bg-white border-3 border-black shadow-[3px_3px_0_#000]">
              <p className="mb-2">
                "Penggunaan token Google AI Studio untuk saat ini telah mencapai <strong>batas kuota maksimum (Limit)</strong>."
              </p>
              <p className="text-red-700 font-extrabold">
                👉 Silakan HUBUNGI ADMINISTRATOR SISTEM untuk memperbarui kuota atau mengganti API Key Google AI Studio!
              </p>
            </div>

            <button
              onClick={() => setShowQuotaModal(false)}
              className="w-full comic-button-danger py-3 text-sm font-black tracking-wide"
            >
              SAYA MENGERTI, TUTUP PEMBERITAHUAN
            </button>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI KELUAR & PENGHAPUSAN SESI (DISCLAIMER) */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="comic-panel p-6 sm:p-7 bg-amber-100 max-w-md w-full space-y-4 border-4 border-black shadow-[8px_8px_0_#000]">
            <div className="border-b-3 border-black pb-3 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 text-black border-3 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0_#000] mb-2 animate-bounce">
                ⚠️
              </div>
              <h3 className="font-black text-2xl uppercase text-amber-950 tracking-tight">
                PERINGATAN KELUAR!
              </h3>
              <p className="text-xs font-black text-red-700 uppercase tracking-widest mt-0.5">
                Pembersihan Sesi Otomatis
              </p>
            </div>

            <div className="comic-speech-bubble p-4 text-sm font-bold text-black leading-relaxed bg-white border-3 border-black shadow-[3px_3px_0_#000]">
              <p className="mb-2 text-neutral-900">
                Apakah Anda yakin ingin keluar? Sesuai ketentuan sistem:
              </p>
              <p className="text-red-700 font-black">
                ⚠️ JIKA ANDA KELUAR, SELURUH DRAF HALAMAN DAN GAMBAR KOMIK YANG BELUM DIUNDUH AKAN OTOMATIS TERHAPUS / DIRESET!
              </p>
              <p className="mt-2 text-xs text-neutral-600 font-semibold">
                Pastikan Anda telah mengklik tombol "Unduh Halaman (PNG)" pada lembar komik Anda sebelum meninggalkan sesi.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full comic-button-primary py-3 text-sm font-black tracking-wide bg-emerald-400 hover:bg-emerald-300 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>BATAL & SAYA MAU UNDUH DULU</span>
              </button>
              
              <button
                onClick={confirmLogout}
                className="w-full comic-button-danger py-2.5 text-xs font-black tracking-wide"
              >
                SAYA SUDAH UNDUH, KELUAR & BERSIHKAN SESI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT HALAMAN BARU */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="comic-panel p-6 bg-yellow-100 max-w-md w-full space-y-4 border-4 border-black shadow-[8px_8px_0_#000]">
            
            <div className="border-b-3 border-black pb-2 flex items-center justify-between">
              <h3 className="font-black text-lg uppercase text-black flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Buka Halaman Baru ({maxPageNumber + 1})
              </h3>
              <button 
                onClick={() => setShowNewPageModal(false)}
                className="font-black text-lg px-2 border-2 border-black bg-white hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-3 text-xs">
              <div>
                <label className="font-black uppercase text-neutral-800 block mb-1 text-xs">
                  Judul Babak / Halaman Baru:
                </label>
                <input
                  type="text"
                  value={newPageTitleInput}
                  onChange={(e) => setNewPageTitleInput(e.target.value)}
                  placeholder={`Contoh: Halaman ${maxPageNumber + 1}: Lorong Terkutuk`}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold shadow-[2px_2px_0_#000] focus:outline-none text-sm"
                  autoFocus
                />
                <p className="text-xs text-neutral-700 font-bold mt-1.5">
                  Setiap halaman baru akan mewarisi alur cerita dari halaman sebelumnya.
                </p>
              </div>

              <div className="pt-2 border-t-2 border-black flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-3.5 py-2 border-2 border-black bg-white font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="comic-button-primary px-4 py-2 text-xs font-black flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Lembaran Ini</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS HALAMAN */}
      {showDeletePageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="comic-panel p-6 bg-red-50 max-w-md w-full space-y-4 border-4 border-black shadow-[8px_8px_0_#000]">
            <div className="border-b-3 border-black pb-3 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-600 text-white border-3 border-black flex items-center justify-center text-2xl shadow-[3px_3px_0_#000] mb-2">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="font-black text-xl uppercase text-red-950 tracking-tight">
                HAPUS HALAMAN {pageToDelete}?
              </h3>
              <p className="text-xs font-black text-red-700 uppercase tracking-widest mt-0.5">
                Tindakan Ini Tidak Dapat Dibatalkan
              </p>
            </div>

            <div className="comic-speech-bubble p-4 text-xs font-bold text-black leading-relaxed bg-white border-2 border-black shadow-[2px_2px_0_#000]">
              <p className="mb-2">
                Apakah Anda yakin ingin menghapus <strong>Halaman {pageToDelete}</strong>?
              </p>
              <p className="text-red-700 font-extrabold">
                ⚠️ Semua adegan naskah dan ilustrasi komik yang ada di halaman ini akan dihapus secara permanen dari sesi Anda.
              </p>
              {pages.length <= 1 && (
                <p className="mt-2 text-neutral-600 italic font-medium">
                  (Catatan: Karena ini adalah satu-satunya halaman yang tersisa, menghapusnya akan mengosongkan naskah dan mengulang ke Halaman 1 baru.)
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeletePageModal(false); setPageToDelete(null); }}
                className="flex-1 py-2.5 px-3 border-2 border-black bg-white font-black text-xs uppercase hover:bg-neutral-100"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={confirmDeletePage}
                className="flex-1 comic-button-danger py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Halaman</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN API KEY (ADMIN ONLY) */}
      {showSettingsModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="comic-panel p-6 bg-yellow-100 max-w-lg w-full space-y-4 border-4 border-black shadow-[8px_8px_0_#000]">
            
            <div className="border-b-3 border-black pb-2 flex items-center justify-between">
              <h3 className="font-black text-lg uppercase text-black flex items-center gap-2">
                <img src="/logo.svg" alt="Mythoria Logo" className="w-6 h-6 rounded-full border border-black" />
                Pengaturan Google AI Studio (Admin)
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="font-black text-lg px-2 border-2 border-black bg-white hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              <div>
                <label className="font-black uppercase text-neutral-800 block mb-1 text-xs">
                  Google AI Studio API Key (Admin):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukkan AIzaSy..."
                    className="flex-1 bg-white border-2 border-black p-2.5 font-mono text-xs shadow-[2px_2px_0_#000] focus:outline-none font-bold"
                  />
                  <button
                    onClick={() => fetchAvailableModels(apiKey)}
                    disabled={isLoadingModels || !apiKey}
                    className="comic-button-primary px-3.5 py-2.5 text-xs flex items-center gap-1 font-black"
                  >
                    {isLoadingModels ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Muat Model'}
                  </button>
                </div>
                <p className="text-xs text-neutral-700 font-bold mt-1">
                  Kunci API ini akan digunakan oleh seluruh sistem (termasuk User yang menulis naskah).
                </p>
              </div>

              {apiStatusMessage && (
                <div className="p-2.5 border-2 border-black bg-white text-xs font-bold">
                  {apiStatusMessage}
                </div>
              )}

              <div>
                <label className="font-black uppercase text-neutral-800 block mb-1 text-xs">
                  Pilih Model yang Tersedia untuk API Key Ini:
                </label>
                {availableModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2.5 font-mono text-xs font-bold shadow-[2px_2px_0_#000] focus:outline-none"
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-neutral-200 border-2 border-black text-neutral-700 font-bold text-xs">
                    Belum ada model termuat. Masukkan API Key lalu tekan "Muat Model".
                  </div>
                )}
              </div>

            </div>

            <div className="pt-2 border-t-2 border-black flex justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border-2 border-black bg-white font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={saveSettings}
                className="comic-button-primary px-4 py-2 text-xs font-black"
              >
                Terapkan untuk Seluruh Sistem
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL UNDUH SELURUH BUKU KOMIK */}
      <FullBookModal
        isOpen={showFullBookModal}
        onClose={() => setShowFullBookModal(false)}
        pages={pages}
        panels={panels}
        currentSessionTitle="Mythoria: Grimoire of Reality"
      />

    </div>
  );
}
