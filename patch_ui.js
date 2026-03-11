import fs from 'fs';

const path = 'src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

// ─── 1. SCROLL TO TOP on every view change ───
c = c.replace(
  `  const requireAuth = (targetView: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina') => {
    if (!session) {
      setView('auth');
    } else {
      setView(targetView);
    }
  };`,
  `  const goTo = (v: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView(v);
  };
  const requireAuth = (targetView: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!session) { setView('auth'); } else { setView(targetView); }
  };`
);

// ─── 2. MAIN wrapper ───
c = c.replace(
  `    <div className="min-h-screen font-sans pb-24 md:pb-0">`,
  `    <div className="min-h-screen font-sans pb-28 md:pb-0">`
);

// ─── 3. TOP NAV ───
c = c.replace(
  `      {/* Top Header - iOS Style */}
      <nav className="sticky top-0 z-50 nav-gradient px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center cursor-pointer h-12" 
            onClick={() => setView('home')}
          >
            <img 
              src="/logo.png" 
              alt="ReMatch Logo" 
              className="h-full w-auto object-contain hover:opacity-80 transition-opacity" 
            />
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('home')} className={\`px-3 py-1 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-lg active:scale-95 \${view === 'home' ? 'text-brand-end bg-brand-end/20' : 'text-white/70 hover:text-white'}\`}>Home</button>
            <button onClick={() => requireAuth('dashboard')} className={\`px-3 py-1 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-lg active:scale-95 \${view === 'dashboard' ? 'text-brand-end bg-brand-end/20' : 'text-white/70 hover:text-white'}\`}>Dashboard</button>
            <button onClick={() => setView('vetrina')} className={\`px-3 py-1 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-lg active:scale-95 \${view === 'vetrina' ? 'text-brand-end bg-brand-end/20' : 'text-white/70 hover:text-white'}\`}>Vetrina</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-brand-end hover:text-white transition-all">
              <Bell size={20} />
              {proposals.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1c1c1e]"></span>
              )}
            </button>
            <button 
              onClick={() => {
                if (session) {
                  if (window.confirm("Sei sicuro di voler uscire?")) {
                    supabase.auth.signOut();
                  }
                } else {
                  setView('auth');
                }
              }}
              title={session ? "Esci da ReMatch" : "Accedi a ReMatch"}
              className={\`w-8 h-8 rounded-full flex items-center justify-center border overflow-hidden cursor-pointer backdrop-blur-md transition-all \${
                session 
                  ? "bg-brand-end/20 border-brand-end/20 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500" 
                  : "bg-white/10 border-white/20 hover:bg-white/20 text-white"
              }\`}
            >
              <User size={16} className="text-current" />
            </button>
          </div>
        </div>
      </nav>`,
  `      {/* Top Header */}
      <nav className="sticky top-0 z-50 nav-gradient px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer h-10" onClick={() => goTo('home')}>
            <img src="/logo.png" alt="ReMatch Logo" className="h-full w-auto object-contain hover:opacity-80 transition-opacity" />
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {(['home','vetrina'] as const).map(v => (
              <button key={v} onClick={() => goTo(v)} className={\`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 capitalize \${view === v ? 'text-brand-end bg-brand-end/15' : 'text-white/60 hover:text-white hover:bg-white/8'}\`}>{v}</button>
            ))}
            <button onClick={() => requireAuth('dashboard')} className={\`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 \${view === 'dashboard' ? 'text-brand-end bg-brand-end/15' : 'text-white/60 hover:text-white hover:bg-white/8'}\`}>Dashboard</button>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <span className="hidden sm:block text-xs font-semibold text-white/50 max-w-[120px] truncate">{currentUser?.nome}</span>
            )}
            <button className="relative p-2 text-brand-end/80 hover:text-brand-end transition-all">
              <Bell size={20} />
              {proposals.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1c1c1e]"></span>
              )}
            </button>
            <button 
              onClick={() => {
                if (session) {
                  if (window.confirm("Sei sicuro di voler uscire?")) { supabase.auth.signOut(); }
                } else {
                  goTo('auth');
                }
              }}
              title={session ? "Esci" : "Accedi"}
              className={\`w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer transition-all \${
                session ? "bg-brand-end/15 border-brand-end/25 text-brand-end hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400"
                        : "bg-white/8 border-white/15 text-white/70 hover:bg-white/15 hover:text-white"
              }\`}
            >
              <User size={15} />
            </button>
          </div>
        </div>
      </nav>`
);

