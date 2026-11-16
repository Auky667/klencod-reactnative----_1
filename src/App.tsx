import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  Copy,
  Volume2,
  VolumeX,
  Menu,
  X,
  Compass,
  Sparkles,
  Award,
  Bookmark,
  Play,
  RefreshCw,
  TrendingUp,
  Mail,
  MessageCircle,
  CheckCircle2,
  Check,
  Globe
} from "lucide-react";
import { SECTIONS, DHIKR_LIST, Dhikr } from "./data/adhkar";

export default function App() {
  // Basic UI states
  const [selectedSectionId, setSelectedSectionId] = useState<string>("morning");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Interactive Tasbeeh Panel state
  const [activeDhikr, setActiveDhikr] = useState<Dhikr | null>(null);
  const [tasbeehCount, setTasbeehCount] = useState<number>(0);
  const [tasbeehTarget, setTasbeehTarget] = useState<number>(3);
  const [tasbeehCompleted, setTasbeehCompleted] = useState<boolean>(false);

  // Free Rosary (المسبحة الحرة) state
  const [freeRosaryActive, setFreeRosaryActive] = useState<boolean>(false);
  const [freeRosaryCount, setFreeRosaryCount] = useState<number>(0);
  const [freeRosaryTarget, setFreeRosaryTarget] = useState<number>(33);
  const [freeRosaryCompleted, setFreeRosaryCompleted] = useState<boolean>(false);

  // Session statistics
  const [sessionTotalClicks, setSessionTotalClicks] = useState<number>(() => {
    const saved = localStorage.getItem("total_tasbeeh_clicks");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem("total_tasbeeh_clicks", sessionTotalClicks.toString());
  }, [sessionTotalClicks]);

  // Play peaceful soft chime via Web Audio API
  const playChime = (isCompletion = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      if (isCompletion) {
        // Dual-tone success chime
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
        
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.8);
      } else {
        // A single sweet high-pitch droplet sound
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio context play failed due to browser user-gesture policies.", e);
    }
  };

  // Device vibration helper
  const triggerVibration = (isCompletion = false) => {
    if (navigator.vibrate) {
      if (isCompletion) {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate(60);
      }
    }
  };

  // Handle Tasbeeh Tap
  const handleTasbeehClick = () => {
    if (tasbeehCompleted) return;
    
    const nextCount = tasbeehCount + 1;
    setTasbeehCount(nextCount);
    setSessionTotalClicks(prev => prev + 1);

    if (nextCount >= tasbeehTarget) {
      setTasbeehCompleted(true);
      playChime(true);
      triggerVibration(true);
    } else {
      playChime(false);
      triggerVibration(false);
    }
  };

  // Handle Free Rosary Tap
  const handleFreeRosaryClick = () => {
    if (freeRosaryCompleted) return;

    const nextCount = freeRosaryCount + 1;
    setFreeRosaryCount(nextCount);
    setSessionTotalClicks(prev => prev + 1);

    if (nextCount >= freeRosaryTarget) {
      setFreeRosaryCompleted(true);
      playChime(true);
      triggerVibration(true);
    } else {
      playChime(false);
      triggerVibration(false);
    }
  };

  // Start interactive tasbeeh mode
  const startTasbeeh = (dhikr: Dhikr) => {
    setActiveDhikr(dhikr);
    setTasbeehCount(0);
    setTasbeehTarget(dhikr.count || 33);
    setTasbeehCompleted(false);
    setFreeRosaryActive(false); // Close free rosary if active
  };

  // Open Free Rosary
  const openFreeRosary = () => {
    setFreeRosaryActive(true);
    setActiveDhikr(null); // Close specific dhikr tasbeeh
    setFreeRosaryCount(0);
    setFreeRosaryCompleted(false);
  };

  // Copy text function
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Categorized sections
  const dailySections = useMemo(() => SECTIONS.filter(s => s.category === "daily"), []);
  const seasonalSections = useMemo(() => SECTIONS.filter(s => s.category === "seasonal"), []);

  // Get current section details
  const currentSection = useMemo(() => {
    return SECTIONS.find(s => s.id === selectedSectionId);
  }, [selectedSectionId]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return DHIKR_LIST.filter(d => {
      const textMatch = d.text.toLowerCase().includes(q);
      const virtueMatch = d.virtue.toLowerCase().includes(q);
      const sourceMatch = d.source.toLowerCase().includes(q);
      
      // Find if the section title matches the query
      const sec = SECTIONS.find(s => s.id === d.sectionId);
      const sectionMatch = sec ? sec.title.toLowerCase().includes(q) : false;

      return textMatch || virtueMatch || sourceMatch || sectionMatch;
    });
  }, [searchQuery]);

  // List of dhikrs in the selected section (only used when search is empty)
  const currentDhikrs = useMemo(() => {
    return DHIKR_LIST.filter(d => d.sectionId === selectedSectionId);
  }, [selectedSectionId]);

  // Safe count of items per section
  const getSectionCount = (sectionId: string) => {
    return DHIKR_LIST.filter(d => d.sectionId === sectionId).length;
  };

  return (
    <div className="min-h-screen flex flex-col font-tajawal bg-[#FAF8F2] text-[#1F2E26] bg-islamic-pattern selection:bg-emerald-200 selection:text-emerald-950 transition-all duration-300">
      
      {/* TOP BRAND HEADER & SUMMARY */}
      <header className="sticky top-0 z-30 bg-emerald-950 text-[#E2CEB3] border-b-2 border-amber-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-emerald-900 text-[#E2CEB3] transition-colors"
              aria-label="فتح القائمة"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-amber-500/40 flex items-center justify-center shadow-md">
              <span className="text-2xl sm:text-3xl font-amiri text-amber-400 font-bold">🕌</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide font-amiri text-amber-400">الْوَابِلُ الصَّيِّبُ</h1>
              <p className="text-[10px] sm:text-xs text-emerald-300 font-light">أذكار المسلم اليومية والموسمية المعتمدة</p>
            </div>
          </div>

          {/* Session stats & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-emerald-900 text-[#E2CEB3] transition-colors flex items-center justify-center"
              title={soundEnabled ? "كتم الصوت" : "تفعيل الصوت"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5 text-amber-400" /> : <VolumeX className="h-5 w-5 text-gray-400" />}
            </button>

            {/* Free Rosary Button */}
            <button
              onClick={openFreeRosary}
              className="hidden md:flex items-center gap-2 bg-emerald-900/80 hover:bg-emerald-800 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              <span>📿 المسبحة الحرة</span>
            </button>

            {/* Statistics pill */}
            <div className="bg-emerald-900/60 border border-emerald-800 px-3 py-1 rounded-full text-[11px] sm:text-xs text-[#E2CEB3] flex items-center gap-1.5 shadow-inner">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium">إجمالي التسبيحات:</span>
              <span className="font-bold text-amber-300 text-xs sm:text-sm font-amiri">{sessionTotalClicks}</span>
              
              {sessionTotalClicks > 0 && (
                <button 
                  onClick={() => {
                    if(confirm("هل تريد تصفير إجمالي التسبيحات؟")) {
                      setSessionTotalClicks(0);
                    }
                  }} 
                  className="mr-1.5 text-gray-400 hover:text-red-400" 
                  title="تصفير العداد"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN APP CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-8xl w-full mx-auto relative">
        
        {/* SIDEBAR: Sections and Navigation */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-amber-500/10 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col h-[calc(100vh-74px)] lg:h-auto
            ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Sidebar Header for mobile */}
          <div className="p-4 border-b border-amber-500/10 bg-emerald-950 text-white flex lg:hidden justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h2 className="font-bold text-amber-400">قائمة الأقسام والمواسم</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md hover:bg-emerald-900 text-[#E2CEB3]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search Box in Sidebar */}
          <div className="p-4 border-b border-amber-500/10 bg-[#FAF8F2]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-800 h-4 w-4" />
              <input
                type="text"
                placeholder="ابحث في جميع الأذكار والفضائل..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAbout(false);
                }}
                className="w-full pr-9 pl-4 py-2 border border-emerald-950/20 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-emerald-800/40 text-emerald-950 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800/60 hover:text-emerald-800 text-xs font-medium"
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Navigation links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4 bg-white custom-scrollbar">
            
            {/* Quick Link: About Page */}
            <div>
              <button
                onClick={() => {
                  setShowAbout(true);
                  setSelectedSectionId("");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-right transition-all ${
                  showAbout
                    ? "bg-amber-50/70 border-amber-500/40 text-amber-800 font-bold shadow-sm"
                    : "border-transparent hover:bg-[#FAF8F2] text-[#2C3E35] font-medium"
                }`}
              >
                <span className="text-lg">ℹ️</span>
                <div className="flex-1">
                  <div className="text-sm">عن تطبيق الوابل الصّيِّب</div>
                  <div className="text-[10px] text-amber-600/80">قصة هذا التطبيق، المصادر والتواصل</div>
                </div>
              </button>
            </div>

            {/* Quick Link: Free Rosary for mobile */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  openFreeRosary();
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-right transition-all ${
                  freeRosaryActive
                    ? "bg-emerald-900 border-emerald-950 text-amber-300 font-bold shadow-sm"
                    : "border-emerald-800/20 bg-emerald-950/5 text-[#2C3E35] font-medium hover:bg-emerald-950/10"
                }`}
              >
                <span className="text-lg">📿</span>
                <div className="flex-1">
                  <div className="text-sm">المسبحة الإلكترونية الحرة</div>
                  <div className="text-[10px] text-emerald-700">تسابيح مفتوحة مع عداد ذكي</div>
                </div>
              </button>
            </div>

            {/* Category: Daily Remembrances */}
            <div>
              <h3 className="text-xs font-bold text-emerald-800/60 pr-2 mb-2 tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>الأذكار اليومية ({dailySections.length})</span>
              </h3>
              <div className="space-y-1">
                {dailySections.map((sec) => {
                  const isSelected = selectedSectionId === sec.id && !showAbout && !freeRosaryActive;
                  const count = getSectionCount(sec.id);
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        setShowAbout(false);
                        setFreeRosaryActive(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-right transition-all ${
                        isSelected
                          ? "bg-emerald-900 text-white font-medium shadow-md border-r-4 border-amber-500"
                          : "text-[#2C3E35] hover:bg-[#FAF8F2] hover:text-emerald-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base shrink-0">{sec.icon}</span>
                        <span className="truncate">{sec.title}</span>
                      </div>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? "bg-amber-500 text-emerald-950" : "bg-[#FAF8F2] border border-emerald-800/10 text-emerald-800"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category: Seasonal & Event Remembrances */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-emerald-800/60 pr-2 mb-2 tracking-wider flex items-center gap-1">
                <Compass className="h-3 w-3 text-amber-500" />
                <span>أذكار المواسم والمناسبات ({seasonalSections.length})</span>
              </h3>
              <div className="space-y-1">
                {seasonalSections.map((sec) => {
                  const isSelected = selectedSectionId === sec.id && !showAbout && !freeRosaryActive;
                  const count = getSectionCount(sec.id);
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        setShowAbout(false);
                        setFreeRosaryActive(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-right transition-all ${
                        isSelected
                          ? "bg-emerald-950 text-white font-medium shadow-md border-r-4 border-amber-500"
                          : "text-[#2C3E35] hover:bg-[#FAF8F2] hover:text-emerald-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base shrink-0">{sec.icon}</span>
                        <span className="truncate">{sec.title}</span>
                      </div>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? "bg-amber-500 text-emerald-950" : "bg-[#FAF8F2] border border-emerald-800/10 text-emerald-800"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </nav>

          {/* Sidebar footer with app statistics */}
          <div className="p-4 border-t border-amber-500/10 bg-[#FAF8F2] text-center">
            <div className="text-[11px] text-emerald-800/70">
              يحتوي التطبيق على <span className="font-bold text-emerald-950">٤٢</span> قسماً رئيسياً من أمهات كتب الحديث والأذكار المأثورة.
            </div>
          </div>
        </aside>

        {/* MIDDLE WORKSPACE & SCROLLABLE CONTENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-74px)] custom-scrollbar">
          
          {/* SEARCH MODE VIEW */}
          {searchQuery && (
            <div className="space-y-6">
              {/* Search Header */}
              <div className="bg-white border-b-2 border-amber-500/20 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="h-6 w-6 text-amber-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-emerald-950">نتائج البحث عن: "{searchQuery}"</h2>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800/80">
                  عثرنا على <span className="font-bold text-amber-600">{(searchResults || []).length}</span> نتيجة مطابقة لكلمات البحث.
                </p>
              </div>

              {/* Search Cards */}
              <div className="space-y-4">
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((dhikr, idx) => {
                    const sec = SECTIONS.find(s => s.id === dhikr.sectionId);
                    return (
                      <div
                        key={dhikr.id}
                        className="bg-white rounded-2xl border border-amber-500/15 hover:border-amber-500/40 transition-all duration-300 p-5 sm:p-6 shadow-sm space-y-4 relative group"
                      >
                        {/* Card Header info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-[#FAF8F2] pb-3">
                          <div className="flex items-center gap-2 text-emerald-800/70">
                            <span className="bg-[#FAF8F2] px-2 py-1 rounded-md border border-emerald-800/10 font-bold">
                              النتيجة {idx + 1}
                            </span>
                            <span>•</span>
                            <button
                              onClick={() => {
                                setSelectedSectionId(dhikr.sectionId);
                                setSearchQuery("");
                              }}
                              className="text-amber-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <span>{sec?.icon}</span>
                              <span>{sec?.title}</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dhikr.type === 'tasbeeh' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {dhikr.type === 'tasbeeh' ? 'تسبيح وتكرار' : 'قراءة فقط'}
                            </span>
                          </div>
                        </div>

                        {/* Text of Dhikr */}
                        <p className="text-xl sm:text-2xl font-amiri leading-loose font-semibold text-[#1F2E26] text-center py-2 select-all">
                          {dhikr.text}
                        </p>

                        {/* Virtue/Benefit */}
                        {dhikr.virtue && (
                          <div className="bg-[#FAF8F2] rounded-xl p-3.5 border border-amber-500/10 flex gap-3 items-start text-xs sm:text-sm">
                            <Award className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-950 block mb-1">فضل هذا الذكر:</span>
                              <p className="text-[#2C3E35]/90 leading-relaxed">{dhikr.virtue}</p>
                            </div>
                          </div>
                        )}

                        {/* Card Actions footer */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Bookmark className="h-3.5 w-3.5 text-emerald-800/50" />
                            <span className="text-xs text-[#2C3E35]/60 italic font-amiri font-bold">المصدر: {dhikr.source}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Copy Button */}
                            <button
                              onClick={() => copyToClipboard(dhikr.text, dhikr.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                copiedId === dhikr.id
                                  ? "bg-green-500 text-white"
                                  : "bg-[#FAF8F2] hover:bg-emerald-950 hover:text-white text-emerald-950 border border-emerald-950/10"
                              }`}
                            >
                              {copiedId === dhikr.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedId === dhikr.id ? "تم النسخ!" : "نسخ النص"}</span>
                            </button>

                            {/* Tasbeeh Button - Only if type is 'tasbeeh' */}
                            {dhikr.type === "tasbeeh" && (
                              <button
                                onClick={() => startTasbeeh(dhikr)}
                                className="inline-flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                <span>ابدأ التسبيح ({dhikr.count} مرات)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-amber-500/20 p-12 text-center space-y-3">
                    <p className="text-5xl">🔍</p>
                    <p className="text-emerald-950 font-bold text-lg">لم نعثر على أي ذكر يطابق كلمات البحث</p>
                    <p className="text-xs text-emerald-800/60">جرب البحث بكلمات أبسط مثل "الحمد لله"، "المساء"، "الصلاة" أو "الكرسي"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* "عني" (ABOUT US) MODE VIEW */}
          {showAbout && !searchQuery && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-amber-500/30 shadow-xl overflow-hidden">
              {/* Decorative banner */}
              <div className="bg-emerald-950 text-[#E2CEB3] py-12 px-6 text-center relative overflow-hidden border-b-4 border-amber-500">
                {/* Islamic geometric stars decorations */}
                <div className="absolute inset-0 opacity-5 flex items-center justify-between pointer-events-none">
                  <span className="text-[200px] font-bold font-amiri leading-none -mr-16">🕌</span>
                  <span className="text-[200px] font-bold font-amiri leading-none -ml-16">📿</span>
                </div>

                <div className="relative space-y-3">
                  <span className="text-5xl">✨</span>
                  <h2 className="text-3xl font-amiri font-bold text-amber-400">تطبيق الْوَابِلُ الصَّيِّبُ</h2>
                  <p className="text-xs sm:text-sm text-emerald-200 max-w-md mx-auto font-light">
                    "وَمَثَلُ مَا بَعَثَنِي اللَّهُ بِهِ مِنَ الْهُدَى وَالْعِلْمِ كَمَثَلِ الْغَيْثِ الْكَثِيرِ"
                  </p>
                </div>
              </div>

              {/* Content Card */}
              <div className="p-6 sm:p-8 space-y-8">
                
                {/* App literary text */}
                <div className="bg-[#FAF8F2] rounded-2xl p-6 sm:p-8 border border-amber-500/20 text-center relative">
                  {/* Arabic quotes */}
                  <span className="absolute right-4 top-4 text-4xl text-amber-600/20 font-serif">”</span>
                  <p className="text-base sm:text-lg text-emerald-950 font-semibold leading-loose text-center max-w-2xl mx-auto font-amiri">
                    "هذا البرنامج صُنع بمجهود فردي خالص، لا يبتغي صاحبه من ورائه إلا وجه الله والإسهام في خدمة دينه الحنيف. جُمعت فيه أذكار المسلم من أمهات كتب السنة والأذكار المأثورة، ليكون رفيقاً للمسلم في يومه وليلته، وعوناً له على ذكر الله في كل حال."
                  </p>
                  <span className="absolute left-4 bottom-4 text-4xl text-amber-600/20 font-serif">“</span>
                </div>

                {/* Sources Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <span>المصادر العلميّة المعتمَدة:</span>
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <li className="bg-[#FAF8F2] border border-emerald-800/5 p-3 rounded-xl text-center font-bold text-emerald-950">
                      📖 حصن المسلم
                      <span className="block text-[10px] text-amber-600 font-normal mt-1">للشيخ سعيد القحطاني</span>
                    </li>
                    <li className="bg-[#FAF8F2] border border-emerald-800/5 p-3 rounded-xl text-center font-bold text-emerald-950">
                      📖 كتاب الأذكار
                      <span className="block text-[10px] text-amber-600 font-normal mt-1">للإمام النووي رحمه الله</span>
                    </li>
                    <li className="bg-[#FAF8F2] border border-emerald-800/5 p-3 rounded-xl text-center font-bold text-emerald-950">
                      📖 الوابل الصيب
                      <span className="block text-[10px] text-amber-600 font-normal mt-1">لابن القيم الجوزية رحمه الله</span>
                    </li>
                  </ul>
                </div>

                {/* Contribution & Contact */}
                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-emerald-950">إن وجدت خطأً أو أردت الإسهام فتواصل معنا</h4>
                    <p className="text-xs text-emerald-800/70 mt-1">نسعد بملاحظاتكم البنّاءة لتطوير وتصحيح أوراد المسلم باستمرار.</p>
                  </div>

                  {/* Contacts Placeholders Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Email */}
                    <a
                      href="mailto:support@alwabil.islamic"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center justify-center gap-2 bg-[#FAF8F2] hover:bg-emerald-950 hover:text-white transition-colors p-3 rounded-xl border border-emerald-950/10 text-xs text-emerald-950"
                    >
                      <Mail className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate font-semibold">support@alwabil.com</span>
                    </a>

                    {/* Twitter placeholder */}
                    <a
                      href="https://x.com/alwabil_adhkar"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center justify-center gap-2 bg-[#FAF8F2] hover:bg-emerald-950 hover:text-white transition-colors p-3 rounded-xl border border-emerald-950/10 text-xs text-emerald-950"
                    >
                      <Globe className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate font-semibold">@AlWabil_Adhkar</span>
                    </a>

                    {/* WhatsApp placeholder */}
                    <a
                      href="https://wa.me/0000000"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center justify-center gap-2 bg-[#FAF8F2] hover:bg-emerald-950 hover:text-white transition-colors p-3 rounded-xl border border-emerald-950/10 text-xs text-emerald-950"
                    >
                      <MessageCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate font-semibold">تواصل عبر الواتساب</span>
                    </a>
                  </div>
                </div>

                {/* Concluding Duas and Blessings */}
                <div className="text-center border-t border-amber-500/10 pt-6 space-y-2">
                  <p className="text-lg font-amiri font-bold text-emerald-950">
                    "اللهم اجعله في ميزان حسناتنا يوم القيامة"
                  </p>
                  <p className="text-[10px] text-emerald-800/50">
                    نسألكم صالح الدعاء بظهر الغيب لنا ولوالدينا ولكل من ساهم في تيسير هذا الذكر.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FREE STYLE ELECTRONIC ROSARY (المسبحة الحرة) VIEW */}
          {freeRosaryActive && !searchQuery && !showAbout && (
            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-amber-500/20 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-block bg-[#FAF8F2] p-3.5 rounded-full border border-amber-500/20 text-2xl">
                  📿
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-950">المسبحة الإلكترونية الحرة</h2>
                <p className="text-xs sm:text-sm text-emerald-800/70">
                  استعن بهذه المسبحة لترديد أي أوراد أو استغفار بالعدد الذي تحدده وتفضله.
                </p>
              </div>

              {/* Inputs for Target count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F2] p-4 rounded-2xl border border-emerald-950/5">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">الهدف المطلوب لتكراره:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={freeRosaryTarget}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 33;
                        setFreeRosaryTarget(val);
                        setFreeRosaryCompleted(freeRosaryCount >= val);
                      }}
                      className="w-full bg-white border border-emerald-950/20 rounded-lg px-3 py-1.5 text-sm text-emerald-950 text-center font-bold"
                    />
                    {/* Presets */}
                    <div className="flex gap-1">
                      {[33, 100].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            setFreeRosaryTarget(preset);
                            setFreeRosaryCompleted(freeRosaryCount >= preset);
                          }}
                          className="bg-emerald-900 text-white text-xs font-bold px-2 py-1.5 rounded-lg"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => {
                      setFreeRosaryCount(0);
                      setFreeRosaryCompleted(false);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>تصفير العداد الحالي</span>
                  </button>
                </div>
              </div>

              {/* BIG INTERACTIVE BUTTON */}
              <div className="flex flex-col items-center justify-center space-y-6 py-4">
                
                {/* Circular Progress View */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                  
                  {/* Simulated Circular track using simple absolute borders */}
                  <div className="absolute inset-0 rounded-full border-[8px] border-[#FAF8F2] shadow-inner"></div>
                  
                  {/* Absolute active overlay representation using dynamic scale or rotations */}
                  <div className="absolute inset-0 rounded-full border-[8px] border-emerald-950 opacity-30"></div>

                  {/* Golden glowing center button */}
                  <button
                    onClick={handleFreeRosaryClick}
                    disabled={freeRosaryCompleted}
                    className={`
                      w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-850 hover:to-emerald-800 text-white border-4 border-amber-500 flex flex-col items-center justify-center shadow-2xl transition-all duration-100 select-none
                      ${freeRosaryCompleted ? "opacity-80 border-green-500 cursor-not-allowed" : "active:scale-95 cursor-pointer hover:shadow-amber-500/20"}
                    `}
                  >
                    <span className="text-[10px] text-amber-300 font-bold tracking-wider">اضغط هنا للتسبيح</span>
                    <span className="text-4xl sm:text-5xl font-bold font-amiri mt-1 text-[#FAF8F2]">
                      {freeRosaryCount}
                    </span>
                    <span className="text-[11px] text-emerald-300/90 mt-0.5">الهدف: {freeRosaryTarget}</span>
                  </button>
                </div>

                {/* Linear progress bar */}
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-[11px] text-[#2C3E35] font-medium">
                    <span>النسبة المئوية للهدف</span>
                    <span className="font-bold font-amiri text-xs">
                      {Math.min(100, Math.round((freeRosaryCount / freeRosaryTarget) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF8F2] rounded-full h-3.5 border border-amber-500/10 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-900 h-full transition-all duration-200 rounded-full"
                      style={{ width: `${Math.min(100, (freeRosaryCount / freeRosaryTarget) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Success Message */}
                {freeRosaryCompleted && (
                  <div className="w-full bg-green-50 border-2 border-green-500/30 rounded-2xl p-4 text-center space-y-2 pulse-slow">
                    <div className="flex justify-center text-green-600">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-green-950 font-bold text-base sm:text-lg">اكتمل الورد والحمد لله! 🎉</h3>
                    <p className="text-xs text-green-800">
                      كتب الله لك الأجر والمغفرة ورفع من درجاتك.
                    </p>
                    <button
                      onClick={() => {
                        setFreeRosaryCount(0);
                        setFreeRosaryCompleted(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all mt-2"
                    >
                      ابدأ من جديد
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAIN DHIKR VIEW (List of Section Remembrances) */}
          {!searchQuery && !showAbout && !freeRosaryActive && (
            <div className="space-y-6">
              
              {/* Section Header Card */}
              {currentSection && (
                <div className="bg-white border-b-4 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                  {/* Decorative absolute label */}
                  <div className="absolute -left-12 -top-12 w-36 h-36 rounded-full bg-emerald-950/5 flex items-center justify-center select-none font-amiri text-5xl font-bold text-emerald-900/10">
                    🕌
                  </div>

                  <div className="relative space-y-3">
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl sm:text-4xl bg-[#FAF8F2] p-2.5 rounded-2xl border border-amber-500/25 shadow-inner shrink-0">
                        {currentSection.icon}
                      </span>
                      <div>
                        <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-amber-600">
                          {currentSection.category === "daily" ? "الأذكار اليومية" : "أذكار المواسم والمناسبات"}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-emerald-950 font-amiri">
                          {currentSection.title}
                        </h2>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#2C3E35]/80 max-w-3xl leading-relaxed">
                      {currentSection.description}
                    </p>
                  </div>
                </div>
              )}

              {/* DHIKR LIST CARDS */}
              <div className="space-y-6">
                {currentDhikrs.length > 0 ? (
                  currentDhikrs.map((dhikr, index) => {
                    return (
                      <div
                        key={dhikr.id}
                        className="bg-white rounded-2xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 p-5 sm:p-7 shadow-sm space-y-5 relative group"
                      >
                        {/* Card Header info */}
                        <div className="flex items-center justify-between text-xs border-b border-[#FAF8F2] pb-3">
                          <div className="flex items-center gap-2 text-emerald-800/60">
                            <span className="bg-[#FAF8F2] text-[#1F2E26] px-2.5 py-1 rounded-md border border-emerald-900/10 font-bold font-amiri text-sm">
                              الذِّكْرُ {index + 1} مِنَ {currentDhikrs.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dhikr.type === 'tasbeeh' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {dhikr.type === 'tasbeeh' ? `يُكرّر ${dhikr.count} مرّات` : 'يُقرأ كاملًا'}
                            </span>
                          </div>
                        </div>

                        {/* Text of Dhikr (Beautiful large fonts with rich styling) */}
                        <p className="text-xl sm:text-2xl font-amiri leading-loose font-semibold text-[#1F2E26] text-center py-3 select-all">
                          {dhikr.text}
                        </p>

                        {/* Virtue / Benefit section */}
                        {dhikr.virtue && (
                          <div className="bg-[#FAF8F2] rounded-xl p-4 border border-amber-500/10 flex gap-3 items-start text-xs sm:text-sm transition-all">
                            <Award className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-950 block mb-1">فضل الذكر وفائدته:</span>
                              <p className="text-[#2C3E35]/95 leading-relaxed">{dhikr.virtue}</p>
                            </div>
                          </div>
                        )}

                        {/* Source of Dhikr */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Bookmark className="h-3.5 w-3.5 text-emerald-800/40" />
                            <span className="text-xs text-[#2C3E35]/60 italic font-amiri font-bold">المصدر: {dhikr.source}</span>
                          </div>

                          {/* Card Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Copy Text Button */}
                            <button
                              onClick={() => copyToClipboard(dhikr.text, dhikr.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                copiedId === dhikr.id
                                  ? "bg-green-600 text-white"
                                  : "bg-[#FAF8F2] hover:bg-emerald-950 hover:text-white text-emerald-950 border border-emerald-950/10"
                              }`}
                            >
                              {copiedId === dhikr.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedId === dhikr.id ? "تم النسخ!" : "نسخ الذكر"}</span>
                            </button>

                            {/* Start Tasbeeh Interactive Button (Only for type: tasbeeh) */}
                            {dhikr.type === "tasbeeh" && (
                              <button
                                onClick={() => startTasbeeh(dhikr)}
                                className="inline-flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-300 px-4.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                <Play className="h-3 w-3 fill-current text-amber-400" />
                                <span>ابدأ التسبيح</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-amber-500/20 p-12 text-center space-y-2">
                    <span className="text-4xl">📿</span>
                    <h3 className="text-emerald-950 font-bold text-lg">لا يوجد أذكار مدخلة حالياً في هذا القسم</h3>
                    <p className="text-xs text-emerald-800/60">سيتم إضافة أوراد جديدة لهذا القسم قريباً.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ACTIVE INTERACTIVE TASBEEH PANEL (DRAWER / OVERLAY MODAL) */}
      {activeDhikr && (
        <div className="fixed inset-0 bg-emerald-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-amber-500/35 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-emerald-950 text-[#E2CEB3] p-4 flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">📿</span>
                <h3 className="font-bold text-amber-400">شاشة التسبيح التفاعلية</h3>
              </div>
              <button
                onClick={() => setActiveDhikr(null)}
                className="p-1.5 rounded-lg hover:bg-emerald-900 text-amber-400 transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              
              {/* Dhikr content */}
              <div className="bg-[#FAF8F2] rounded-2xl p-5 border border-amber-500/25 text-center space-y-3 shadow-inner">
                <p className="text-lg sm:text-xl font-amiri leading-loose font-bold text-[#1F2E26] select-all">
                  {activeDhikr.text}
                </p>
                <div className="text-[10px] text-emerald-800 font-medium italic">
                  المصدر: {activeDhikr.source}
                </div>
              </div>

              {/* Target setting and Reset Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-900/5 p-4 rounded-2xl border border-emerald-950/10">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    حدد تكرار التسبيحات المطلوبة:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={tasbeehTarget}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setTasbeehTarget(val);
                        setTasbeehCompleted(tasbeehCount >= val);
                      }}
                      className="w-20 bg-white border border-emerald-950/20 rounded-lg px-2 py-1 text-sm text-emerald-950 text-center font-bold"
                    />
                    <span className="text-xs text-emerald-800/80">مرات</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTasbeehCount(0);
                      setTasbeehCompleted(false);
                    }}
                    className="flex items-center gap-1 bg-white hover:bg-gray-100 text-emerald-950 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-950/20 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>تصفير العداد</span>
                  </button>
                  <button
                    onClick={() => setTasbeehTarget(activeDhikr.count)}
                    className="bg-emerald-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-emerald-800"
                  >
                    الرجوع للأصلي ({activeDhikr.count})
                  </button>
                </div>
              </div>

              {/* BIG CLICKABLE BUTTON CONTAINER */}
              <div className="flex flex-col items-center justify-center space-y-5">
                
                {/* Counter Circle */}
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[8px] border-[#FAF8F2] shadow-inner"></div>
                  <div className="absolute inset-0 rounded-full border-[8px] border-emerald-950 opacity-25"></div>

                  {/* Golden pulse button */}
                  <button
                    onClick={handleTasbeehClick}
                    disabled={tasbeehCompleted}
                    className={`
                      w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-850 hover:to-emerald-800 text-white border-4 border-amber-500 flex flex-col items-center justify-center shadow-xl transition-all select-none
                      ${tasbeehCompleted ? "opacity-85 border-green-500 cursor-not-allowed" : "active:scale-95 cursor-pointer hover:shadow-amber-500/25"}
                    `}
                  >
                    <span className="text-[10px] text-amber-300 font-bold tracking-wider">اضغط للتسبيح</span>
                    <span className="text-4xl sm:text-5xl font-bold font-amiri mt-1 text-[#FAF8F2]">
                      {tasbeehCount}
                    </span>
                    <span className="text-xs text-emerald-200 mt-0.5">من {tasbeehTarget}</span>
                  </button>
                </div>

                {/* Linear progress bar */}
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-[11px] text-[#2C3E35] font-medium">
                    <span>التقدم المحرز للذكر</span>
                    <span className="font-bold font-amiri text-xs">
                      {Math.min(100, Math.round((tasbeehCount / tasbeehTarget) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF8F2] rounded-full h-3 border border-amber-500/10 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-900 h-full transition-all duration-200 rounded-full"
                      style={{ width: `${Math.min(100, (tasbeehCount / tasbeehTarget) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tasbeeh Success Message */}
                {tasbeehCompleted && (
                  <div className="w-full bg-green-50 border-2 border-green-500/30 rounded-2xl p-4 text-center space-y-2 pulse-slow">
                    <div className="flex justify-center text-green-600">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-green-950 font-bold text-base sm:text-lg">اكتمل الذكر والحمد لله 🎉</h3>
                    <p className="text-xs text-green-800">
                      تقبل الله منكم وغفر ذنوبكم وطهر قلوبكم.
                    </p>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setTasbeehCount(0);
                          setTasbeehCompleted(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        كرر مجدداً
                      </button>
                      <button
                        onClick={() => setActiveDhikr(null)}
                        className="bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        عودة للأذكار
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF8F2] p-4 border-t border-amber-500/15 text-center flex justify-between items-center">
              <span className="text-xs text-emerald-800/70">
                أكمل بقية الأوراد لنيل تمام الأجر اليومي.
              </span>
              <button
                onClick={() => setActiveDhikr(null)}
                className="bg-emerald-950 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-900 transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL FLOATING ACTION FOR GENERAL ROSARY (MOBILE FRIENDLY) */}
      <button
        onClick={openFreeRosary}
        className="md:hidden fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-850 border-2 border-amber-400 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
        title="افتح المسبحة الحرة"
      >
        <span className="text-2xl">📿</span>
      </button>

      {/* FOOTER OF THE WEBSITE */}
      <footer className="bg-emerald-950 text-[#E2CEB3] border-t-2 border-amber-500/40 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-xl">🕌</span>
              <span className="font-amiri font-bold text-lg text-amber-400">الْوَابِلُ الصَّيِّبُ لأذكار وأوراد المسلم</span>
            </div>
            <p className="text-xs text-emerald-300/90 max-w-md">
              أكبر مرجع متكامل لأذكار اليوم والليلة والمواسم والمناسبات، مستمد بالكامل من كتب السنة المطهرة.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex flex-wrap justify-center gap-4 text-xs font-bold">
              <button onClick={() => { setShowAbout(true); setFreeRosaryActive(false); setSelectedSectionId(""); }} className="hover:text-amber-400 transition-colors">عن التطبيق</button>
              <span>•</span>
              <button onClick={() => { setFreeRosaryActive(true); setShowAbout(false); setSelectedSectionId(""); }} className="hover:text-amber-400 transition-colors">المسبحة الإلكترونية</button>
              <span>•</span>
              <button onClick={() => { setSelectedSectionId("morning"); setShowAbout(false); setFreeRosaryActive(false); }} className="hover:text-amber-400 transition-colors">أذكار الصباح</button>
              <span>•</span>
              <button onClick={() => { setSelectedSectionId("evening"); setShowAbout(false); setFreeRosaryActive(false); }} className="hover:text-amber-400 transition-colors">أذكار المساء</button>
            </div>
            
            <div className="text-[10px] text-emerald-300/60">
              © {new Date().getFullYear()} جميع الحقوق محفوظة لكل مسلم - صدقة جارية عن صاحب التطبيق ووالديه
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}