import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  MenuItem, Category, Order, Bill, User, MenuStats, 
  PendingOrder, TableBill, RestaurantSettings, PaymentConfirmation, OrderItem
} from '../types';

class FirebaseService {
  // =======================
  // Menu Items
  // =======================
  async getMenuItems(userId: string): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'menuItems'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      return items.sort((a, b) => a.category.localeCompare(b.category));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), {
        ...item,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    try {
      await updateDoc(doc(db, 'menuItems', id), {
        ...updates,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'menuItems', id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // =======================
  // Categories
  // =======================
  async getCategories(userId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...category,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // =======================
  // Pending Orders
  // =======================
  async getPendingOrders(userId: string): Promise<PendingOrder[]> {
    try {
      const q = query(
        collection(db, 'pendingOrders'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingOrder));
      return orders.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }
  }

  async addPendingOrder(order: Omit<PendingOrder, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'pendingOrders'), {
        ...order,
        timestamp: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding pending order:', error);
      throw error;
    }
  }

  async approvePendingOrder(pendingOrderId: string, pendingOrder: PendingOrder): Promise<string> {
    try {
      const approvedOrder: Omit<Order, 'id'> = {
        ...pendingOrder,
        status: 'approved',
        paymentStatus: 'pending',
      };
      
      // Add the order to orders collection
      const orderId = await this.addOrder(approvedOrder);
      
      // Add items to table bill
      await this.addToTableBill(pendingOrder.userId, pendingOrder.tableNumber, pendingOrder.items);
      
      // Send order to appropriate departments after approval
      await this.sendOrderToDepartments(orderId, { ...approvedOrder, id: orderId }, pendingOrder.userId);
      
      // Remove the pending order
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
      return orderId;
    } catch (error) {
      console.error('Error approving pending order:', error);
      throw error;
    }
  }

  async sendOrderToDepartments(orderId: string, order: Order, userId: string): Promise<void> {
    try {
      // Get menu items to determine departments
      const menuItems = await this.getMenuItems(userId);
      const { telegramService } = await import('./telegram');
      
      // Group items by department
      const kitchenItems: OrderItem[] = [];
      const barItems: OrderItem[] = [];
      
      for (const orderItem of order.items) {
        const menuItem = menuItems.find(mi => mi.id === orderItem.id);
        if (menuItem?.department === 'bar') {
          barItems.push(orderItem);
        } else {
          kitchenItems.push(orderItem);
        }
      }
      
      // Send to kitchen if has kitchen items
      if (kitchenItems.length > 0) {
        await telegramService.sendOrderToDepartment(order, 'kitchen', kitchenItems);
      }
      
      // Send to bar if has bar items
      if (barItems.length > 0) {
        await telegramService.sendOrderToDepartment(order, 'bar', barItems);
      }
    } catch (error) {
      console.error('Error sending order to departments:', error);
      throw error;
    }
  }

  async rejectPendingOrder(pendingOrderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
    } catch (error) {
      console.error('Error rejecting pending order:', error);
      throw error;
    }
  }

  // =======================
  // Table Bills
  // =======================
  async getTableBills(userId: string): Promise<TableBill[]> {
    try {
      const q = query(
        collection(db, 'tableBills'), 
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableBill));
      return bills.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
    } catch (error) {
      console.error('Error fetching table bills:', error);
      return [];
    }
  }

  async getTableBill(userId: string, tableNumber: string): Promise<TableBill | null> {
    try {
      const q = query(
        collection(db, 'tableBills'), 
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as TableBill;
    } catch (error) {
      console.error('Error fetching table bill:', error);
      return null;
    }
  }

  async addToTableBill(userId: string, tableNumber: string, items: OrderItem[]): Promise<void> {
    try {
      const existingBill = await this.getTableBill(userId, tableNumber);
      if (existingBill) {
        const updatedItems = [...existingBill.items];
        items.forEach(newItem => {
          const idx = updatedItems.findIndex(item => item.id === newItem.id);
          if (idx >= 0) {
            updatedItems[idx].quantity += newItem.quantity;
            updatedItems[idx].total += newItem.total;
          } else {
            updatedItems.push(newItem);
          }
        });
        const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        await updateDoc(doc(db, 'tableBills', existingBill.id), {
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        const newBill: Omit<TableBill, 'id'> = {
          tableNumber,
          userId,
          items,
          subtotal,
          tax,
          total,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'tableBills'), newBill);
      }
    } catch (error) {
      console.error('Error adding to table bill:', error);
      throw error;
    }
  }

  async removeItemFromTableBill(userId: string, tableNumber: string, itemId: string): Promise<void> {
    try {
      const bill = await this.getTableBill(userId, tableNumber);
      if (!bill) return;
      const updatedItems = bill.items.filter(item => item.id !== itemId);
      if (updatedItems.length === 0) {
        await updateDoc(doc(db, 'tableBills', bill.id), {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      } else {
        const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        await updateDoc(doc(db, 'tableBills', bill.id), {
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error removing item from table bill:', error);
      throw error;
    }
  }

  async markTableBillAsPaid(userId: string, tableNumber: string, confirmationId?: string): Promise<void> {
    try {
      const bill = await this.getTableBill(userId, tableNumber);
      if (!bill) return;
      const updates: Partial<TableBill> = {
        status: 'paid',
        updatedAt: new Date().toISOString()
      };
      if (confirmationId) {
        updates.paymentConfirmationId = confirmationId;
      }
      await updateDoc(doc(db, 'tableBills', bill.id), updates);
    } catch (error) {
      console.error('Error marking table bill as paid:', error);
      throw error;
    }
  }

  // =======================
  // Payment Confirmations
  // =======================
  async addPaymentConfirmation(confirmation: Omit<PaymentConfirmation, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'paymentConfirmations'), {
        ...confirmation,
        timestamp: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment confirmation:', error);
      throw error;
    }
  }

  async getPaymentConfirmations(userId: string): Promise<PaymentConfirmation[]> {
    try {
      const q = query(
        collection(db, 'paymentConfirmations'), 
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentConfirmation));
    } catch (error) {
      console.error('Error fetching payment confirmations:', error);
      return [];
    }
  }

  async updatePaymentConfirmation(id: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      await updateDoc(doc(db, 'paymentConfirmations', id), {
        status,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment confirmation:', error);
      throw error;
    }
  }

  // =======================
  // Orders
  // =======================
  async getOrders(userId: string, limit_count?: number): Promise<Order[]> {
    try {
      let q = query(
        collection(db, 'orders'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      const sortedOrders = orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return limit_count ? sortedOrders.slice(0, limit_count) : sortedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async addOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        timestamp: new Date().toISOString(),
      });
      await this.createBill(docRef.id, order);
      return docRef.id;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', id), updates);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // =======================
  // Bills
  // =======================
  async createBill(orderId: string, order: Omit<Order, 'id'>): Promise<string> {
    try {
      const subtotal = order.totalAmount;
      const tax = subtotal * 0.15;
      const total = subtotal + tax;
      const bill: Omit<Bill, 'id'> = {
        orderId,
        userId: order.userId,
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal,
        tax,
        total,
        timestamp: new Date().toISOString(),
        status: 'draft',
      };
      const docRef = await addDoc(collection(db, 'bills'), bill);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  async getBills(userId: string): Promise<Bill[]> {
    try {
      const q = query(
        collection(db, 'bills'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
      return bills.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<void> {
    try {
      await updateDoc(doc(db, 'bills', id), updates);
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  // =======================
  // Analytics
  // =======================
  async getMenuStats(userId: string): Promise<MenuStats> {
    try {
      const orders = await this.getOrders(userId);
      const menuItems = await this.getMenuItems(userId);
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalViews = menuItems.reduce((sum, item) => sum + item.views, 0);
      const itemOrderCounts: Record<string, { name: string; orders: number }> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!itemOrderCounts[item.id]) {
            const menuItem = menuItems.find(mi => mi.id === item.id);
            itemOrderCounts[item.id] = { name: menuItem?.name || item.name, orders: 0 };
          }
          itemOrderCounts[item.id].orders += item.quantity;
        });
      });
      const popularItems = Object.entries(itemOrderCounts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);
      const monthlyRevenue = this.calculateMonthlyRevenue(orders);
      return {
        totalOrders,
        totalRevenue,
        totalViews,
        popularItems,
        recentOrders: orders.slice(0, 10),
        monthlyRevenue,
      };
    } catch (error) {
      console.error('Error fetching menu stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalViews: 0,
        popularItems: [],
        recentOrders: [],
        monthlyRevenue: [],
      };
    }
  }

  private calculateMonthlyRevenue(orders: Order[]): Array<{ month: string; revenue: number }> {
    const monthlyData: Record<string, number> = {};
    orders.forEach(order => {
      const date = new Date(order.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + order.totalAmount;
    });
    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }

  // =======================
  // File Upload
  // =======================
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // =======================
  // User Profile
  // =======================
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();