// ─── 4. BOTTOM NAV ───
c = c.replace(
  `      {/* Floating Bottom Tab Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="glass-card rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl">
          <button 
            onClick={() => setView('home')}
            className={\`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 \${view === 'home' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}\`}
          >
            <Home size={22} className={view === 'home' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button 
            onClick={() => requireAuth('sell')}
            className={\`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 \${view === 'sell' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}\`}
          >
            <PlusCircle size={22} className={view === 'sell' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Vendi</span>
          </button>
          <button 
            onClick={() => requireAuth('buy')}
            className={\`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 \${view === 'buy' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}\`}
          >
            <ShoppingBag size={22} className={view === 'buy' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Compra</span>
          </button>
          <button 
            onClick={() => requireAuth('dashboard')}
            className={\`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 \${view === 'dashboard' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}\`}
          >
            <div className="relative">
              <LayoutDashboard size={22} className={view === 'dashboard' ? 'scale-110' : ''} />
              {proposals.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1">Dashboard</span>
          </button>
          <button 
            onClick={() => setView('vetrina')}
            className={\`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 \${view === 'vetrina' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}\`}
          >
            <ShoppingBag size={22} className={view === 'vetrina' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Vetrina</span>
          </button>`,
  `      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm md:hidden">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.06]">
          {([
            { v: 'home', icon: <Home size={20} />, label: 'Home', fn: () => goTo('home') },
            { v: 'sell', icon: <PlusCircle size={20} />, label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', icon: <ShoppingBag size={20} />, label: 'Compra', fn: () => requireAuth('buy') },
            { v: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', fn: () => requireAuth('dashboard'), dot: proposals.length > 0 },
            { v: 'vetrina', icon: <ShoppingBag size={20} />, label: 'Vetrina', fn: () => goTo('vetrina') },
          ] as { v: string; icon: React.ReactNode; label: string; fn: () => void; dot?: boolean }[]).map(tab => (
            <button
              key={tab.v}
              onClick={tab.fn}
              className={\`flex-1 flex flex-col items-center py-2.5 rounded-[1.5rem] transition-all duration-300 \${view === tab.v ? 'nav-item-active' : 'text-ios-gray hover:bg-black/4'}\`}
            >
              <div className="relative">
                {tab.icon}
                {tab.dot && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
              </div>
              <span className="text-[9px] font-black mt-0.5 tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Desktop sidebar nav */}
      <nav className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-2xl rounded-2xl px-1.5 py-1.5 flex items-center gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-black/[0.05]">
          {([
            { v: 'home', label: 'Home', fn: () => goTo('home') },
            { v: 'sell', label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', label: 'Compra', fn: () => requireAuth('buy') },
            { v: 'dashboard', label: 'Dashboard', fn: () => requireAuth('dashboard') },
            { v: 'vetrina', label: 'Vetrina', fn: () => goTo('vetrina') },
          ] as { v: string; label: string; fn: () => void }[]).map(tab => (
            <button
              key={tab.v}
              onClick={tab.fn}
              className={\`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 \${view === tab.v ? 'nav-item-active' : 'text-ios-gray hover:text-ios-label hover:bg-black/4'}\`}
            >{tab.label}</button>
          ))}
        </div>
      </nav>`
);

// ─── 5. Main content wrapper ───
c = c.replace(
  `      <main className="max-w-5xl mx-auto px-6 py-8">`,
  `      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">`
);

