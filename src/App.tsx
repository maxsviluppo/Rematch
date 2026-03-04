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
import { Item, Request, Proposal } from './types';
import { notificationService } from './services/NotificationService';

const USER_ID = "user_123"; // Mock user ID for demo

const CATEGORIES = ['Tutte', 'Elettronica', 'Abbigliamento', 'Casa', 'Sport', 'Libri', 'Altro'];

export default function App() {
  const [view, setView] = useState<'home' | 'sell' | 'buy' | 'dashboard'>('home');
  const [items, setItems] = useState<Item[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [topSearches, setTopSearches] = useState<{query: string, count: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutte');

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
    fetchData();
    notificationService.init(USER_ID);
    
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    return () => {
      notificationService.disconnect();
    };
  }, [view, searchQuery, selectedCategory]);

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
      await fetch('/api/match', { method: 'POST' });
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
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory !== 'Tutte') params.append('category', selectedCategory);
      
      const itemsRes = await fetch(`/api/items?${params.toString()}`);
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      const propRes = await fetch(`/api/proposals/${USER_ID}`);
      const propData = await propRes.json();
      setProposals(propData);

      const topRes = await fetch('/api/stats/top-searches');
      const topData = await topRes.json();
      setTopSearches(topData);

      const favRes = await fetch(`/api/favorites/${USER_ID}`);
      const favData = await favRes.json();
      setFavorites(favData);

      const reqRes = await fetch(`/api/requests/${USER_ID}`);
      const reqData = await reqRes.json();
      setUserRequests(reqData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
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
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, seller_id: USER_ID, price: parseFloat(newItem.price) })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante il salvataggio dell'annuncio");
      }

      // Trigger matching for demo
      await fetch('/api/match', { method: 'POST' });
      
      alert("Annuncio pubblicato con successo!");
      setView('dashboard');
      setNewItem({ title: '', description: '', price: '', location: '', category: 'Altro', image_url: 'https://picsum.photos/seed/item/400/300' });
      setImagePreview(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Errore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newRequest, 
          buyer_id: USER_ID, 
          min_price: parseFloat(newRequest.min_price), 
          max_price: parseFloat(newRequest.max_price) 
        })
      });
      // Trigger matching for demo
      await fetch('/api/match', { method: 'POST' });
      setView('dashboard');
      setNewRequest({ query: '', min_price: '', max_price: '', location: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const respondToProposal = async (id: number, status: 'accepted' | 'rejected') => {
    try {
      await fetch(`/api/proposals/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (itemId: number) => {
    const isFav = favorites.some(f => f.id === itemId);
    try {
      if (isFav) {
        await fetch(`/api/favorites/${USER_ID}/${itemId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: USER_ID, itemId })
        });
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRequest = async (id: number) => {
    try {
      await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const saveCurrentSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          buyer_id: USER_ID, 
          query: searchQuery, 
          min_price: 0, 
          max_price: 0, 
          location: 'Ovunque' 
        })
      });
      await fetch('/api/match', { method: 'POST' });
      alert("Ricerca salvata! Ti avviseremo quando troveremo un match.");
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans pb-24 md:pb-0">
      {/* Top Header - iOS Style */}
      <nav className="sticky top-0 z-50 nav-gradient px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('home')}
          >
            <div className="w-8 h-8 bg-brand-start/20 rounded-lg flex items-center justify-center text-brand-start shadow-sm backdrop-blur-md">
              <Package size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-brand-start to-brand-end">ReMatch</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('home')} className={`px-3 py-1 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-lg active:scale-95 ${view === 'home' ? 'text-brand-end bg-brand-end/20' : 'text-white/70 hover:text-white'}`}>Marketplace</button>
            <button onClick={() => setView('dashboard')} className={`px-3 py-1 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-lg active:scale-95 ${view === 'dashboard' ? 'text-brand-end bg-brand-end/20' : 'text-white/70 hover:text-white'}`}>Dashboard</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-brand-start hover:text-brand-end transition-all">
              <Bell size={20} />
              {proposals.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-end rounded-full border-2 border-brand-start"></span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-start/20 flex items-center justify-center border border-brand-start/20 overflow-hidden cursor-pointer backdrop-blur-md">
              <User size={16} className="text-brand-start" />
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Bottom Tab Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="glass-card rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl">
          <button 
            onClick={() => setView('home')}
            className={`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 ${view === 'home' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}`}
          >
            <Home size={22} className={view === 'home' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button 
            onClick={() => setView('sell')}
            className={`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 ${view === 'sell' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}`}
          >
            <PlusCircle size={22} className={view === 'sell' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Vendi</span>
          </button>
          <button 
            onClick={() => setView('buy')}
            className={`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 ${view === 'buy' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}`}
          >
            <ShoppingBag size={22} className={view === 'buy' ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold mt-1">Compra</span>
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`flex-1 flex flex-col items-center py-3 rounded-[1.8rem] transition-all duration-500 ${view === 'dashboard' ? 'nav-item-active' : 'text-ios-gray hover:bg-black/5'}`}
          >
            <div className="relative">
              <LayoutDashboard size={22} className={view === 'dashboard' ? 'scale-110' : ''} />
              {proposals.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1">Dashboard</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
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
              {/* Hero Section */}
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
                      onClick={() => setView('sell')}
                      className="ios-btn-primary group !px-6 sm:!px-10 !py-4 sm:!py-5 text-base sm:text-lg w-full sm:w-auto"
                    >
                      Inizia a Vendere
                      <ArrowRight size={20} className="inline ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>
                    <button 
                      onClick={() => setView('buy')}
                      className="px-6 py-4 sm:px-10 sm:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl font-black text-base sm:text-lg hover:bg-white/20 transition-all active:scale-95 shadow-2xl w-full sm:w-auto"
                    >
                      Cerca Oggetti
                    </button>
                  </div>
                </div>
              </section>
                
                {/* Search & Categories */}
                <div className="ios-card p-4 sm:p-8 glass-card !rounded-[2rem] sm:!rounded-[3rem] shadow-2xl">
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
                    <div className="flex-1 relative group">
                      <Search className="absolute left-5 sm:left-7 top-1/2 -translate-y-1/2 text-ios-gray group-focus-within:text-ios-blue transition-colors duration-300" size={20} />
                      <input 
                        type="text" 
                        placeholder="Cosa stai cercando oggi?"
                        className="w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-5 bg-ios-secondary/50 rounded-2xl sm:rounded-3xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-base sm:text-xl font-bold placeholder:text-ios-gray/40"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <button 
                        onClick={() => fetchData()}
                        className="ios-btn-primary flex-1 md:flex-none !px-8 sm:!px-12 !rounded-2xl sm:!rounded-3xl shadow-2xl"
                      >
                        Cerca
                      </button>
                      {searchQuery && (
                        <button 
                          onClick={saveCurrentSearch}
                          className="p-4 sm:p-5 bg-ios-blue/10 text-ios-blue rounded-2xl sm:rounded-3xl hover:bg-ios-blue/20 transition-all active:scale-90 shadow-lg"
                          title="Salva questa ricerca"
                        >
                          <Bell size={24} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto py-4 sm:py-6 no-scrollbar">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-500 ${
                          selectedCategory === cat 
                            ? 'bg-ios-label text-white shadow-2xl scale-105' 
                            : 'bg-ios-secondary text-ios-gray hover:bg-ios-gray/10 hover:scale-105'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ios-card p-8 space-y-4 ios-card-hover group">
                  <div className="w-14 h-14 bg-ios-blue/10 text-ios-blue rounded-[1.5rem] flex items-center justify-center group-hover:bg-ios-blue group-hover:text-white transition-colors duration-500">
                    <TrendingUp size={28} />
                  </div>
                  <h3 className="text-2xl">Smart Matching</h3>
                  <p className="text-ios-gray text-sm leading-relaxed">Algoritmo avanzato che connette venditori e acquirenti in base all'intento reale.</p>
                </div>
                
                <div className="ios-card p-8 space-y-4 bg-ios-blue text-white ios-card-hover shadow-2xl shadow-ios-blue/20">
                  <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center">
                    <Clock size={28} />
                  </div>
                  <h3 className="text-2xl">Esclusività 24h</h3>
                  <p className="text-white/80 text-sm leading-relaxed">I match sono esclusivi per 24 ore, dando priorità a chi cerca davvero l'oggetto.</p>
                </div>
                
                <div className="ios-card p-8 space-y-4 ios-card-hover group">
                  <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-[1.5rem] flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors duration-500">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-2xl">Affari Verificati</h3>
                  <p className="text-ios-gray text-sm leading-relaxed">Gestiamo l'intera transazione, dal pagamento sicuro alla spedizione finale.</p>
                </div>
              </section>

              {/* Live Marketplace */}
              <section className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className="text-2xl">Marketplace Live</h2>
                    <p className="text-ios-gray text-sm">Scopri gli ultimi scambi in tempo reale.</p>
                  </div>
                  <button className="text-ios-blue text-sm font-semibold flex items-center gap-1 hover:translate-x-1 transition-transform duration-200">
                    Vedi tutto <ChevronRight size={16} />
                  </button>
                </div>
                
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item) => {
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
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-xl transition-all duration-300 shadow-lg ${isFav ? 'bg-red-500 text-white scale-110' : 'bg-white/70 text-ios-gray hover:text-red-500 hover:scale-110'}`}
                            >
                              <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                            </button>
                            
                            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-sm font-bold text-ios-label shadow-xl">
                              €{item.price}
                            </div>
                          </div>
                          <div className="p-5 space-y-3">
                            <div className="space-y-1">
                              <span className="badge bg-ios-blue/10 text-ios-blue">{item.category}</span>
                              <h4 className="font-bold text-base truncate">{item.title}</h4>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-ios-gray text-xs font-medium">
                                <MapPin size={12} />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Simple mock message for demo
                                    fetch('/api/messages', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        sender_id: USER_ID,
                                        receiver_id: item.seller_id,
                                        item_id: item.id,
                                        content: `Ciao! Sono interessato a "${item.title}". È ancora disponibile?`
                                      })
                                    }).then(() => alert("Messaggio inviato!"));
                                  }}
                                  className="p-2 bg-ios-secondary rounded-full text-ios-gray hover:text-ios-blue transition-colors"
                                  title="Contatta Venditore"
                                >
                                  <MessageCircle size={14} />
                                </button>
                                <ArrowRight size={14} className="text-ios-gray opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </div>
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
              <div className="ios-card p-6 sm:p-16 glass-card !rounded-[2rem] sm:!rounded-[3.5rem] shadow-2xl space-y-8 sm:space-y-12">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ios-blue/10 text-ios-blue rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Package size={32} />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Vendi un Oggetto</h2>
                  <p className="text-ios-gray text-base sm:text-xl font-medium max-w-md mx-auto">Inserisci i dettagli del tuo oggetto e trova subito un acquirente interessato.</p>
                </div>
                
                <form onSubmit={handleSell} className="space-y-8 sm:space-y-10">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Foto dell'oggetto</label>
                    <div className="relative group">
                      {imagePreview ? (
                        <div className="relative aspect-video rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl">
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
                        <label className="w-full aspect-video bg-ios-secondary/50 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-4 border-dashed border-ios-gray/20 flex flex-col items-center justify-center gap-4 sm:gap-6 cursor-pointer hover:bg-ios-secondary transition-all group overflow-hidden">
                          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-ios-blue shadow-2xl group-hover:scale-110 transition-transform duration-500">
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
                    <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Titolo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="es. iPhone 15 Pro, Fotocamera..."
                      className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
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
                      className="w-full px-6 sm:px-10 py-5 sm:py-8 bg-ios-secondary/50 rounded-2xl sm:rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30 resize-none"
                      value={newItem.description}
                      onChange={e => setNewItem({...newItem, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Prezzo (€)</label>
                      <input 
                        required
                        type="number" 
                        placeholder="0.00"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newItem.price}
                        onChange={e => setNewItem({...newItem, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Luogo</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Città"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newItem.location}
                        onChange={e => setNewItem({...newItem, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full ios-btn-primary !py-5 sm:!py-8 text-xl sm:text-2xl !rounded-xl sm:!rounded-[2rem] shadow-2xl shadow-ios-blue/30"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="ios-card p-6 sm:p-16 glass-card !rounded-[2rem] sm:!rounded-[3.5rem] shadow-2xl space-y-8 sm:space-y-12">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ios-blue/10 text-ios-blue rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Search size={32} />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Cosa Cerchi?</h2>
                  <p className="text-ios-gray text-base sm:text-xl font-medium max-w-md mx-auto">Dicci cosa desideri e il nostro algoritmo troverà il match perfetto per te.</p>
                </div>
                
                <form onSubmit={handleBuy} className="space-y-8 sm:space-y-10">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Cosa desideri?</label>
                    <div className="relative group">
                      <Search className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 text-ios-gray group-focus-within:text-ios-blue transition-colors duration-300" size={20} />
                      <input 
                        required
                        type="text" 
                        placeholder="es. iPhone 15 Pro, Bici da corsa..."
                        className="w-full pl-14 sm:pl-20 pr-6 sm:pr-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newRequest.query}
                        onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-xs sm:text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">Budget Massimo (€)</label>
                      <input 
                        required
                        type="number" 
                        placeholder="Qualsiasi"
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
                        placeholder="Città o Ovunque"
                        className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-ios-secondary/50 rounded-xl sm:rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all text-lg sm:text-2xl font-bold placeholder:text-ios-gray/30"
                        value={newRequest.location}
                        onChange={e => setNewRequest({...newRequest, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full ios-btn-primary !py-5 sm:!py-8 text-xl sm:text-2xl !rounded-xl sm:!rounded-[2rem] shadow-2xl shadow-ios-blue/30"
                  >
                    {loading ? 'Analisi in corso...' : 'Trova il mio Match'}
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
                  <button 
                    onClick={handleManualMatch} 
                    disabled={loading}
                    className="flex-1 sm:flex-none ios-btn-primary !px-6 sm:!px-8 !py-3.5 sm:!py-4 text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 shadow-2xl"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Forza Match
                  </button>
                </div>
              </div>

              {/* Bento Stats Grid */}
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Matches */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl">Match Suggeriti</h3>
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
                                <div className="flex items-center gap-1.5 text-red-500">
                                  <Clock size={14} />
                                  <span>Scade tra 23h</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                              <button 
                                onClick={() => respondToProposal(prop.proposal_id, 'accepted')}
                                className="flex-1 ios-btn-primary py-3 text-sm shadow-none"
                              >
                                Accetta
                              </button>
                              <button 
                                onClick={() => respondToProposal(prop.proposal_id, 'rejected')}
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
                      <h3 className="text-xl">Oggetti Salvati</h3>
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
                      <h3 className="text-xl">Le mie Ricerche</h3>
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
                            <button 
                              onClick={() => deleteRequest(req.id)}
                              className="p-2 text-ios-gray hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats & Info */}
                <div className="space-y-6">
                  <div className="ios-card p-8 bg-linear-to-br from-brand-start to-brand-end text-white space-y-8">
                    <h3 className="text-xl">Le tue Statistiche</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Annunci</p>
                        <p className="text-4xl font-bold">{items.filter(i => i.seller_id === USER_ID).length}</p>
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

                  <div className="ios-card p-8 space-y-6">
                    <h3 className="text-xl">Come funziona</h3>
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

                  {/* Top Searches Ranking */}
                  <div className="ios-card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl">Top 20 Ricercati</h3>
                      <TrendingUp size={20} className="text-ios-blue" />
                    </div>
                    <div className="space-y-4">
                      {topSearches.length === 0 ? (
                        <p className="text-ios-gray text-xs">Nessun dato disponibile ancora.</p>
                      ) : (
                        topSearches.map((search, index) => (
                          <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${index < 3 ? 'bg-ios-blue text-white' : 'bg-ios-secondary text-ios-gray'}`}>
                                {index + 1}
                              </span>
                              <span className="text-sm font-bold capitalize group-hover:text-ios-blue transition-colors">{search.query}</span>
                            </div>
                            <span className="text-[10px] font-black text-ios-gray/40 uppercase tracking-widest">{search.count} {search.count === 1 ? 'Ricerca' : 'Ricerche'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
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
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-linear-to-br from-brand-start to-brand-end rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Package size={22} />
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-brand-start to-brand-end">ReMatch</span>
              </div>
              <p className="text-ios-gray text-lg max-w-sm leading-relaxed">
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
                <li><button onClick={() => setView('home')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Marketplace</button></li>
                <li><button onClick={() => setView('sell')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Vendi Oggetto</button></li>
                <li><button onClick={() => setView('buy')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Cerca Oggetto</button></li>
                <li><button onClick={() => setView('dashboard')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-medium">Dashboard</button></li>
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
