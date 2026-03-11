import fs from 'fs';
const appPath = 'src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  "const [view, setView] = useState<'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina'>('home');",
  `const [view, setView] = useState<'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth'>('home');
  const requireAuth = (targetView: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina') => {
    if (!session) {
      setView('auth');
    } else {
      setView(targetView);
    }
  };`
);

content = content.replace(
  `  if (!session) {
    return <Auth onLogin={(id, nome) => setCurrentUser({ id, nome })} />;
  }`,
  ``
);

content = content.replace(
  `            <button 
              onClick={() => {
                if (window.confirm("Sei sicuro di voler uscire?")) {
                  supabase.auth.signOut();
                }
              }}
              title="Esci da ReMatch"
              className="w-8 h-8 rounded-full bg-brand-end/20 flex items-center justify-center border border-brand-end/20 overflow-hidden cursor-pointer backdrop-blur-md hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 transition-all"
            >
              <User size={16} className="text-current" />
            </button>`,
  `            <button 
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
            </button>`
);

content = content.replace(
  `      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (`,
  `      <main className="max-w-5xl mx-auto px-6 py-8">
        {view === 'auth' && (
          <div className="pt-10">
            <Auth onLogin={(id, nome) => {
              setCurrentUser({ id, nome });
              setView('dashboard');
            }} />
          </div>
        )}
        <AnimatePresence mode="wait">
          {view === 'home' && (`
);

content = content.replace(/setView\('sell'\)/g, "requireAuth('sell')");
content = content.replace(/setView\('buy'\)/g, "requireAuth('buy')");
content = content.replace(/setView\('dashboard'\)/g, "requireAuth('dashboard')");
content = content.replace(/setView\('checkout'\)/g, "requireAuth('checkout')");

fs.writeFileSync(appPath, content);
console.log('App.tsx updated for auth rendering rules!');