// ─── 6. HOME - hero section ───
c = c.replace(
  `              {/* Hero Section */}
              <section className="relative overflow-hidden rounded-[3.5rem] bg-ios-label text-white p-8 md:p-20">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
                  <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] bg-linear-to-br from-ios-blue via-brand-start to-brand-end blur-[120px] rounded-full animate-pulse"></div>
                </div>
                
                <div className="relative z-10 max-w-2xl space-y-10">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                    <TrendingUp size={18} className="text-brand-start" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Marketplace Intelligente</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-6xl md:text-8xl leading-[1.1] md:leading-[1] font-display font-black tracking-tighter">
                    Dai nuova vita <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-start to-brand-end">ai tuoi oggetti.</span>
                  </h1>
                  
                  <p className="text-white/60 text-lg md:text-2xl leading-relaxed max-w-lg font-medium">
                    ReMatch connette chi vende e chi cerca attraverso un sistema di matchmaking esclusivo basato sull'intento reale.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 sm:gap-5 pt-4 sm:pt-6">
                    <button 
                      onClick={() => requireAuth('sell')}
                      className="ios-btn-primary group !px-6 sm:!px-10 !py-4 sm:!py-5 text-base sm:text-lg w-full sm:w-auto"
                    >
                      Inizia a Vendere
                      <ArrowRight size={20} className="inline ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>
                    <button 
                      onClick={() => requireAuth('buy')}
                      className="px-6 py-4 sm:px-10 sm:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl font-black text-base sm:text-lg hover:bg-white/20 transition-all active:scale-95 shadow-2xl w-full sm:w-auto"
                    >
                      Cerca Oggetti
                    </button>
                  </div>
                </div>
              </section>`,
  `              {/* Hero */}
              <section className="relative overflow-hidden rounded-3xl bg-[#1c1c1e] text-white px-6 py-10 sm:px-14 sm:py-16">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-brand-start/20 rounded-full blur-[100px]" />
                  <div className="absolute -bottom-1/4 -left-1/4 w-2/4 h-2/4 bg-brand-end/15 rounded-full blur-[80px]" />
                </div>
                <div className="relative z-10 max-w-xl space-y-6 sm:space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
                    <TrendingUp size={14} className="text-brand-start" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Marketplace Intelligente</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl leading-tight font-display font-black tracking-tighter">
                    Dai nuova vita<br />
                    <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg,#FFB800,#FF7A00)'}}>ai tuoi oggetti.</span>
                  </h1>
                  <p className="text-white/55 text-sm sm:text-lg leading-relaxed max-w-md font-medium">
                    ReMatch connette chi vende e chi cerca tramite un matchmaking intelligente basato sull'intento reale.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => requireAuth('sell')} className="ios-btn-primary group flex items-center gap-2">
                      Inizia a Vendere
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => requireAuth('buy')} className="px-6 py-3.5 bg-white/10 border border-white/15 rounded-xl font-bold text-sm hover:bg-white/18 transition-all active:scale-95">
                      Cerca Oggetti
                    </button>
                  </div>
                </div>
              </section>`
);

// ─── 7. HOME - Top Searches section ───
c = c.replace(
  `              {/* Top 10 Searches Ranking - Move before Search Box */}
              <section className="ios-card p-8 sm:p-12 glass-card !rounded-[2.5rem] sm:!rounded-[3.5rem] shadow-2xl space-y-8">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-black">Top 10 Ricercati</h3>
                    <p className="text-ios-gray text-sm">Le tendenze più calde della community.</p>
                  </div>
                  <TrendingUp size={28} className="text-brand-end" />
                </div>`,
  `              {/* Top Searches */}
              <section className="ios-card p-5 sm:p-8 space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="rm-section-title">🔥 Più Cercati</h3>
                    <p className="text-ios-gray text-xs mt-0.5">Tendenze live della community</p>
                  </div>
                  <TrendingUp size={22} className="text-brand-end" />
                </div>`
);

