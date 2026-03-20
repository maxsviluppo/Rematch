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
  LayoutGrid,
  Box,
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

// --- HELPER COMPONENTS ---



// Compact card for completed PURCHASES (buyer side)
const CompletedPurchaseCard = ({ tr, t }: any) => {
  const stars = tr.review_rating || 0;
  return (
    <motion.div layout className="ios-card p-3 group cursor-default hover:shadow-lg transition-all relative overflow-hidden">
      <div className="aspect-square rounded-2xl overflow-hidden mb-2 relative">
        <img src={tr.image_url} alt={tr.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-[9px] font-black truncate">{tr.title}</p>
          <p className="text-white/80 text-[9px] font-bold">€{tr.price}</p>
        </div>
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-[8px] font-black rounded-full uppercase tracking-wide">
          Ricevuto
        </div>
      </div>
      {/* Star rating display */}
      <div className="flex items-center justify-center gap-0.5 mt-1">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={10} className={s <= stars ? 'text-orange-500' : 'text-gray-200'} fill={s <= stars ? 'currentColor' : 'none'} />
        ))}
        {stars === 0 && <span className="text-[8px] text-ios-gray ml-1">N/R</span>}
      </div>
    </motion.div>
  );
};

// Compact card for completed SALES (seller side)
const CompletedSaleCard = ({ tr }: any) => (
  <motion.div layout className="ios-card p-3 group cursor-default hover:shadow-lg transition-all relative overflow-hidden">
    <div className="aspect-square rounded-2xl overflow-hidden mb-2 relative">
      <img src={tr.image_url} alt={tr.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-white text-[9px] font-black truncate">{tr.title}</p>
        <p className="text-white/80 text-[9px] font-bold">€{tr.price}</p>
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-ios-blue text-white text-[8px] font-black rounded-full uppercase tracking-wide">
        Venduto
      </div>
    </div>
    <p className="text-[9px] text-center text-ios-gray font-bold truncate px-1">Accredito al 15°</p>
  </motion.div>
);

const TransactionCard = ({ tr, isSeller, t, currentUser, loading, handleShip, handleConfirmArrival, setReviewState, reviewState, handleSubmitReview }: any) => {
  const deadlineDate = new Date(tr.shipping_deadline);
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
  const isExpired = diff <= 0 && tr.status === 'paid';

  return (
    <motion.div layout className="ios-card p-8 group relative overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all border border-black/[0.02]">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden shrink-0 shadow-md">
          <img src={tr.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isSeller ? 'bg-ios-blue text-white' : 'bg-brand-start text-white'}`}>
                  {isSeller ? t('sale') : t('purchase')}
                </span>
                <span className="text-ios-gray font-bold text-xs">{t('id')} #{tr.id}</span>
              </div>
              <h4 className="text-2xl font-black tracking-tight">{tr.title}</h4>
              <p className="text-brand-start font-black text-xl">{tr.price}€</p>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${
                tr.status === 'paid' ? 'bg-orange-100 text-orange-600' :
                tr.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                tr.status === 'delivered' ? 'bg-green-100 text-green-600' :
                'bg-ios-secondary text-ios-gray'
              }`}>
                {tr.status === 'paid' ? t('to_ship') : tr.status === 'shipped' ? t('in_transit') : tr.status === 'delivered' ? t('delivered') : tr.status}
              </div>
            </div>
          </div>
          <div className="p-6 bg-ios-secondary/30 rounded-3xl border border-black/[0.03] space-y-6">
            {isSeller ? (
              <>
                {tr.status === 'paid' && (
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
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse ${
                            daysLeft <= 1 ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 
                            daysLeft <= 3 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 
                            'bg-green-500 text-white'
                          }`}>
                            <Clock size={12} />
                            {isExpired ? t('expired_badge' as any) : `${daysLeft} ${t('days_remaining' as any)}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold leading-relaxed text-ios-label bg-white/50 p-4 rounded-2xl border border-black/[0.02]">
                        {tr.buyer_name} {tr.buyer_surname}<br />
                        <span className="text-brand-end">{t('shipping_to' as any)}</span> {tr.buyer_address}<br />
                        {tr.buyer_cap}, {tr.buyer_city}<br />
                        <span className="text-ios-gray/60">{tr.buyer_email}</span>
                      </div>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleShip(tr.id, {
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
                      <button 
                        type="submit" 
                        disabled={loading}
                        className={`md:col-span-2 ios-btn-primary !py-4 !rounded-2xl shadow-lg shadow-brand-end/20 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={20} />
                            <span>{t('saving')}</span>
                          </>
                        ) : (
                          t('confirm_shipping_cta')
                        )}
                      </button>
                    </form>
                  </div>
                )}
                {tr.status === 'shipped' && (
                  <div className="space-y-3">
                    <p className="text-ios-blue font-bold text-sm tracking-tight">{t('waiting_buyer_confirm')}</p>
                    <div className="p-4 bg-ios-blue/5 rounded-2xl border border-ios-blue/10">
                      <p className="text-[10px] text-ios-blue font-bold uppercase tracking-widest mb-1">{t('tracking_for_buyer')}</p>
                      <p className="text-sm font-black">{tr.courier} • {tr.tracking_id}</p>
                    </div>
                  </div>
                )}
                {tr.status === 'delivered' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-5 bg-green-500/10 text-green-700 rounded-2xl border border-green-500/20">
                      <CheckCircle2 size={28} className="shrink-0" />
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">Oggetto Consegnato!</p>
                        <p className="text-xs font-medium opacity-80 mt-0.5">L'acquirente ha confermato la ricezione.</p>
                      </div>
                    </div>
                    <div className="p-5 bg-ios-blue/5 rounded-2xl border border-ios-blue/10 space-y-2">
                      <div className="flex items-center gap-2 text-ios-blue">
                        <Star size={16} fill="currentColor" />
                        <p className="font-black text-sm uppercase tracking-wide">Grazie per aver venduto su ReMatch!</p>
                      </div>
                      <p className="text-xs text-ios-gray font-medium leading-relaxed">
                        Il ricavato netto di <span className="font-black text-ios-label">€{tr.price}</span> verrà accreditato entro il <span className="font-black text-ios-blue">15 del mese</span> corrente o del mese successivo, al netto delle commissioni di piattaforma.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {tr.status === 'paid' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-ios-blue/10 text-ios-blue rounded-2xl">
                      <Clock size={20} className="shrink-0" />
                      <p className="font-bold text-sm">{t('order_shipped_within_5')}</p>
                    </div>
                    <p className="text-xs text-ios-gray font-medium leading-relaxed">{t('arrival_instructions')}</p>
                  </div>
                )}
                {tr.status === 'shipped' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-ios-blue/5 rounded-2xl border border-ios-blue/10">
                      <p className="text-[10px] text-ios-blue font-bold uppercase tracking-widest mb-1">{t('tracking_code')}</p>
                      <p className="text-sm font-black">{tr.courier} • {tr.tracking_id}</p>
                    </div>
                    <button
                      onClick={() => handleConfirmArrival(tr.id)}
                      className="w-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                    >
                      {t('confirm_receive')}
                    </button>
                  </div>
                )}
                {tr.status === 'delivered' && !tr.review_rating && (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-500/10 text-green-600 rounded-2xl font-black text-sm uppercase text-center border border-green-500/20">
                      {t('item_arrived')}
                    </div>

                    <form onSubmit={(e) => {
                      setReviewState({...reviewState, transactionId: tr.id});
                      handleSubmitReview(e);
                    }} className="space-y-4 pt-4 border-t border-black/[0.05]">
                      <h5 className="text-sm font-black uppercase tracking-widest text-ios-gray">{t('write_review')}</h5>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewState({...reviewState, rating: star, transactionId: tr.id})}
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
                        value={reviewState.transactionId === tr.id ? reviewState.comment : ''}
                        onChange={(e) => setReviewState({...reviewState, comment: e.target.value, transactionId: tr.id})}
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
};



export default function App() {
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'purchases' | 'sales' | 'items' | 'saved'>('overview');
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{id: string, nome: string} | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('it');

  const t = (key: keyof typeof translations['it']) => {
    return translations[currentLang][key] || translations['it'][key] || key;
  };

  const [view, setView] = useState<'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth' | 'success'>('home');
  const goTo = (v: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'auth' | 'success') => {
    window.scrollTo(0, 0);
    setView(v);
  };
  const requireAuth = (targetView: 'home' | 'sell' | 'buy' | 'dashboard' | 'checkout' | 'vetrina' | 'success') => {
    window.scrollTo(0, 0);
    if (!session) { setView('auth'); } else { setView(targetView); }
  };
  const [items, setItems] = useState<Item[]>([]);
  const [sellerItems, setSellerItems] = useState<Item[]>([]);  // All items by current seller (any status)
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topSearches, setTopSearches] = useState<{query: string, count: number}[]>([]);
  const [showAllTopSearches, setShowAllTopSearches] = useState(false);
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<{ show: boolean, title: string, body: string, type: string }>({ show: false, title: '', body: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Tutte']);
  const [maxPriceFilter, setMaxPriceFilter] = useState(5000);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState({ show: false, title: '', message: '' });
  const [showErrorModal, setShowErrorModal] = useState({ show: false, title: '', message: '' });
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] Auth event: ${event}`, session?.user?.id);
      
      setSession(session);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        // Automatically close auth panel and go to home if logged in
        if (view === 'auth') {
          setView('home');
          window.scrollTo(0, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear all user-specific data only on explicit sign out
        console.log(`[${now}] Clearing user data due to sign out`);
        setCurrentUser(null);
        setFavorites([]);
        setProposals([]);
        setTransactions([]);
        setSellerItems([]);
        setUserRequests([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    // Proactively set user from session metadata if possible
    let currentSession: any = null;
    await supabase.auth.getSession().then(({ data: { session } }) => {
      currentSession = session;
    });

    const metaNome = currentSession?.user?.user_metadata?.nome;
    if (metaNome) {
      setCurrentUser({ id: userId, nome: metaNome });
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('nome')
        .eq('id', userId)
        .single();

      if (data?.nome) {
        setCurrentUser({ id: userId, nome: data.nome });
      } else if (metaNome) {
        // If not in table but have metadata, try to insert it (resilience)
        await supabase.from('users').insert([{
          id: userId,
          nome: metaNome,
          username: metaNome.toLowerCase().replace(/\s/g, ''),
          email: currentSession?.user?.email
        }]).select();
        setCurrentUser({ id: userId, nome: metaNome });
      } else if (!currentUser) {
        setCurrentUser({ id: userId, nome: 'Utente' });
      }
    } catch (error) {
      console.error("fetchUserProfile error:", error);
      if (!currentUser && !metaNome) {
        setCurrentUser({ id: userId, nome: 'Utente' });
      }
    }
  };

  useEffect(() => {
    // Initial fetch of public items
    fetchItems();
    
    // Top searches only once
    fetchTopSearches();
  }, []);

  useEffect(() => {
    // Fetch user-specific data when user changes
    if (currentUser) {
      notificationService.init(currentUser.id);
      notificationService.onNotification((data) => {
        console.log("Notification received, refreshing data...", data);
        setShowNotificationModal({ 
          show: true, 
          title: data.title, 
          body: data.body, 
          type: data.type 
        });
        fetchData();
      });
      fetchUserRelatedData(currentUser.id);
    }
    
    return () => {
      if (currentUser) {
        notificationService.disconnect();
      }
    };
  }, [currentUser]);

  useEffect(() => {
    // Filtered items fetch - triggered by debounced search or view changes
    fetchItems();
  }, [view, debouncedSearchQuery, selectedCategories, maxPriceFilter]);

  const fetchTopSearches = async () => {
    if (topSearches.length > 0) return;
    try {
      const { data: sampleReqs } = await supabase
        .from('requests')
        .select('query')
        .eq('status', 'active')
        .limit(200);
      
      const searchCounts: Record<string, number> = {};
      (sampleReqs || []).forEach(r => {
        const q = r.query?.toLowerCase().trim();
        if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
      });
      const top = Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopSearches(top);
    } catch (e) {
      console.error("Top searches error:", e);
    }
  };

  const fetchItems = async () => {
    // If we have items and no active filter, don't re-fetch unless on vetrina/home
    if (items.length > 0 && !debouncedSearchQuery && selectedCategories.includes('Tutte') && maxPriceFilter === 5000 && view !== 'home' && view !== 'vetrina') {
      return;
    }

    try {
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] Attempting to fetch items...`);
      
      let allItems = [];
      let fetchSource = 'Local API';

      try {
        // Step 1: Try Local Proxy first (faster and handles pool better)
        const localRes = await fetch('/api/items', { signal: AbortSignal.timeout(30000) });
        if (localRes.ok) {
          allItems = await localRes.json();
        } else {
          throw new Error('Local API failed');
        }
      } catch (proxyErr) {
        // Step 2: Fallback to Direct Supabase
        console.warn(`[${now}] Local API unavailable, falling back to direct Supabase...`);
        fetchSource = 'Supabase Direct';
        const { data, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .or('status.eq.available,status.is.null')
          .limit(50);
        
        if (itemsError) throw itemsError;
        allItems = data || [];
      }
      
      console.log(`[${now}] Found ${allItems.length} items from ${fetchSource}.`);
      
      let filteredItems = allItems;
      if (debouncedSearchQuery || (!selectedCategories.includes('Tutte') && selectedCategories.length > 0) || maxPriceFilter < 5000) {
        filteredItems = filteredItems.filter((item: any) => {
          const matchesSearch = !debouncedSearchQuery ||
            item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

          const matchesCategory = selectedCategories.includes('Tutte') ||
                                 selectedCategories.length === 0 ||
                                 selectedCategories.includes(item.category);

          const matchesPrice = item.price <= maxPriceFilter;

          return matchesSearch && matchesCategory && matchesPrice;
        });
      }
      setItems(filteredItems);
    } catch (err) {
      console.error("Items fetch error:", err);
    }
  };

  useEffect(() => {
    if (selectedItem?.id) {
      fetch(`/api/items/${selectedItem.id}/view`, { method: 'POST' }).catch(console.error);
      // Optimistically increment for current session view
      setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, views_count: (i.views_count || 0) + 1 } : i));
    }
  }, [selectedItem?.id]);

  const fetchUserRelatedData = async (forcedId?: string) => {
    const userId = forcedId || session?.user?.id;
    if (!userId) return;
    const now = new Date().toLocaleTimeString();
    
    console.log(`[${now}] Dash: Starting parallel data fetching...`);
    
    // Parallelize ALL user-specific data fetching
    try {
      await Promise.all([
        // 1. Fetch Requests & Proposals
        (async () => {
          try {
            const { data: reqData } = await supabase.from('requests').select('*').eq('buyer_id', userId).eq('status', 'active');
            if (reqData) {
              setUserRequests(reqData);
              if (reqData.length > 0) {
                const { data: props } = await supabase.from('proposals').select('*, items(*)').eq('status', 'pending').in('request_id', reqData.map(r => r.id));
                if (props) setProposals(props.map(p => ({ ...p.items, proposal_id: p.id, request_id: p.request_id, item_id: p.item_id, status: p.status, expires_at: p.expires_at })));
              }
            }
          } catch (e) { console.error("Dash: Req error:", e); }
        })(),
        // 2. Fetch Favorites
        (async () => {
          try {
            const { data: favData } = await supabase.from('favorites').select('item_id, items(*)').eq('user_id', userId);
            if (favData) {
              setFavorites(favData.map(f => (Array.isArray(f.items) ? f.items[0] : f.items)).filter(Boolean));
            }
          } catch (e) { console.error("Dash: Fav error:", e); }
        })(),
        // 3. Fetch Transactions
        (async () => {
          try {
            const { data: transData, error: transErr } = await supabase.from('transactions').select('*').or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order('created_at', { ascending: false }).limit(20);
            if (transErr) console.error("Dash: Trans error:", transErr);
            setTransactions(transData || []);
          } catch (e) { console.error("Dash: Trans catch:", e); }
        })(),
        // 4. Fetch Seller (My) Items
        (async () => {
          try {
            const { data: sItems, error: sErr } = await supabase.from('items').select('*').eq('seller_id', userId).limit(50);
            if (sErr) console.error("Dash: Seller items error:", sErr);
            setSellerItems(sItems || []);
          } catch (e) { console.error("Dash: Seller catch:", e); }
        })(),
        // 5. Fetch Messages
        (async () => {
          try {
            const { data: msgs } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: true });
            if (msgs) setMessages(msgs);
          } catch (e) { console.error("Dash: Msgs error:", e); }
        })()
      ]);
      console.log(`[${now}] Dash: Parallel fetching completed.`);
    } catch (err) {
      console.error("Critical parallel fetch error:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchItems(),
        fetchUserRelatedData(),
        fetchTopSearches()
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      setShowSuccessModal({
        show: true,
        title: t('success_title' as any),
        message: t('notifications_enabled_success' as any)
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      notificationService.disconnect();
      setSession(null);
      setCurrentUser(null);
      setFavorites([]);
      setProposals([]);
      setTransactions([]);
      setUserRequests([]);
      setSellerItems([]);
      setView('home');
      try {
        window.scrollTo(0, 0);
      } catch (err) {
        console.error("Logout error:", err);
        // Force local logout even if server fails
        setSession(null);
        setCurrentUser(null);
        setView('home');
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Force local logout even if server fails
      setSession(null);
      setCurrentUser(null);
      setView('home');
    }
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
      setShowSuccessModal({
        show: true,
        title: "Account Eliminato",
        message: "Il tuo account è stato rimosso con successo. Ci dispiace vederti andare via!"
      });
      goTo('home');
    } catch (err: any) {
      console.error(err);
      setShowErrorModal({
        show: true,
        title: "Errore",
        message: "Non è stato possibile eliminare l'account. Riprova più tardi."
      });
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

  // fetchData is now a combined utility, removing the old standalone implementation below


  const runMatching = async (specificRequestId?: number, specificItemId?: number) => {
    try {
      let requestsData = [];
      let itemsData = [];

      if (specificRequestId) {
        const { data } = await supabase.from('requests').select('*').eq('id', specificRequestId);
        requestsData = data || [];
        const { data: itms } = await supabase.from('items').select('id, title, description, price, location, seller_id').eq('status', 'available').limit(500);
        itemsData = itms || [];
      } else if (specificItemId) {
        const { data } = await supabase.from('items').select('id, title, description, price, location, seller_id').eq('id', specificItemId).eq('status', 'available');
        itemsData = data || [];
        const { data: reqs } = await supabase.from('requests').select('*').eq('status', 'active').limit(500);
        requestsData = reqs || [];
      } else {
        // Fallback to minimal full matching if necessary, but limit it
        const { data: reqs } = await supabase.from('requests').select('*').eq('status', 'active').limit(100);
        requestsData = reqs || [];
        const { data: itms } = await supabase.from('items').select('id, title, description, price, location, seller_id').eq('status', 'available').limit(100);
        itemsData = itms || [];
      }

      if (!requestsData.length || !itemsData.length) return 0;

      // Fetch only potentially relevant proposals to avoid full table scan
      const reqIds = requestsData.map(r => r.id);
      const itemIds = itemsData.map(i => i.id);
      
      const { data: existingProposals } = await supabase
        .from('proposals')
        .select('request_id, item_id')
        .in('request_id', reqIds)
        .in('item_id', itemIds);

      let matchesCreated = 0;
      for (const req of requestsData) {
        for (const item of itemsData) {
          if (item.seller_id === req.buyer_id) continue;
          
          const query = req.query.toLowerCase();
          const title = item.title.toLowerCase();
          const desc = item.description.toLowerCase();

          if (title.includes(query) || desc.includes(query)) {
            if ((req.min_price === 0 || item.price >= req.min_price) &&
                (req.max_price === 0 || item.price <= req.max_price)) {

              const exists = existingProposals?.some((p: any) => p.request_id === req.id && p.item_id === item.id);
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
      alert("Per favor inserisci almeno un titolo e un prezzo.");
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
        setShowSuccessModal({
          show: true,
          title: t('success_title' as any),
          message: t('item_published_success' as any)
        });
      } else {
        const { data: insertedItem, error } = await supabase.from('items').insert({
          title: newItem.title,
          description: newItem.description,
          price: parseFloat(newItem.price),
          location: newItem.location,
          category: newItem.category,
          image_url: imagePreviews[0] || newItem.image_url,
          images: imagePreviews.length > 0 ? imagePreviews : [newItem.image_url],
          seller_id: (session?.user?.id || ''),
          status: 'available'
        }).select('id').single();

        if (error) throw error;
        if (insertedItem) await runMatching(undefined, insertedItem.id);
        setShowSuccessModal({
          show: true,
          title: t('success_title' as any),
          message: t('item_published_success' as any)
        });
      }

      requireAuth('dashboard');
      setNewItem({ title: '', description: '', price: '', location: '', category: 'Altro', image_url: 'https://picsum.photos/seed/item/400/300', images: [] });
      setImagePreviews([]);
      setIsEditingItem(false);
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setShowErrorModal({
        show: true,
        title: "Errore Pubblicazione",
        message: err.message || "Non è stato possibile pubblicare l'annuncio. Riprova più tardi."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    setItemToDelete(itemId);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemToDelete);
      setShowSuccessModal({
        show: true,
        title: "Annuncio Eliminato",
        message: "L'annuncio è stato rimosso definitivamente dal marketplace."
      });
      setSelectedItem(null);
      await fetchData();
    } catch (err: any) {
      setShowErrorModal({
        show: true,
        title: "Errore Eliminazione",
        message: err.message || "Non è stato possibile eliminare l'annuncio."
      });
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: insertedReq, error } = await supabase.from('requests').insert({
        query: newRequest.query,
        min_price: parseFloat(newRequest.min_price) || 0,
        max_price: parseFloat(newRequest.max_price) || 0,
        location: newRequest.location,
        buyer_id: (session?.user?.id || ''),
        status: 'active'
      }).select('id').single();

      if (error) throw error;

      if (insertedReq) await runMatching(insertedReq.id);
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
    if (!session || !currentUser) { setView('auth'); return; }
    
    // Optimistic Update
    const isCurrentlyFav = favorites.some(f => f.id === itemId);
    const itemToToggle = items.find(i => i.id === itemId) || (isCurrentlyFav ? favorites.find(f => f.id === itemId) : null);
    
    if (isCurrentlyFav) {
      setFavorites(prev => prev.filter(f => f.id !== itemId));
    } else if (itemToToggle) {
      setFavorites(prev => [...prev, itemToToggle]);
    }

    try {
      const { data: locals } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('item_id', itemId);
      
      const existing = locals?.[0];

      if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
      } else {
        await supabase.from('favorites').insert({ user_id: currentUser.id, item_id: itemId });
      }
      // Re-fetch to ensure sync with server, but UI already updated
      await fetchData();
    } catch (err) {
      console.error("Toggle favorite error:", err);
      // Rollback on error
      fetchData();
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
    if (!activeProposal || !currentUser) {
      setShowErrorModal({
        show: true,
        title: "Accesso Richiesto",
        message: "Devi essere loggato per procedere al pagamento."
      });
      return;
    }
    setLoading(true);
    console.log("Starting Checkout (Supabase direct)...", { activeProposal, shippingDetails });
    try {
      // Calculate shipping deadline (5 days)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const proposalId = activeProposal.proposal_id && activeProposal.proposal_id > 0
        ? activeProposal.proposal_id
        : null;

      // Insert transaction directly via Supabase
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert([{
          proposal_id: proposalId,
          buyer_id: currentUser.id,
          seller_id: activeProposal.seller_id,
          item_id: activeProposal.item_id,
          buyer_name: String(shippingDetails.name || ''),
          buyer_surname: String(shippingDetails.surname || ''),
          buyer_email: String(shippingDetails.email || ''),
          buyer_phone: String(shippingDetails.phone || ''),
          buyer_address: String(shippingDetails.address || ''),
          buyer_city: String(shippingDetails.city || ''),
          buyer_cap: String(shippingDetails.cap || ''),
          shipping_deadline: deadline.toISOString(),
          status: 'paid',
          title: String(activeProposal.title || ''),
          price: parseFloat(String(activeProposal.price)) || 0,
          category: String(activeProposal.category || ''),
          image_url: String(activeProposal.image_url || ''),
          images: activeProposal.images || []
        }])
        .select('id')
        .single();

      if (txError) {
        console.error("Transaction insert error:", txError);
        throw new Error(txError.message || JSON.stringify(txError));
      }

      console.log("Transaction created:", txData);

      // Update proposal status if exists
      if (proposalId) {
        await supabase.from('proposals').update({ status: 'accepted' }).eq('id', proposalId);
      }

      // Mark item as sold
      await supabase.from('items').update({ status: 'sold' }).eq('id', activeProposal.item_id);

      // If purchase came from a match, clean up request and proposals
      if (activeProposal.request_id && activeProposal.request_id > 0) {
        await supabase.from('proposals').delete().eq('request_id', activeProposal.request_id);
        await supabase.from('requests').delete().eq('id', activeProposal.request_id);
      }

      console.log("Checkout Success!");
      setView('success');
      await fetchData();
    } catch (err: any) {
      console.error("Checkout Error:", err);
      const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setShowErrorModal({
        show: true,
        title: "Errore Checkout",
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (transactionId: number, trackingInfo: { tracking_id: string, courier: string, seller_iban: string }) => {
    if (!transactionId) {
      setShowErrorModal({
        show: true,
        title: "Errore",
        message: "ID Transazione non trovato."
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'shipped',
          tracking_id: trackingInfo.tracking_id,
          courier: trackingInfo.courier,
          seller_iban: trackingInfo.seller_iban,
          shipped_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw new Error(error.message);
      
      setShowSuccessModal({
        show: true,
        title: t('success_title' as any),
        message: t('shipping_success_msg' as any)
      });
      await fetchData();
    } catch (err: any) {
      console.error("SHIPMENT ERROR:", err);
      const msg = typeof err === 'string' ? err : (err?.message || "Errore durante la spedizione.");
      setShowErrorModal({
        show: true,
        title: "Errore Spedizione",
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArrival = async (transactionId: number) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'delivered' })
        .eq('id', transactionId);

      if (error) throw new Error(error.message);

      setShowSuccessModal({
        show: true,
        title: t('success_title' as any),
        message: t('delivery_success_msg' as any)
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      const msg = typeof err === 'string' ? err : (err?.message || "Errore durante la conferma.");
      setShowErrorModal({
        show: true,
        title: "Errore Conferma",
        message: msg
      });
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

      setShowSuccessModal({
        show: true,
        title: t('success_title' as any),
        message: t('review_success_msg' as any)
      });
      setReviewState({ rating: 0, comment: '', transactionId: null });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const saveCurrentSearch = async () => {
    if (!session) { setView('auth'); return; }
    if (!searchQuery) return;
    setLoading(true);
    try {
      const { data: insertedReq, error } = await supabase.from('requests').insert({
        buyer_id: (session?.user?.id || ''),
        query: searchQuery,
        min_price: 0,
        max_price: 0,
        location: 'Tutte le città',
        status: 'active'
      }).select('id').single();

      if (error) throw error;
      if (insertedReq) await runMatching(insertedReq.id);
      
      setShowSuccessModal({
        show: true,
        title: "Ricerca Salvata",
        message: "Ti avviseremo tramite notifica appena troveremo un match perfetto!"
      });
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
        className="sticky top-0 z-50 bg-black px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5"
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

       <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-6 sm:pt-20 sm:pb-10">
        {view === 'auth' && (
          <div className="pt-10">
            <Auth onLogin={(id, nome) => {
              setCurrentUser({ id, nome });
              goTo('home');
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
              className="space-y-12 -mx-4 sm:-mx-6 -mt-20 sm:-mt-32"
            >
              {/* Hero */}
              <section className="relative overflow-hidden sm:rounded-b-[2.5rem] bg-black text-white min-h-[90vh] sm:min-h-[80vh] flex flex-col items-center justify-start text-center px-6 pt-16 pb-20 max-w-[1900px] mx-auto shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                {/* Visual elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-orange-500/20 rounded-full blur-[180px]" 
                  />
                  <motion.div 
                    animate={{ 
                      scale: [1.2, 1, 1.2],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-orange-600/15 rounded-full blur-[180px]" 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,165,0,0.08)_0%,transparent_70%)]" />
                </div>
                                <div className="relative z-10 max-w-4xl w-full space-y-12 mt-16 sm:mt-24">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <motion.div 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="flex justify-center flex-col items-center gap-4"
                      >
                        <img 
                          src="/logo.png" 
                          alt="ReMatch Logo" 
                          className="h-32 sm:h-44 md:h-64 w-auto object-contain hover:scale-105 transition-transform duration-700 filter drop-shadow-[0_0_50px_rgba(255,165,0,0.4)]"
                        />
                      </motion.div>
                      <div className="flex flex-col gap-2">
                        <p className="text-2xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
                          {t('home_subtitle' as any) || 'Diamo nuova vita alle tue cose'}
                        </p>
                        <p className="text-lg sm:text-xl text-white/50 font-medium max-w-2xl mx-auto leading-relaxed">
                          {t('home_payoff' as any) || 'Semplice, veloce, sicuro. Trasforma in valore ciò che non usi più.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button 
                      onClick={() => requireAuth('sell')} 
                      className="w-full sm:w-auto px-12 py-5 bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all active:scale-95 shadow-[0_20px_60px_-10px_rgba(255,100,0,0.5)] flex items-center justify-center gap-3"
                    >
                      <Tag size={22} />
                      {t('hero_start_selling')}
                    </button>
                    <button 
                      onClick={() => requireAuth('buy')} 
                      className="w-full sm:w-auto px-12 py-5 bg-white/10 backdrop-blur-3xl border border-white/20 text-white rounded-2xl font-black text-lg hover:bg-white/20 hover:border-orange-500/50 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Search size={22} />
                      {t('search_cta')}
                    </button>
                  </div>

                  {/* Hero AI Search Box */}
                  <div id="hero-search-box" className="ios-card bg-white/5 backdrop-blur-2xl border-white/10 p-2 sm:p-3 rounded-[2rem] max-w-2xl mx-auto mt-8 group focus-within:border-orange-500/50 transition-all duration-500">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-orange-500 transition-colors" size={20} />
                        <input
                          type="text"
                          placeholder="Cosa cerchi oggi?"
                          className="w-full pl-14 pr-12 py-5 bg-transparent rounded-2xl focus:outline-none text-lg font-bold placeholder:text-white/50 text-white"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (setDebouncedSearchQuery(searchQuery), fetchData())}
                        />
                        {searchQuery && (
                          <button 
                            onClick={() => saveCurrentSearch()}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                          >
                            <Heart size={20} />
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setDebouncedSearchQuery(searchQuery);
                          fetchData();
                          // Scroll to results
                          setTimeout(() => {
                            const itemsSection = document.getElementById('marketplace-items');
                            itemsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }} 
                        className="px-10 py-5 bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 text-white font-black rounded-[1.5rem] hover:scale-105 transition-all shadow-xl shadow-orange-600/40 ring-2 ring-orange-500/20 active:scale-95"
                      >
                        Match Now
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Vetrina in container */}
              <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
                {/* Vetrina Anteprima */}
                <section id="marketplace-items" className="space-y-5 sm:space-y-6 scroll-mt-24">
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
                        <div className="p-3 sm:p-4 space-y-2">
                          <h4 className="font-bold text-sm truncate">{item.title}</h4>
                          <div className="flex items-center justify-between text-[10px] text-ios-gray">
                            <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>
                            <div className="flex items-center gap-2 font-bold bg-black/[0.03] px-2 py-0.5 rounded-full">
                              <span className="flex items-center gap-0.5"><Eye size={10} /> {item.views_count || 0}</span>
                              <span className="flex items-center gap-0.5"><Heart size={10} /> {item.LikeCount || 0}</span>
                            </div>
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
            </div>
          </motion.div>
          )}

          {view === 'sell' && (
            <motion.div
              key="sell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto w-full relative"
            >
              <div className="ios-card space-y-0 overflow-hidden shadow-2xl relative border border-white/10 glass-card">
                 <div className="relative bg-gradient-to-br from-brand-start to-brand-end p-12 sm:p-24 flex flex-col items-center text-center space-y-4 overflow-hidden">
                   {/* Mesmerizing Background Elements */}
                   <motion.div 
                     animate={{ 
                       x: [0, 50, 0], 
                       y: [0, -30, 0],
                       scale: [1, 1.2, 1] 
                     }}
                     transition={{ duration: 10, repeat: Infinity }}
                     className="absolute -top-[20%] -right-[10%] w-[300px] h-[300px] bg-white/20 blur-[80px] rounded-full"
                   />
                   <motion.div 
                     animate={{ 
                       x: [0, -40, 0], 
                       y: [0, 20, 0],
                       scale: [1.2, 1, 1.2] 
                     }}
                     transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                     className="absolute -bottom-[20%] -left-[10%] w-[250px] h-[250px] bg-brand-start blur-[80px] rounded-full opacity-60"
                   />
                   
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="z-10 flex flex-col items-center"
                   >
                     <h2 className="text-4xl sm:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">{t('sell_title')}</h2>
                     <p className="text-white/80 font-bold max-w-sm text-lg sm:text-2xl mt-2 leading-tight italic uppercase tracking-widest">{t('sell_desc')}</p>
                   </motion.div>
                 </div>
                
                <div className="p-5 sm:p-10 space-y-8">
                  <form onSubmit={handleSell} className="space-y-6 sm:space-y-8">
                    {/* Photos content remains identical, just ensuring correct structure */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="rm-label">{t('item_photos')}</label>
                        <span className="text-ios-gray text-[10px] font-black uppercase tracking-widest">{imagePreviews.length}/3 {t('photos_count')}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {imagePreviews.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group">
                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-xl text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                            {idx === 0 && (
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-end text-white text-[8px] font-black uppercase rounded-md shadow-sm">
                                {t('main_photo')}
                              </div>
                            )}
                          </div>
                        ))}
                        {imagePreviews.length < 3 && (
                          <label className="aspect-square bg-ios-secondary rounded-2xl border-2 border-dashed border-ios-gray/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-ios-secondary/80 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-end shadow-md group-hover:scale-105 transition-transform"><Plus size={20} /></div>
                            <p className="text-ios-gray text-[10px] font-black uppercase tracking-wider">{t('add')}</p>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="rm-label">{t('title')}</label>
                      <input required type="text" placeholder={t('placeholder_title')} className="rm-input-lg" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                    </div>

                    <div className="space-y-4">
                      <label className="rm-label">{t('description')}</label>
                      <textarea required rows={4} placeholder={t('placeholder_desc')} className="rm-input-lg resize-none" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="rm-label">{t('price')} (€)</label>
                        <input required type="number" placeholder="0.00" className="rm-input-lg" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                        <label className="rm-label">{t('category')}</label>
                        <div className="relative">
                          <select
                            required
                            className="rm-input-lg appearance-none w-full"
                            value={newItem.category}
                            onChange={e => setNewItem({...newItem, category: e.target.value})}
                          >
                            <option value="">{t('all')}</option>
                            {CATEGORIES.filter(c => c !== 'Tutte').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ios-gray">
                            <ChevronRight className="rotate-90" size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
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

                    <button type="submit" disabled={loading || imagePreviews.length === 0} className="ios-btn-primary w-full flex items-center justify-center gap-3 text-lg py-5 shadow-xl shadow-brand/40 uppercase tracking-widest font-black">
                      {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Tag size={22} />}
                      {t('put_in_sale')}
                    </button>

                    {isEditingItem && (
                      <button type="button" onClick={() => { setIsEditingItem(false); setView('dashboard'); }} className="w-full text-ios-gray font-bold text-sm py-2">Annulla</button>
                    )}
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'buy' && (
            <motion.div
              key="buy"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto w-full relative"
            >
              <div className="ios-card space-y-0 overflow-hidden shadow-2xl relative">
                <div className="relative bg-gradient-to-br from-brand-start to-brand-end p-10 sm:p-20 flex flex-col items-center text-center space-y-4 overflow-hidden">
                  {/* Decorative animated glow */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/20 blur-[100px] rounded-full pointer-events-none"
                  />
                  <motion.div 
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-brand-start blur-[100px] rounded-full pointer-events-none opacity-50"
                  />
                  
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-2xl z-10">{t('buy_title')}</h2>
                  <p className="text-white/80 font-bold max-w-sm text-lg sm:text-xl z-10 leading-relaxed italic">{t('buy_desc')}</p>
                </div>
                
                <div className="p-5 sm:p-10 space-y-8">
                  <form onSubmit={handleBuy} className="space-y-6 sm:space-y-8">
                    <div className="space-y-4">
                      <label className="rm-label">{t('what_looking_for')}</label>
                      <input required type="text" placeholder={t('placeholder_buy_title')} className="rm-input-lg" value={newRequest.query} onChange={e => setNewRequest({...newRequest, query: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="rm-label">{t('max_price_label')}</label>
                        <input type="number" placeholder={t('no_limit')} className="rm-input-lg" value={newRequest.max_price} onChange={e => setNewRequest({...newRequest, max_price: e.target.value})} />
                      </div>
                      <div className="space-y-4">
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

                    <button type="submit" disabled={loading} className="ios-btn-primary w-full flex items-center justify-center gap-3 text-lg py-5 shadow-xl shadow-brand/40 uppercase tracking-widest font-black">
                      {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={22} />}
                      {t('create_match_search')}
                    </button>
                    
                    <button type="button" onClick={() => setView('home')} className="w-full text-ios-gray font-bold text-sm py-2">Annulla</button>
                  </form>
                </div>
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
                  <form 
                    noValidate 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const getVal = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value || '';
                      
                      const details = {
                        name: getVal('name'),
                        surname: getVal('surname'),
                        email: getVal('email'),
                        phone: getVal('phone'),
                        address: getVal('address'),
                        city: getVal('city'),
                        cap: getVal('cap')
                      };

                      // Basic validation check before calling handleCheckout
                      if (!details.name || !details.email || !details.address) {
                        alert("Per favore completa i campi obbligatori.");
                        return;
                      }

                      handleCheckout(details);
                  }} className="space-y-4 sm:space-y-6">
                   <div className="flex justify-end">
                     <button 
                       type="button" 
                       onClick={(e) => {
                         const form = (e.target as HTMLElement).closest('form');
                         if (form) {
                           const setVal = (name: string, val: string) => {
                             const el = form.elements.namedItem(name) as HTMLInputElement;
                             if (el) el.value = val;
                           };
                           setVal('name', 'Mario');
                           setVal('surname', 'Rossi');
                           setVal('email', 'mario.rossi@example.com');
                           setVal('phone', '+39 333 1234567');
                           setVal('address', 'Via Roma 123');
                           setVal('city', 'Milano');
                           setVal('cap', '20121');
                         }
                       }}
                       className="text-[10px] font-black uppercase tracking-widest text-brand-start bg-brand-start/10 px-3 py-1.5 rounded-lg hover:bg-brand-start/20 transition-all border border-brand-start/20"
                     >
                       ⚡ Simula Dati Demo
                     </button>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <input name="name" required placeholder={t('name')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                     <input name="surname" required placeholder={t('surname')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                   </div>
                   <input name="email" type="text" required placeholder="Email" className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                   <input name="phone" required placeholder={t('phone')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                   <input name="address" required placeholder={t('address')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <input name="city" required placeholder={t('city')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                     <input name="cap" required placeholder={t('cap')} className="w-full px-6 py-4 bg-ios-secondary/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-ios-blue/10 transition-all font-bold placeholder:text-ios-gray/40" />
                   </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`ios-btn-primary w-full text-base sm:text-lg flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        <span>{t('publishing')}</span>
                      </>
                    ) : (
                      t('payment_confirm') + " (Demo)"
                    )}
                  </button>
                  <button type="button" onClick={() => setView('home')} className="w-full py-3 text-ios-gray text-sm font-bold hover:text-ios-label transition-colors">
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
              className="space-y-10"
            >
              <div className="ios-card space-y-0 overflow-hidden shadow-2xl relative border border-white/10 glass-card">
                 <div className="relative bg-gradient-to-br from-brand-start to-brand-end p-12 sm:p-20 flex flex-col items-center text-center space-y-4 overflow-hidden">
                   {/* Mesmerizing Background Elements */}
                   <motion.div 
                     animate={{ 
                       x: [0, 80, 0], 
                       y: [0, -40, 0],
                       scale: [1, 1.4, 1] 
                     }}
                     transition={{ duration: 15, repeat: Infinity }}
                     className="absolute -top-[50%] -right-[20%] w-[500px] h-[500px] bg-white/20 blur-[100px] rounded-full pointer-events-none"
                   />
                   <motion.div 
                     animate={{ 
                       x: [0, -70, 0], 
                       y: [0, 50, 0],
                       scale: [1.4, 1, 1.4] 
                     }}
                     transition={{ duration: 18, repeat: Infinity, delay: 2 }}
                     className="absolute -bottom-[40%] -left-[20%] w-[450px] h-[450px] bg-brand-start blur-[100px] rounded-full opacity-60 pointer-events-none"
                   />
                   
                   <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="z-10 flex flex-col items-center"
                   >
                     <h2 className="text-4xl sm:text-7xl font-black tracking-tighter text-white drop-shadow-2xl translate-y-2 uppercase">{t('dashboard_title')}</h2>
                     <div className="flex items-center gap-2 mt-6 bg-black/20 backdrop-blur-xl px-6 py-2.5 rounded-2xl border border-white/10 shadow-ios">
                       <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                       <span className="text-white text-base sm:text-xl font-black tracking-widest uppercase">{currentUser?.nome}</span>
                     </div>
                     {!notificationsEnabled && (
                       <button
                         onClick={handleEnableNotifications}
                         className="mt-6 px-5 py-2.5 bg-white/10 text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 hover:scale-105 transition-all shadow-lg border border-white/5"
                       >
                         <Bell size={14} />
                         {t('enable_notif')}
                       </button>
                     )}
                   </motion.div>
                 </div>
               </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:sticky sm:top-[72px] z-20 transition-all">
                {[
                  { id: 'overview', label: t('tab_overview'), icon: LayoutGrid },
                  { id: 'items', label: t('tab_items'), icon: Box },
                  { id: 'purchases', label: t('tab_purchases'), icon: ShoppingBag },
                  { id: 'sales', label: t('tab_sales'), icon: Tag },
                  { id: 'saved', label: t('tab_saved'), icon: Heart }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDashboardTab(tab.id as any)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap transition-all font-black text-sm ${dashboardTab === tab.id ? 'bg-gradient-to-br from-brand-start to-brand-end text-white scale-105 shadow-brand' : 'bg-ios-secondary text-ios-gray hover:text-ios-label hover:shadow-lg hover:-translate-y-0.5'}`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {dashboardTab === 'overview' && (
                  <motion.div 
                    key="overview"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-10"
                  >
                    {/* Stats Box */}
                    <div className="stat-card-brand space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="rm-section-title !text-white">{t('my_stats')}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                          <TrendingUp size={12} />
                          <span>{t('top_seller')}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                        {[
                          { label: t('active_listings' as any), val: sellerItems.filter(i => i.status === 'available').length },
                          { label: t('sold_products' as any), val: transactions.filter(tr => tr.seller_id === (session?.user?.id || '')).length },
                          { label: t('purchased_products' as any), val: transactions.filter(tr => tr.buyer_id === (session?.user?.id || '')).length },
                          { label: t('active_searches'), val: userRequests.length },
                          { label: t('matches_found'), val: proposals.length },
                          { label: t('reliability'), val: '9.8' }
                        ].map((stat, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className="text-3xl font-black">{stat.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* My Searches */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="rm-section-title">{t('my_searches')}</h3>
                        <span className="text-ios-gray text-xs font-medium">{userRequests.length} {t('active')}</span>
                      </div>

                      {userRequests.length === 0 ? (
                        <div className="ios-card p-12 border-2 border-dashed border-ios-gray/10 flex flex-col items-center justify-center text-center space-y-3">
                          <Search size={24} className="text-ios-gray/20" />
                          <p className="text-ios-gray text-xs">{t('no_saved_searches')}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userRequests.map((req) => (
                            <div key={req.id} className="ios-card p-5 flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-ios-blue/10 text-ios-blue rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <Search size={20} />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-base tracking-tight text-ios-label">"{req.query}"</p>
                                  <p className="text-[10px] text-ios-gray font-black uppercase tracking-widest bg-ios-secondary px-2 py-0.5 rounded-full inline-block">
                                    {req.location} • {req.max_price > 0 ? `${t('up_to')} €${req.max_price}` : t('any_price')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setNewRequest({ query: req.query, min_price: 0, max_price: req.max_price, location: req.location });
                                    deleteRequest(req.id);
                                    setView('buy');
                                  }}
                                  className="p-2 text-ios-gray hover:text-ios-blue transition-colors rounded-lg"
                                >
                                  <RefreshCw size={18} />
                                </button>
                                <button
                                  onClick={() => deleteRequest(req.id)}
                                  className="p-2 text-ios-gray hover:text-red-500 transition-colors rounded-lg"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggested Matches */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="rm-section-title">{t('suggested_matches')}</h3>
                        <span className="px-3 py-1 bg-brand-end text-white text-[10px] font-black rounded-full shadow-lg shadow-brand-end/20">
                          {proposals.length} {t('new_notif')}
                        </span>
                      </div>

                      {proposals.length === 0 ? (
                        <div className="ios-card p-12 border-2 border-dashed text-center">
                          <p className="text-ios-gray text-xs">{t('no_matches')}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {proposals.map((prop) => (
                            <motion.div layout key={prop.proposal_id} className="ios-card p-5 flex gap-5 group items-center">
                              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
                                <img src={prop.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/5" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h4 className="font-bold text-base truncate">{prop.title}</h4>
                                  <p className="text-brand-end font-black">€{prop.price}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => respondToProposal(prop, 'accepted')} className="flex-1 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-lg shadow-sm">Accetta</button>
                                  <button onClick={() => respondToProposal(prop, 'rejected')} className="flex-1 py-1.5 bg-ios-secondary text-ios-gray text-[10px] font-black rounded-lg">Rifiuta</button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Final - Logout and Delete */}
                    <div className="pt-10 border-t border-ios-gray/10 space-y-4">
                      <button 
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full py-4 bg-white text-ios-label font-bold rounded-2xl border border-ios-gray/10 hover:bg-ios-secondary transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut size={18} />
                        {t('logout_cta')}
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-4 text-red-500 font-bold text-sm hover:underline"
                      >
                        {t('delete_account_cta')}
                      </button>
                    </div>

                    {/* How it works */}
                    <div className="ios-card p-8 bg-ios-secondary/50 border-none">
                      <h3 className="rm-section-title mb-6">{t('how_it_works')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                          { step: 1, icon: <LayoutGrid size={24} />, text: t('step1') },
                          { step: 2, icon: <RefreshCw size={24} />, text: t('step2') },
                          { step: 3, icon: <CheckCircle2 size={24} />, text: t('step3') }
                        ].map((s) => (
                          <div key={s.step} className="flex flex-col items-center text-center space-y-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-end shadow-sm border border-black/[0.03]">
                              {s.icon}
                            </div>
                            <p className="text-[11px] font-bold text-ios-gray uppercase tracking-widest">{s.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {dashboardTab === 'purchases' && (
                  <motion.div 
                    key="purchases"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('tab_purchases')}</h3>
                      <span className="text-ios-gray text-xs font-medium">
                        {transactions.filter(t => t.buyer_id === currentUser?.id).length} ordini totali
                      </span>
                    </div>

                    {/* Active */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ios-gray">In Corso</h4>
                      {transactions.filter(t => t.buyer_id === currentUser?.id && !['completed', 'cancelled'].includes(t.status) && !(t.status === 'delivered' && t.review_rating)).length === 0 ? (
                        <div className="ios-card p-12 border-2 border-dashed text-center">
                          <p className="text-ios-gray text-xs">Nessun acquisto in corso.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {transactions
                            .filter(t => t.buyer_id === currentUser?.id && !['completed', 'cancelled'].includes(t.status) && !(t.status === 'delivered' && t.review_rating))
                            .map(tr => (
                            <TransactionCard key={tr.id} tr={tr} isSeller={false} t={t} currentUser={currentUser} loading={loading} handleShip={handleShip} handleConfirmArrival={handleConfirmArrival} setReviewState={setReviewState} reviewState={reviewState} handleSubmitReview={handleSubmitReview} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completed */}
                    {transactions.filter(t => t.buyer_id === currentUser?.id && (t.status === 'completed' || (t.status === 'delivered' && t.review_rating))).length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ios-gray">Completati</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                          {transactions
                            .filter(t => t.buyer_id === currentUser?.id && (t.status === 'completed' || (t.status === 'delivered' && t.review_rating)))
                            .map(tr => <CompletedPurchaseCard key={tr.id} tr={tr} t={t} />)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {dashboardTab === 'sales' && (
                  <motion.div 
                    key="sales"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('tab_sales')}</h3>
                      <span className="text-ios-gray text-xs font-medium">
                        {transactions.filter(t => t.seller_id === currentUser?.id).length} vendite totali
                      </span>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ios-gray">Ordini Ricevuti</h4>
                      {transactions.filter(t => t.seller_id === currentUser?.id && !['completed', 'cancelled'].includes(t.status)).length === 0 ? (
                        <div className="ios-card p-12 border-2 border-dashed text-center">
                          <p className="text-ios-gray text-xs">Nessuna vendita attiva.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {transactions
                            .filter(t => t.seller_id === currentUser?.id && !['completed', 'cancelled'].includes(t.status))
                            .map(tr => (
                            <TransactionCard key={tr.id} tr={tr} isSeller={true} t={t} currentUser={currentUser} loading={loading} handleShip={handleShip} handleConfirmArrival={handleConfirmArrival} setReviewState={setReviewState} reviewState={reviewState} handleSubmitReview={handleSubmitReview} />
                          ))}
                        </div>
                      )}
                    </div>

                    {transactions.filter(t => t.seller_id === currentUser?.id && t.status === 'completed').length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ios-gray">Archivio Vendite</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                          {transactions
                            .filter(t => t.seller_id === currentUser?.id && t.status === 'completed')
                            .map(tr => <CompletedSaleCard key={tr.id} tr={tr} t={t} />)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {dashboardTab === 'items' && (
                  <motion.div 
                    key="items"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="rm-section-title">{t('tab_items')}</h3>
                      <button onClick={() => requireAuth('sell')} className="text-brand-end text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                        {t('sell_title')} <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                      {sellerItems.length === 0 ? (
                        <div className="col-span-full ios-card p-20 text-center border-2 border-dashed flex flex-col items-center gap-4">
                          <Box size={48} className="text-ios-gray/20" />
                          <p className="text-ios-gray font-bold">{t('no_active_listings' as any) || 'Nessun annuncio'}</p>
                          <button onClick={() => setView('sell')} className="ios-btn-primary px-8">Inizia ora</button>
                        </div>
                      ) : (
                        sellerItems.map((item) => (
                          <div key={item.id} onClick={() => setSelectedItem(item)} className="ios-card p-3 group cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden bg-white">
                            <div className="aspect-square rounded-xl overflow-hidden mb-3">
                              <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            {item.status === 'sold' && (
                              <div className="absolute top-0 right-0 p-2">
                                <span className="bg-black/60 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-sm">Sold</span>
                              </div>
                            )}
                            <h4 className="text-xs font-bold truncate text-ios-label">{item.title}</h4>
                            <p className="text-sm font-black text-brand-end mt-1">€{item.price}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {dashboardTab === 'saved' && (
                  <motion.div 
                    key="saved"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-12"
                  >
                    {/* Saved Items */}
                    <div className="space-y-6">
                      <h3 className="rm-section-title">{t('saved_items')}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                        {favorites.length === 0 ? (
                          <div className="col-span-full ios-card p-12 border-2 border-dashed text-center">
                            <p className="text-ios-gray text-xs">{t('no_saved_items')}</p>
                          </div>
                        ) : (
                          favorites.map((item) => (
                            <div key={item.id} onClick={() => setSelectedItem(item)} className="ios-card p-3 group cursor-pointer bg-white">
                              <div className="aspect-square rounded-xl overflow-hidden mb-2">
                                <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <h4 className="text-xs font-bold truncate text-ios-label">{item.title}</h4>
                              <p className="text-xs font-black text-brand-end mt-0.5">€{item.price}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1.5 bg-ios-blue/10 text-ios-blue text-[10px] font-black rounded-full uppercase tracking-widest border border-ios-blue/5">
                      {selectedItem.category}
                    </span>
                    <div className="flex items-center gap-4 text-ios-gray font-black text-[10px] uppercase tracking-widest px-1">
                      <span className="flex items-center gap-1.5"><Eye size={14} className="text-ios-gray/40" /> {selectedItem.views_count || 0} {t('views' as any)}</span>
                      <span className="flex items-center gap-1.5"><Heart size={14} className="text-red-400" /> {selectedItem.LikeCount || 0} {t('likes' as any)}</span>
                    </div>
                  </div>
                  <h3 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight text-ios-label">{selectedItem.title}</h3>
                  <div className="flex items-center gap-4 text-ios-gray font-bold">
                    <div className="flex items-center gap-2 bg-ios-secondary/30 px-4 py-2 rounded-2xl border border-black/[0.03]">
                      <MapPin size={18} className="text-ios-gray/50" />
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
                  {session?.user?.id === selectedItem.seller_id ? (
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
                <li><button onClick={() => setShowErrorModal({ show: true, title: "Contatti", message: "La sezione contatti sarà disponibile a breve." })} className="text-ios-gray hover:text-brand-end transition-colors text-sm font-bold">{t('contacts')}</button></li>
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

      {/* Notifications and Success Modals */}
      <AnimatePresence>
        {showNotificationModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationModal({ ...showNotificationModal, show: false })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/5"
            >
              <div className={`h-2 ${showNotificationModal.type === 'sale' ? 'bg-orange-500' : 'bg-ios-blue'}`} />
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-2xl ${showNotificationModal.type === 'sale' ? 'bg-orange-500/10 text-orange-600' : 'bg-ios-blue/10 text-ios-blue'}`}>
                    <Bell size={32} className="animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight">{showNotificationModal.title}</h3>
                    <p className="text-ios-gray font-bold leading-relaxed">{showNotificationModal.body}</p>
                  </div>
                </div>
                
                  <button
                  onClick={() => {
                    setShowNotificationModal({ ...showNotificationModal, show: false });
                    setView('dashboard');
                  }}
                  className="w-full py-4 bg-black text-white font-black rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <ArrowRight size={20} />
                  <span>{t('go_to_dashboard' as any)}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {showSuccessModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 text-center space-y-6">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/20"
                >
                  <CheckCircle2 size={40} strokeWidth={3} />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-ios-label">{showSuccessModal.title}</h3>
                  <p className="text-ios-gray text-sm leading-relaxed font-bold">
                    {showSuccessModal.message}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })}
                  className="w-full py-5 bg-black text-white font-black rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em] shadow-xl"
                >
                  {t('close' as any)}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-2 border-4 border-red-50">
                  <XCircle size={40} strokeWidth={3} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-ios-label">{showErrorModal.title}</h3>
                  <p className="text-ios-gray text-sm leading-relaxed font-bold">
                    {showErrorModal.message}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setShowErrorModal({ ...showErrorModal, show: false })}
                  className="w-full py-5 bg-ios-secondary text-ios-label font-black rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                >
                  Indietro
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Item Delete Confirmation Modal */}
        {itemToDelete !== null && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
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
                <h3 className="text-2xl font-black tracking-tight">Elimina Annuncio?</h3>
                <p className="text-ios-gray text-sm leading-relaxed font-medium">
                  Sei sicuro di voler eliminare questo annuncio? Questa azione non può essere annullata.
                </p>
              </div>

              <div className="p-4 bg-ios-secondary/30 flex flex-col gap-2">
                <button
                  onClick={confirmDeleteItem}
                  disabled={loading}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/25 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'Eliminazione...' : 'Sì, elimina'}
                </button>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="w-full py-4 bg-white text-ios-label font-black rounded-2xl active:scale-95 transition-all text-sm border border-black/5"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
