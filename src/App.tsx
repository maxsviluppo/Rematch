/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  ShoppingBag,
  User,
  Store,
  UserCheck,
  Bell,
  ChevronRight,
  TrendingUp,
  Tag,
  Home,
  LayoutDashboard,
  PlusCircle,
  Camera,
  ImagePlus,
  RefreshCw,
  X,
  Heart,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, Request, Proposal, Transaction } from './types';
import { notificationService } from './services/NotificationService';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';

// --- SUPABASE DATA FETCHING ---
// The current user ID will be dynamic


const CATEGORIES = ['Tutte', 'Elettronica', 'Abbigliamento', 'Casa', 'Sport', 'Libri', 'Altro'];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{id: string, nome: string} | null>(null);

  const [view, setView] = useState<'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth'>('home');
  const goTo = (v: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView(v);
  };
  const requireAuth = (targetView: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!session) { setView('auth'); } else { setView(targetView); }
  };
  const [items, setItems] = useState<Item[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topSearches, setTopSearches] = useState<{query: string, count: number}[]>([]);
  const [showAllTopSearches, setShowAllTopSearches] = useState(false);
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Tutte']);

  // Form states
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    category: 'Altro',
    image_url: 'https://picsum.photos/seed/item/400/300'
  });

  const [newRequest, setNewRequest] = useState({
    query: '',
    min_price: '',
    max_price: '',
    location: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('nome')
        .eq('id', userId)
        .single();
      
      setCurrentUser({
        id: userId,
        nome: data?.nome || 'Utente'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setCurrentUser({ id: userId, nome: 'Utente' });
    }
  };

  useEffect(() => {
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
  }, [view, searchQuery, selectedCategories, currentUser]);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      alert("Notifiche attivate con successo!");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setNewItem({ ...newItem, image_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setNewItem({ ...newItem, image_url: 'https://picsum.photos/seed/item/400/300' });
  };

  const handleManualMatch = async () => {
    setLoading(true);
    try {
      runMatching();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Items
      const { data: allItems, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      let filteredItems = allItems || [];
      if (searchQuery || (!selectedCategories.includes('Tutte') && selectedCategories.length > 0)) {
        filteredItems = filteredItems.filter(item => {
          const matchesSearch = !searchQuery || 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesCategory = selectedCategories.includes('Tutte') || 
                                 selectedCategories.length === 0 || 
                                 selectedCategories.includes(item.category);
                                 
          return matchesSearch && matchesCategory;
        });
      }
      setItems(filteredItems);

      // 2. Fetch User Requests & Proposals
      const { data: userReqs, error: reqsError } = await supabase
        .from('requests')
        .select('*')
        .eq('buyer_id', (currentUser?.id || ''))
        .eq('status', 'active');
      
      if (reqsError) throw reqsError;
      setUserRequests(userReqs || []);

      const { data: userProposals, error: propError } = await supabase
        .from('proposals')
        .select('*, items(*)')
        .eq('status', 'pending');

      if (propError) throw propError;
      
      // Filter proposals where the request belongs to (currentUser?.id || '')
      const filteredProposals = (userProposals || []).filter(p => {
        const req = userReqs?.find(r => r.id === p.request_id);
        return !!req;
      }).map(p => ({
        ...p.items,
        proposal_id: p.id,
        request_id: p.request_id,
        item_id: p.item_id,
        status: p.status,
        expires_at: p.expires_at
      }));
      setProposals(filteredProposals);

      // 3. Top Searches (This could be optimized with a view or separate state)
      const { data: allReqs } = await supabase.from('requests').select('query, status').eq('status', 'active');
      const searchCounts: Record<string, number> = {};
      (allReqs || []).forEach(r => {
        const q = r.query?.toLowerCase().trim();
        if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
      });
      const top = Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 100);
      setTopSearches(top);

      // 4. Favorites (Restored)
      const { data: favs, error: favError } = await supabase
        .from('favorites')
        .select('item_id, items(*)')
        .eq('user_id', (currentUser?.id || ''));
      
      if (favError) throw favError;
      setFavorites((favs || []).map(f => f.items));

      // 5. Fetch Transactions (from Express API)
      const resTrans = await fetch(`/api/transactions/${(currentUser?.id || '')}`);
      const trans = await resTrans.json();
      setTransactions(trans || []);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const runMatching = async () => {
    // This is a client-side implementation of matchmaking for demo
    // In production, this should be a database function or recurring job
    try {
      const { data: requests } = await supabase.from('requests').select('*').eq('status', 'active');
      const { data: items } = await supabase.from('items').select('*').eq('status', 'available');
      const { data: existingProposals } = await supabase.from('proposals').select('*');

      if (!requests || !items) return 0;

      let matchesCreated = 0;
      for (const req of requests) {
        for (const item of items) {
          const query = req.query.toLowerCase();
          const title = item.title.toLowerCase();
          const desc = item.description.toLowerCase();

          if (title.includes(query) || desc.includes(query)) {
            if ((req.min_price === 0 || item.price >= req.min_price) &&
                (req.max_price === 0 || item.price <= req.max_price)) {
              
              const exists = existingProposals?.find((p: any) => p.request_id === req.id && p.item_id === item.id);
              if (!exists) {
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);
                
                await supabase.from('proposals').insert({
                  request_id: req.id,
                  item_id: item.id,
                  status: 'pending',
                  expires_at: expiresAt.toISOString()
                });
                matchesCreated++;
              }
            }
          }
        }
      }
      return matchesCreated;
    } catch (err) {
      console.error("Match error:", err);
      return 0;
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.price) {
      alert("Per favore inserisci almeno un titolo e un prezzo.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('items').insert({
        title: newItem.title,
        description: newItem.description,
        price: parseFloat(newItem.price),
        location: newItem.location,
        category: newItem.category,
        image_url: newItem.image_url,
        seller_id: (currentUser?.id || ''),
        status: 'available'
      });

      if (error) throw error;
      
      await runMatching();
      
      alert("Annuncio pubblicato con successo!");
      requireAuth('dashboard');
      setNewItem({ title: '', description: '', price: '', location: '', category: 'Altro', image_url: 'https://picsum.photos/seed/item/400/300' });
      setImagePreview(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'PGRST205') {
        alert("Errore: Tabella 'items' non trovata nel database. Assicurati che il server sia avviato o crea la tabella su Supabase.");
      } else {
        alert("Errore durante la pubblicazione: " + (err.message || "Errore sconosciuto"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('requests').insert({
        query: newRequest.query,
        min_price: parseFloat(newRequest.min_price) || 0,
        max_price: parseFloat(newRequest.max_price) || 0,
        location: newRequest.location,
        buyer_id: (currentUser?.id || ''),
        status: 'active'
      });

      if (error) throw error;
      
      await runMatching();
      requireAuth('dashboard');
      setNewRequest({ query: '', min_price: '', max_price: '', location: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const respondToProposal = async (proposal: Proposal, status: 'accepted' | 'rejected') => {
    if (status === 'rejected') {
      try {
        await supabase.from('proposals').update({ status: 'rejected' }).eq('id', proposal.proposal_id);
        fetchData();
      } catch (err) {
        console.error("Error rejecting proposal:", err);
      }
      return;
    }

    // If accepted, move to checkout
    setActiveProposal(proposal);
    requireAuth('checkout');
  };

  const toggleFavorite = async (itemId: number) => {
    try {
      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', (currentUser?.id || ''))
        .eq('item_id', itemId)
        .single();
      
      if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
      } else {
        await supabase.from('favorites').insert({ user_id: (currentUser?.id || ''), item_id: itemId });
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRequest = async (id: number) => {
    try {
      await supabase.from('requests').delete().eq('id', id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async (shippingDetails: any) => {
    if (!activeProposal) return;
    setLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: activeProposal.proposal_id,
          buyer_id: (currentUser?.id || ''),
          seller_id: activeProposal.seller_id,
          item_id: activeProposal.item_id,
          shipping_details: shippingDetails
        })
      });

      if (response.ok) {
        alert("Ordine effettuato con successo!");
        requireAuth('dashboard');
        fetchData();
      } else {
        const err = await response.json();
        alert("Errore durante il checkout: " + err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (transactionId: number, trackingInfo: { tracking_id: string, courier: string, seller_iban: string }) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingInfo)
      });
      if (response.ok) {
        alert("Spedizione confermata!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmArrival = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/confirm-arrival`, {
        method: 'POST'
      });
      if (response.ok) {
        alert("Ricezione confermata! Transazione completata.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveCurrentSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      await supabase.from('requests').insert({
        buyer_id: (currentUser?.id || ''),
        query: searchQuery,
        min_price: 0,
        max_price: 0,
        location: 'Ovunque',
        status: 'active'
      });
      await runMatching();
      alert("Ricerca salvata! Ti avviseremo quando troveremo un match.");
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen font-sans pb-28 md:pb-0">
      {/* Top Header */}
      <nav className="sticky top-0 z-50 nav-gradient px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer h-10" onClick={() => goTo('home')}>
            <img src="/logo.png" alt="ReMatch Logo" className="h-full w-auto object-contain hover:opacity-80 transition-opacity" />
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {(['home','vetrina'] as const).map(v => (
              <button key={v} onClick={() => goTo(v)} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 capitalize ${view === v ? 'text-brand-end bg-brand-end/15' : 'text-white/60 hover:text-white hover:bg-white/8'}`}>{v}</button>
            ))}
            <button onClick={() => requireAuth('dashboard')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 ${view === 'dashboard' ? 'text-brand-end bg-brand-end/15' : 'text-white/60 hover:text-white hover:bg-white/8'}`}>Dashboard</button>
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
              className={`w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer transition-all ${
                session ? "bg-brand-end text-white border-transparent shadow-[0_2px_10px_rgba(255,122,0,0.3)] hover:scale-105 active:scale-95"
                        : "bg-white/10 border-white/15 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {session ? <UserCheck size={18} /> : <User size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm md:hidden">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.06]">
          {([
            { v: 'home', icon: <Home size={20} />, label: 'Home', fn: () => goTo('home') },
            { v: 'sell', icon: <PlusCircle size={20} />, label: 'Vendi', fn: () => requireAuth('sell') },
            { v: 'buy', icon: <Search size={20} />, label: 'Cerca', fn: () => requireAuth('buy') },
            { v: 'vetrina', icon: <Store size={20} />, label: 'Vetrina', fn: () => goTo('vetrina') },
            { v: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', fn: () => requireAuth('dashboard'), dot: proposals.length > 0 },
          ] as { v: string; icon: React.ReactNode; label: string; fn: () => void; dot?: boolean }[]).map(tab => (
            <button
              key={tab.v}
              onClick={tab.fn}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-[1.5rem] transition-all duration-300 ${view === tab.v ? 'nav-item-active' : 'text-ios-gray hover:bg-black/4'}`}
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
            { v: 'buy', label: 'Cerca', fn: () => requireAuth('buy') },
            { v: 'vetrina', label: 'Vetrina', fn: () => goTo('vetrina') },
            { v: 'dashboard', label: 'Dashboard', fn: () => requireAuth('dashboard') },
          ] as { v: string; label: string; fn: () => void }[]).map(tab => (
            <button
              key={tab.v}
              onClick={tab.fn}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 ${view === tab.v ? 'nav-item-active' : 'text-ios-gray hover:text-ios-label hover:bg-black/4'}`}
            >{tab.label}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {view === 'auth' && (
          <div className="pt-10">
            <Auth onLogin={(id, nome) => {
              setCurrentUser({ id, nome });
              requireAuth('dashboard');
            }} />
          </div>
        )}
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              {/* Hero */}
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
              </section>

              {/* Top Searches */}
              <section className="ios-card p-5 sm:p-8 space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="rm-section-title">🔥 Più Cercati</h3>
                    <p className="text-ios-gray text-xs mt-0.5">Tendenze live della community</p>
                  </div>
                  <TrendingUp size={22} className="text-brand-end" />
                </div>
                
                <div className="flex flex-wrap gap-3 sm:gap-4 overflow-hidden">
                  {topSearches.length === 0 ? (
                    <p className="text-ios-gray text-sm italic">Nessun dato disponibile ancora.</p>
                  ) : (
                    <>
                      {/* Always show the first 10 */}
                      {topSearches.slice(0, 10).map((search, index) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={`top-${index}`} 
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-ios-secondary rounded-xl border border-black/[0.04] group hover:bg-ios-label hover:text-white transition-all duration-200 cursor-default"
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${index < 3 ? 'bg-brand-end text-white' : 'bg-ios-label/10 text-ios-label group-hover:bg-white/20 group-hover:text-white'}`}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold capitalize">{search.query}</span>
                          <span className="px-2 py-0.5 bg-black/5 rounded-md text-[9px] font-black group-hover:bg-white/10">{search.count}</span>
                        </motion.div>
                      ))}

                      {/* Animated expansion for the rest */}
                      <AnimatePresence>
                        {showAllTopSearches && topSearches.slice(10, 100).map((search, index) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, height: 0, scale: 0.9 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.9 }}
                            key={`extra-${index}`} 
                            className="flex items-center gap-2.5 px-4 py-2.5 bg-ios-secondary rounded-xl border border-black/[0.04] group hover:bg-ios-label hover:text-white transition-all duration-200 cursor-default"
                          >
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-ios-label/10 text-ios-label group-hover:bg-white/20 group-hover:text-white">
                              {index + 11}
                            </span>
                            <span className="text-sm font-bold capitalize">{search.query}</span>
                            <span className="px-2 py-0.5 bg-black/5 rounded-md text-[9px] font-black group-hover:bg-white/10">{search.count}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                {topSearches.length > 10 && (
                  <div className="pt-8 text-center">
                    <button 
                      onClick={() => setShowAllTopSearches(!showAllTopSearches)}
                      className="inline-flex items-center gap-3 px-8 py-3 bg-white border border-black/[0.05] rounded-full text-ios-blue font-black text-sm hover:shadow-lg active:scale-95 transition-all group"
                    >
                      {showAllTopSearches ? 'Chiudi classifica' : 'Mostra classifica completa (100)'}
                      <ChevronRight 
                        size={18} 
                        className={`transition-transform duration-500 ${showAllTopSearches ? '-rotate-90' : 'rotate-90'}`} 
                      />
                    </button>
                  </div>
                )}
              </section>
                
              {/* Search */}
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
              </div>

              {/* Vetrina Anteprima */}
              <section className="space-y-5 sm:space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="rm-section-title">Vetrina Live</h2>
                    <p className="text-ios-gray text-xs mt-0.5">Gli ultimi oggetti nella community</p>
                  </div>
                  <button onClick={() => goTo('vetrina')} className="text-brand-end text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Vedi tutto <ChevronRight size={15} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
                            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-xl shadow-md transition-colors ${isFav ? 'bg-red-500 text-white' : 'bg-white/80 text-ios-gray hover:text-red-500'}`}
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
                </div>
              </section>
            </motion.div>
          )}

          {view === 'sell' && (
            <motion.div 
              key="sell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="ios-card p-5 sm:p-10 space-y-6 sm:space-y-8">
                <div className="page-hero">
                  <div className="page-hero-icon"><Package size={24} /></div>
                  <h2>Vendi un Oggetto</h2>
                  <p>Inserisci i dettagli e trova subito un acquirente.</p>
                </div>
                
                <form onSubmit={handleSell} className="space-y-5 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="rm-label">Foto dell'oggetto</label>
                    <div className="relative group">
                      {imagePreview ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={removeImage}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 bg-black/50 backdrop-blur-xl text-white rounded-xl sm:rounded-2xl hover:bg-black/70 transition-all"
                          >
                            <RefreshCw size={20} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full aspect-video bg-ios-secondary rounded-2xl border-2 border-dashed border-ios-gray/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-ios-secondary/80 transition-all group overflow-hidden">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-end shadow-md group-hover:scale-105 transition-transform duration-300">
                            <Camera size={28} />
                          </div>
                          <div className="text-center">
                            <p className="text-lg sm:text-2xl font-black">Carica una foto</p>
                            <p className="text-ios-gray text-xs sm:text-base font-medium">Trascina o clicca per selezionare</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="rm-label">Titolo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="es. iPhone 15 Pro, Fotocamera..."
                      className="rm-input-lg"
                      value={newItem.title}
                      onChange={e => setNewItem({...newItem, title: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Descrizione</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Condizioni, accessori, dettagli..."
                      className="rm-input-lg resize-none"
                      value={newItem.description}
                      onChange={e => setNewItem({...newItem, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">Prezzo (€)</label>
                      <input 
                        required
                        type="number" 
                        placeholder="0.00"
                        className="rm-input-lg"
                        value={newItem.price}
                        onChange={e => setNewItem({...newItem, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">Luogo</label>
                      <div className="relative">
                        <select 
                          required
                          className="rm-input-lg appearance-none cursor-pointer w-full"
                          value={newItem.location}
                          onChange={e => setNewItem({...newItem, location: e.target.value})}
                        >
                          <option value="" disabled>Seleziona città...</option>
                          <option value="Ovunque">Ovunque</option>
                          <option value="Roma">Roma</option>
                          <option value="Milano">Milano</option>
                          <option value="Napoli">Napoli</option>
                          <option value="Torino">Torino</option>
                          <option value="Palermo">Palermo</option>
                          <option value="Genova">Genova</option>
                          <option value="Bologna">Bologna</option>
                          <option value="Firenze">Firenze</option>
                          <option value="Bari">Bari</option>
                          <option value="Catania">Catania</option>
                          <option value="Venezia">Venezia</option>
                          <option value="Verona">Verona</option>
                        </select>
                        <div className="absolute inset-y-0 right-6 sm:right-10 flex items-center pointer-events-none text-ios-gray">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="ios-btn-primary w-full text-lg"
                  >
                    {loading ? 'Pubblicazione...' : 'Metti in Vendita'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'buy' && (
            <motion.div 
              key="buy"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="ios-card p-5 sm:p-10 space-y-6 sm:space-y-8">
                <div className="page-hero">
                  <div className="page-hero-icon"><Search size={24} /></div>
                  <h2>Cerca un Oggetto</h2>
                  <p>Dicci cosa cerchi e ti avviseremo appena appare.</p>
                </div>
                
                <form onSubmit={handleBuy} className="space-y-5 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="rm-label">Cosa cerchi?</label>
                    <input 
                      required
                      type="text" 
                      placeholder="es. MacBook Pro, Tavolo Legno..."
                      className="rm-input-lg"
                      value={newRequest.query}
                      onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">Oppure digita Prezzo Massimo (€)</label>
                      <input 
                        type="number" 
                        placeholder="Nessun limite"
                        className="rm-input-lg"
                        value={newRequest.max_price}
                        onChange={e => setNewRequest({...newRequest, max_price: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">Dove?</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Città o 'Ovunque'"
                        className="rm-input-lg"
                        value={newRequest.location}
                        onChange={e => setNewRequest({...newRequest, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="ios-btn-primary w-full text-lg"
                  >
                    {loading ? 'Salvataggio...' : (newRequest.query !== '' && topSearches && userRequests.find(r => r.query === newRequest.query) ? 'Aggiorna Ricerca Match' : 'Crea Ricerca Match')}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'checkout' && activeProposal && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto"
            >
              <div className="ios-card p-5 sm:p-10 space-y-6 sm:space-y-8">
                <div className="page-hero">
                  <h2>Checkout</h2>
                  <p>Inserisci i dati per la spedizione</p>
                </div>

                <div className="flex items-center gap-4 p-4 sm:p-6 bg-ios-secondary rounded-2xl">
                  <img src={activeProposal.image_url} className="w-20 h-20 rounded-2xl object-cover shadow-lg" alt="" />
                  <div>
                    <h4 className="font-black text-xl">{activeProposal.title}</h4>
                    <p className="text-brand-start font-black text-lg">{activeProposal.price}€</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  handleCheckout({
                    name: target.name.value,
                    surname: target.surname.value,
                    email: target.email.value,
                    phone: target.phone.value,
                    address: target.address.value,
                    city: target.city.value,
                    cap: target.cap.value
                  });
                }} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <input name="name" required placeholder="Nome" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                    <input name="surname" required placeholder="Cognome" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  </div>
                  <input name="email" type="email" required placeholder="Email" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  <input name="phone" required placeholder="Telefono" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  <input name="address" required placeholder="Indirizzo e numero civico" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <input name="city" required placeholder="Città" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                    <input name="cap" required placeholder="CAP" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  </div>
                  <button type="submit" className="ios-btn-primary w-full text-base sm:text-lg">
                    Paga e Conferma (Demo)
                  </button>
                  <button type="button" onClick={() => requireAuth('dashboard')} className="w-full py-3 text-ios-gray text-sm font-bold hover:text-ios-label transition-colors">
                    Annulla
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
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
              </div>

              {/* My Transactions Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="rm-section-title">Vendite & Acquisti</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-ios-secondary rounded-full text-[10px] font-bold text-ios-gray uppercase tracking-widest">Live Flow</span>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="ios-card p-12 text-center space-y-4 bg-ios-secondary/20 border-2 border-dashed border-black/[0.05]">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Clock size={24} className="text-ios-gray" />
                    </div>
                    <p className="text-ios-gray font-bold">Nessuna transazione attiva.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    {transactions.map(t => {
                      const isSeller = t.seller_id === (currentUser?.id || '');
                      const deadlineDate = new Date(t.shipping_deadline);
                      const now = new Date();
                      const diff = deadlineDate.getTime() - now.getTime();
                      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const isExpired = diff <= 0 && t.status === 'paid';

                      return (
                        <motion.div key={t.id} layout className="ios-card p-8 group relative overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all border border-black/[0.02]">
                          <div className="flex flex-col md:flex-row gap-8">
                            {/* Item Info */}
                            <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden shrink-0 shadow-md">
                              <img src={t.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>

                            <div className="flex-1 space-y-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isSeller ? 'bg-ios-blue text-white' : 'bg-brand-start text-white'}`}>
                                      {isSeller ? 'Vendita' : 'Acquisto'}
                                    </span>
                                    <span className="text-ios-gray font-bold text-xs">ID #{t.id}</span>
                                  </div>
                                  <h4 className="text-2xl font-black tracking-tight">{t.title}</h4>
                                  <p className="text-brand-start font-black text-xl">{t.price}€</p>
                                </div>

                                <div className="text-right">
                                  <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${
                                    t.status === 'paid' ? 'bg-orange-100 text-orange-600' : 
                                    t.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                                    t.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                    'bg-ios-secondary text-ios-gray'
                                  }`}>
                                    {t.status === 'paid' ? 'Da Spedire' : t.status === 'shipped' ? 'In Viaggio' : t.status === 'delivered' ? 'Consegnato' : t.status}
                                  </div>
                                </div>
                              </div>

                              {/* Dynamic Content based on Status and Role */}
                              <div className="p-6 bg-ios-secondary/30 rounded-3xl border border-black/[0.03] space-y-6">
                                {isSeller ? (
                                  <>
                                    {/* Seller Side */}
                                    {t.status === 'paid' && (
                                      <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-black/[0.05] shadow-sm">
                                          <div className="flex items-center gap-3">
                                            <Clock size={20} className={isExpired ? 'text-red-500' : 'text-orange-500'} />
                                            <span className="font-bold text-sm">Tempo Rimasto per Spedire:</span>
                                          </div>
                                          <span className={`font-black text-lg ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                            {isExpired ? 'SCADUTO' : `${daysLeft}g ${hoursLeft}h`}
                                          </span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                          <h5 className="text-xs font-black uppercase tracking-widest text-ios-gray">Indirizzo Spedizione</h5>
                                          <div className="text-sm font-bold leading-relaxed text-ios-label">
                                            {t.buyer_name} {t.buyer_surname}<br />
                                            {t.buyer_address}<br />
                                            {t.buyer_cap}, {t.buyer_city}<br />
                                            {t.buyer_email}
                                          </div>
                                          <p className="text-[10px] text-ios-gray italic font-medium">Nota: Il numero di telefono è gestito solo dalla piattaforma per privacy.</p>
                                        </div>

                                        <form onSubmit={(e) => {
                                          e.preventDefault();
                                          const target = e.target as any;
                                          handleShip(t.id, {
                                            tracking_id: target.tracking.value,
                                            courier: target.courier.value,
                                            seller_iban: target.iban.value
                                          });
                                        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <input name="tracking" required placeholder="Codice Tracking" className="checkout-input !py-3 !text-sm" />
                                          <input name="courier" required placeholder="Corriere (es. DHL, BRT)" className="checkout-input !py-3 !text-sm" />
                                          <input name="iban" required placeholder="Il tuo IBAN (per il pagamento)" className="checkout-input !py-3 !text-sm md:col-span-2" />
                                          <button type="submit" className="md:col-span-2 ios-btn-primary !py-4 !rounded-2xl shadow-xl">
                                            Conferma Spedizione & Blocca Timer
                                          </button>
                                        </form>
                                      </div>
                                    )}
                                    {t.status === 'shipped' && (
                                      <div className="space-y-2">
                                        <p className="font-bold">Spedito con {t.courier}</p>
                                        <p className="text-ios-gray text-sm">Tracking: <span className="font-black text-ios-label">{t.tracking_id}</span></p>
                                        <p className="text-xs text-orange-600 font-bold mt-4">In attesa che l'acquirente confermi la ricezione.</p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {/* Buyer Side */}
                                    {t.status === 'paid' && (
                                      <div className="flex items-center gap-4 text-orange-600">
                                        <Clock size={20} />
                                        <p className="font-bold">Il venditore sta preparando la spedizione (Scadenza tra {daysLeft}g)</p>
                                      </div>
                                    )}
                                    {t.status === 'shipped' && (
                                      <div className="space-y-6">
                                        <div className="space-y-2">
                                          <p className="font-bold">Oggetto in viaggio!</p>
                                          <p className="text-ios-gray text-sm">Corriere: <span className="text-ios-label font-bold">{t.courier}</span> | Tracking: <span className="text-ios-label font-bold">{t.tracking_id}</span></p>
                                        </div>
                                        <button 
                                          onClick={() => handleConfirmArrival(t.id)}
                                          className="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-green-600 transition-colors"
                                        >
                                          Ho ricevuto l'oggetto (Conferma)
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}

                                {t.status === 'delivered' && (
                                  <div className="flex items-center gap-4 text-green-600">
                                    <CheckCircle2 size={24} />
                                    <p className="font-black">Ordine Completato!</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'In Vendita', value: items.length, icon: <Package size={18} />, color: 'bg-brand-end/10 text-brand-end' },
                  { label: 'Ricerche', value: userRequests.length, icon: <Search size={18} />, color: 'bg-ios-blue/10 text-ios-blue' },
                  { label: 'Match', value: proposals.length, icon: <Bell size={18} />, color: 'bg-green-500/10 text-green-600' },
                  { label: 'Salvati', value: favorites.length, icon: <Heart size={18} />, color: 'bg-red-500/10 text-red-500' },
                ].map(s => (
                  <motion.div key={s.label} whileHover={{ y: -2 }} className="ios-card p-4 sm:p-6 space-y-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                    <div>
                      <p className="text-ios-gray text-[10px] font-black uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl sm:text-3xl font-display font-black">{s.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Matches */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="rm-section-title">Match Suggeriti</h3>
                    <span className="px-3 py-1 bg-ios-blue text-white text-[10px] font-bold rounded-full">
                      {proposals.length} Nuovi
                    </span>
                  </div>
                  
                  {proposals.length === 0 ? (
                    <div className="ios-card p-16 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                        <ShoppingBag size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold">Nessun match ancora</p>
                        <p className="text-ios-gray text-sm max-w-xs">Ti avviseremo appena troveremo l'oggetto perfetto per te.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map((prop) => (
                        <motion.div 
                          layout
                          key={prop.proposal_id} 
                          className="ios-card p-6 flex flex-col sm:flex-row gap-6 group"
                        >
                          <div className="w-full sm:w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 relative">
                            <img src={prop.image_url} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                            <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                              98% Match
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xl font-bold">{prop.title}</h4>
                                <p className="text-xl font-bold text-ios-blue">€{prop.price}</p>
                              </div>
                              <p className="text-ios-gray text-sm line-clamp-2 leading-relaxed">{prop.description}</p>
                              <div className="flex items-center gap-4 text-xs font-medium text-ios-gray">
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={14} />
                                  <span>{prop.location}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                              <button 
                                onClick={() => respondToProposal(prop, 'accepted')}
                                className="flex-1 ios-btn-primary py-3 text-sm shadow-none"
                              >
                                Accetta
                              </button>
                              <button 
                                onClick={() => respondToProposal(prop, 'rejected')}
                                className="px-6 py-3 bg-ios-secondary text-ios-gray font-semibold rounded-2xl text-sm hover:bg-ios-gray/10 hover:text-ios-label active:scale-95 transition-all"
                              >
                                Rifiuta
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Saved Items Section */}
                  <div className="pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">Oggetti Salvati</h3>
                      <span className="text-ios-gray text-xs font-medium">{favorites.length} oggetti</span>
                    </div>

                    {favorites.length === 0 ? (
                      <div className="ios-card p-12 border-2 border-dashed border-ios-gray/10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                          <Heart size={24} />
                        </div>
                        <p className="text-ios-gray text-sm">Non hai ancora salvato nessun oggetto.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {favorites.map((item) => (
                          <motion.div 
                            layout
                            key={item.id} 
                            className="ios-card group cursor-pointer relative"
                          >
                            <div className="aspect-square overflow-hidden relative">
                              <img 
                                src={item.image_url} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                              />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                              >
                                <Heart size={12} fill="currentColor" />
                              </button>
                            </div>
                            <div className="p-3">
                              <h4 className="font-bold text-xs truncate">{item.title}</h4>
                              <p className="text-ios-blue font-bold text-xs">€{item.price}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* My Searches Section */}
                  <div className="pt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">Le mie Ricerche</h3>
                      <span className="text-ios-gray text-xs font-medium">{userRequests.length} attive</span>
                    </div>

                    {userRequests.length === 0 ? (
                      <div className="ios-card p-12 border-2 border-dashed border-ios-gray/10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                          <Search size={24} />
                        </div>
                        <p className="text-ios-gray text-sm">Non hai ancora salvato nessuna ricerca.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userRequests.map((req) => (
                          <div key={req.id} className="ios-card p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-ios-blue/10 text-ios-blue rounded-full flex items-center justify-center">
                                <Search size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-sm">"{req.query}"</p>
                                <p className="text-[10px] text-ios-gray">
                                  {req.location} • {req.max_price > 0 ? `fino a €${req.max_price}` : 'Qualsiasi prezzo'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
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
                    )}
                  </div>
                </div>

                {/* Stats & Info */}
                <div className="space-y-6">
                  <div className="stat-card-brand space-y-5">
                    <h3 className="rm-section-title !text-white">Le tue Statistiche</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Annunci</p>
                        <p className="text-4xl font-bold">{items.filter(i => i.seller_id === (currentUser?.id || '')).length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Match</p>
                        <p className="text-4xl font-bold">{proposals.length}</p>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <TrendingUp size={18} />
                        <span>Top 5% Venditori</span>
                      </div>
                      <ChevronRight size={20} className="opacity-50" />
                    </div>
                  </div>

                  <div className="ios-card p-5 sm:p-6 space-y-5">
                    <h3 className="rm-section-title">Come funziona</h3>
                    <div className="space-y-6">
                      {[
                        { step: 1, text: "Colleghiamo il tuo intento con l'inventario live." },
                        { step: 2, text: "Controlla i match entro 24 ore." },
                        { step: 3, text: "Pagamento sicuro e consegna garantita." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-ios-blue/10 text-ios-blue flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {item.step}
                          </div>
                          <p className="text-xs text-ios-gray font-medium leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Removed duplicate Top Searches */}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'vetrina' && (
            <motion.div 
              key="vetrina"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl -mx-6 px-6 py-4 flex flex-col gap-4 border-b border-black/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black">Vetrina Annunci</h2>
                    <p className="text-ios-gray text-xs">Esplora tutti gli oggetti disponibili nella community.</p>
                  </div>
                  <button onClick={() => setView('home')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={28} />
                  </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        if (cat === 'Tutte') {
                          setSelectedCategories(['Tutte']);
                        } else {
                          const newCats = selectedCategories.includes(cat)
                            ? selectedCategories.filter(c => c !== cat)
                            : [...selectedCategories.filter(c => c !== 'Tutte'), cat];
                          setSelectedCategories(newCats.length === 0 ? ['Tutte'] : newCats);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border-2 ${
                        selectedCategories.includes(cat) 
                          ? 'bg-brand-end border-brand-end text-white shadow-lg' 
                          : 'bg-white border-black/[0.05] text-ios-gray hover:border-brand-end/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {items.length === 0 ? (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <ShoppingBag size={48} className="mx-auto text-ios-gray/20" />
                    <p className="text-ios-gray font-bold">Nessun oggetto trovato per questa selezione.</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const isFav = favorites.some(f => f.id === item.id);
                    return (
                      <motion.div 
                        layout
                        whileHover={{ y: -8 }}
                        key={item.id} 
                        className="ios-card ios-card-hover group cursor-pointer"
                      >
                        <div className="aspect-square overflow-hidden relative">
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-lg ${isFav ? 'bg-red-500 text-white' : 'bg-white/70 text-ios-gray'}`}
                          >
                            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                          </button>
                          <div className="absolute bottom-3 left-3 px-3 py-1 bg-brand-end text-white rounded-xl text-sm font-bold shadow-lg">
                            €{item.price}
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h4 className="font-bold text-sm truncate">{item.title}</h4>
                          <span className="flex items-center gap-1 text-[10px] text-ios-gray"><MapPin size={10} />{item.location}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-black/[0.05] py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center h-24">
                <img 
                  src="/logo.png" 
                  alt="ReMatch Logo" 
                  className="h-14 w-auto object-contain" 
                />
              </div>
              <p className="text-ios-gray text-lg max-w-sm leading-relaxed font-medium">
                Il marketplace intelligente che connette l'intento con l'inventario. Vendi più velocemente, compra meglio.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray hover:text-brand-end hover:scale-110 hover:shadow-md transition-all border border-black/[0.05]">
                    <span className="sr-only">{social}</span>
                    <div className="w-4 h-4 bg-current opacity-20 rounded-full"></div>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-ios-label">Piattaforma</h4>
              <ul className="space-y-3">
                <li><button onClick={() => setView('home')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Home</button></li>
                <li><button onClick={() => requireAuth('sell')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Vendi</button></li>
                <li><button onClick={() => requireAuth('buy')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Compra</button></li>
                <li><button onClick={() => requireAuth('dashboard')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Dashboard</button></li>
                <li><button onClick={() => setView('vetrina')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Vetrina</button></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-ios-label">Supporto</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Centro Aiuto</a></li>
                <li><a href="#" className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Sicurezza</a></li>
                <li><a href="#" className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Termini</a></li>
                <li><a href="#" className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-black/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-ios-gray text-xs font-semibold uppercase tracking-widest">© 2024 REMATCH. TUTTI I DIRITTI RISERVATI.</p>
            <div className="flex items-center gap-3 px-4 py-2 bg-ios-secondary rounded-full text-ios-gray text-[10px] font-bold uppercase tracking-wider border border-black/[0.05]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Sistemi Operativi
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
