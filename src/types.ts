export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
  language: string;
  condition?: 'New' | 'Used';
  description?: string;
  highlights?: string[];
  specifications?: {
    [key: string]: string;
  };
  rating?: number;
  reviewCount?: number;
  genre?: string;
  isPlaceholderImage?: boolean;
  stock?: number;
}

export interface BookSection {
  title: string;
  subtitle: string;
  books: Book[];
  color?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface Order {
  id?: string;
  userId?: string;
  isGuest?: boolean;
  guestInfo?: {
    email: string;
    name: string;
  };
  items: {
    bookId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  customerName?: string;
  customerEmail?: string;
  waybill?: string;
  trackingStatus?: string;
  createdAt: any;
  address: string;
  paymentMethod: string;
  coinsEarned?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  pustakCoins?: number;
  wishlist?: string[];
}
