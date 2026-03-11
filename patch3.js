import fs from 'fs';

let contentApp = fs.readFileSync('src/App.tsx', 'utf8');
let contentAuth = fs.readFileSync('src/components/Auth.tsx', 'utf8');


// ─── 1. Fix Auth Panel Styling (Make it light/glass instead of dark) ───
// We'll replace the JSX structure of Auth.tsx carefully.
contentAuth = contentAuth.replace(
  `        className="max-w-md w-full glass-card rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-white/20"
      >
        {/* Decorazioni di sfondo per il form per adattarsi alla palette */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-brand-start/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-brand-end/30 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center mb-8">
          <img src="/logo.png" alt="ReMatch Logo" className="h-[21px] w-auto inline-block mx-auto mb-6 scale-150 drop-shadow-lg" />
          <h2 className="text-2xl font-black font-display text-white mb-2">{isLogin ? 'Bentornato' : 'Crea Account'}</h2>
          <p className="text-white/60 text-sm font-medium">
            {isLogin ? 'Accedi per continuare su ReMatch' : 'Unisciti alla community'}
          </p>
        </div>`,
  `        className="max-w-md w-full ios-card p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <img src="/logo.png" alt="ReMatch" className="h-6 w-auto inline-block mx-auto mb-6 drop-shadow-sm" />
          <h2 className="text-3xl font-black font-display text-ios-label mb-2 tracking-tight">{isLogin ? 'Bentornato' : 'Crea Account'}</h2>
          <p className="text-ios-gray text-sm font-medium">
            {isLogin ? 'Accedi per continuare su ReMatch' : 'Unisciti alla community'}
          </p>
        </div>`
);

// Auth inputs replacements
contentAuth = contentAuth.replace(/text-white\/70/g, 'text-ios-gray');
contentAuth = contentAuth.replace(/text-white\/40/g, 'text-ios-gray/50');
contentAuth = contentAuth.replace(/w-full bg-white\/5 border border-white\/10 rounded-2xl py-3\.5 pl-12 pr-4 focus:outline-none focus:border-brand-end focus:ring-1 focus:ring-brand-end\/50 transition-all text-white placeholder-white\/30 backdrop-blur-md/g, 'w-full bg-ios-secondary/50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-end/30 focus:ring-2 focus:ring-brand-end/20 transition-all text-ios-label font-bold placeholder-ios-gray/40');

// Fix Auth login buttons text colors and shadows
contentAuth = contentAuth.replace(
  `            className="ios-btn-primary w-full shadow-lg shadow-brand-end/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />`,
  `            className="ios-btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />`
);

contentAuth = contentAuth.replace(
  `        <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 font-medium py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 backdrop-blur-md"
          >`,
  `        <div className="relative z-10 mt-6 pt-6 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="ios-btn-secondary w-full flex items-center justify-center gap-3 disabled:opacity-70"
          >`
);

contentAuth = contentAuth.replace(
  `        <p className="relative z-10 text-center mt-6 text-sm text-white/50">
          {isLogin ? "Non hai un account? " : "Hai già un account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-white hover:text-brand-end font-bold transition-colors cursor-pointer"
          >`,
  `        <p className="relative z-10 text-center mt-8 text-sm font-medium text-ios-gray">
          {isLogin ? "Non hai un account? " : "Hai già un account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-brand-end hover:text-brand-start font-bold transition-colors cursor-pointer"
          >`
);

// ─── 2. Edit App.tsx (Icons, ordering, and profile button) ───

// Add Store icon
contentApp = contentApp.replace(
  `  ShoppingBag,
  User,`,
  `  ShoppingBag,
  User,
  Store,
  UserCheck,`
);

// Desktop profile icon
contentApp = contentApp.replace(
  `            <button 
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
            </button>`,
  `            <button 
              onClick={() => {
                if (session) {
                  if (window.confirm("Sei sicuro di voler uscire?")) { supabase.auth.signOut(); }
                } else {
                  goTo('auth');
                }
              }}
              title={session ? "Esci" : "Accedi"}
              className={\`w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer transition-all \${
                session ? "bg-brand-end text-white border-transparent shadow-[0_2px_10px_rgba(255,122,0,0.3)] hover:scale-105 active:scale-95"
                        : "bg-white/10 border-white/15 text-white/70 hover:bg-white/20 hover:text-white"
              }\`}
            >
              {session ? <UserCheck size={18} /> : <User size={18} />}
            </button>`
);

// Bottom Mobile Nav order and icons: home, sell, buy(Cerca), vetrina(Store), dashboard(LayoutDashboard)
contentApp = contentApp.replace(
  `          {([
            { v: 'home', icon: <Home size={20} />, label: 'Home', fn: () => goTo('home') },
            { v: 'sell', icon: <PlusCircle size={20} />, label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', icon: <ShoppingBag size={20} />, label: 'Compra', fn: () => requireAuth('buy') },
            { v: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', fn: () => requireAuth('dashboard'), dot: proposals.length > 0 },
            { v: 'vetrina', icon: <ShoppingBag size={20} />, label: 'Vetrina', fn: () => goTo('vetrina') },
          ] as { v: string; icon: React.ReactNode; label: string; fn: () => void; dot?: boolean }[]).map(tab => (`,
  `          {([
            { v: 'home', icon: <Home size={20} />, label: 'Home', fn: () => goTo('home') },
            { v: 'sell', icon: <PlusCircle size={20} />, label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', icon: <Search size={20} />, label: 'Cerca', fn: () => requireAuth('buy') },
            { v: 'vetrina', icon: <Store size={20} />, label: 'Vetrina', fn: () => goTo('vetrina') },
            { v: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', fn: () => requireAuth('dashboard'), dot: proposals.length > 0 },
          ] as { v: string; icon: React.ReactNode; label: string; fn: () => void; dot?: boolean }[]).map(tab => (`
);

// Desktop Bottom Nav order and labels
contentApp = contentApp.replace(
  `          {([
            { v: 'home', label: 'Home', fn: () => goTo('home') },
            { v: 'sell', label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', label: 'Compra', fn: () => requireAuth('buy') },
            { v: 'dashboard', label: 'Dashboard', fn: () => requireAuth('dashboard') },
            { v: 'vetrina', label: 'Vetrina', fn: () => goTo('vetrina') },
          ] as { v: string; label: string; fn: () => void }[]).map(tab => (`,
  `          {([
            { v: 'home', label: 'Home', fn: () => goTo('home') },
            { v: 'sell', label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', label: 'Cerca', fn: () => requireAuth('buy') },
            { v: 'vetrina', label: 'Vetrina', fn: () => goTo('vetrina') },
            { v: 'dashboard', label: 'Dashboard', fn: () => requireAuth('dashboard') },
          ] as { v: string; label: string; fn: () => void }[]).map(tab => (`
);



fs.writeFileSync('src/App.tsx', contentApp);
fs.writeFileSync('src/components/Auth.tsx', contentAuth);
console.log('Done patching Auth styling and Nav order/icons!');
