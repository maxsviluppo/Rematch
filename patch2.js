import fs from 'fs';
const appPath = 'src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add auto-refresh interval (every 60 seconds) in the useEffect
content = content.replace(
  `  useEffect(() => {
    if (currentUser) {
      fetchData();
      notificationService.init(currentUser.id);
    }
    
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    return () => {
      notificationService.disconnect();
    };
  }, [view, searchQuery, selectedCategories, currentUser]);`,
  `  useEffect(() => {
    let interval: any;
    if (currentUser) {
      fetchData();
      notificationService.init(currentUser.id);
      
      // Auto-refresh match ogni 60 secondi come richiesto
      interval = setInterval(() => {
        runMatching().then(() => fetchData());
      }, 60000);
    }
    
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    return () => {
      notificationService.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [view, searchQuery, selectedCategories, currentUser]);`
);

// 2. Remove "Forza Match" button
content = content.replace(
  `                  <button 
                    onClick={handleManualMatch} 
                    disabled={loading}
                    className="flex-1 sm:flex-none ios-btn-primary !px-6 sm:!px-8 !py-3.5 sm:!py-4 text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 shadow-2xl"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Forza Match
                  </button>`,
  ``
);

// 3. Fix fonts in "Compra" page
content = content.replace(
  `              <div className="ios-card p-10 sm:p-20 glass-card !rounded-[3rem] shadow-2xl space-y-12">
                <div className="space-y-4 text-center">
                  <div className="w-20 h-20 bg-brand-start/10 text-brand-start rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Search size={32} />
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-display font-black tracking-tight">Cerca un Oggetto</h2>
                  <p className="text-ios-gray text-xl font-medium">Dicci cosa cerchi e ti avviseremo appena appare.</p>
                </div>
                
                <form onSubmit={handleBuy} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Cosa cerchi?</label>
                    <input 
                      required
                      type="text" 
                      placeholder="es. MacBook Pro, Tavolo Legno..."
                      className="w-full px-10 py-6 bg-ios-secondary/50 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-2xl font-bold placeholder:text-ios-gray/30"
                      value={newRequest.query}
                      onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Prezzo Min (€)</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-full px-10 py-6 bg-ios-secondary/50 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newRequest.min_price}
                        onChange={e => setNewRequest({...newRequest, min_price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Prezzo Max (€)</label>
                      <input 
                        type="number" 
                        placeholder="Qualsiasi"
                        className="w-full px-10 py-6 bg-ios-secondary/50 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newRequest.max_price}
                        onChange={e => setNewRequest({...newRequest, max_price: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Dove?</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Città o 'Ovunque'"
                      className="w-full px-10 py-6 bg-ios-secondary/50 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-2xl font-bold placeholder:text-ios-gray/30"
                      value={newRequest.location}
                      onChange={e => setNewRequest({...newRequest, location: e.target.value})}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full ios-btn-primary !py-8 text-2xl !rounded-[2rem] shadow-2xl"
                  >
                    {loading ? 'Salvataggio...' : 'Crea Richiesta Match'}
                  </button>`,
  `              <div className="ios-card p-6 sm:p-16 glass-card !rounded-[2rem] sm:!rounded-[3.5rem] shadow-2xl space-y-8 sm:space-y-12">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-start/10 text-brand-start rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Search size={32} />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Cerca un Oggetto</h2>
                  <p className="text-ios-gray text-base sm:text-xl font-medium max-w-md mx-auto">Dicci cosa cerchi e ti avviseremo appena appare.</p>
                </div>
                
                <form onSubmit={handleBuy} className="space-y-8 sm:space-y-10">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Cosa cerchi?</label>
                    <input 
                      required
                      type="text" 
                      placeholder="es. MacBook Pro, Tavolo Legno..."
                      className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                      value={newRequest.query}
                      onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Oppure digita Prezzo Massimo (€)</label>
                      <input 
                        type="number" 
                        placeholder="Nessun limite"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newRequest.max_price}
                        onChange={e => setNewRequest({...newRequest, max_price: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Dove?</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Città o 'Ovunque'"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newRequest.location}
                        onChange={e => setNewRequest({...newRequest, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full ios-btn-primary !py-5 sm:!py-8 text-xl sm:text-2xl !rounded-xl sm:!rounded-[2rem] shadow-2xl shadow-brand-start/30"
                  >
                    {loading ? 'Salvataggio...' : (newRequest.query !== '' && topSearches && userRequests.find(r => r.query === newRequest.query) ? 'Aggiorna Ricerca Match' : 'Crea Ricerca Match')}
                  </button>`
);

// We need to give the ability to "edit" old requests on the buy page.
// We can add "Modifica" button next to "X" in "Le tue ricerche" lists (line 1450~)
content = content.replace(
  `                            <button 
                              onClick={() => deleteRequest(req.id)}
                              className="p-2 text-ios-gray hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}`,
  `                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setNewRequest({
                                    query: req.query,
                                    min_price: 0,
                                    max_price: req.max_price,
                                    location: req.location
                                  });
                                  deleteRequest(req.id); // Eliminate for rewrite
                                  setView('buy');
                                }}
                                className="p-2 text-ios-gray hover:text-ios-blue transition-colors"
                                title="Modifica questa ricerca"
                              >
                                <RefreshCw size={18} />
                              </button>
                              <button 
                                onClick={() => deleteRequest(req.id)}
                                className="p-2 text-ios-gray hover:text-red-500 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}`
);

fs.writeFileSync(appPath, content);
console.log('Done!');