// search items styling
c = c.replace(
  /className="flex items-center gap-3 px-6 py-3 bg-ios-secondary\/50 rounded-2xl border border-black\/\[0\.03\] group hover:bg-ios-label hover:text-white transition-all duration-300 cursor-default"/g,
  `className="flex items-center gap-2.5 px-4 py-2.5 bg-ios-secondary rounded-xl border border-black/[0.04] group hover:bg-ios-label hover:text-white transition-all duration-200 cursor-default"`
);
c = c.replace(
  /className="flex items-center gap-3 px-6 py-3 bg-ios-secondary\/50 rounded-2xl border border-black\/\[0\.03\] group hover:bg-ios-label hover:text-white transition-all duration-300 cursor-default" key=\{\`extra-\$\{index\}\`\}/g,
  `key={\`extra-\${index}\`} className="flex items-center gap-2.5 px-4 py-2.5 bg-ios-secondary rounded-xl border border-black/[0.04] group hover:bg-ios-label hover:text-white transition-all duration-200 cursor-default"`
);

// ─── 8. HOME - Search section ───
c = c.replace(
  `              {/* Search Section */}
              <div className="ios-card p-6 sm:p-10 glass-card !rounded-[2.5rem] sm:!rounded-[3.5rem] shadow-2xl">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 text-ios-gray group-focus-within:text-brand-end transition-colors duration-300" size={24} />
                    <input 
                      type="text" 
                      placeholder="Cosa stai cercando oggi?"
                      className="w-full pl-14 sm:pl-20 pr-8 py-5 sm:py-7 bg-ios-secondary/50 rounded-2xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-brand-end/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/40 shadow-inner"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => fetchData()}
                    className="ios-btn-primary !px-10 sm:!px-16 !py-5 sm:!py-7 !text-xl !rounded-2xl sm:!rounded-[2rem] shadow-2xl shadow-brand-end/20 active:scale-95 transition-all"
                  >
                    Trova Match
                  </button>
                </div>
                <p className="mt-4 text-center text-ios-gray text-xs font-medium italic">
                  La nostra AI cercherà match in tutte le categorie basandosi sulle tue parole chiave.
                </p>
              </div>`,
  `              {/* Search */}
              <div className="ios-card p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray/60 group-focus-within:text-brand-end transition-colors duration-200" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cosa stai cercando oggi?"
                      className="w-full pl-11 pr-4 py-3.5 bg-ios-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-end/30 transition-all text-base font-semibold placeholder:text-ios-gray/50"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => fetchData()} className="ios-btn-primary whitespace-nowrap">
                    Trova Match
                  </button>
                </div>
                <p className="mt-3 text-ios-gray text-xs font-medium">La nostra AI cerca match in tutte le categorie.</p>
              </div>`
);

// ─── 9. HOME - Vetrina Anteprima section ───
c = c.replace(
  `              {/* Live Marketplace - Shown at the bottom */}
              <section className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">Vetrina Anteprima</h2>
                    <p className="text-ios-gray text-sm">Gli ultimi 20 oggetti caricati nella community.</p>
                  </div>
                  <button 
                    onClick={() => setView('vetrina')}
                    className="text-ios-blue text-sm font-bold flex items-center gap-1 hover:translate-x-1 transition-transform"
                  >
                    Vedi tutto <ChevronRight size={16} />
                  </button>
                </div>`,
  `              {/* Vetrina Anteprima */}
              <section className="space-y-5 sm:space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="rm-section-title">Vetrina Live</h2>
                    <p className="text-ios-gray text-xs mt-0.5">Gli ultimi oggetti nella community</p>
                  </div>
                  <button onClick={() => goTo('vetrina')} className="text-brand-end text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Vedi tutto <ChevronRight size={15} />
                  </button>
                </div>`
);

// ─── 10. HOME - item card ───
c = c.replace(
  `                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                  {items.slice(0, 10).map((item) => {
                    const isFav = favorites.some(f => f.id === item.id);
                    return (
                      <motion.div 
                        layout
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.98 }}
                        key={item.id} 
                        className="ios-card ios-card-hover group cursor-pointer relative"
                      >
                        <div className="aspect-[4/5] overflow-hidden relative">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className={\`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-xl shadow-lg \${isFav ? 'bg-red-500 text-white' : 'bg-white/70 text-ios-gray'}\`}
                          >
                            <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                          </button>
                          
                          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-sm font-bold shadow-xl">
                            €{item.price}
                          </div>
                        </div>
                        <div className="p-5 space-y-3">
                          <h4 className="font-bold text-base truncate">{item.title}</h4>
                          <div className="flex items-center justify-between text-xs text-ios-gray">
                            <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>`,
  `                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {items.slice(0, 12).map((item) => {
                    const isFav = favorites.some(f => f.id === item.id);
                    return (
                      <motion.div 
                        layout
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        key={item.id} 
                        className="ios-card ios-card-hover group cursor-pointer"
                      >
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                            className={\`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-xl shadow-md transition-colors \${isFav ? 'bg-red-500 text-white' : 'bg-white/80 text-ios-gray hover:text-red-500'}\`}
                          >
                            <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                          </button>
                          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-black shadow-sm">
                            €{item.price}
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 space-y-1.5">
                          <h4 className="font-bold text-sm truncate">{item.title}</h4>
                          <div className="flex items-center justify-between text-xs text-ios-gray">
                            <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>`
);

// ─── 11. SELL page wrapper ───
c = c.replace(
  `            <div className="ios-card p-6 sm:p-16 glass-card !rounded-[2rem] sm:!rounded-[3.5rem] shadow-2xl space-y-8 sm:space-y-12">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ios-blue/10 text-ios-blue rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Package size={32} />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Vendi un Oggetto</h2>
                  <p className="text-ios-gray text-base sm:text-xl font-medium max-w-md mx-auto">Inserisci i dettagli del tuo oggetto e trova subito un acquirente interessato.</p>
                </div>`,
  `            <div className="ios-card p-5 sm:p-10 space-y-6 sm:space-y-8">
                <div className="page-hero">
                  <div className="page-hero-icon"><Package size={24} /></div>
                  <h2>Vendi un Oggetto</h2>
                  <p>Inserisci i dettagli e trova subito un acquirente.</p>
                </div>`
);

// sell form input classes
c = c.replace(
  /className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary\/50 rounded-xl sm:rounded-\[2rem\] focus:outline-none focus:ring-4 focus:ring-ios-blue\/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray\/30"/g,
  `className="rm-input-lg"`
);
c = c.replace(
  /className="w-full px-6 sm:px-10 py-5 sm:py-8 bg-ios-secondary\/50 rounded-2xl sm:rounded-\[2\.5rem\] focus:outline-none focus:ring-4 focus:ring-ios-blue\/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray\/30 resize-none"/g,
  `className="rm-input-lg resize-none"`
);
c = c.replace(
  /className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-\[0\.2em\]"/g,
  `className="rm-label"`
);
c = c.replace(
  `className="w-full ios-btn-primary !py-5 sm:!py-8 text-xl sm:text-2xl !rounded-xl sm:!rounded-[2rem] shadow-2xl shadow-ios-blue/30"`,
  `className="ios-btn-primary w-full text-lg"`
);

// sell form photo zone
c = c.replace(
  `<div className="relative aspect-video rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl">`,
  `<div className="relative aspect-video rounded-2xl overflow-hidden shadow-md">`
);
c = c.replace(
  `<label className="w-full aspect-video bg-ios-secondary/50 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-4 border-dashed border-ios-gray/20 flex flex-col items-center justify-center gap-4 sm:gap-6 cursor-pointer hover:bg-ios-secondary transition-all group overflow-hidden">`,
  `<label className="w-full aspect-video bg-ios-secondary rounded-2xl border-2 border-dashed border-ios-gray/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-ios-secondary/80 transition-all group overflow-hidden">`
);
c = c.replace(
  `<div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-ios-blue shadow-2xl group-hover:scale-110 transition-transform duration-500">`,
  `<div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-end shadow-md group-hover:scale-105 transition-transform duration-300">`
);
c = c.replace(
  `<p className="text-lg sm:text-2xl font-black">Carica una foto</p>
                             <p className="text-ios-gray text-xs sm:text-base font-medium">Trascina o clicca per selezionare</p>`,
  `<p className="text-base font-black">Carica una foto</p>
                             <p className="text-ios-gray text-xs font-medium">Trascina o clicca per selezionare</p>`
);

// ─── 12. BUY page wrapper ───
c = c.replace(
  `              <div className="ios-card p-6 sm:p-16 glass-card !rounded-[2rem] sm:!rounded-[3.5rem] shadow-2xl space-y-8 sm:space-y-12">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-start/10 text-brand-start rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Search size={32} />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Cerca un Oggetto</h2>
                  <p className="text-ios-gray text-base sm:text-xl font-medium max-w-md mx-auto">Dicci cosa cerchi e ti avviseremo appena appare.</p>
                </div>`,
  `              <div className="ios-card p-5 sm:p-10 space-y-6 sm:space-y-8">
                <div className="page-hero">
                  <div className="page-hero-icon"><Search size={24} /></div>
                  <h2>Cerca un Oggetto</h2>
                  <p>Dicci cosa cerchi e ti avviseremo appena appare.</p>
                </div>`
);

// buy form inputs
c = c.replace(
  `                    <input 
                      required
                      type="text" 
                      placeholder="es. MacBook Pro, Tavolo Legno..."
                      className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                      value={newRequest.query}
                      onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                    />`,
  `                    <input
                      required
                      type="text"
                      placeholder="es. MacBook Pro, Tavolo Legno..."
                      className="rm-input-lg"
                      value={newRequest.query}
                      onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                    />`
);
c = c.replace(
  `                        type="number" 
                        placeholder="Nessun limite"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"`,
  `                        type="number"
                        placeholder="Nessun limite"
                        className="rm-input-lg"`
);
c = c.replace(
  `                        type="text" 
                        placeholder="Città o 'Ovunque'"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"`,
  `                        type="text"
                        placeholder="Città o 'Ovunque'"
                        className="rm-input-lg"`
);
c = c.replace(
  `className="w-full ios-btn-primary !py-5 sm:!py-8 text-xl sm:text-2xl !rounded-xl sm:!rounded-[2rem] shadow-2xl shadow-brand-start/30"`,
  `className="ios-btn-primary w-full text-lg"`
);

// ─── 13. CHECKOUT wrapper ───
c = c.replace(
  `              <div className="ios-card p-10 glass-card !rounded-[3rem] shadow-2xl space-y-10">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black tracking-tight">Checkout</h2>
                  <p className="text-ios-gray font-medium">Inserisci i dati per la spedizione</p>
                </div>`,
  `              <div className="ios-card p-5 sm:p-10 space-y-6 sm:space-y-8">
                <div className="page-hero">
                  <h2>Checkout</h2>
                  <p>Inserisci i dati per la spedizione</p>
                </div>`
);
c = c.replace(
  `<div className="flex items-center gap-6 p-6 bg-ios-secondary/30 rounded-[2rem] border border-black/[0.03]">`,
  `<div className="flex items-center gap-4 p-4 sm:p-6 bg-ios-secondary rounded-2xl">`
);
c = c.replace(
  `<button type="submit" className="w-full ios-btn-primary !py-5 sm:!py-6 text-lg sm:text-xl !rounded-xl sm:!rounded-[1.5rem] shadow-xl">`,
  `<button type="submit" className="ios-btn-primary w-full text-base sm:text-lg">`
);
c = c.replace(
  `<button type="button" onClick={() => requireAuth('dashboard')} className="w-full py-4 text-ios-gray font-bold hover:text-ios-label transition-colors">`,
  `<button type="button" onClick={() => requireAuth('dashboard')} className="w-full py-3 text-ios-gray text-sm font-bold hover:text-ios-label transition-colors">`
);

// ─── 14. DASHBOARD - header ───
c = c.replace(
  `              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">La tua Dashboard</h2>
                  <p className="text-ios-gray text-base sm:text-lg font-medium">Gestisci le tue attività e i tuoi match intelligenti.</p>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
                  {!notificationsEnabled && (
                    <button 
                      onClick={handleEnableNotifications}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 sm:py-4 bg-ios-blue/10 text-ios-blue font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 hover:bg-ios-blue/20 transition-all active:scale-95 shadow-lg shadow-ios-blue/5"
                    >
                      <Bell size={16} />
                      Attiva Notifiche
                    </button>
                  )}
                </div>
              </div>`,
  `              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-display font-black">Dashboard</h2>
                {!notificationsEnabled && (
                  <button onClick={handleEnableNotifications} className="flex items-center gap-2 px-4 py-2.5 bg-ios-blue/10 text-ios-blue font-bold rounded-xl text-xs sm:text-sm hover:bg-ios-blue/20 transition-all active:scale-95">
                    <Bell size={14} /> Attiva Notifiche
                  </button>
                )}
              </div>`
);

// ─── 15. STATS GRID cards ───
c = c.replace(
  `              {/* Bento Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <motion.div whileHover={{ y: -5 }} className="ios-card p-6 sm:p-8 bg-ios-blue text-white space-y-4 sm:space-y-6 shadow-2xl shadow-ios-blue/20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">In Vendita</p>
                    <p className="text-3xl sm:text-5xl font-display font-black tracking-tighter">{items.length}</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="ios-card p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ios-blue/10 text-ios-blue rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Search size={20} />
                  </div>
                  <div>
                    <p className="text-ios-gray text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Ricerche</p>
                    <p className="text-3xl sm:text-5xl font-display font-black tracking-tighter">{userRequests.length}</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="ios-card p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 text-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="text-ios-gray text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Match</p>
                    <p className="text-3xl sm:text-5xl font-display font-black tracking-tighter">{proposals.length}</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="ios-card p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 text-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Heart size={20} />
                  </div>
                  <div>
                    <p className="text-ios-gray text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Salvati</p>
                    <p className="text-3xl sm:text-5xl font-display font-black tracking-tighter">{favorites.length}</p>
                  </div>
                </motion.div>
              </div>`,
  `              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'In Vendita', value: items.length, icon: <Package size={18} />, color: 'bg-brand-end/10 text-brand-end' },
                  { label: 'Ricerche', value: userRequests.length, icon: <Search size={18} />, color: 'bg-ios-blue/10 text-ios-blue' },
                  { label: 'Match', value: proposals.length, icon: <Bell size={18} />, color: 'bg-green-500/10 text-green-600' },
                  { label: 'Salvati', value: favorites.length, icon: <Heart size={18} />, color: 'bg-red-500/10 text-red-500' },
                ].map(s => (
                  <motion.div key={s.label} whileHover={{ y: -2 }} className="ios-card p-4 sm:p-6 space-y-3">
                    <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${s.color}\`}>{s.icon}</div>
                    <div>
                      <p className="text-ios-gray text-[10px] font-black uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl sm:text-3xl font-display font-black">{s.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>`
);

// ─── 16. DASHBOARD - Match title ───
c = c.replace(
  `                  <h3 className="text-xl">Match Suggeriti</h3>`,
  `                  <h3 className="rm-section-title">Match Suggeriti</h3>`
);
c = c.replace(
  `                  <h3 className="text-xl">Oggetti Salvati</h3>`,
  `                  <h3 className="rm-section-title">Oggetti Salvati</h3>`
);
c = c.replace(
  `                  <h3 className="text-xl">Le mie Ricerche</h3>`,
  `                  <h3 className="rm-section-title">Le mie Ricerche</h3>`
);
c = c.replace(
  `                  <h3 className="text-2xl font-black">Le mie Vendite & Acquisti</h3>`,
  `                  <h3 className="rm-section-title">Vendite & Acquisti</h3>`
);

// ─── 17. DASHBOARD right column cards ───
c = c.replace(
  `                  <div className="ios-card p-8 bg-linear-to-br from-brand-start to-brand-end text-white space-y-8">
                    <h3 className="text-xl">Le tue Statistiche</h3>`,
  `                  <div className="stat-card-brand space-y-5">
                    <h3 className="rm-section-title !text-white">Le tue Statistiche</h3>`
);
c = c.replace(
  `                  <div className="ios-card p-8 space-y-6">
                    <h3 className="text-xl">Come funziona</h3>`,
  `                  <div className="ios-card p-5 sm:p-6 space-y-5">
                    <h3 className="rm-section-title">Come funziona</h3>`
);

// ─── 18. SELL form space ───
c = c.replace(
  `              <form onSubmit={handleSell} className="space-y-8 sm:space-y-10">`,
  `              <form onSubmit={handleSell} className="space-y-5 sm:space-y-6">`
);
c = c.replace(
  `                <form onSubmit={handleBuy} className="space-y-8 sm:space-y-10">`,
  `                <form onSubmit={handleBuy} className="space-y-5 sm:space-y-6">`
);

// ─── 19. sell form grid ───
c = c.replace(
  `                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">`,
  `                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">`
);

// ─── 20. sell select dropdown ───
c = c.replace(
  `                          className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30 appearance-none cursor-pointer"`,
  `                          className="rm-input-lg appearance-none cursor-pointer w-full"`
);

fs.writeFileSync(path, c);
console.log('Big UI patch done!');
