export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  photo: string;
  category: string;
  department: 'kitchen' | 'bar';
  available: boolean;
  preparation_time: number;
  ingredients: string;
  allergens: string;
  popularity_score: number;
  views: number;
  orders: number;
  last_updated: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  order: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  timestamp: string;
  status: 'pending_approval' | 'approved' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'rejected';
  userId: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
}
export interface PaymentConfirmation {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  method: 'bank_transfer' | 'mobile_money';
  screenshotUrl: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  orderId?: string; // Optional reference to the original order
}

export interface TableBill {
  id: string;
  tableNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  paymentConfirmationId?: string; // Add this new field
}

export interface PendingOrder {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  timestamp: string;
  userId: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'bank_transfer';
  notes?: string;
}

export interface TableBill {
  id: string;
  tableNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantSettings {
  id: string;
  userId: string;
  numberOfTables: number;
  taxRate: number;
  currency: string;
  autoApproveOrders: boolean;
  menuTheme: 'classic' | 'modern' | 'elegant' | 'minimal';
  updatedAt: string;
}
export interface Bill {
  id: string;
  orderId: string;
  userId: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
  status: 'draft' | 'sent' | 'paid';
}

export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  telegramChatId?: string;
  phone?: string;
  address?: string;
  logo?: string;
  created_at: string;
  subscription: 'free' | 'premium';
  settings: {
    currency: string;
    language: 'en' | 'am';
    theme: string;
    notifications: boolean;
  };
}

export interface GlobalSettings {
  id: string;
  defaultCurrency: string;
  defaultLanguage: 'en' | 'am';
  platformName: string;
  supportEmail: string;
  features: {
    multiLanguage: boolean;
    analytics: boolean;
    telegramIntegration: boolean;
  };
}

export interface Analytics {
  tableNumber: string;
  itemViews: Record<string, number>;
  itemOrders: Record<string, number>;
  waiterCalls: number;
  billRequests: number;
  totalSpent: number;
  orderCount: number;
  sessionStart: string;
}

export interface TableStats {
  tableNumber: string;
  orders: number;
  totalSpent: number;
  waiterCalls: number;
  billRequests: number;
  lastActivity: string;
}

export interface AppSettings {
  language: 'en' | 'am';
  orderType: 'dine-in' | 'takeaway';
}

export interface OrderFeedback {
  orderId: string;
  tableNumber: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface MenuStats {
  totalOrders: number;
  totalRevenue: number;
  totalViews: number;
  popularItems: Array<{ id: string; name: string; orders: number }>;
  recentOrders: Order[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}