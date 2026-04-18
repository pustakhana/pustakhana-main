/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, getDocFromServer, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Book, CartItem, Order, UserProfile, Review, BookSection } from './types';
import booksDataRaw from './data/books.json';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
import { ShoppingCart, LogIn, LogOut, Package, Home, BookOpen, Trash2, Plus, Minus, CheckCircle2, Loader2, Search, Filter, User as UserIcon, X, ChevronRight, CreditCard, MapPin, Sparkles, Tag, Truck, ArrowLeft, Star, ChevronLeft, Heart, Menu, ShieldCheck, RotateCcw, Headphones, Coins, AlertCircle, Share2, Facebook, Twitter, Linkedin, Mail, Check, Copy, Wallet, ImageOff, Phone } from 'lucide-react';
import { delhiveryService } from './services/delhiveryService';

// --- Disposable Email Domains ---
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'temp-mail.org', 'guerrillamail.com', 
  '10minutemail.com', 'trashmail.com', 'getnada.com', 'dispostable.com'
];

const ADMIN_EMAIL = 'pustakhana@gmail.com';

function isDisposableEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

// --- Filter Books with Invalid Images and add details ---
const initialBooksData = (booksDataRaw as any[]).map(book => {
  const isInvalidImage = !book.image || 
    !book.image.startsWith('http') || 
    book.image.length <= 20 ||
    book.image.toLowerCase().includes('placeholder') ||
    book.image.toLowerCase().includes('example.com');
  
  const finalImage = isInvalidImage ? null : book.image;

  return {
    ...book,
    image: finalImage,
    isPlaceholderImage: isInvalidImage,
    description: book.description || `Explore the captivating world of "${book.title}" by ${book.author}. This ${book.category} book is a must-read for anyone looking to expand their horizons.`,
    highlights: book.highlights || [
      "High-quality paper and binding",
      "Engaging and thought-provoking content",
      "Suitable for all age groups",
      "Perfect for gifting"
    ],
    specifications: book.specifications || {
      "Author": book.author,
      "Category": book.category,
      "Language": book.language,
      "Condition": book.condition || "New",
      "Format": "Binding",
      "Publisher": "Pustak Khana Publishing",
      "Pages": "320",
      "ISBN-13": "NA"
    },
    rating: book.rating || (4 + Math.random()),
    reviewCount: book.reviewCount || Math.floor(Math.random() * 500) + 50,
    stock: book.stock || 10,
    genre: book.genre || (
      book.category.includes("Fiction") ? (
        book.title.toLowerCase().includes("mystery") || book.title.toLowerCase().includes("silent") || book.title.toLowerCase().includes("patient") ? "Mystery & Thriller" :
        book.title.toLowerCase().includes("love") || book.title.toLowerCase().includes("romance") ? "Romance" :
        book.title.toLowerCase().includes("fantasy") || book.title.toLowerCase().includes("magic") ? "Fantasy" :
        "Contemporary Fiction"
      ) :
      book.category.includes("Self-Help") ? "Personal Growth" :
      book.category.includes("Business") ? "Investing & Finance" :
      book.category.includes("Other") ? (
        book.language === "Hindi" ? "Hindi Literature" :
        book.language === "Marathi" ? "Marathi Literature" :
        "General Interest"
      ) : "Other"
    )
  };
});

let booksData = [...initialBooksData];
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PincodeChecker = () => {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await delhiveryService.checkPincode(pincode);
      if (data.delivery_codes && data.delivery_codes.length > 0) {
        setResult(data.delivery_codes[0].postal_code);
      } else {
        setError('Delivery not available for this pincode');
        setResult(null);
      }
    } catch (err) {
      setError('Failed to check pincode. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Enter Pincode" 
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full pl-7 pr-3 py-1.5 text-[10px] rounded-lg border border-slate-200 focus:outline-none focus:border-brand bg-white"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-brand text-white px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'CHECK'}
        </button>
      </form>
      {error && <p className="text-[9px] text-red-500 mt-1 font-medium">{error}</p>}
      {result && (
        <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
          <p className="text-[9px] text-green-700 font-bold">
            Delivery available to {result.city}, {result.state}
          </p>
          <p className="text-[8px] text-green-600 mt-0.5">
            {result.cash === 'Y' ? '✓ COD Available' : '✗ Prepaid Only'}
          </p>
        </div>
      )}
    </div>
  );
};

const BookPlaceholder = ({ className, letter = 'B' }: { className?: string; letter?: string }) => (
  <div className={cn("flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-400 select-none", className)}>
    <div className="relative w-24 h-32 border-2 border-slate-400 rounded-sm flex items-center justify-center mb-3 shadow-sm bg-[#fdfcf0]">
      <div className="absolute left-1 top-0 bottom-0 w-1 border-r border-slate-300" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200/50" />
      <span className="text-5xl font-black text-red-600/90 drop-shadow-sm">{letter}</span>
    </div>
    <div className="space-y-0.5 text-center">
      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">No Image</span>
      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Available</span>
    </div>
  </div>
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Context ---
interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  cart: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, delta: number) => void;
  clearCart: () => void;
  orders: Order[];
  books: Book[];
  appliedCoupon: string | null;
  setAppliedCoupon: (coupon: string | null) => void;
  isFirstTimeBuyer: boolean;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  toggleWishlist: (bookId: string) => Promise<void>;
  wishlist: string[];
  smartSections: BookSection[];
  recentlyViewed: string[];
  addToRecentlyViewed: (bookId: string) => void;
  getRelatedBooks: (currentBook: Book) => Promise<string[]>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- Components ---

const PromoBanner = () => {
  const { cart } = useApp();
  const navigate = useNavigate();

  const handleClaimNow = () => {
    if (cart.length > 0) {
      navigate('/cart');
    } else {
      navigate('/catalog');
    }
  };

  const bannerContent = (
    <div className="flex items-center gap-8 md:gap-16 px-4">
      <div className="flex items-center gap-3">
        <div className="bg-white text-red-600 px-2 py-0.5 rounded font-black text-[10px] md:text-xs flex items-center gap-1 shadow-lg">
          <Sparkles className="w-3 h-3 fill-current" />
          LIMITED OFFER
        </div>
        <span className="font-bold text-sm md:text-base tracking-tight whitespace-nowrap">
          FLAT <span className="text-yellow-300 text-lg md:text-xl font-black drop-shadow-sm">₹100 OFF</span> ON YOUR FIRST ORDER
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-[10px] md:text-xs border border-white/30 rounded-full px-4 py-1 bg-white/10 backdrop-blur-md shadow-inner whitespace-nowrap">
          Use Code: <span className="font-black text-yellow-300">WELCOME100</span>
        </div>
        <button 
          onClick={handleClaimNow}
          className="text-xs font-black hover:text-yellow-200 flex items-center gap-1 whitespace-nowrap"
        >
          CLAIM NOW <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-red-600 via-brand to-red-600 text-white py-2.5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      
      <div className="max-w-[1600px] mx-auto relative z-10 overflow-hidden">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex w-fit"
        >
          {bannerContent}
          {bannerContent}
        </motion.div>
      </div>
      
      {/* Animated Shine Effect */}
      <motion.div 
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
      />
    </div>
  );
};

