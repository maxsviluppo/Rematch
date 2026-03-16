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
  Globe,
  Star,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Shield,
  HelpCircle,
  Lock,
  ExternalLink,
  Smartphone,
  Info,
  Share2,
  LogOut,
  Trash2,
  SlidersHorizontal,
  MessageCircle,
  Eye,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, Request, Proposal, Transaction } from './types';
import { notificationService } from './services/NotificationService';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import { translations, Language } from './translations';

// --- SUPABASE DATA FETCHING ---
// The current user ID will be dynamic


const CATEGORIES = [
  'Tutte', 
  'Elettronica', 
  'Informatica', 
  'Telefonia', 
  'Console & Videogiochi', 
  'Abbigliamento Donna', 
  'Abbigliamento Uomo', 
  'Accessori & Scarpe', 
  'Casa & Arredamento', 
  'Elettrodomestici', 
  'Giardino & Fai da te', 
  'Sport & Fitness', 
  'Biciclette', 
  'Libri & Riviste', 
  'Musica & Film', 
  'Strumenti Musicali', 
  'Collezionismo', 
  'Bambini & Giocattoli', 
  'Fotografia', 
  'Auto & Moto', 
  'Altro'
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{id: string, nome: string} | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('it');

  const t = (key: keyof typeof translations['it']) => {
    return translations[currentLang][key] || translations['it'][key] || key;
  };

  const [view, setView] = useState<'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth' | 'success'>('home');
  const goTo = (v: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth' | 'success') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView(v);
  };
  const requireAuth = (targetView: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'success') => {
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
  const [maxPriceFilter, setMaxPriceFilter] = useState(5000);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form states
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    category: 'Altro',
    image_url: 'https://picsum.photos/seed/item/400/300',
    images: [] as string[]
  });

  const [newRequest, setNewRequest] = useState({
    query: '',
    min_price: '',
    max_price: '',
    location: ''
  });
  const [customCitySell, setCustomCitySell] = useState('');
  const [customCityBuy, setCustomCityBuy] = useState('');
  const [isCustomCitySell, setIsCustomCitySell] = useState(false);
  const [isCustomCityBuy, setIsCustomCityBuy] = useState(false);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [reviewState, setReviewState] = useState<{rating: number, comment: string, transactionId: number | null}>({
    rating: 0,
    comment: '',
    transactionId: null
  });

  // Auto-hide header logic
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Fine-tuned conditions:
      // 1. If at very top (<= 5px), always show
      if (currentScrollY <= 5) {
        setShowHeader(true);
      }
      // 2. If scrolling down AND passed a minimum threshold (100px)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }
      // 3. If scrolling up significantly
      else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
    fetchData();

    let interval: any;
    if (currentUser) {
      notificationService.init(currentUser.id);

      /*
      interval = setInterval(() => {
        runMatching().then(() => fetchData());
      }, 60000);
      */
    }

    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    return () => {
      notificationService.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [view, searchQuery, selectedCategories, maxPriceFilter, currentUser]);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      alert("Notifiche attivate con successo!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    notificationService.disconnect();
    setSession(null);
    setCurrentUser(null);
    goTo('home');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // In un'app reale qui chiameremmo una Edge Function o un'API sicura per eliminare l'utente da auth.users
      await supabase.from('items').delete().eq('seller_id', currentUser.id);
      await supabase.from('requests').delete().eq('buyer_id', currentUser.id);
      await supabase.auth.signOut();
      notificationService.disconnect();
      setSession(null);
      setCurrentUser(null);
      setShowDeleteConfirm(false);
      goTo('home');
      alert("Account eliminato con successo.");
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione dell'account.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = 3 - imagePreviews.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setImagePreviews(prev => {
            const newList = [...prev, base64String].slice(0, 3);
            return newList;
          });
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
      if (searchQuery || (!selectedCategories.includes('Tutte') && selectedCategories.length > 0) || maxPriceFilter < 5000) {
        filteredItems = filteredItems.filter(item => {
          const matchesSearch = !searchQuery ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesCategory = selectedCategories.includes('Tutte') ||
                                 selectedCategories.length === 0 ||
                                 selectedCategories.includes(item.category);

          const matchesPrice = item.price <= maxPriceFilter;

          return matchesSearch && matchesCategory && matchesPrice;
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
          // Skip if the item belongs to the same user who made the request
          if (item.seller_id === req.buyer_id) continue;
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
      if (isEditingItem && editingId) {
        const { error } = await supabase.from('items').update({
          title: newItem.title,
          description: newItem.description,
          price: parseFloat(newItem.price),
          location: newItem.location,
          category: newItem.category,
          image_url: imagePreviews[0] || newItem.image_url,
          images: imagePreviews.length > 0 ? imagePreviews : [newItem.image_url],
          updated_at: new Date().toISOString()
        }).eq('id', editingId);
        if (error) throw error;
        alert("Annuncio aggiornato con successo!");
      } else {
        const { error } = await supabase.from('items').insert({
          title: newItem.title,
          description: newItem.description,
          price: parseFloat(newItem.price),
          location: newItem.location,
          category: newItem.category,
          image_url: imagePreviews[0] || newItem.image_url,
          images: imagePreviews.length > 0 ? imagePreviews : [newItem.image_url],
          seller_id: (currentUser?.id || ''),
          status: 'available'
        });
        if (error) throw error;
        await runMatching();
        alert("Annuncio pubblicato con successo!");
      }

      requireAuth('dashboard');
      setNewItem({ title: '', description: '', price: '', location: '', category: 'Altro', image_url: 'https://picsum.photos/seed/item/400/300', images: [] });
      setImagePreviews([]);
      setIsEditingItem(false);
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Errore: " + (err.message || "Errore sconosciuto"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare definitivamente questo annuncio? Questa azione è irreversibile.")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) throw error;
      alert("Annuncio eliminato definitivamente.");
      setSelectedItem(null);
      await fetchData();
    } catch (err: any) {
      alert("Errore durante l'eliminazione: " + err.message);
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
    if (!session) { setView('auth'); return; }
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
    if (!activeProposal || !currentUser) return;
    setLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: activeProposal.proposal_id,
          buyer_id: currentUser.id,
          seller_id: activeProposal.seller_id,
          item_id: activeProposal.item_id,
          title: activeProposal.title,
          price: activeProposal.price,
          category: activeProposal.category,
          image_url: activeProposal.image_url,
          images: activeProposal.images,
          shipping_details: shippingDetails
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante il checkout');
      }

      setView('success');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Errore durante il checkout: " + err.message);
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
      
      if (!response.ok) throw new Error('Errore durante la conferma spedizione');

      alert(t('confirm_shipping_cta') + " OK!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleConfirmArrival = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/confirm-arrival`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Errore durante la conferma ricezione');

      alert(t('item_arrived'));
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewState.transactionId) return;

    try {
      const { error } = await supabase.from('transactions').update({
        review_rating: reviewState.rating,
        review_comment: reviewState.comment,
        status: 'completed'
      }).eq('id', reviewState.transactionId);

      if (error) throw error;

      alert("Grazie per la tua recensione!");
      setReviewState({ rating: 0, comment: '', transactionId: null });
      fetchData();
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
        location: 'Tutte le città',
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
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-50 nav-gradient px-4 sm:px-6 py-3 sm:py-4"
      >
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer h-10" onClick={() => goTo('home')}>
            <img src="/logo.png" alt="ReMatch Logo" className="h-full w-auto object-contain hover:opacity-80 transition-opacity" />
          </div>

          <div className="hidden md:flex items-center gap-1">
            {(['home','vetrina'] as const).map(v => (
              <button key={v} onClick={() => goTo(v)} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 capitalize ${view === v ? 'text-brand-end bg-brand-end/15' : 'text-white/60 hover:text-white hover:bg-white/8'}`}>
                {v === 'home' ? t('home') : t('vetrina')}
              </button>
            ))}
            <button onClick={() => requireAuth('dashboard')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 ${view === 'dashboard' ? 'text-brand-end bg-brand-end/15' : 'text-white/60 hover:text-white hover:bg-white/8'}`}>{t('dashboard')}</button>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <span className="hidden sm:block text-xs font-semibold text-white/50 max-w-[120px] truncate">{currentUser?.nome}</span>
            )}

            {/* Language Switcher */}
            <div className="relative p-1">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-95"
              >
                <span className="text-lg leading-none">
                  {currentLang === 'it' && '🇮🇹'}
                  {currentLang === 'en' && '🇬🇧'}
                  {currentLang === 'es' && '🇪🇸'}
                  {currentLang === 'fr' && '🇫🇷'}
                  {currentLang === 'de' && '🇩🇪'}
                </span>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setShowLangMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-[#2c2c2e]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                      {(['it', 'en', 'es', 'fr', 'de'] as Language[]).map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            setCurrentLang(lang);
                            setShowLangMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-all hover:bg-white/10 ${currentLang === lang ? 'text-brand-end' : 'text-white'}`}
                        >
                          <span className="text-lg">
                            {lang === 'it' && '🇮🇹'}
                            {lang === 'en' && '🇬🇧'}
                            {lang === 'es' && '🇪🇸'}
                            {lang === 'fr' && '🇫🇷'}
                            {lang === 'de' && '🇩🇪'}
                          </span>
                          <span className="capitalize">{lang === 'it' ? 'Italiano' : lang === 'en' ? 'English' : lang === 'es' ? 'Español' : lang === 'fr' ? 'Français' : 'Deutsch'}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button className="relative p-2 text-brand-end/80 hover:text-brand-end transition-all">
              <Bell size={20} />
              {proposals.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1c1c1e]"></span>
              )}
            </button>
            <button
              onClick={() => {
                if (session) {
                  setShowLogoutConfirm(true);
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
      </motion.nav>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm md:hidden">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.06]">
          {([
            { v: 'home', icon: <Home size={20} />, label: t('home'), fn: () => goTo('home') },
            { v: 'sell', icon: <PlusCircle size={20} />, label: t('sell'), fn: () => requireAuth('sell') },
            { v: 'buy', icon: <Search size={20} />, label: t('buy'), fn: () => requireAuth('buy') },
            { v: 'vetrina', icon: <Store size={20} />, label: t('vetrina'), fn: () => goTo('vetrina') },
            { v: 'dashboard', icon: <LayoutDashboard size={20} />, label: t('dashboard'), fn: () => requireAuth('dashboard'), dot: proposals.length > 0 },
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('hero_badge')}</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl leading-tight font-display font-black tracking-tighter">
                    {t('hero_title1')}<br />
                    <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg,#FFB800,#FF7A00)'}}>{t('hero_title2')}</span>
                  </h1>
                  <p className="text-white/55 text-sm sm:text-lg leading-relaxed max-w-md font-medium">
                    {t('hero_desc')}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => requireAuth('sell')} className="ios-btn-primary group flex items-center gap-2">
                      {t('hero_start_selling')}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => requireAuth('buy')} className="px-6 py-3.5 bg-white/10 border border-white/15 rounded-xl font-bold text-sm hover:bg-white/18 transition-all active:scale-95">
                      {t('hero_search_items')}
                    </button>
                  </div>
                </div>
              </section>

              {/* Search */}
              <div className="ios-card p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray/60 group-focus-within:text-brand-end transition-colors duration-200" size={18} />
                    <input
                      type="text"
                      placeholder={t('search_placeholder')}
                      className="w-full pl-11 pr-4 py-3.5 bg-ios-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-end/30 transition-all text-base font-semibold placeholder:text-ios-gray/50"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => fetchData()} className="ios-btn-primary whitespace-nowrap">
                    {t('search_cta')}
                  </button>
                </div>
                <p className="mt-3 text-ios-gray text-xs font-medium">{t('search_ai_help')}</p>
              </div>


              {/* Vetrina Anteprima */}
              <section className="space-y-5 sm:space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="rm-section-title">{t('vetrina')}</h2>
                    <p className="text-ios-gray text-xs mt-0.5">{t('recent_items')}</p>
                  </div>
                  <button onClick={() => goTo('vetrina')} className="text-brand-end text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    {t('see_all')} <ChevronRight size={15} />
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
                        onClick={() => setSelectedItem(item)}
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

              {/* Share App Section */}
              <section className="ios-card bg-gradient-to-br from-brand-start to-brand-end p-8 sm:p-12 relative overflow-hidden group">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Share2 className="text-white" size={36} />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {t('share_title')}
                    </h2>
                    <p className="text-white/80 text-lg font-medium leading-relaxed">
                      {t('share_desc')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Rematch',
                          text: t('share_desc'),
                          url: window.location.origin
                        });
                      } else {
                        alert('Link copiato negli appunti!');
                        navigator.clipboard.writeText(window.location.origin);
                      }
                    }}
                    className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-black/20 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Share2 size={24} />
                    {t('share_cta')}
                  </button>
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
                  <h2>{t('sell_title')}</h2>
                  <p>{t('sell_desc')}</p>
                </div>

                <form onSubmit={handleSell} className="space-y-5 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="rm-label">{t('item_photos')}</label>
                      <span className="text-ios-gray text-[10px] font-black uppercase tracking-widest">{imagePreviews.length}/3 {t('photos_count')}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {imagePreviews.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group">
                          <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-xl text-white rounded-lg hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-end text-white text-[8px] font-black uppercase rounded-md shadow-sm">
                              {t('main_photo')}
                            </div>
                          )}
                        </div>
                      ))}

                      {imagePreviews.length < 3 && (
                        <label className="aspect-square bg-ios-secondary rounded-2xl border-2 border-dashed border-ios-gray/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-ios-secondary/80 transition-all group overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-end shadow-md group-hover:scale-105 transition-transform duration-300">
                            <Plus size={20} />
                          </div>
                          <p className="text-ios-gray text-[10px] font-black uppercase tracking-wider">{t('add')}</p>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="rm-label">{t('title')}</label>
                    <input
                      required
                      type="text"
                      placeholder={t('placeholder_title')}
                      className="rm-input-lg"
                      value={newItem.title}
                      onChange={e => setNewItem({...newItem, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-sm font-black text-ios-gray ml-2 uppercase tracking-[0.2em]">{t('description')}</label>
                    <textarea
                      required
                      rows={4}
                      placeholder={t('placeholder_desc')}
                      className="rm-input-lg resize-none"
                      value={newItem.description}
                      onChange={e => setNewItem({...newItem, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="rm-label">{t('category')}</label>
                    <div className="relative">
                      <select
                        required
                        className="rm-input-lg appearance-none cursor-pointer w-full text-ios-label"
                        value={newItem.category}
                        onChange={e => setNewItem({...newItem, category: e.target.value})}
                      >
                        <option value="">{t('all')}</option>
                        {CATEGORIES.filter(c => c !== 'Tutte').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ios-gray">
                        <ChevronRight className="rotate-90" size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">{t('price')} (€)</label>
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
                      <label className="rm-label">{t('location')}</label>
                      <div className="relative">
                        <select
                          required
                          className="rm-input-lg appearance-none cursor-pointer w-full"
                          value={isCustomCitySell ? 'custom' : newItem.location}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setIsCustomCitySell(true);
                              setNewItem({...newItem, location: ''});
                            } else {
                              setIsCustomCitySell(false);
                              setNewItem({...newItem, location: e.target.value});
                            }
                          }}
                        >
                          <option value="" disabled>{t('city_select_placeholder')}</option>
                          <option value="Tutte le città">{t('all_cities')}</option>
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
                          <option value="custom">Altro (Inserisci città)</option>
                        </select>
                        {isCustomCitySell && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3"
                          >
                            <input
                              type="text"
                              required
                              placeholder="Inserisci il nome della città"
                              className="rm-input-lg"
                              value={newItem.location}
                              onChange={e => setNewItem({...newItem, location: e.target.value})}
                            />
                          </motion.div>
                        )}
                        <div className="absolute inset-y-0 right-6 sm:right-10 flex items-center pointer-events-none text-ios-gray">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-8 py-5 sm:py-6 bg-brand-end text-white text-base sm:text-lg font-black rounded-2xl sm:rounded-3xl hover:bg-black transition-all active:scale-[0.98] shadow-2xl shadow-brand-end/30 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={24} />
                        <span>{isEditingItem ? "Aggiorna Annuncio" : t('put_in_sale')}</span>
                      </>
                    )}
                  </button>

                  {isEditingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingItem(false);
                        setEditingId(null);
                        setNewItem({ title: '', description: '', price: '', location: '', category: 'Altro', image_url: '', images: [] });
                        setImagePreviews([]);
                        setView('dashboard');
                      }}
                      className="w-full mt-3 py-4 text-ios-gray font-bold text-sm"
                    >
                      Annulla Modifica
                    </button>
                  )}
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
                  <h2>{t('buy_title')}</h2>
                  <p>{t('buy_desc')}</p>
                </div>

                <form onSubmit={handleBuy} className="space-y-5 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="rm-label">{t('what_looking_for')}</label>
                    <input
                      required
                      type="text"
                      placeholder={t('placeholder_buy_title')}
                      className="rm-input-lg"
                      value={newRequest.query}
                      onChange={e => setNewRequest({...newRequest, query: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">{t('max_price_label')}</label>
                      <input
                        type="number"
                        placeholder={t('no_limit')}
                        className="rm-input-lg"
                        value={newRequest.max_price}
                        onChange={e => setNewRequest({...newRequest, max_price: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <label className="rm-label">{t('where')}</label>
                      <div className="relative">
                        <select
                          required
                          className="rm-input-lg appearance-none cursor-pointer w-full"
                          value={isCustomCityBuy ? 'custom' : newRequest.location}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setIsCustomCityBuy(true);
                              setNewRequest({...newRequest, location: ''});
                            } else {
                              setIsCustomCityBuy(false);
                              setNewRequest({...newRequest, location: e.target.value});
                            }
                          }}
                        >
                          <option value="" disabled>{t('city_select_placeholder')}</option>
                          <option value="Tutte le città">{t('all_cities')}</option>
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
                          <option value="custom">Altro (Inserisci città)</option>
                        </select>
                        {isCustomCityBuy && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3"
                          >
                            <input
                              type="text"
                              required
                              placeholder="Inserisci il nome della città"
                              className="rm-input-lg"
                              value={newRequest.location}
                              onChange={e => setNewRequest({...newRequest, location: e.target.value})}
                            />
                          </motion.div>
                        )}
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
                    {loading ? t('saving') : (newRequest.query !== '' && topSearches && userRequests.find(r => r.query === newRequest.query) ? t('update_match_search') : t('create_match_search'))}
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
                  <h2>{t('checkout')}</h2>
                  <p>{t('checkout_desc')}</p>
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
                    <input name="name" required placeholder={t('name')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                    <input name="surname" required placeholder={t('surname')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  </div>
                  <input name="email" type="email" required placeholder="Email" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  <input name="phone" required placeholder={t('phone')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  <input name="address" required placeholder={t('address')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <input name="city" required placeholder={t('city')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                    <input name="cap" required placeholder={t('cap')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                  </div>
                  <button type="submit" className="ios-btn-primary w-full text-base sm:text-lg">
                    {t('payment_confirm')} (Demo)
                  </button>
                  <button type="button" onClick={() => requireAuth('dashboard')} className="w-full py-3 text-ios-gray text-sm font-bold hover:text-ios-label transition-colors">
                    {t('cancel')}
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
                  <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">{t('dashboard_title')}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-ios-gray text-base sm:text-lg font-black">{currentUser?.nome}</span>
                  </div>
                  <p className="text-ios-gray/60 text-sm font-medium">{t('dashboard_desc')}</p>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
                  {!notificationsEnabled && (
                    <button
                      onClick={handleEnableNotifications}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 sm:py-4 bg-ios-blue/10 text-ios-blue font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 hover:bg-ios-blue/20 transition-all active:scale-95 shadow-lg shadow-ios-blue/5"
                    >
                      <Bell size={16} />
                      {t('enable_notif')}
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Stats Box (Brand Style) - Now First */}
              <div className="stat-card-brand space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="rm-section-title !text-white">{t('my_stats')}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                    <TrendingUp size={12} />
                    <span>{t('top_seller')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{t('active_listings')}</p>
                    <p className="text-4xl font-black">{items.filter(i => i.seller_id === (currentUser?.id || '')).length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{t('matches_found')}</p>
                    <p className="text-4xl font-black">{proposals.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{t('active_searches')}</p>
                    <p className="text-4xl font-black">{userRequests.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{t('reliability')}</p>
                    <p className="text-4xl font-black">9.8</p>
                  </div>
                </div>
              </div>

              {/* 2. 4 Information Containers (Stats Summary) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: t('in_sale'), value: items.filter(i => i.seller_id === (currentUser?.id || '')).length, icon: <Package size={18} />, color: 'bg-brand-end/10 text-brand-end' },
                  { label: t('my_searches'), value: userRequests.length, icon: <Search size={18} />, color: 'bg-ios-blue/10 text-ios-blue' },
                  { label: t('matches_found'), value: proposals.length, icon: <Bell size={18} />, color: 'bg-green-500/10 text-green-600' },
                  { label: t('saved_items'), value: favorites.length, icon: <Heart size={18} />, color: 'bg-red-500/10 text-red-500' },
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
                <div className="lg:col-span-2 space-y-12">
                  {/* 3. My Searches (Moved here) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('my_searches')}</h3>
                      <span className="text-ios-gray text-xs font-medium">{userRequests.length} {t('active')}</span>
                    </div>

                    {userRequests.length === 0 ? (
                      <div className="ios-card p-12 border-2 border-dashed border-ios-gray/10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                          <Search size={24} />
                        </div>
                        <p className="text-ios-gray text-sm">{t('no_saved_searches')}</p>
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
                                  {req.location} • {req.max_price > 0 ? `${t('up_to')} €${req.max_price}` : t('any_price')}
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
                                title={t('edit_search')}
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

                  {/* 4. Suggested Matches (Moved here) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('suggested_matches')}</h3>
                      <span className="px-3 py-1 bg-ios-blue text-white text-[10px] font-bold rounded-full">
                        {proposals.length} {t('new_notif')}
                      </span>
                    </div>

                    {proposals.length === 0 ? (
                      <div className="ios-card p-16 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                          <ShoppingBag size={32} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold">{t('no_matches')}</p>
                          <p className="text-ios-gray text-sm max-w-xs">{t('no_matches_desc')}</p>
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
                              <div className="absolute bottom-3 right-3 px-3 py-1 bg-brand-end text-white text-xs font-black rounded-xl shadow-lg">
                                €{prop.price}
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-xl font-bold">{prop.title}</h4>
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
                                  {t('accept')}
                                </button>
                                <button
                                  onClick={() => respondToProposal(prop, 'rejected')}
                                  className="px-6 py-3 bg-ios-secondary text-ios-gray font-semibold rounded-2xl text-sm hover:bg-ios-gray/10 hover:text-ios-label active:scale-95 transition-all"
                                >
                                  {t('reject')}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Items in Sale (New Section) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('in_sale')}</h3>
                      <span className="text-ios-gray text-xs font-medium">
                        {items.filter(i => i.seller_id === (currentUser?.id || '')).length} {t('items_count')}
                      </span>
                    </div>

                    {items.filter(i => i.seller_id === (currentUser?.id || '')).length === 0 ? (
                      <div className="ios-card p-12 border-2 border-dashed border-ios-gray/10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                          <Package size={24} />
                        </div>
                        <p className="text-ios-gray text-sm">{t('no_saved_items')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {items.filter(i => i.seller_id === (currentUser?.id || '')).map((item) => (
                          <motion.div
                            layout
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="ios-card group cursor-pointer relative"
                          >
                            <div className="aspect-square overflow-hidden relative">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                              <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white rounded-lg text-[10px] font-black shadow-sm">
                                Live
                              </div>
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-black shadow-sm">
                                €{item.price}
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-bold text-xs truncate">{item.title}</h4>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Sales & Purchases (Transactions) */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('sales_purchases')}</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-ios-secondary rounded-full text-[10px] font-bold text-ios-gray uppercase tracking-widest">Live Flow</span>
                      </div>
                    </div>

                    {transactions.length === 0 ? (
                      <div className="ios-card p-12 text-center space-y-4 bg-ios-secondary/20 border-2 border-dashed border-black/[0.05]">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                          <Clock size={24} className="text-ios-gray" />
                        </div>
                        <p className="text-ios-gray font-bold">{t('no_active_transactions')}</p>
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
                                <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden shrink-0 shadow-md">
                                  <img src={t.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="flex-1 space-y-6">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isSeller ? 'bg-ios-blue text-white' : 'bg-brand-start text-white'}`}>
                                          {isSeller ? t('sale') : t('purchase')}
                                        </span>
                                        <span className="text-ios-gray font-bold text-xs">{t('id')} #{t.id}</span>
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
                                        {t.status === 'paid' ? t('to_ship') : t.status === 'shipped' ? t('in_transit') : t.status === 'delivered' ? t('delivered') : t.status}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-6 bg-ios-secondary/30 rounded-3xl border border-black/[0.03] space-y-6">
                                    {isSeller ? (
                                      <>
                                        {t.status === 'paid' && (
                                          <div className="space-y-6">
                                            <div className="flex items-center gap-3 p-4 bg-orange-500/10 text-orange-600 rounded-2xl">
                                              <Clock size={20} className="shrink-0" />
                                              <div>
                                                <p className="font-black text-sm uppercase tracking-tight">{t('ship_within_5_days')}</p>
                                                <p className="text-[10px] opacity-80">{t('payment_confirmed_seller')}</p>
                                              </div>
                                            </div>

                                            <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-ios-gray">{t('shipping_address')}</h5>
                                                <span className="text-[10px] text-orange-500 font-bold">{t('no_phone_notice')}</span>
                                              </div>
                                              <div className="text-sm font-bold leading-relaxed text-ios-label bg-white/50 p-4 rounded-2xl border border-black/[0.02]">
                                                {t.buyer_name} {t.buyer_surname}<br />
                                                {t.buyer_address}<br />
                                                {t.buyer_cap}, {t.buyer_city}<br />
                                                {t.buyer_email}
                                              </div>
                                            </div>

                                            <form onSubmit={(e) => {
                                              e.preventDefault();
                                              const formData = new FormData(e.currentTarget);
                                              handleShip(t.id, {
                                                tracking_id: formData.get('tracking') as string,
                                                courier: formData.get('courier') as string,
                                                seller_iban: formData.get('iban') as string
                                              });
                                            }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <input name="tracking" required placeholder={t('tracking_code')} className="checkout-input !py-3 !text-sm" />
                                              <input name="courier" required placeholder={t('courier_placeholder')} className="checkout-input !py-3 !text-sm" />
                                              <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-ios-gray ml-1">{t('bank_details')}</label>
                                                <input name="iban" required placeholder={t('iban_placeholder')} className="checkout-input !py-3 !text-sm" />
                                              </div>
                                              <button type="submit" className="md:col-span-2 ios-btn-primary !py-4 !rounded-2xl shadow-lg shadow-brand-end/20">{t('confirm_shipping_cta')}</button>
                                            </form>
                                          </div>
                                        )}
                                        {t.status === 'shipped' && (
                                          <div className="space-y-3">
                                            <p className="text-ios-blue font-bold text-sm tracking-tight">{t('waiting_buyer_confirm')}</p>
                                            <div className="p-4 bg-ios-blue/5 rounded-2xl border border-ios-blue/10">
                                              <p className="text-[10px] text-ios-blue font-bold uppercase tracking-widest mb-1">{t('tracking_for_buyer')}</p>
                                              <p className="text-sm font-black">{t.courier} • {t.tracking_id}</p>
                                            </div>
                                          </div>
                                        )}
                                        {t.status === 'delivered' && (
                                          <div className="p-5 bg-green-500/10 text-green-600 rounded-2xl border border-green-500/20">
                                            <p className="font-black text-sm uppercase tracking-tight mb-2">Match Completato!</p>
                                            <p className="text-xs font-medium leading-relaxed">{t('payment_processed_in_3_days')}</p>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {t.status === 'paid' && (
                                          <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-4 bg-ios-blue/10 text-ios-blue rounded-2xl">
                                              <Clock size={20} className="shrink-0" />
                                              <p className="font-bold text-sm">{t('order_shipped_within_5')}</p>
                                            </div>
                                            <p className="text-xs text-ios-gray font-medium leading-relaxed">{t('arrival_instructions')}</p>
                                          </div>
                                        )}
                                        {t.status === 'shipped' && (
                                          <div className="space-y-6">
                                            <div className="p-4 bg-ios-blue/5 rounded-2xl border border-ios-blue/10">
                                              <p className="text-[10px] text-ios-blue font-bold uppercase tracking-widest mb-1">{t('tracking_code')}</p>
                                              <p className="text-sm font-black">{t.courier} • {t.tracking_id}</p>
                                            </div>
                                            <button
                                              onClick={() => handleConfirmArrival(t.id)}
                                              className="w-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                                            >
                                              {t('confirm_receive')}
                                            </button>
                                          </div>
                                        )}
                                        {t.status === 'delivered' && (
                                          <div className="space-y-6">
                                            <div className="p-4 bg-green-500/10 text-green-600 rounded-2xl font-black text-sm uppercase text-center border border-green-500/20">
                                              {t('item_arrived')}
                                            </div>

                                            <form onSubmit={(e) => {
                                              setReviewState({...reviewState, transactionId: t.id});
                                              handleSubmitReview(e);
                                            }} className="space-y-4 pt-4 border-t border-black/[0.05]">
                                              <h5 className="text-sm font-black uppercase tracking-widest text-ios-gray">{t('write_review')}</h5>
                                              <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                  <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewState({...reviewState, rating: star, transactionId: t.id})}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${reviewState.rating >= star ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-ios-secondary text-ios-gray'}`}
                                                  >
                                                    <Star size={18} fill={reviewState.rating >= star ? 'currentColor' : 'none'} />
                                                  </button>
                                                ))}
                                              </div>
                                              <textarea
                                                required
                                                placeholder={t('placeholder_desc')}
                                                className="rm-input-lg !py-3 !text-sm resize-none"
                                                rows={2}
                                                value={reviewState.transactionId === t.id ? reviewState.comment : ''}
                                                onChange={(e) => setReviewState({...reviewState, comment: e.target.value, transactionId: t.id})}
                                              />
                                              <button type="submit" className="ios-btn-primary w-full py-4 text-sm">{t('submit_review')}</button>
                                            </form>
                                          </div>
                                        )}
                                      </>
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

                  {/* 6. Saved Objects */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('saved_items')}</h3>
                      <span className="text-ios-gray text-xs font-medium">{favorites.length} {t('items_count')}</span>
                    </div>

                    {favorites.length === 0 ? (
                      <div className="ios-card p-12 border-2 border-dashed border-ios-gray/10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-ios-secondary rounded-full flex items-center justify-center text-ios-gray/30">
                          <Heart size={24} />
                        </div>
                        <p className="text-ios-gray text-sm">{t('no_saved_items')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {favorites.map((item) => (
                          <motion.div
                            layout
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="ios-card group cursor-pointer relative"
                          >
                            <div className="aspect-square overflow-hidden relative">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"><Heart size={12} fill="currentColor" /></button>
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-black shadow-sm">
                                €{item.price}
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-bold text-xs truncate">{item.title}</h4>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 7. Final - Logout and Delete */}
                  <div className="pt-12 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex-1 py-5 rounded-3xl bg-gradient-to-r from-ios-secondary to-ios-secondary/50 text-ios-gray font-black uppercase tracking-widest text-sm hover:from-ios-secondary/80 hover:to-ios-secondary transition-all active:scale-[0.98] border border-black/5 flex items-center justify-center gap-3 shadow-sm"
                    >
                      <LogOut size={20} />
                      {t('logout_cta')}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex-1 py-5 rounded-3xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black uppercase tracking-widest text-sm hover:from-red-600 hover:to-red-700 shadow-xl shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Trash2 size={20} />
                      {t('delete_account_cta')}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">

                  <div className="ios-card p-5 sm:p-6 space-y-5">
                    <h3 className="rm-section-title">{t('how_it_works')}</h3>
                    <div className="space-y-6">
                      {[
                        { step: 1, text: t('step1') },
                        { step: 2, text: t('step2') },
                        { step: 3, text: t('step3') }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-ios-blue/10 text-ios-blue flex items-center justify-center text-xs font-bold flex-shrink-0">{item.step}</div>
                          <p className="text-xs text-ios-gray font-medium leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
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
              <motion.div
                animate={{ y: showHeader ? 0 : -300 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="sticky top-0 md:top-20 z-40 bg-white/95 backdrop-blur-2xl -mx-6 px-6 py-4 flex flex-col gap-4 border-b border-black/[0.05] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                       <button
                        onClick={() => requireAuth('sell')}
                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-90 transition-all flex-shrink-0"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t('vetrina')}</h2>
                    </div>
                  </div>
                  <button onClick={() => setView('home')} className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-ios-gray">
                    <X size={24} />
                  </button>
                </div>

                {/* Search Bar - Prominent */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray group-focus-within:text-brand-end transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder={t('search_placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-black/[0.04] focus:bg-white border-2 border-transparent focus:border-brand-end/20 rounded-2xl text-sm font-bold placeholder:text-ios-gray/50 transition-all outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-center ${showFilters ? 'bg-brand-end border-brand-end text-white shadow-lg' : 'bg-black/[0.04] border-transparent text-ios-gray'}`}
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
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
                            className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all duration-300 border ${
                              selectedCategories.includes(cat)
                                ? 'bg-brand-end border-brand-end text-white shadow-md'
                                : 'bg-white border-black/[0.1] text-ios-gray hover:border-brand-end/30'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="bg-black/[0.03] p-4 rounded-2xl border border-black/[0.03]">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-ios-gray">{t('max_price_label')}</span>
                          <span className="text-base font-black text-brand-end">€{maxPriceFilter === 5000 ? t('no_limit') : maxPriceFilter}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="50"
                          value={maxPriceFilter}
                          onChange={(e) => setMaxPriceFilter(parseInt(e.target.value))}
                          className="w-full accent-brand-end h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {items.length === 0 ? (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <ShoppingBag size={48} className="mx-auto text-ios-gray/20" />
                    <p className="text-ios-gray font-bold">{t('no_matches')}</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const isFav = favorites.some(f => f.id === item.id);
                    return (
                      <motion.div
                        layout
                        whileHover={{ y: -8 }}
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
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

              {/* Share App Section (Reused) */}
              <section className="ios-card bg-gradient-to-br from-brand-start to-brand-end p-8 sm:p-12 relative overflow-hidden group mt-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Share2 className="text-white" size={36} />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {t('share_title')}
                    </h2>
                    <p className="text-white/80 text-lg font-medium leading-relaxed">
                      {t('share_desc')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Rematch',
                          text: t('share_desc'),
                          url: window.location.origin
                        });
                      } else {
                        alert('Link copiato negli appunti!');
                        navigator.clipboard.writeText(window.location.origin);
                      }
                    }}
                    className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-black/20 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Share2 size={24} />
                    {t('share_cta')}
                  </button>
                </div>
              </section>
            </motion.div>
          )}
          {view === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto py-20 px-6 text-center space-y-12"
            >
              <div className="w-32 h-32 bg-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                <Check className="text-white" size={64} strokeWidth={4} />
              </div>

              <div className="space-y-6">
                <h2 className="text-5xl sm:text-7xl font-display font-black tracking-tight">{t('payment_success')}</h2>
                <div className="space-y-4 max-w-lg mx-auto">
                  <p className="text-ios-gray text-xl sm:text-2xl font-medium leading-relaxed">
                    {t('order_shipped_within_5')}
                  </p>
                  <p className="text-ios-gray/60 text-base font-medium">
                    {t('arrival_instructions')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
                <button
                  onClick={() => goTo('dashboard')}
                  className="ios-btn-primary py-5 text-lg"
                >
                  {t('dashboard')}
                </button>
                <button
                  onClick={() => goTo('home')}
                  className="px-8 py-5 bg-ios-secondary text-ios-label rounded-3xl font-black text-lg hover:bg-ios-secondary/80 transition-all border border-black/5"
                >
                  {t('home')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Elimina Account?</h3>
                <p className="text-ios-gray text-sm leading-relaxed font-medium">
                  Questa azione è irreversibile. Tutti i tuoi annunci, ricerche e match verranno cancellati definitivamente.
                </p>
              </div>

              <div className="p-4 bg-ios-secondary/30 flex flex-col gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'Eliminazione...' : 'Sì, elimina definitivamente'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-white text-ios-label font-black rounded-2xl active:scale-95 transition-all text-sm border border-black/5"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-brand-end/10 text-brand-end rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <LogOut size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Esci dall'Account</h3>
                <p className="text-ios-gray text-sm leading-relaxed font-medium">
                  Sei sicuro di voler uscire? Dovrai accedere nuovamente per gestire i tuoi annunci e i tuoi match.
                </p>
              </div>

              <div className="p-4 bg-ios-secondary/30 flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                  }}
                  className="w-full py-4 bg-gradient-to-br from-brand-start to-brand-end text-white font-black rounded-2xl shadow-lg shadow-brand-end/25 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Sì, disconnetti
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-white text-ios-label font-black rounded-2xl active:scale-95 transition-all text-sm border border-black/5"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="relative h-64 sm:h-96 shrink-0 bg-black flex items-center justify-center group overflow-hidden">
                <motion.div
                  className="flex h-full w-full cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    const threshold = 50;
                    if (info.offset.x < -threshold) {
                      setActiveImageIndex(prev => (prev === (selectedItem.images?.length || 1) - 1 ? 0 : prev + 1));
                    } else if (info.offset.x > threshold) {
                      setActiveImageIndex(prev => (prev === 0 ? (selectedItem.images?.length || 1) - 1 : prev - 1));
                    }
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImageIndex}
                      src={(selectedItem.images && selectedItem.images.length > 0) ? selectedItem.images[activeImageIndex] : selectedItem.image_url}
                      alt={selectedItem.title}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="w-full h-full object-cover select-none"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        if (x < rect.width / 3) {
                          setActiveImageIndex(prev => (prev === 0 ? (selectedItem.images?.length || 1) - 1 : prev - 1));
                        } else if (x > (rect.width * 2) / 3) {
                          setActiveImageIndex(prev => (prev === (selectedItem.images?.length || 1) - 1 ? 0 : prev + 1));
                        } else {
                          setIsZoomed(true);
                        }
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                </motion.div>

                {/* Carousel Controls (Dots) */}
                {selectedItem.images && selectedItem.images.length > 1 && (
                  <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2 z-10 pointer-events-none">
                    {selectedItem.images.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'w-6 bg-white shadow-md' : 'bg-white/40 backdrop-blur-md'}`}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setActiveImageIndex(0);
                  }}
                  className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-xl text-white rounded-2xl hover:bg-black/60 transition-all shadow-lg z-20"
                >
                  <X size={24} />
                </button>
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-brand-end text-white rounded-2xl text-xl font-black shadow-xl z-10">
                  €{selectedItem.price}
                </div>
              </div>

              {/* Zoom Overlay */}
              <AnimatePresence>
                {isZoomed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsZoomed(false)}
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
                  >
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      src={(selectedItem.images && selectedItem.images.length > 0) ? selectedItem.images[activeImageIndex] : selectedItem.image_url}
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                    <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
                      <X size={32} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-1">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-ios-blue/10 text-ios-blue text-[10px] font-bold rounded-full uppercase tracking-widest">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{selectedItem.title}</h3>
                  <div className="flex items-center gap-4 text-ios-gray font-medium">
                    <div className="flex items-center gap-1.5 bg-ios-secondary/50 px-3 py-1.5 rounded-xl border border-black/[0.03]">
                      <MapPin size={16} />
                      <span className="text-sm">{selectedItem.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-ios-gray">{t('description')}</h4>
                  <p className="text-ios-label text-lg leading-relaxed font-medium">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Product Detail Actions */}
                <div className="pt-6 border-t border-black/[0.05] space-y-6">
                  {currentUser?.id === selectedItem.seller_id ? (
                    <div className="space-y-6">
                      {/* Seller Stats */}
                      <div className="flex items-center gap-6 p-4 bg-ios-secondary/30 rounded-2xl border border-black/5">
                        <div className="flex items-center gap-2">
                          <Heart size={18} className="text-red-500" fill="currentColor" />
                          <span className="text-xl font-black">{selectedItem.likecount || 0}</span>
                          <span className="text-[10px] font-bold text-ios-gray uppercase tracking-widest ml-1">Likes</span>
                        </div>
                        <div className="w-px h-8 bg-black/5" />
                        <div className="flex items-center gap-2">
                          <Eye size={18} className="text-ios-blue" />
                          <span className="text-xl font-black">24</span>
                          <span className="text-[10px] font-bold text-ios-gray uppercase tracking-widest ml-1">Visite</span>
                        </div>
                      </div>

                      {/* Transaction Workflow for Seller */}
                      {(() => {
                        const tx = transactions.find(t => t.item_id === selectedItem.id);
                        if (!tx) return null;

                        const deadlineDate = new Date(tx.shipping_deadline);
                        const diff = deadlineDate.getTime() - new Date().getTime();
                        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                        return (
                          <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-3xl space-y-5">
                            <div className="flex items-center gap-3 text-orange-600">
                              <ShoppingBag size={20} />
                              <h5 className="font-black uppercase tracking-widest text-xs">VENDITA RICHIESTA</h5>
                            </div>

                            {tx.status === 'paid' && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                                  <Clock size={16} className="text-orange-500" />
                                  <span className="text-sm font-bold">
                                    Spedire entro: <span className="text-orange-600 font-black">{daysLeft}g {hoursLeft}h</span>
                                  </span>
                                </div>
                                <p className="text-[10px] font-medium text-ios-gray">Il pagamento è stato confermato e protetto. Inserisci i dati per procedere.</p>

                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget as HTMLFormElement);
                                  handleShip(tx.id, {
                                    tracking_id: formData.get('tracking') as string,
                                    courier: formData.get('courier') as string,
                                    seller_iban: formData.get('iban') as string
                                  });
                                }} className="space-y-3">
                                  <input name="tracking" required placeholder={t('tracking_code')} className="checkout-input !py-3 !text-sm w-full" />
                                  <input name="courier" required placeholder={t('courier_placeholder')} className="checkout-input !py-3 !text-sm w-full" />
                                  <input name="iban" required placeholder={t('iban_placeholder')} className="checkout-input !py-3 !text-sm w-full" />
                                  <button type="submit" className="w-full ios-btn-primary !py-4 shadow-lg">{t('confirm_shipping_cta')}</button>
                                </form>
                              </div>
                            )}

                            {tx.status === 'shipped' && (
                              <div className="p-4 bg-ios-blue/10 text-ios-blue rounded-2xl flex items-center gap-3">
                                <Truck size={20} />
                                <span className="text-sm font-bold">Spedizione confermata: {tx.tracking_id}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setNewItem({
                              title: selectedItem.title,
                              description: selectedItem.description,
                              price: selectedItem.price.toString(),
                              location: selectedItem.location,
                              category: selectedItem.category,
                              image_url: selectedItem.image_url,
                              images: selectedItem.images || []
                            });
                            setImagePreviews(selectedItem.images || [selectedItem.image_url]);
                            setIsEditingItem(true);
                            setEditingId(selectedItem.id);
                            setSelectedItem(null);
                            setView('sell');
                          }}
                          className="flex-1 py-4 bg-ios-secondary text-ios-label font-black rounded-2xl hover:bg-ios-secondary/80 flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDeleteItem(selectedItem.id)}
                          className="flex-1 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 flex items-center justify-center gap-2"
                        >
                          <Trash2 size={18} />
                          Elimina
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-row gap-3">
                      <button
                        onClick={() => {
                          if (selectedItem) {
                            setActiveProposal({
                              ...selectedItem,
                              proposal_id: 0,
                              request_id: 0,
                              item_id: selectedItem.id,
                              status: 'pending',
                              expires_at: new Date().toISOString()
                            } as Proposal);
                            setSelectedItem(null);
                            requireAuth('checkout');
                          }
                        }}
                        className="flex-[7] ios-btn-primary py-5 flex items-center justify-center gap-3 shadow-xl shadow-brand-end/25"
                      >
                        <ShoppingBag size={20} />
                        <span className="truncate">{t('buy_now')}</span>
                      </button>
                      <button
                        onClick={() => {
                          toggleFavorite(selectedItem.id);
                        }}
                        className={`flex-[3] py-5 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${
                          favorites.some(f => f.id === selectedItem.id)
                            ? 'bg-red-500 text-white shadow-xl shadow-red-500/20'
                            : 'bg-ios-secondary text-ios-gray border border-black/5 hover:bg-ios-secondary/80'
                        }`}
                      >
                        <Heart size={20} fill={favorites.some(f => f.id === selectedItem.id) ? "currentColor" : "none"} />
                        <span className="hidden sm:inline">{favorites.some(f => f.id === selectedItem.id) ? t('saved') : t('save_item')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-32 border-t border-black/[0.05] py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-center md:justify-start h-12">
                <img src="/logo.png" alt="ReMatch" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-ios-gray text-sm font-medium leading-relaxed">
                Connettiamo l'intento con l'inventario tramite il matchmaking intelligente.
              </p>
              <div className="flex justify-center md:justify-start gap-3">
                {['Instagram', 'Twitter'].map(s => (
                  <div key={s} className="w-8 h-8 bg-ios-secondary rounded-lg flex items-center justify-center text-ios-gray hover:text-brand-end transition-all cursor-pointer">
                    <div className="w-4 h-4 rounded-sm bg-current opacity-20"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6 text-center md:text-left">
              <h4 className="text-xs font-black uppercase tracking-widest text-ios-label">{t('explore')}</h4>
              <ul className="space-y-3">
                <li><button onClick={() => goTo('home')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('home')}</button></li>
                <li><button onClick={() => requireAuth('sell')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('sell')}</button></li>
                <li><button onClick={() => requireAuth('buy')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('buy')}</button></li>
                <li><button onClick={() => requireAuth('dashboard')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('dashboard')}</button></li>
                <li><button onClick={() => setView('vetrina')} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('vetrina')}</button></li>
              </ul>
            </div>

            <div className="space-y-6 text-center md:text-left">
              <h4 className="text-xs font-black uppercase tracking-widest text-ios-label">{t('support')}</h4>
              <ul className="space-y-3">
                <li><span className="text-ios-gray hover:text-ios-label cursor-default transition-colors text-sm font-bold block">{t('help_center')}</span><span className="text-[10px] text-ios-gray/60 font-medium">{t('help_desc')}</span></li>
                <li><span className="text-ios-gray hover:text-ios-label cursor-default transition-colors text-sm font-bold block">{t('security')}</span><span className="text-[10px] text-ios-gray/60 font-medium">{t('security_desc')}</span></li>
                <li><button onClick={() => alert("Sezione Contatti in arrivo...")} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('contacts')}</button></li>
              </ul>
            </div>

            <div className="space-y-6 text-center md:text-left">
              <h4 className="text-xs font-black uppercase tracking-widest text-ios-label">{t('legal')}</h4>
              <ul className="space-y-3 text-center md:text-left">
                <li className="space-y-1">
                  <span className="text-ios-gray hover:text-ios-label cursor-default transition-colors text-sm font-bold block">{t('terms')}</span>
                  <p className="text-[10px] text-ios-gray/60 leading-tight">{t('terms_desc')}</p>
                </li>
                <li className="space-y-1">
                  <span className="text-ios-gray hover:text-ios-label cursor-default transition-colors text-sm font-bold block">{t('privacy')}</span>
                  <p className="text-[10px] text-ios-gray/60 leading-tight">{t('privacy_desc')}</p>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-black/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-ios-gray text-[10px] font-black uppercase tracking-[0.2em]">© 2026 REMATCH MARKETPLACE. {t('rights_reserved')}.</p>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-ios-secondary/50 rounded-2xl text-ios-gray text-[10px] font-bold uppercase tracking-widest border border-black/[0.02]">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              {t('active_systems')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
