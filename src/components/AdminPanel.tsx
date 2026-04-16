import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Trash2, Package, Save, X, 
  ChevronRight, ChevronLeft, Filter, ArrowUpDown, 
  AlertCircle, CheckCircle2, Loader2, MoreVertical,
  Image as ImageIcon, Tag, BookOpen, Layers, ShoppingBag,
  ExternalLink, User, Calendar, DollarSign, Clock, Truck, Eye
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Book, Order } from '../types';
import { Link } from 'react-router-dom';
import { useApp, handleFirestoreError, OperationType } from '../App';

export const AdminPanel: React.FC = () => {
  const { books } = useApp();
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Fetch all orders for admin
  React.useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setAllOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
    return unsubscribe;
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(books.map(b => b.category));
    return ['All', ...Array.from(cats)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || book.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, filterCategory]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const customerName = order.isGuest ? order.guestInfo?.name : order.customerName || 'Customer';
      const orderId = order.id || '';
      const matchesSearch = customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                           orderId.toLowerCase().includes(orderSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allOrders, orderSearchTerm, statusFilter]);

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    setLoading(editingBook.id);
    try {
      const bookRef = doc(db, 'books', editingBook.id);
      const { id, ...updateData } = editingBook;
      
      // Update specifications with the new fields
      const updatedSpecifications = {
        ...(editingBook.specifications || {}),
        "Author": editingBook.author,
        "Category": editingBook.category,
        "Language": editingBook.language,
        "Condition": editingBook.condition || "New",
        "Binding": editingBook.specifications?.Binding || editingBook.specifications?.Format || "Paperback",
        "Publisher": editingBook.specifications?.Publisher || "Pustak Khana Publishing",
        "Pages": editingBook.specifications?.Pages || "320",
        "ISBN-13": editingBook.specifications?.["ISBN-13"] || "NA"
      };

      // Use setDoc with merge: true to handle books that exist in local data but not yet in Firestore
      await setDoc(bookRef, {
        ...updateData,
        specifications: updatedSpecifications,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setMessage({ type: 'success', text: 'Book updated successfully!' });
      setEditingBook(null);
    } catch (error) {
      console.error("Error updating book:", error);
      setMessage({ type: 'error', text: 'Failed to update book.' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    setLoading(id);
    try {
      await deleteDoc(doc(db, 'books', id));
      setMessage({ type: 'success', text: 'Book deleted successfully!' });
    } catch (error) {
      console.error("Error deleting book:", error);
      setMessage({ type: 'error', text: 'Failed to delete book.' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleQuickStockUpdate = async (id: string, newStock: number) => {
    try {
      await setDoc(doc(db, 'books', id), {
        stock: Math.max(0, newStock),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setLoading(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: `Order updated to ${newStatus}` });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      setMessage({ type: 'error', text: 'Failed to update order status.' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              {activeTab === 'inventory' ? <Package className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Admin Panel</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeTab === 'inventory' ? 'Inventory Management' : 'Order Management'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === 'inventory' ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === 'orders' ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Orders
            </button>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="hidden md:block text-slate-500 hover:text-brand text-sm font-bold transition-colors"
            >
              Back to Store
            </Link>
            {activeTab === 'inventory' && (
              <Link 
                to="/admin/add-book"
                className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
              >
                <Plus className="w-4 h-4" /> Add New Book
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'inventory' ? (
          <>
            {/* Inventory Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Books</p>
                <p className="text-3xl font-black text-slate-900">{books.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Out of Stock</p>
                <p className="text-3xl font-black text-red-500">{books.filter(b => (b.stock || 0) === 0).length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Low Stock</p>
                <p className="text-3xl font-black text-amber-500">{books.filter(b => (b.stock || 0) > 0 && (b.stock || 0) < 5).length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                <p className="text-3xl font-black text-brand">₹{books.reduce((acc, b) => acc + (b.price * (b.stock || 0)), 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by title, author, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand transition-all"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Books Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Price</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                              {book.image ? (
                                <img src={book.image} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[200px]">{book.title}</p>
                              <p className="text-xs text-slate-500 truncate">by {book.author}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">ID: {book.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            {book.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="font-bold text-slate-900">₹{book.price}</p>
                          <p className="text-[10px] text-slate-400 line-through">₹{book.mrp}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleQuickStockUpdate(book.id, (book.stock || 0) - 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={cn(
                                "w-8 text-center font-black",
                                (book.stock || 0) === 0 ? "text-red-500" : 
                                (book.stock || 0) < 5 ? "text-amber-500" : "text-brand"
                              )}>
                                {book.stock || 0}
                              </span>
                              <button 
                                onClick={() => handleQuickStockUpdate(book.id, (book.stock || 0) + 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-brand-light hover:text-brand transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            {(book.stock || 0) === 0 && (
                              <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Out of Stock</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setEditingBook(book)}
                              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-brand hover:text-white transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBook(book.id)}
                              disabled={loading === book.id}
                              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              {loading === book.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredBooks.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold">No books found matching your search.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Orders Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                <p className="text-3xl font-black text-slate-900">{allOrders.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Orders</p>
                <p className="text-3xl font-black text-amber-500">{allOrders.filter(o => o.status === 'pending').length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                <p className="text-3xl font-black text-green-500">{allOrders.filter(o => o.status === 'completed').length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                <p className="text-3xl font-black text-brand">₹{allOrders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Orders Search & Filter */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by customer name or order ID..."
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Method</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map((order) => {
                      const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recent';
                      const customerName = order.isGuest ? order.guestInfo?.name : order.customerName || 'Customer';
                      const customerEmail = order.isGuest ? order.guestInfo?.email : order.customerEmail || 'Member';
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate uppercase text-xs tracking-tight">#{order.id?.slice(-8)}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <p className="text-[10px] text-slate-500">{date}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-1 italic">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{customerName}</p>
                              <p className="text-[10px] text-slate-500">{customerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="font-black text-brand text-lg">₹{order.total}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <select 
                                value={order.status}
                                disabled={loading === order.id}
                                onChange={(e) => handleUpdateOrderStatus(order.id!, e.target.value)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-2 outline-none transition-all cursor-pointer",
                                  order.status === 'pending' ? "bg-amber-50 border-amber-200 text-amber-600" :
                                  order.status === 'completed' ? "bg-green-50 border-green-200 text-green-600" :
                                  "bg-red-50 border-red-200 text-red-600"
                                )}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-brand hover:text-white transition-all shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold">No orders found matching your search.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Order Details</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">#{selectedOrder.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User className="w-3 h-3" /> Customer Info
                    </h3>
                    <div className="bg-slate-50 p-5 rounded-3xl space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Name</p>
                        <p className="font-bold text-slate-900">{selectedOrder.isGuest ? selectedOrder.guestInfo?.name : selectedOrder.customerName || 'Member'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Email</p>
                        <p className="font-bold text-slate-600 text-sm underline decoration-slate-200">
                          {selectedOrder.isGuest ? selectedOrder.guestInfo?.email : selectedOrder.customerEmail || 'member@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Truck className="w-3 h-3" /> Delivery Address
                    </h3>
                    <div className="bg-slate-50 p-5 rounded-3xl">
                      <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                        {selectedOrder.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package className="w-3 h-3" /> Order Items
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className={cn(
                        "p-4 flex items-center justify-between",
                        idx !== selectedOrder.items.length - 1 && "border-b border-slate-50"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-brand text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                          </div>
                        </div>
                        <p className="font-black text-slate-900">₹{item.quantity * item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl shadow-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Order Amount</p>
                    <p className="text-xl font-black text-brand">₹{selectedOrder.total}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Payment Method</p>
                    <p className="text-xs font-black uppercase text-slate-300 tracking-tighter">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm"
                >
                  Close
                </button>
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id!, 'completed')}
                    className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-200 text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Ship Order
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingBook(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                    <Edit2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Edit Book</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update details for {editingBook.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingBook(null)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateBook} className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Book Title</label>
                    <input 
                      type="text"
                      required
                      value={editingBook.title}
                      onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Author Name</label>
                    <input 
                      type="text"
                      required
                      value={editingBook.author}
                      onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                    <input 
                      type="number"
                      required
                      value={editingBook.price}
                      onChange={(e) => setEditingBook({ ...editingBook, price: Number(e.target.value) })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MRP (₹)</label>
                    <input 
                      type="number"
                      required
                      value={editingBook.mrp}
                      onChange={(e) => setEditingBook({ ...editingBook, mrp: Number(e.target.value) })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Quantity</label>
                    <input 
                      type="number"
                      required
                      value={editingBook.stock || 0}
                      onChange={(e) => setEditingBook({ ...editingBook, stock: Number(e.target.value) })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={editingBook.category}
                      onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condition</label>
                    <select 
                      value={editingBook.condition || 'New'}
                      onChange={(e) => setEditingBook({ ...editingBook, condition: e.target.value as any })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                    <input 
                      type="text"
                      value={editingBook.language || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, language: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Binding</label>
                    <input 
                      type="text"
                      value={editingBook.specifications?.Binding || editingBook.specifications?.Format || ''}
                      onChange={(e) => setEditingBook({ 
                        ...editingBook, 
                        specifications: { ...(editingBook.specifications || {}), Binding: e.target.value } 
                      })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Publisher</label>
                    <input 
                      type="text"
                      value={editingBook.specifications?.Publisher || ''}
                      onChange={(e) => setEditingBook({ 
                        ...editingBook, 
                        specifications: { ...(editingBook.specifications || {}), Publisher: e.target.value } 
                      })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pages</label>
                    <input 
                      type="text"
                      value={editingBook.specifications?.Pages || ''}
                      onChange={(e) => setEditingBook({ 
                        ...editingBook, 
                        specifications: { ...(editingBook.specifications || {}), Pages: e.target.value } 
                      })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ISBN-13</label>
                    <input 
                      type="text"
                      value={editingBook.specifications?.["ISBN-13"] || ''}
                      onChange={(e) => setEditingBook({ 
                        ...editingBook, 
                        specifications: { ...(editingBook.specifications || {}), "ISBN-13": e.target.value } 
                      })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                    <input 
                      type="text"
                      value={editingBook.image}
                      onChange={(e) => setEditingBook({ ...editingBook, image: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      rows={4}
                      value={editingBook.description}
                      onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-brand focus:bg-white transition-all outline-none text-sm font-bold resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading === editingBook.id}
                    className="flex-[2] py-4 rounded-2xl bg-brand text-white font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                  >
                    {loading === editingBook.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className={cn(
              "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border",
              message.type === 'success' ? "bg-white border-green-100 text-green-600" : "bg-white border-red-100 text-red-600"
            )}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm">{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const Minus = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