const Navbar = () => {
  const { user, cart, loading, wishlist, isMobileMenuOpen, setIsMobileMenuOpen, books } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const suggestions = useMemo(() => {
    if (!search.trim() || search.length < 2) return [];
    const term = search.toLowerCase();
    return books
      .filter(b => 
        b.title.toLowerCase().includes(term) || 
        b.author.toLowerCase().includes(term) ||
        b.isbn?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [search, books]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search)}`);
      setIsMobileMenuOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (bookId: string) => {
    navigate(`/book/${bookId}`);
    setSearch('');
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-[#1a9a84] text-white py-1.5 px-4 text-[9px] md:text-xs font-medium">
        <div className="max-w-[1600px] mx-auto flex justify-center md:justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="truncate max-w-[200px] md:max-w-none">Get Rs50 extra off, Use Code : <span className="font-bold">APP50</span></span>
            <button className="bg-white text-[#1a9a84] px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold whitespace-nowrap">GET APP</button>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/our-links" className="hover:underline flex items-center gap-1">
              <Package className="w-3 h-3" /> Offline Events - Pustak Box
            </Link>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Call : 8767466660
            </span>
            <Link to="/orders" className="hover:underline flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Track Order
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
          {/* Top Row: Logo and Action Buttons */}
          <div className="flex justify-between items-center mb-3 md:mb-5">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-brand transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Pustakkhana Logo" 
                  className="h-8 md:h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
              {!loading && (
                <div className="flex items-center gap-4 md:gap-6">
                  {user ? (
                    <>
                      <Link to="/wishlist" className="relative text-slate-600 hover:text-brand transition-colors flex flex-col items-center gap-0.5">
                        <Heart className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Wishlist</span>
                        {wishlistCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>
                      <Link to="/profile" className="text-slate-600 hover:text-brand transition-colors flex flex-col items-center gap-0.5">
                        <UserIcon className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Account</span>
                      </Link>
                    </>
                  ) : (
                    <Link to="/auth" className="text-slate-600 hover:text-brand transition-colors flex flex-col items-center gap-0.5">
                      <UserIcon className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Login</span>
                    </Link>
                  )}
                </div>
              )}
              <Link to="/cart" className="relative text-slate-600 hover:text-brand transition-colors flex flex-col items-center gap-0.5">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] font-bold">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Bottom Row: Search Bar */}
          <div className="w-full max-w-3xl mx-auto relative group">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input 
                type="text"
                placeholder="Search by ISBN, Title, Author"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-4 md:pl-6 pr-12 py-2 md:py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-slate-50 text-xs md:text-sm"
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-4 md:px-6 bg-brand text-white rounded-r-full hover:bg-brand-dark transition-colors flex items-center justify-center">
                <Search className="w-4 h-4 md:w-5 h-5" />
              </button>
            </form>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-[-1]" 
                    onClick={() => setShowSuggestions(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60] max-h-[60vh] overflow-y-auto"
                  >
                    <div className="p-2">
                      {suggestions.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleSuggestionClick(book.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                        >
                          <div className="w-10 h-14 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                            {book.image ? (
                              <img src={book.image} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              <BookPlaceholder className="w-full h-full p-1 border-none" letter="B" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-brand transition-colors">{book.title}</h4>
                            <p className="text-xs text-slate-500 truncate">by {book.author}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-brand">₹{book.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={handleSearch}
                      className="w-full p-4 bg-slate-50 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors border-t border-slate-100"
                    >
                      View all results for "{search}"
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search & Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col h-[100dvh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <img 
                  src="/logo.png" 
                  alt="Pustakkhana Logo" 
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-brand">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Mobile Search */}
                <div className="relative">
                  <form onSubmit={handleSearch} className="relative">
                    <input 
                      type="text"
                      placeholder="Search books..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-slate-50 text-sm"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-5 h-5" />
                    </button>
                  </form>

                  {/* Mobile Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</h3>
                      <div className="space-y-2">
                        {suggestions.map((book) => (
                          <button
                            key={book.id}
                            onClick={() => handleSuggestionClick(book.id)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                          >
                            <div className="w-10 h-14 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                              {book.image ? (
                                <img src={book.image} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <BookPlaceholder className="w-full h-full p-1 border-none" letter="B" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{book.title}</h4>
                              <p className="text-[10px] text-slate-500 truncate">by {book.author}</p>
                              <p className="text-[10px] font-bold text-brand mt-1">₹{book.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Shop By Category</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/catalog?condition=Used" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-brand-light hover:text-brand transition-colors text-center">Used Books</Link>
                      <Link to="/catalog" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-brand-light hover:text-brand transition-colors text-center">New Books</Link>
                      <Link to="/catalog?category=Children" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-brand-light hover:text-brand transition-colors text-center">Kids Books</Link>
                      <Link to="/catalog?category=Fiction" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-brand-light hover:text-brand transition-colors text-center">Fiction</Link>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Information</h3>
                    <Link to="/our-links" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand">Our Links</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                    <Link to="/quick-links" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand">Quick Links</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                    <Link to="/support" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand">Support</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                    <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand">Track Order</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-6 pb-20 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customer Support</p>
                    <p className="text-sm font-black text-slate-900">8767466660</p>
                  </div>
                </div>
                {!user && (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                  >
                    <LogIn className="w-4 h-4" /> Login / Sign Up
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Secondary Nav - Desktop Only */}
      <div className="bg-white border-b border-slate-100 hidden lg:block overflow-x-auto no-scrollbar">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center gap-8 h-12 text-xs font-bold text-slate-600 whitespace-nowrap">
            <div className="flex items-center gap-1 text-brand cursor-pointer hover:text-brand-dark">
              <Filter className="w-4 h-4" /> Shop By Category
            </div>
            <div className="cursor-pointer hover:text-brand">Shop By Store</div>
            <Link to="/catalog?condition=Used" className="hover:text-brand">Used Books</Link>
            <Link to="/catalog" className="hover:text-brand">Popular New Books</Link>
            <Link to="/catalog?category=Children" className="hover:text-brand">Kids Books</Link>
            <div className="cursor-pointer hover:text-brand">Text Books</div>
            <div className="cursor-pointer hover:text-brand">Fantasy</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const FloatingFeatures = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[60] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-3 mb-2"
          >
            <Link to="/bulk-enquiry" onClick={() => setIsOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 flex items-center gap-4 min-w-[280px] hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="https://img.fkcdn.com/image/xif0q/book/0/q/v/all-naturals-set-4-book-original-imahdh9yryugaskd.jpeg" alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Bulk Enquiry</span>
                    <span className="bg-pink-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">New</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">Buy books in bulk for schools,<br />offices, and events.</p>
                </div>
              </div>
            </Link>

            <a href="https://wa.link/ehsfwh" target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 flex items-center gap-4 min-w-[280px] hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="font-bold text-slate-900">Contact with us</span>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#f15a24] text-white w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full font-bold shadow-xl hover:bg-[#d94e1c] transition-all flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="hidden md:inline">Explore more features</span>
          </div>
        )}
      </button>
    </div>
  );
};

const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);
  const isInWishlist = wishlist.includes(book.id);

  const handleImageError = () => {
    if (failed || book.image?.startsWith('data:')) return;
    setFailed(true);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book.id);
  };

  const discount = Math.round(((book.mrp - book.price) / book.mrp) * 100);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group relative"
    >
      <Link to={`/book/${book.id}`}>
        <div className="aspect-[3/4] overflow-hidden bg-slate-100 relative">
          {(!book.image || failed) ? (
            <BookPlaceholder 
              className="w-full h-full rounded-none border-none" 
              letter={failed ? 'P' : 'B'} 
            />
          ) : (
            <img 
              src={book.image} 
              alt={book.title} 
              className="w-full h-full object-contain p-2 transition-transform duration-500"
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />
          )}
          
          {/* Red Circular Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 w-8 h-8 md:w-10 md:h-10 bg-red-600 text-white rounded-full flex flex-col items-center justify-center text-[8px] md:text-[10px] font-black shadow-lg z-10">
              <span>{discount}%</span>
              <span className="text-[5px] md:text-[6px] -mt-1">OFF</span>
            </div>
          )}

          {/* Condition Badge */}
          {book.condition && (
            <div className="absolute top-2 right-2">
              <span className={cn(
                "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                book.condition === 'New' ? "bg-brand-light text-brand border-brand-light/50" : "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {book.condition}
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button 
            onClick={handleWishlist}
            className={cn(
              "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 shadow-md",
              isInWishlist ? "bg-red-50 text-red-500" : "bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
          </button>
        </div>
        
        <div className="p-2">
          <h3 className="font-bold text-slate-900 line-clamp-2 text-[10px] md:text-sm mb-1 group-hover:text-brand transition-colors h-6 md:h-10 leading-tight">
            {book.title}
          </h3>
          <p className="text-[8px] md:text-[10px] text-slate-500 mb-1 truncate">{book.author}</p>
          
          {book.rating && (
            <div className="flex items-center gap-1 mb-1">
              <div className="flex items-center bg-green-600 text-white px-1 rounded text-[8px] md:text-[10px] font-bold">
                {book.rating.toFixed(1)} <Star className="w-1.5 h-1.5 fill-current ml-0.5" />
              </div>
              <span className="text-[8px] md:text-[10px] text-slate-400">({book.reviewCount})</span>
            </div>
          )}

          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center gap-0.5 bg-brand/5 px-1.5 py-0.5 rounded text-[7px] font-bold text-brand">
              <Coins className="w-2 h-2" />
              Earn {Math.floor(book.price / 100)} Coins
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs md:text-base font-bold text-slate-900">₹{book.price}</span>
                <span className="text-[8px] md:text-[10px] text-slate-400 line-through">₹{book.mrp}</span>
              </div>
            </div>
            <button 
              onClick={handleAdd}
              className={cn(
                "w-6 h-6 md:w-10 md:h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-md",
                added ? "bg-brand-dark text-white" : "bg-brand text-white hover:bg-brand-dark"
              )}
            >
              {added ? <CheckCircle2 className="w-3 h-3 md:w-5 md:h-5" /> : <Plus className="w-3 h-3 md:w-5 md:h-5" />}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const BookCarousel: React.FC<{ title: string, subtitle: string, books: Book[], viewAllLink: string }> = ({ title, subtitle, books, viewAllLink }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Triple the books for infinite effect
  const infiniteBooks = useMemo(() => {
    if (books.length === 0) return [];
    return [...books, ...books, ...books];
  }, [books]);

  useEffect(() => {
    // Start in the middle set of books
    if (scrollRef.current && books.length > 0) {
      const { scrollWidth } = scrollRef.current;
      scrollRef.current.scrollLeft = scrollWidth / 3;
    }
  }, [books]);

  const handleInfiniteScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth } = scrollRef.current;
    const oneThird = scrollWidth / 3;

    if (scrollLeft <= 0) {
      scrollRef.current.scrollLeft = oneThird;
    } else if (scrollLeft >= oneThird * 2) {
      scrollRef.current.scrollLeft = oneThird;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    handleInfiniteScroll();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollRef.current.scrollLeft - clientWidth : scrollRef.current.scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      
      // Check for loop after animation
      setTimeout(handleInfiniteScroll, 500);
    }
  };

  return (
    <section className="mb-8 relative group">
      <div className="flex justify-between items-end mb-4 px-4 md:px-0">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-slate-900">{title}</h2>
          <p className="text-slate-500 text-[10px] md:text-sm">{subtitle}</p>
        </div>
        <Link to={viewAllLink} className="text-brand font-bold text-[10px] md:text-sm hover:underline flex items-center gap-1">
          See All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="relative">
        {/* Navigation Arrows - Desktop Only */}
        <button 
          onClick={() => scroll('left')}
          className="hidden lg:flex absolute -left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl border border-slate-100 items-center justify-center text-slate-600 hover:text-brand transition-all z-20 opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl border border-slate-100 items-center justify-center text-slate-600 hover:text-brand transition-all z-20 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onScroll={handleInfiniteScroll}
          className={cn(
            "flex overflow-x-auto gap-3 md:gap-6 no-scrollbar pb-6 px-4 md:px-0 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none",
            isDragging && "snap-none"
          )}
        >
          {infiniteBooks.map((book, idx) => (
            <div key={`${book.id}-${idx}`} className="w-[110px] sm:w-[140px] md:w-[200px] flex-shrink-0 snap-start">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { books, smartSections, recentlyViewed } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const featuredBooks = useMemo(() => books.slice(0, 10), [books]);
  const budgetPicks = useMemo(() => books.filter(b => b.price <= 299).slice(0, 10), [books]);
  const bestSellers = useMemo(() => books.filter(b => b.isBestSeller).slice(0, 10), [books]);

  const recentlyViewedBooks = useMemo(() => {
    return recentlyViewed
      .map(id => books.find(b => b.id === id))
      .filter((b): b is Book => !!b)
      .slice(0, 10);
  }, [recentlyViewed, books]);

  const dataCategories = useMemo(() => {
    const cats = [...new Set(books.map(b => b.category as string))] as string[];
    return cats.map(fullName => {
      let icon = "📚";
      let color = "bg-brand";
      let name = fullName.replace(" Books", "");
      
      if (fullName.includes("Fiction")) { icon = "📚"; color = "bg-blue-500"; }
      else if (fullName.includes("Self-Help")) { icon = "🌱"; color = "bg-brand"; }
      else if (fullName.includes("Business")) { icon = "📈"; color = "bg-amber-500"; }
      else if (fullName.includes("Other")) { icon = "📖"; color = "bg-purple-500"; }
      
      return { fullName, name, icon, color };
    });
  }, [books]);

  const categoryBooks = useMemo(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === "99 Store") return books.filter(b => b.price <= 299).slice(0, 10);
    if (selectedCategory === "Used Books") return books.filter(b => b.condition === 'Used').slice(0, 10);
    if (selectedCategory === "New Arrivals") return books.slice(0, 10);
    return books.filter(b => b.category === selectedCategory).slice(0, 10);
  }, [selectedCategory, books]);

  const banners = [
    {
      title: "Pustak Box",
      subtitle: "Fill the box with as many books as you can!",
      color: "bg-brand",
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1000"
    },
    {
      title: "99 Store",
      subtitle: "Books starting at just ₹99",
      color: "bg-slate-900",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000"
    }
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Carousel */}
      <div className="max-w-[1600px] mx-auto px-4 pt-4 md:pt-8">
        <div className="relative h-[180px] md:h-[320px] overflow-hidden bg-slate-900 rounded-3xl shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
              <img 
                src={banners[currentBanner].image || null} 
                alt="" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 max-w-3xl">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4"
                >
                  {banners[currentBanner].title}
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm md:text-lg text-slate-200 mb-4 md:mb-6 line-clamp-2"
                >
                  {banners[currentBanner].subtitle}
                </motion.p>
                <motion.button 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => navigate('/catalog')}
                  className="bg-brand text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold w-fit hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 text-xs md:text-base"
                >
                  Shop Now
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {banners.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentBanner === i ? "bg-brand w-8" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4">
        {/* Category Icons Row (Image 3) */}
        <div className="py-8 flex overflow-x-auto gap-6 no-scrollbar pb-4">
          {[
            { name: "BEST SELLER", icon: <Star className="w-6 h-6" />, color: "bg-orange-500" },
            { name: "AWARD WINNERS", icon: <Sparkles className="w-6 h-6" />, color: "bg-yellow-500" },
            { name: "BOX SETS", icon: <Package className="w-6 h-6" />, color: "bg-blue-500" },
            { name: "INTERNATIONAL BEST SELLER", icon: <BookOpen className="w-6 h-6" />, color: "bg-purple-500" },
            { name: "NEW ARRIVALS", icon: <Plus className="w-6 h-6" />, color: "bg-green-500" },
            { 
              name: "WHATSAPP", 
              icon: (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              ), 
              color: "bg-green-500",
              link: "https://wa.link/ehsfwh"
            }
          ].map((cat, i) => (
            <button 
              key={i}
              onClick={() => {
                if ('link' in cat) {
                  window.open(cat.link as string, '_blank');
                } else {
                  navigate(`/catalog?category=${cat.name}`);
                }
              }}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className={cn(
                "w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform text-white",
                cat.color
              )}>
                {React.cloneElement(cat.icon as React.ReactElement, { className: "w-4 h-4 md:w-6 md:h-6" })}
              </div>
              <span className="text-[7px] md:text-[8px] font-black text-slate-900 text-center w-16 md:w-20 leading-tight uppercase tracking-tighter">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Category Circles */}
        <div className="mb-8 flex overflow-x-auto gap-8 no-scrollbar pb-4">
          {[
            { name: "99 Store", fullName: "99 Store", icon: "₹", color: "bg-brand" },
            ...dataCategories,
            { name: "Used Books", fullName: "Used Books", icon: "♻️", color: "bg-indigo-500" },
            { name: "New Arrivals", fullName: "New Arrivals", icon: "✨", color: "bg-purple-500" }
          ].map((cat, i) => (
            <button 
              key={i}
              onClick={() => setSelectedCategory(cat.fullName === selectedCategory ? null : cat.fullName)}
              className="flex flex-col items-center gap-2 md:gap-3 flex-shrink-0 group"
            >
              <div className={cn(
                "w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center text-xl md:text-3xl shadow-lg group-hover:scale-110 transition-transform text-white",
                cat.color,
                selectedCategory === cat.fullName && "ring-4 ring-brand ring-offset-4"
              )}>
                {cat.icon}
              </div>
              <span className={cn(
                "text-[9px] md:text-xs font-bold transition-colors text-center w-14 md:w-20 leading-tight",
                selectedCategory === cat.fullName ? "text-brand" : "text-slate-700 group-hover:text-brand"
              )}>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Curated Collections */}
        {smartSections.length > 0 && (
          <>
            {smartSections.map((section, idx) => (
              <BookCarousel 
                key={idx}
                title={section.title}
                subtitle={section.subtitle}
                books={section.books}
                viewAllLink="/catalog"
              />
            ))}
          </>
        )}

        {/* Dynamic Category Section */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div 
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BookCarousel 
                title={selectedCategory}
                subtitle={`Explore our curated collection for ${selectedCategory}`}
                books={categoryBooks}
                viewAllLink={`/catalog?category=${selectedCategory === '99 Store' ? 'All' : selectedCategory}`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {recentlyViewedBooks.length > 0 && (
          <BookCarousel 
            title="Recently Viewed" 
            subtitle="Pick up where you left off" 
            books={recentlyViewedBooks} 
            viewAllLink="/catalog" 
          />
        )}

        <BookCarousel 
          title="Featured Books" 
          subtitle="Handpicked titles just for you" 
          books={featuredBooks} 
          viewAllLink="/catalog" 
        />

        <BookCarousel 
          title="Budget Picks" 
          subtitle="Great reads under ₹299" 
          books={budgetPicks} 
          viewAllLink="/catalog?maxPrice=299" 
        />

        <BookCarousel 
          title="Best Sellers" 
          subtitle="Most loved books by our community" 
          books={bestSellers} 
          viewAllLink="/catalog?category=Fiction" 
        />

        {/* Price Stores Section */}
        <div className="max-w-[1600px] mx-auto mb-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {[
            { 
              price: "99", 
              color: "bg-[#00a651]", 
              img: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800",
              tagline: "READ MORE SPEND LESS",
              desc: "Explore the works of different authors, novelist & thinkers."
            },
            { 
              price: "149", 
              color: "bg-[#e43a15]", 
              img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800",
              tagline: "PREMIUM SELECTION",
              desc: "Handpicked titles for the discerning reader at great value."
            },
            { 
              price: "199", 
              color: "bg-[#1a237e]", 
              img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800",
              tagline: "EXCLUSIVE COLLECTIONS",
              desc: "Rare finds and special editions starting at an unbeatable price."
            }
          ].map((store, i) => (
            <section 
              key={i} 
              className="relative h-[160px] md:h-[300px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl group cursor-pointer transition-all duration-500 hover:shadow-brand/20"
              onClick={() => navigate(`/catalog?maxPrice=${store.price}`)}
            >
              {/* Background Image */}
              <img 
                src={store.img} 
                alt={`The ₹${store.price} Store`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors duration-500" />

              {/* Slanted Overlay */}
              <div 
                className={cn(
                  "absolute inset-y-0 -right-8 w-[70%] md:w-[75%] transform -skew-x-[15deg] origin-top shadow-[-15px_0_40px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:-skew-x-[12deg]",
                  store.color
                )}
              />

              {/* Content - Right Side (Overlay) */}
              <div className="absolute inset-y-0 right-0 w-[65%] md:w-[68%] flex flex-col justify-center items-center text-white p-3 md:p-8 text-center z-10">
                <h2 className="text-sm md:text-2xl font-normal font-['Times_New_Roman',_Times,_serif] mb-0.5 drop-shadow-lg tracking-tight">THE {store.price} STORE</h2>
                <p className="text-[7px] md:text-[10px] font-serif italic tracking-[0.2em] mb-3 md:mb-6 opacity-90 border-y border-white/10 py-0.5 px-1">{store.tagline}</p>
                
                <div className="flex flex-col items-center leading-none mb-3 md:mb-6">
                  <span className="text-[8px] md:text-sm font-medium mb-1 opacity-90 uppercase tracking-wider">BOOKS STARTED from</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl md:text-6xl font-black drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]">{store.price}</span>
                    <span className="text-[10px] md:text-xl font-bold -mt-1 md:-mt-2 tracking-widest">only</span>
                  </div>
                </div>

                <p className="text-[8px] md:text-[11px] leading-tight opacity-90 max-w-[140px] md:max-w-[200px] font-medium line-clamp-2 md:line-clamp-none">
                  {store.desc}
                </p>
              </div>

              {/* Shop Now Button - Bottom Left */}
              <div className="absolute bottom-3 left-4 md:bottom-8 md:left-8 z-20">
                <button className="bg-[#00d084] text-white px-3 py-1.5 md:px-5 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-xs flex items-center gap-2 shadow-lg hover:bg-[#00b371] transition-all group/btn active:scale-95">
                  SHOP NOW
                  <div className="flex -space-x-1.5">
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-2 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Chalkboard Style Sign - Left Side (Desktop Only) */}
              <div className="absolute top-1/2 left-6 md:left-10 -translate-y-1/2 hidden xl:block pointer-events-none">
                <div className="bg-slate-900/80 border-2 border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  <p className="text-white font-serif text-[10px] md:text-sm leading-tight text-center">
                    START FROM<br/>
                    <span className="text-brand font-black text-lg md:text-2xl">₹{store.price}</span>
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: <Truck className="w-5 h-5 md:w-6 md:h-6" />, title: "Free Delivery", desc: "On orders above ₹499" },
            { icon: <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />, title: "Secure Payment", desc: "100% safe transactions" },
            { icon: <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />, title: "Easy Returns", desc: "7 days return policy" },
            { icon: <Headphones className="w-5 h-5 md:w-6 md:h-6" />, title: "24/7 Support", desc: "Dedicated help center" }
          ].map((badge, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 text-center flex flex-col items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                {badge.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[10px] md:text-sm">{badge.title}</h3>
                <p className="text-slate-500 text-[8px] md:text-[10px]">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CatalogPage = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [genre, setGenre] = useState('All');
  const [condition, setCondition] = useState<'All' | 'New' | 'Used'>('All');
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, selectedPriceRanges, condition, selectedLanguages, sortBy]);

  useEffect(() => {
    const s = searchParams.get('search');
    const c = searchParams.get('category');
    const maxP = searchParams.get('maxPrice');
    if (s !== null) setSearch(s);
    if (c !== null) setCategory(c);
    if (maxP !== null) {
      const p = parseInt(maxP);
      if (p === 99) setSelectedPriceRanges(['0-100']);
      else if (p === 149) setSelectedPriceRanges(['0-100', '101-200']);
      else if (p === 199) setSelectedPriceRanges(['0-100', '101-200']);
    }
  }, [searchParams]);

  const priceRanges = [
    { label: 'All Prices', min: 0, max: 10000 },
    { label: '0-100', min: 0, max: 100 },
    { label: '101-200', min: 101, max: 200 },
    { label: '201-400', min: 201, max: 400 },
    { label: '401-1000', min: 401, max: 1000 },
    { label: '1001-3000', min: 1001, max: 3000 },
    { label: '3000 above', min: 3001, max: 10000 },
  ];

  const categories = useMemo(() => ['All', ...new Set(booksData.map(b => b.category))], []);
  const genres = useMemo(() => ['All', ...new Set(booksData.map(b => b.genre).filter(Boolean))], []);
  const languages = useMemo(() => [...new Set(booksData.map(b => b.language).filter(Boolean))], []);
  
  const filteredBooks = useMemo(() => {
    let result = booksData.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) || 
                           book.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || book.category === category;
      const matchesGenre = genre === 'All' || book.genre === genre;
      const matchesPrice = selectedPriceRanges.length === 0 || selectedPriceRanges.some(rangeLabel => {
        const range = priceRanges.find(r => r.label === rangeLabel);
        if (rangeLabel === 'All Prices') return true;
        return range ? (book.price >= range.min && book.price <= range.max) : false;
      });
      const matchesCondition = condition === 'All' || book.condition === condition;
      const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(book.language || '');
      return matchesSearch && matchesCategory && matchesGenre && matchesPrice && matchesCondition && matchesLanguage;
    });

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    
    return result;
  }, [search, category, selectedPriceRanges, condition, selectedLanguages, sortBy]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-32 bg-white p-3 md:p-6 rounded-xl md:rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-xl font-bold text-slate-900">Filter</h2>
                <button 
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className="text-[10px] md:text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  {isFilterVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              <button 
                onClick={() => {
                  setCategory('All');
                  setGenre('All');
                  setCondition('All');
                  setSelectedPriceRanges([]);
                  setSelectedLanguages([]);
                }}
                className="text-[9px] md:text-xs font-bold text-brand hover:underline"
              >
                Clear All
              </button>
            </div>

            <AnimatePresence>
              {isFilterVisible && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="text-slate-400 text-[9px] md:text-xs mb-4 md:mb-8">Refine your results</p>

                  <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-6 lg:gap-0 no-scrollbar pb-2 lg:pb-0">
                    {/* Price Filter */}
                    <div className="mb-4 lg:mb-8 min-w-[140px] lg:min-w-0">
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        <h3 className="text-[9px] md:text-sm font-bold text-slate-900 uppercase tracking-wider">Price</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedPriceRanges(priceRanges.map(r => r.label))}
                            className="text-[7px] md:text-[10px] font-bold text-brand hover:underline"
                          >
                            All
                          </button>
                          <button 
                            onClick={() => setSelectedPriceRanges([])}
                            className="text-[7px] md:text-[10px] font-bold text-slate-400 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 md:space-y-3">
                        {priceRanges.map((range) => (
                          <label key={range.label} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                className="peer h-3.5 w-3.5 md:h-5 md:w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-brand checked:border-brand transition-all"
                                checked={selectedPriceRanges.includes(range.label)}
                                onChange={() => {
                                  setSelectedPriceRanges(prev => 
                                    prev.includes(range.label) 
                                      ? prev.filter(r => r !== range.label) 
                                      : [...prev, range.label]
                                  );
                                }}
                              />
                              <CheckCircle2 className="absolute h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                            </div>
                            <span className="text-[9px] md:text-sm text-slate-600 group-hover:text-brand transition-colors whitespace-nowrap">{range.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Genre Filter */}
                    <div className="mb-4 lg:mb-8 min-w-[140px] lg:min-w-0">
                      <h3 className="text-[9px] md:text-sm font-bold text-slate-900 mb-2 md:mb-4 uppercase tracking-wider">Genre</h3>
                      <div className="space-y-1.5 md:space-y-3 max-h-32 md:max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        {genres.map((g) => (
                          <label key={g} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="radio" 
                                name="genre"
                                className="peer h-3.5 w-3.5 md:h-5 md:w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:bg-brand checked:border-brand transition-all"
                                checked={genre === g}
                                onChange={() => setGenre(g)}
                              />
                              <div className="absolute h-1 w-1 md:h-2 md:w-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 left-1.5 pointer-events-none transition-opacity" />
                            </div>
                            <span className="text-[9px] md:text-sm text-slate-600 group-hover:text-brand transition-colors whitespace-nowrap">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Language Filter */}
                    <div className="mb-4 lg:mb-8 min-w-[140px] lg:min-w-0">
                      <h3 className="text-[9px] md:text-sm font-bold text-slate-900 mb-2 md:mb-4 uppercase tracking-wider">Language</h3>
                      <div className="space-y-1.5 md:space-y-3 max-h-32 md:max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        {languages.map((lang) => (
                          <label key={lang} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                className="peer h-3.5 w-3.5 md:h-5 md:w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-brand checked:border-brand transition-all"
                                checked={selectedLanguages.includes(lang)}
                                onChange={() => toggleLanguage(lang)}
                              />
                              <CheckCircle2 className="absolute h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                            </div>
                            <span className="text-[9px] md:text-sm text-slate-600 group-hover:text-brand transition-colors whitespace-nowrap">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Condition Filter */}
                    <div className="mb-4 lg:mb-8 min-w-[120px] lg:min-w-0">
                      <h3 className="text-[9px] md:text-sm font-bold text-slate-900 mb-2 md:mb-4 uppercase tracking-wider">Condition</h3>
                      <div className="flex gap-1.5 md:gap-2">
                        {['New', 'Used'].map(cond => (
                          <button
                            key={cond}
                            onClick={() => setCondition(prev => prev === cond ? 'All' : cond as any)}
                            className={cn(
                              "flex-1 py-1.5 md:py-2 px-2 md:px-0 rounded-lg text-[8px] md:text-[10px] font-bold border transition-all whitespace-nowrap",
                              condition === cond 
                                ? "bg-brand border-brand text-white" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-brand/30"
                            )}
                          >
                            {cond}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-slate-900">
                Showing {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredBooks.length)} of {filteredBooks.length} results for {category === 'All' ? 'All Books' : category}
              </h1>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 whitespace-nowrap">
                Sort By :
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="relevance">Select</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 mb-12">
            <AnimatePresence mode="popLayout">
              {filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(book => (
                <motion.div 
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <BookCard book={book as Book} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredBooks.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-12">
              <button 
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => prev - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:border-brand hover:text-brand transition-all disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(filteredBooks.length / itemsPerPage) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show only current page, first, last, and neighbors if many pages
                  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl font-bold transition-all",
                          currentPage === pageNum 
                            ? "bg-brand text-white shadow-lg shadow-brand/20" 
                            : "bg-white border border-slate-100 text-slate-400 hover:border-brand/30 hover:text-brand"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="text-slate-300">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                disabled={currentPage === Math.ceil(filteredBooks.length / itemsPerPage)}
                onClick={() => {
                  setCurrentPage(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:border-brand hover:text-brand transition-all disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {filteredBooks.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No books found</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ isOpen, onClose, book }: { isOpen: boolean, onClose: () => void, book: Book }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/book/${book.id}`;
  const shareText = `Check out this amazing book: ${book.title} at Pustakkhana!`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'text-[#25D366]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'text-[#1877F2]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'text-[#1DA1F2]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'text-[#0A66C2]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      color: 'text-red-500',
      url: `mailto:?subject=${encodeURIComponent(book.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
    }
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Share this product</h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-brand transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all group"
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors", option.color)}>
                    {option.icon}
                  </div>
                  <span className="font-bold text-slate-700">{option.name}</span>
                </a>
              ))}

              <div className="pt-4 space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 break-all text-xs text-slate-500 font-mono">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const BookDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, books, user, addReview, toggleWishlist, wishlist, addToRecentlyViewed, getRelatedBooks } = useApp();
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const navigate = useNavigate();

  const book = useMemo(() => books.find(b => b.id === id), [id, books]);
  const isInWishlist = book ? wishlist.includes(book.id) : false;

  useEffect(() => {
    if (id) {
      addToRecentlyViewed(id);
      window.scrollTo(0, 0);
    }
  }, [id]);

  useEffect(() => {
    const fetchRelatedBooks = async () => {
      if (!book) return;
      setLoadingRelated(true);
      try {
        const recommendedIds = await getRelatedBooks(book);
        const recommended = books.filter(b => recommendedIds.includes(b.id));
        setRelatedBooks(recommended);
      } catch (error) {
        console.error("Failed to fetch related books:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedBooks();
  }, [book?.id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'reviews'), where('bookId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });
    return unsubscribe;
  }, [id]);

  if (!book) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Book not found</h2>
        <button onClick={() => navigate('/')} className="text-brand font-bold hover:underline">Back to Home</button>
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleImageError = () => {
    setFailed(true);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to write a review");
      return;
    }
    await addReview({
      bookId: book.id,
      userId: user.uid,
      userName: user.displayName || user.email || 'Anonymous',
      rating: newReview.rating,
      comment: newReview.comment
    });
    setNewReview({ rating: 5, comment: '' });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8">
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        book={book} 
      />
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/catalog" className="hover:text-brand">Books</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/catalog?category=${book.category}`} className="hover:text-brand">{book.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 font-medium truncate max-w-[150px] md:max-w-none">{book.title}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image Section */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative group min-h-[400px] flex items-center justify-center"
          >
            {(!book.image || failed) ? (
              <BookPlaceholder 
                className="w-full h-[400px] md:h-[500px] rounded-2xl border-none bg-slate-50/50" 
                letter={failed ? 'P' : 'B'} 
              />
            ) : (
              <img 
                src={book.image} 
                alt={book.title} 
                className="w-full h-auto object-contain rounded-2xl max-h-[400px] md:max-h-[600px] mx-auto transition-all"
                onError={handleImageError}
                referrerPolicy="no-referrer"
              />
            )}
            
            {failed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-red-200">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="text-sm font-black text-red-600 uppercase tracking-widest text-center">Image Load Failed</span>
                  <p className="text-[10px] text-slate-500 text-center max-w-[180px]">We couldn't load the cover for this book. Showing placeholder instead.</p>
                </div>
              </div>
            )}

            {book.isPlaceholderImage && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full px-8">
                <div className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black flex items-center justify-center gap-3">
                  <ImageOff className="w-5 h-5" />
                  NO COVER AVAILABLE
                </div>
              </div>
            )}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <button 
                onClick={handleShare}
                className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-brand transition-colors border border-slate-100"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => book && toggleWishlist(book.id)}
                className={cn(
                  "w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors border border-slate-100",
                  isInWishlist ? "bg-red-50 text-red-500" : "bg-white text-slate-400 hover:text-red-500"
                )}
              >
                <Heart className={cn("w-5 h-5", isInWishlist && "fill-current")} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Product Info Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-4xl font-bold text-slate-900 mb-1 leading-tight">{book.title}</h1>
            <p className="text-base text-slate-500 mb-3">by <span className="text-brand font-medium">{book.author}</span></p>
            
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="flex items-center bg-green-600 text-white px-1.5 py-0.5 rounded font-bold text-xs md:text-sm">
                {book.rating?.toFixed(1)} <Star className="w-2.5 h-2.5 fill-current ml-1" />
              </div>
              <span className="text-slate-400 text-xs md:text-sm font-medium">{book.reviewCount} Ratings & {reviews.length} Reviews</span>
            </div>

            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-2xl md:text-4xl font-black text-slate-900">₹{book.price}</span>
              <span className="text-sm md:text-xl text-slate-400 line-through">₹{book.mrp}</span>
              <span className="text-green-600 font-black text-xs md:text-base">
                {Math.round(((book.mrp - book.price) / book.mrp) * 100)}% off
              </span>
            </div>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-4 md:mb-6">Free delivery available</p>
          </div>

          {/* Delivery Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6">
            <h3 className="font-bold text-slate-900 text-xs mb-2">Delivery details</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>Delivery by <span className="font-bold text-slate-900">30 Mar, Mon</span></span>
            </div>
            <PincodeChecker />
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: <RotateCcw className="w-3.5 h-3.5" />, label: "7 Days Replacement" },
              { icon: <CreditCard className="w-3.5 h-3.5" />, label: "Cash on Delivery" },
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Pustak Assured" }
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-brand">
                  {badge.icon}
                </div>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Loyalty Coins Bar */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-sm">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-yellow-800 font-bold uppercase tracking-wider">Pustak Coins</p>
              <p className="text-sm text-yellow-700">Earn <span className="font-black">{Math.floor(book.price / 100)}</span> coins on this purchase!</p>
              <p className="text-[10px] text-yellow-600 mt-0.5 font-medium">For every 100 spent You earn 1 Pustak coins</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button 
              onClick={handleAdd}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95",
                added ? "bg-brand-light text-brand" : "bg-brand text-white hover:bg-brand-dark"
              )}
            >
              {added ? <CheckCircle2 className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
              {added ? "Added" : "Add to Cart"}
            </button>
            <button 
              onClick={() => { addToCart(book); navigate('/cart'); }}
              className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Buy Now
            </button>
          </div>

          {/* Product Highlights */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <button className="w-full flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Product highlights</h3>
              <Plus className="w-3 h-3 text-slate-400" />
            </button>
            <div className="p-3 grid grid-cols-2 gap-y-3 gap-x-6">
              {book.highlights?.slice(0, 4).map((highlight, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Feature {i + 1}</p>
                  <p className="text-sm text-slate-700 font-bold leading-tight">{highlight}</p>
                </div>
              ))}
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Language</p>
                <p className="text-sm text-slate-700 font-bold leading-tight">{book.language}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Condition</p>
                <p className="text-sm text-slate-700 font-bold leading-tight">{book.condition}</p>
              </div>
            </div>
          </div>

          {/* Tabs for Details */}
          <div className="border-b border-slate-200 mb-6 flex gap-8">
            {(['description', 'specifications', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 text-base font-bold capitalize transition-all relative",
                  activeTab === tab ? "text-brand" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="mb-12">
            {activeTab === 'description' && (
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-sm">{book.description}</p>
              </div>
            )}
            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(book.specifications || {}).map(([key, value]) => {
                  let displayKey = key;
                  let displayValue = value;
                  
                  if (key.toLowerCase().includes('isbn-10')) {
                    displayValue = 'NA';
                  }
                  if (key.toLowerCase() === 'format' || key.toLowerCase() === 'binding') {
                    displayKey = 'Binding';
                  }
                  if (displayValue === 'Binding') {
                    displayValue = 'Paperback';
                  }

                  return (
                    <div key={key} className="flex border-b border-slate-100 pb-2">
                      <span className="text-slate-400 text-sm w-32 flex-shrink-0">{displayKey}</span>
                      <span className="text-slate-900 text-sm font-bold">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {user && (
                  <form onSubmit={handleSubmitReview} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Write a Review</h4>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            newReview.rating >= star ? "bg-yellow-400 text-white" : "bg-white text-slate-300 border border-slate-200"
                          )}
                        >
                          <Star className={cn("w-4 h-4", newReview.rating >= star && "fill-current")} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your thoughts about this book..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand mb-4 h-24 resize-none"
                      required
                    />
                    <button type="submit" className="bg-brand text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-dark transition-all text-sm">
                      Post Review
                    </button>
                  </form>
                )}

                <div className="space-y-6">
                  {reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className="border-b border-slate-100 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-xs">
                            {review.userName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{review.userName}</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={cn("w-2.5 h-2.5", review.rating >= star ? "text-yellow-400 fill-current" : "text-slate-200")} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed pl-11">{review.comment}</p>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Related Books Section */}
      {loadingRelated ? (
        <div className="mt-16 md:mt-24">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-[110px] sm:w-[140px] md:w-[200px] aspect-[3/4] bg-slate-100 rounded-3xl animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      ) : relatedBooks.length > 0 && (
        <div className="mt-16 md:mt-24">
          <BookCarousel 
            title="Personalized for You" 
            subtitle="Based on your browsing history and current selection" 
            books={relatedBooks} 
            viewAllLink="/catalog" 
          />
        </div>
      )}
    </div>
  );
};

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, user, clearCart, appliedCoupon, setAppliedCoupon, isFirstTimeBuyer, userProfile } = useApp();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ email: '', name: '' });
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [apartmentName, setApartmentName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const geoapifyKey = "5be0f838a424409196ad7ec0bde30347";

  const extractPincode = (addr: string) => {
    const match = addr.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  useEffect(() => {
    const pincode = extractPincode(address);
    if (pincode && cart.length > 0) {
      const calculateShipping = async () => {
        setIsCalculatingCost(true);
        try {
          // Weight calculation: assuming 500g per book for now
          const totalWeight = cart.reduce((acc, item) => acc + (item.quantity * 500), 0);
          const data = await delhiveryService.calculateCost(
            pincode, 
            '110042', // Origin pincode (example)
            totalWeight, 
            paymentMethod === 'cod' ? 'COD' : 'Pre-paid'
          );
          if (data && data.total_amount) {
            setShippingCost(data.total_amount);
          }
        } catch (err) {
          console.error("Shipping cost calculation failed:", err);
          setShippingCost(40); // Fallback
        } finally {
          setIsCalculatingCost(false);
        }
      };
      calculateShipping();
    }
  }, [address, cart, paymentMethod]);

  // --- Geoapify Autocomplete ---
  const [addressValue, setAddressValue] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!addressValue || addressValue.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(addressValue)}&apiKey=${geoapifyKey}&filter=countrycode:in`
        );
        const data = await response.json();
        if (data.features) {
          setAddressSuggestions(data.features.map((feature: any) => ({
            description: feature.properties.formatted,
            source: feature
          })));
        }
      } catch (err) {
        console.error("Error fetching Geoapify suggestions:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [addressValue]);

  useEffect(() => {
    if (address) {
      setAddressValue(address);
    }
  }, [address]);

  const handleSelectAddress = (suggestion: any) => {
    const description = suggestion.description;
    setAddressValue(description);
    setAddress(description);
    setAddressSuggestions([]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${geoapifyKey}`
          );
          const data = await response.json();
          
          if (data.features && data.features[0]) {
            const formattedAddress = data.features[0].properties.formatted;
            setAddress(formattedAddress);
            setAddressValue(formattedAddress);
          } else {
            alert("No address found for this location");
          }
        } catch (error) {
          console.error("Geoapify reverse geocoding error:", error);
          alert("Failed to get address from location");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Unable to retrieve your location";
        if (error.code === 1) msg = "Location permission denied";
        alert(msg);
        setIsLocating(false);
      }
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const discountAmount = useMemo(() => {
    if (appliedCoupon === 'WELCOME100') {
      return isFirstTimeBuyer ? 100 : 0;
    }
    if (appliedCoupon === 'APP50') {
      return 50;
    }
    return 0;
  }, [appliedCoupon, isFirstTimeBuyer]);

  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    
    if (code === 'WELCOME100') {
      if (isFirstTimeBuyer) {
        setAppliedCoupon(code);
        setCouponInput('');
      } else {
        setCouponError('This coupon is only for first-time buyers.');
      }
    } else if (code === 'APP50') {
      setAppliedCoupon(code);
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code.');
    }
  };

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user && !showGuestForm) {
      setShowGuestForm(true);
      return;
    }

    if (!user && isDisposableEmail(guestInfo.email)) {
      setEmailError('Disposable email addresses are not allowed.');
      return;
    }

    if (!address) {
      alert('Please enter your delivery address');
      return;
    }

    if (!user && paymentMethod === 'cod') {
      alert('Cash on Delivery is not available for guest checkout. Please use a prepaid method.');
      return;
    }

    setIsCheckingOut(true);
    const path = 'orders';
    try {
      const coinsEarned = Math.floor(total / 100);
      
      // Delhivery Shipment Creation
      let waybill = '';
      try {
        const pincode = extractPincode(address);
        if (pincode) {
          const shipmentResponse = await delhiveryService.createShipment({
            shipments: [{
              name: user?.displayName || guestInfo.name,
              add: address,
              pin: pincode,
              phone: user?.phoneNumber || "9999999999", // Fallback
              order: `ORDER-${Date.now()}`,
              payment_mode: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
              products_desc: cart.map(item => item.title).join(', '),
              total_amount: total,
              quantity: cart.reduce((acc, item) => acc + item.quantity, 0)
            }],
            pickup_location: { name: "warehouse_name" }
          });
          if (shipmentResponse.packages && shipmentResponse.packages.length > 0) {
            waybill = shipmentResponse.packages[0].waybill;
            
            // Generate tomorrow's date for pickup
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            const pickupDate = tmrw.toISOString().split('T')[0];

            await delhiveryService.createPickup({
              pickup_time: '11:00:00',
              pickup_date: pickupDate,
              pickup_location: 'warehouse_name',
              expected_package_count: 1
            });
          }
        }
      } catch (err) {
        console.error("Delhivery shipment creation failed:", err);
      }

      const orderData: any = {
        isGuest: !user,
        items: cart.map(item => ({
          bookId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        discountAmount,
        shippingCost,
        appliedCoupon,
        total,
        status: 'pending',
        waybill,
        trackingStatus: waybill ? 'Shipment Created' : 'Processing',
        createdAt: serverTimestamp(),
        address,
        houseNumber,
        apartmentName,
        landmark,
        paymentMethod,
        coinsEarned
      };

      if (user) {
        orderData.userId = user.uid;
        orderData.customerName = user.displayName || 'Member';
        orderData.customerEmail = user.email || '';
        // Update user coins in Firestore
        const userRef = doc(db, 'users', user.uid);
        const currentCoins = userProfile?.pustakCoins || 0;
        await addDoc(collection(db, path), orderData);
        // We use a separate doc for user profile usually, but here I'll just update the coins
        // Assuming 'users' collection has docs with ID = user.uid
        try {
          const { updateDoc, increment } = await import('firebase/firestore');
          await updateDoc(userRef, {
            pustakCoins: increment(coinsEarned)
          });
        } catch (e) {
          console.error("Error updating coins:", e);
        }
      } else {
        orderData.guestInfo = guestInfo;
        await addDoc(collection(db, path), orderData);
      }

      clearCart();
      navigate('/checkout-success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-3xl border border-slate-200 inline-block">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't added any books yet.</p>
          <Link to="/catalog" className="bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors inline-block">
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 items-center">
              <div className="w-20 h-28 flex-shrink-0 relative overflow-hidden rounded-lg bg-slate-50">
                {!item.image ? (
                  <BookPlaceholder className="w-full h-full p-2 border-none" letter="B" />
                ) : (
                  <img src={item.image} alt={item.title} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500 mb-2">{item.author}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-200 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-brand"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-brand"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">₹{item.price * item.quantity}</p>
                <p className="text-[10px] text-slate-400">₹{item.price} each</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand" />
                Delivery Address
              </h3>
              <button 
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="text-[10px] font-bold text-brand hover:text-brand-dark flex items-center gap-1 bg-brand-light px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {isLocating ? "Locating..." : "Use Current Location"}
              </button>
            </div>
            <div className="relative">
              <input 
                required
                placeholder="Start typing your address..."
                value={addressValue}
                onChange={(e) => {
                  setAddressValue(e.target.value);
                  setAddress(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
              />
              {addressSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-xl overflow-hidden">
                  {addressSuggestions.map((suggestion, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => handleSelectAddress(suggestion)}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                    >
                      {suggestion.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <input 
                type="text"
                placeholder="House / Flat No."
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
              />
              <input 
                type="text"
                placeholder="Apartment Name"
                value={apartmentName}
                onChange={(e) => setApartmentName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
              />
            </div>
            <div className="mt-3">
              <input 
                type="text"
                placeholder="Landmark (Optional)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand" />
              Payment Method
            </h3>
            <div className="space-y-2">
              {[
                { id: 'cod', label: 'Cash on Delivery', icon: Package, disabled: !user },
                { id: 'upi', label: 'UPI / QR Code', icon: Search, disabled: false },
                { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, disabled: false }
              ].map(method => (
                <label 
                  key={method.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    paymentMethod === method.id ? "border-brand bg-brand-light" : "border-slate-100 hover:border-slate-200",
                    method.disabled && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    className="hidden" 
                    checked={paymentMethod === method.id}
                    disabled={method.disabled}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-brand" : "text-slate-400")} />
                  <div className="flex-1">
                    <span className={cn("text-sm font-bold block", paymentMethod === method.id ? "text-brand-dark" : "text-slate-600")}>
                      {method.label}
                    </span>
                    {method.disabled && <span className="text-[10px] text-red-400 font-bold">Prepaid only for guests</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {showGuestForm && !user && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-brand-light shadow-lg shadow-brand-light/20"
            >
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-brand" />
                Guest Details
              </h3>
              <form onSubmit={handleCheckout} className="space-y-3">
                <input 
                  required
                  type="text"
                  placeholder="Full Name"
                  value={guestInfo.name}
                  onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
                />
                <input 
                  required
                  type="email"
                  placeholder="Email Address"
                  value={guestInfo.email}
                  onChange={(e) => {
                    setGuestInfo({ ...guestInfo, email: e.target.value });
                    setEmailError('');
                  }}
                  className={cn(
                    "w-full px-4 py-2 rounded-xl border focus:outline-none text-sm",
                    emailError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-brand"
                  )}
                />
                {emailError && <p className="text-red-500 text-[10px] font-bold">{emailError}</p>}
                <button 
                  type="submit"
                  disabled={isCheckingOut}
                  className="w-full bg-brand text-white py-3 rounded-xl font-bold hover:bg-brand-dark transition-all disabled:opacity-50 text-sm"
                >
                  Complete Guest Order
                </button>
                <button 
                  type="button"
                  onClick={() => setShowGuestForm(false)}
                  className="w-full text-slate-400 text-xs hover:text-slate-600"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Apply Coupon
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-brand-light p-3 rounded-xl border border-brand/20">
                <div>
                  <p className="text-xs font-bold text-brand uppercase tracking-wider">Coupon Applied</p>
                  <p className="text-sm font-black text-brand-dark">{appliedCoupon}</p>
                </div>
                <button 
                  onClick={() => setAppliedCoupon(null)}
                  className="text-brand hover:text-brand-dark"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Enter Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm uppercase"
                />
                <button 
                  type="submit"
                  className="bg-brand text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-brand-dark transition-colors"
                >
                  Apply
                </button>
              </form>
            )}
            {couponError && <p className="text-red-500 text-[10px] mt-2 font-bold">{couponError}</p>}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{isCalculatingCost ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `₹${shippingCost}`}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-brand font-bold">
                  <span>Discount ({appliedCoupon})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className="text-brand font-medium">FREE</span>
              </div>
              
              {/* Pustak Coins Earning Preview */}
              <div className="bg-brand-light/30 p-4 rounded-2xl border-2 border-brand/20 flex items-center justify-between shadow-sm shadow-brand/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/20">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest block">Loyalty Rewards</span>
                    <span className="text-xs font-bold text-slate-600">You will earn</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-brand block">+{Math.floor(total / 100)}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pustak Coins</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between text-xl font-bold text-slate-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            {!showGuestForm && (
              <button 
                onClick={() => handleCheckout()}
                disabled={isCheckingOut}
                className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : (user ? "Place Order" : "Checkout")}
              </button>
            )}
            {!user && !showGuestForm && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400 mb-2">Or save your history</p>
                <Link to="/auth" className="text-brand text-xs font-bold hover:underline">Sign in with Google</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersPage = () => {
  const { orders, user } = useApp();

  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-6">Your order history will appear here once you make a purchase.</p>
          <Link to="/catalog" className="text-brand font-bold hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                  <p className="text-sm font-mono text-slate-600">{order.id?.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                    order.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-brand-light text-brand"
                  )}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                          {item.quantity}x
                        </div>
                        <span className="font-medium text-slate-900">{item.title}</span>
                      </div>
                      <span className="text-slate-600">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Delivery Address
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{order.address}</p>
                  </div>
                  <div className="md:text-right">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 md:justify-end">
                      <CreditCard className="w-3 h-3" /> Payment Method
                    </h4>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{order.paymentMethod}</p>
                    <div className="flex justify-between items-center md:justify-end md:gap-4">
                      <span className="text-slate-500 text-sm">Total Amount</span>
                      <span className="text-xl font-bold text-slate-900">₹{order.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WishlistPage = () => {
  const { wishlist, books, loading } = useApp();
  const wishlistBooks = useMemo(() => 
    books.filter(b => wishlist.includes(b.id)),
    [wishlist, books]
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-50 rounded-2xl text-red-500">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
          <p className="text-sm text-slate-500">{wishlistBooks.length} items saved</p>
        </div>
      </div>

      {wishlistBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlistBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Save items you like to your wishlist. They will show up here so you can easily find them later.
          </p>
          <Link 
            to="/catalog" 
            className="inline-flex items-center gap-2 bg-brand text-white px-8 py-3 rounded-full font-bold hover:bg-brand-dark transition-all"
          >
            Explore Books
          </Link>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, loading, userProfile } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">My Profile</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center h-fit">
          <img src={user.photoURL || null} alt="" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-brand-light" referrerPolicy="no-referrer" />
          <h2 className="text-xl font-bold text-slate-900">{user.displayName}</h2>
          <p className="text-sm text-slate-500 mb-6">{user.email}</p>
          
          {/* Wallet Section */}
          <div className="bg-brand-light/30 p-4 rounded-2xl border border-brand-light mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-brand" />
              <span className="text-2xl font-black text-brand">{userProfile?.pustakCoins || 0}</span>
            </div>
            <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Pustak Coins</p>
            <p className="text-[8px] text-slate-400 mt-2">1 Coin = ₹100 Spent</p>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-6">Personal Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-50">
                <span className="text-slate-500 text-sm">Full Name</span>
                <span className="font-medium text-slate-900">{user.displayName}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-50">
                <span className="text-slate-500 text-sm">Email Address</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-50">
                <span className="text-slate-500 text-sm">Account Status</span>
                <span className="text-brand font-bold text-xs uppercase tracking-wider bg-brand-light px-2 py-1 rounded">Verified</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/orders" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-light transition-colors group">
                <Package className="w-6 h-6 text-slate-400 group-hover:text-brand mb-2" />
                <p className="font-bold text-slate-900 text-sm">My Orders</p>
                <p className="text-[10px] text-slate-400">View history</p>
              </Link>
              <Link to="/cart" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-light transition-colors group">
                <ShoppingCart className="w-6 h-6 text-slate-400 group-hover:text-brand mb-2" />
                <p className="font-bold text-slate-900 text-sm">My Cart</p>
                <p className="text-[10px] text-slate-400">Items saved</p>
              </Link>
              <Link to="/wishlist" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-light transition-colors group">
                <Heart className="w-6 h-6 text-slate-400 group-hover:text-brand mb-2" />
                <p className="font-bold text-slate-900 text-sm">My Wishlist</p>
                <p className="text-[10px] text-slate-400">Items saved</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50"
      >
        <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3">Order Placed!</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Thank you for shopping with Pustakkhana. Your order has been received and is being processed.
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => navigate(user ? '/orders' : '/catalog')}
            className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand-light/50"
          >
            {user ? 'View My Orders' : 'Continue Shopping'}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:border-brand hover:text-brand transition-all"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AuthPage = () => {
  const { user, loading } = useApp();
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isLogin, setIsLogin] = useState(true);
  
  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (authMethod === 'phone' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, [authMethod]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/catalog');
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && isDisposableEmail(email)) {
      setError('Disposable email addresses are not allowed.');
      return;
    }

    setAuthLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      navigate('/catalog');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS');
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          window.recaptchaVerifier.reset(widgetId);
        });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError('');
    setAuthLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      navigate('/catalog');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (user) return <Navigate to="/profile" />;

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-center text-slate-900 mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          {isLogin ? 'Sign in to continue your reading journey' : 'Join our community of book lovers'}
        </p>

        {/* Auth Method Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
          <button 
            onClick={() => { setAuthMethod('email'); setError(''); }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              authMethod === 'email' ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Email
          </button>
          <button 
            onClick={() => { setAuthMethod('phone'); setError(''); }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              authMethod === 'phone' ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Phone
          </button>
        </div>

        {authMethod === 'email' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand-light/50 flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        ) : (
          <div className="space-y-4 mb-6">
            {!showOtpInput ? (
              <form onSubmit={handlePhoneSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm"
                    placeholder="+91 98765 43210"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">Include country code (e.g., +91 for India)</p>
                </div>
                <div id="recaptcha-container"></div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand-light/50 flex items-center justify-center gap-2"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Enter OTP</label>
                  <input 
                    required
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-sm tracking-[0.5em] text-center font-bold"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand-light/50 flex items-center justify-center gap-2"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="w-full text-slate-400 text-xs hover:text-slate-600"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-3 mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="" />
          Google
        </button>

        <p className="text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- Provider ---

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>(initialBooksData as Book[]);
  const [smartSections, setSmartSections] = useState<BookSection[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentlyViewed');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  const addToRecentlyViewed = (bookId: string) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== bookId);
      const updated = [bookId, ...filtered].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  };

  const getRelatedBooks = async (currentBook: Book): Promise<string[]> => {
    // Category-based recommendations
    const sameCategory = books.filter(b => b.category === currentBook.category && b.id !== currentBook.id);
    
    // If not enough in same category, add other books (best sellers or random)
    if (sameCategory.length < 8) {
      const otherBooks = books
        .filter(b => b.category !== currentBook.category && b.id !== currentBook.id)
        .sort(() => Math.random() - 0.5);
      
      return [...sameCategory, ...otherBooks].slice(0, 12).map(b => b.id);
    }
    
    return sameCategory.slice(0, 12).map(b => b.id);
  };

  const toggleWishlist = async (bookId: string) => {
    if (!user || !userProfile) {
      navigate('/auth');
      return;
    }

    const currentWishlist = userProfile.wishlist || [];
    const isInWishlist = currentWishlist.includes(bookId);
    const newWishlist = isInWishlist 
      ? currentWishlist.filter(id => id !== bookId)
      : [...currentWishlist, bookId];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        wishlist: newWishlist
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const wishlist = useMemo(() => userProfile?.wishlist || [], [userProfile]);

  useEffect(() => {
    const fetchSmartSections = () => {
      if (books.length === 0) return;
      
      const categories = [...new Set(books.map(b => b.category as string).filter(Boolean))] as string[];
      const sections: BookSection[] = categories.slice(0, 5).map(cat => ({
        title: `${cat} Favorites`,
        subtitle: `Handpicked ${cat.toLowerCase()} books for you`,
        books: books.filter(b => b.category === cat).slice(0, 6)
      }));
      
      setSmartSections(sections);
    };

    fetchSmartSections();
  }, [books.length]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_connection_test_', 'test'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firestore is offline. Check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Fetch books from Firestore
    const q = query(collection(db, 'books'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      // Merge with initial books, avoiding duplicates
      setBooks(prev => {
        const merged = [...initialBooksData as Book[]];
        firestoreBooks.forEach(fb => {
          const index = merged.findIndex(b => b.id === fb.id);
          if (index === -1) {
            merged.unshift(fb);
          } else {
            merged[index] = { ...merged[index], ...fb };
          }
        });
        return merged;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'books');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ uid: user.uid, ...snapshot.data() } as UserProfile);
      } else {
        // Create initial profile
        const initialProfile = {
          email: user.email || '',
          displayName: user.displayName || '',
          pustakCoins: 0,
          createdAt: serverTimestamp(),
          role: 'user'
        };
        setDoc(doc(db, 'users', user.uid), initialProfile).catch(err => console.error("Error creating user profile:", err));
        setUserProfile({ uid: user.uid, ...initialProfile } as any);
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
    });

    return unsubscribe;
  }, [user]);

  const addReview = async (review: Omit<Review, 'id' | 'createdAt'>) => {
    const path = 'reviews';
    try {
      await addDoc(collection(db, path), {
        ...review,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const isFirstTimeBuyer = useMemo(() => {
    if (!user) return true; // Assume guest is first time or will be checked on login
    return orders.length === 0;
  }, [user, orders]);

  // Automatically apply WELCOME100 for first time buyers
  useEffect(() => {
    if (isFirstTimeBuyer && !appliedCoupon) {
      setAppliedCoupon('WELCOME100');
    }
  }, [isFirstTimeBuyer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(o);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return unsubscribe;
  }, [user]);

  const addToCart = (book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId: string) => {
    setCart(prev => prev.filter(item => item.id !== bookId));
  };

  const updateQuantity = (bookId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === bookId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ 
      user, 
      userProfile,
      loading, 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      orders,
      books,
      appliedCoupon,
      setAppliedCoupon,
      isFirstTimeBuyer,
      addReview,
      toggleWishlist,
      wishlist,
      smartSections,
      recentlyViewed,
      addToRecentlyViewed,
      getRelatedBooks,
      isMobileMenuOpen,
      setIsMobileMenuOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};


import { 
  AboutUsPage, ContactUsPage, BlogsPage, WholesalePage, 
  SellWithUsPage, CareerPage, FAQsPage, PrivacyPolicyPage, 
  TermsConditionsPage, SafeSecureShoppingPage, ReturnsPage 
} from './components/InfoPages';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuth } from './components/AdminAuth';

const OurLinksPage = () => {
  const links = [
    { title: "About Us", path: "/about-us", icon: <BookOpen className="w-6 h-6 text-brand" /> },
    { title: "Contact Us", path: "/contact-us", icon: <MapPin className="w-6 h-6 text-brand" /> },
    { title: "Blogs", path: "/blogs", icon: <Sparkles className="w-6 h-6 text-brand" /> },
    { title: "Pustakkhana Wholesale", path: "/wholesale", icon: <Package className="w-6 h-6 text-brand" /> },
    { title: "Sell with Us", path: "/sell-with-us", icon: <Plus className="w-6 h-6 text-brand" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100"
      >
        <h1 className="text-4xl font-black text-slate-900 mb-12 text-center">Our Links</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {links.map((link, i) => (
            <Link 
              key={i} 
              to={link.path}
              className="p-6 rounded-2xl bg-slate-50 hover:bg-brand-light transition-all group flex items-center gap-4 border border-transparent hover:border-brand/20"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {link.icon}
              </div>
              <span className="font-bold text-slate-900 text-lg">{link.title}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const QuickLinksPage = () => {
  const links = [
    { title: "Track Order", path: "/orders", icon: <Package className="w-6 h-6 text-brand" /> },
    { title: "Career", path: "/career", icon: <UserIcon className="w-6 h-6 text-brand" /> },
    { title: "FAQs", path: "/faqs", icon: <Search className="w-6 h-6 text-brand" /> },
    { title: "Privacy Policy", path: "/privacy-policy", icon: <CheckCircle2 className="w-6 h-6 text-brand" /> },
    { title: "Terms & Conditions", path: "/terms-conditions", icon: <Filter className="w-6 h-6 text-brand" /> },
    { title: "Safe & Secure Shopping", path: "/safe-secure-shopping", icon: <ShieldCheck className="w-6 h-6 text-brand" /> },
    { title: "Returns", path: "/returns", icon: <RotateCcw className="w-6 h-6 text-brand" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100"
      >
        <h1 className="text-4xl font-black text-slate-900 mb-12 text-center">Quick Links</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {links.map((link, i) => (
            <Link 
              key={i} 
              to={link.path}
              className="p-6 rounded-2xl bg-slate-50 hover:bg-brand-light transition-all group flex items-center gap-4 border border-transparent hover:border-brand/20"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {link.icon}
              </div>
              <span className="font-bold text-slate-900 text-lg">{link.title}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const SupportPage = () => {
  const geoapifyKey = "5be0f838a424409196ad7ec0bde30347";
  const isRetina = typeof window !== 'undefined' && window.devicePixelRatio > 1;
  const baseUrl = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`;
  const retinaUrl = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${geoapifyKey}`;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100"
      >
        <h1 className="text-4xl font-black text-slate-900 mb-8">Support</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand" /> Contact Information
              </h3>
              <ul className="space-y-4 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="font-bold">Call Us:</span> 8767466660
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-bold">WhatsApp:</span> 8767466660
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-bold">Email:</span> pustakhana@gmail.com
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand" /> Our Location
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visit our main store for a wide selection of books and personalized recommendations.
              </p>
            </div>
          </div>

          <div className="h-[400px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 z-0">
            <MapContainer center={[19.0760, 72.8777]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url={isRetina ? retinaUrl : baseUrl}
                attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors'
              />
              <Marker position={[19.0760, 72.8777]}>
                <Popup>
                  Pustakkhana Book Store <br /> Mumbai, India
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BulkEnquiryPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    quantity: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send to Firestore or an email service
    console.log('Bulk Enquiry:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">Enquiry Received!</h1>
        <p className="text-slate-600 mb-8">Thank you for your interest. Our team will get back to you within 24-48 hours with a custom quote.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Bulk Enquiry</h1>
        <p className="text-slate-600">Looking to buy books in bulk for your school, office, or event? Fill out the form below and get the best prices.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-8 md:p-12 bg-slate-900 text-white">
            <h2 className="text-2xl font-bold mb-6">Why buy in bulk?</h2>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold">Special Pricing</h3>
                  <p className="text-sm text-slate-400">Get significant discounts on bulk orders starting from 20+ copies.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold">Priority Shipping</h3>
                  <p className="text-sm text-slate-400">Dedicated logistics support for timely delivery across India.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold">Custom Sourcing</h3>
                  <p className="text-sm text-slate-400">Can't find what you need? We'll source specific titles for you.</p>
                </div>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Phone</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Organization / School</label>
                <input 
                  type="text" 
                  value={formData.organization}
                  onChange={e => setFormData({...formData, organization: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="ABC International School"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Expected Quantity</label>
                <input 
                  required
                  type="number" 
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Message / Requirements</label>
                <textarea 
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
                  placeholder="Tell us about the books you need..."
                />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all">
              Submit Enquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminAddBook = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    mrp: '',
    category: 'Fiction',
    condition: 'New',
    image: '',
    description: '',
    stock: '10',
    binding: 'Paperback',
    publisher: 'Pustak Khana Publishing',
    pages: '320',
    isbn13: 'NA',
    language: 'English'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Admin check removed as per user request for "no login or password" admin panel
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookData = {
        ...formData,
        price: Number(formData.price),
        mrp: Number(formData.mrp),
        stock: Number(formData.stock),
        specifications: {
          "Author": formData.author,
          "Category": formData.category,
          "Language": formData.language,
          "Condition": formData.condition,
          "Binding": formData.binding,
          "Publisher": formData.publisher,
          "Pages": formData.pages,
          "ISBN-13": formData.isbn13
        },
        createdAt: new Date().toISOString(),
        isPlaceholderImage: !formData.image || formData.image.includes('picsum.photos')
      };
      
      await addDoc(collection(db, 'books'), bookData);
      alert('Book added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-black text-slate-900">Add New Book</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Book Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="The Great Gatsby"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Author</label>
            <input 
              required
              type="text" 
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="F. Scott Fitzgerald"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all bg-white"
            >
              <option>Fiction</option>
              <option>Non-Fiction</option>
              <option>Children</option>
              <option>Self-Help</option>
              <option>Business</option>
              <option>Academic</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Selling Price (₹)</label>
            <input 
              required
              type="number" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="299"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">MRP (₹)</label>
            <input 
              required
              type="number" 
              value={formData.mrp}
              onChange={e => setFormData({...formData, mrp: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="499"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Condition</label>
            <select 
              value={formData.condition}
              onChange={e => setFormData({...formData, condition: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all bg-white"
            >
              <option>New</option>
              <option>Used</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Stock Quantity</label>
            <input 
              required
              type="number" 
              value={formData.stock}
              onChange={e => setFormData({...formData, stock: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="10"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Language</label>
            <input 
              required
              type="text" 
              value={formData.language}
              onChange={e => setFormData({...formData, language: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="English"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Binding</label>
            <input 
              required
              type="text" 
              value={formData.binding}
              onChange={e => setFormData({...formData, binding: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="Paperback"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Publisher</label>
            <input 
              required
              type="text" 
              value={formData.publisher}
              onChange={e => setFormData({...formData, publisher: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="Pustak Khana Publishing"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pages</label>
            <input 
              required
              type="text" 
              value={formData.pages}
              onChange={e => setFormData({...formData, pages: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="320"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">ISBN-13</label>
            <input 
              required
              type="text" 
              value={formData.isbn13}
              onChange={e => setFormData({...formData, isbn13: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="NA"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Image URL</label>
            <input 
              required
              type="text" 
              value={formData.image}
              onChange={e => setFormData({...formData, image: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              placeholder="https://example.com/book-cover.jpg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
              placeholder="Write a brief summary of the book..."
            />
          </div>
        </div>
        <button 
          disabled={loading}
          type="submit" 
          className="w-full py-4 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Adding Book...' : 'Add Book to Store'}
        </button>
      </form>
    </div>
  );
};

const BottomNav = () => {
  const { cart, user, wishlist, setIsMobileMenuOpen } = useApp();
  const { pathname } = useLocation();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-[50] flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <Link to="/" className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        pathname === '/' ? "text-brand" : "text-slate-400 hover:text-brand"
      )}>
        <Home className="w-5 h-5" />
        <span className="text-[8px] font-bold">Home</span>
      </Link>
      <Link to="/profile" className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        pathname === '/profile' ? "text-brand" : "text-slate-400 hover:text-brand"
      )}>
        <UserIcon className="w-5 h-5" />
        <span className="text-[8px] font-bold">Account</span>
      </Link>
      <Link to="/wishlist" className={cn(
        "flex flex-col items-center gap-1 transition-colors relative",
        pathname === '/wishlist' ? "text-brand" : "text-slate-400 hover:text-brand"
      )}>
        <Heart className="w-5 h-5" />
        {wishlistCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white">
            {wishlistCount}
          </span>
        )}
        <span className="text-[8px] font-bold">Wishlist</span>
      </Link>
      <Link to="/cart" className={cn(
        "flex flex-col items-center gap-1 transition-colors relative",
        pathname === '/cart' ? "text-brand" : "text-slate-400 hover:text-brand"
      )}>
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white">
            {cartCount}
          </span>
        )}
        <span className="text-[8px] font-bold">Cart</span>
      </Link>
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[8px] font-bold">Menu</span>
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <Router>
      <AppProvider>
        <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
          <PromoBanner />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/book/:id" element={<BookDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/bulk-enquiry" element={<BulkEnquiryPage />} />
              <Route path="/admin" element={<AdminAuth><AdminPanel /></AdminAuth>} />
              <Route path="/admin/add-book" element={<AdminAuth><AdminAddBook /></AdminAuth>} />
              <Route path="/our-links" element={<OurLinksPage />} />
              <Route path="/quick-links" element={<QuickLinksPage />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/contact-us" element={<ContactUsPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/wholesale" element={<WholesalePage />} />
              <Route path="/sell-with-us" element={<SellWithUsPage />} />
              <Route path="/career" element={<CareerPage />} />
              <Route path="/faqs" element={<FAQsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-conditions" element={<TermsConditionsPage />} />
              <Route path="/safe-secure-shopping" element={<SafeSecureShoppingPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Routes>
          </main>
          <FloatingFeatures />
          <footer className="bg-[#f8f9fa] border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-[1600px] mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                <div className="lg:col-span-1">
                  <img 
                    src="/logo.png" 
                    alt="Pustakkhana Logo" 
                    className="h-12 w-auto object-contain mb-6"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    Ever wanted to buy a book but could not because it was too expensive? worry not! because Pustakkhana is here! Pustakkhana, these days in news, is being called as the Robinhood of the world of books.
                  </p>
                  <div className="flex gap-4">
                    <a href="#" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="#" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="#" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">
                    <Link to="/our-links" className="hover:text-brand transition-colors">Our Links</Link>
                  </h4>
                  <ul className="space-y-4 text-sm text-slate-500">
                    <li><Link to="/about-us" className="hover:text-brand transition-colors">About Us</Link></li>
                    <li><Link to="/contact-us" className="hover:text-brand transition-colors">Contact Us</Link></li>
                    <li><Link to="/blogs" className="hover:text-brand transition-colors">Blogs</Link></li>
                    <li><Link to="/wholesale" className="hover:text-brand transition-colors">Pustakkhana Wholesale</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">
                    <Link to="/quick-links" className="hover:text-brand transition-colors">Quick Links</Link>
                  </h4>
                  <ul className="space-y-4 text-sm text-slate-500">
                    <li><Link to="/orders" className="hover:text-brand transition-colors">Track Order</Link></li>
                    <li><Link to="/career" className="hover:text-brand transition-colors">Career</Link></li>
                    <li><Link to="/faqs" className="hover:text-brand transition-colors">FAQs</Link></li>
                    <li><Link to="/privacy-policy" className="hover:text-brand transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/terms-conditions" className="hover:text-brand transition-colors">Terms & Conditions</Link></li>
                    <li><Link to="/safe-secure-shopping" className="hover:text-brand transition-colors">Safe & Secure Shopping</Link></li>
                    <li><Link to="/returns" className="hover:text-brand transition-colors">Returns</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">
                    <Link to="/support" className="hover:text-brand transition-colors">Support</Link>
                  </h4>
                  <ul className="space-y-4 text-sm text-slate-500">
                    <li>
                      <a href="tel:8767466660" className="flex items-center gap-2 hover:text-brand transition-colors">
                        <Phone className="w-4 h-4 text-brand" /> Call : 8767466660
                      </a>
                    </li>
                    <li>
                      <a href="https://wa.me/918767466660" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand transition-colors">
                        <svg className="w-4 h-4 fill-brand" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp Us : 8767466660
                      </a>
                    </li>
                    <li>
                      <a href="mailto:pustakhana@gmail.com" className="flex items-center gap-2 hover:text-brand transition-colors">
                        <Mail className="w-4 h-4 text-brand" /> Email : pustakhana@gmail.com
                      </a>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <h4 className="font-bold text-slate-900 mb-4 uppercase text-[10px] tracking-widest">Download Mobile App</h4>
                    <div className="flex gap-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-8 cursor-pointer" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-8 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span>Our Products :</span>
                  <Link to="#" className="text-brand hover:underline">Pustakkhana</Link>
                  <Link to="#" className="text-brand hover:underline">Pustak Box</Link>
                  <Link to="#" className="text-brand hover:underline">Dump</Link>
                </div>
                <p className="text-slate-400 text-xs">© 2026 Pustakkhana Book Store. All rights reserved.</p>
              </div>
            </div>
          </footer>
          <BottomNav />
        </div>
      </AppProvider>
    </Router>
  );
}
