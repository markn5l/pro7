import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  MenuItem, Category, Order, Bill, User, MenuStats, 
  PendingOrder, TableBill, RestaurantSettings, PaymentConfirmation, OrderItem
} from '../types';

class FirebaseService {
  // =======================
  // Menu Items with Department Support
  // =======================
  async getMenuItems(userId: string): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'menuItems'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        department: doc.data().department || 'kitchen', // Default to kitchen
        ...doc.data()
      } as MenuItem));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), {
        department: item.department || 'kitchen', // Default to kitchen
        ...item,
        created_at: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  }

  // =======================
  // Order Processing with Department Splitting
  // =======================
  async approvePendingOrder(pendingOrderId: string, pendingOrder: PendingOrder): Promise<string> {
    try {
      // 1. Create main approved order
      const approvedOrder: Omit<Order, 'id'> = {
        ...pendingOrder,
        status: 'approved',
        paymentStatus: 'pending',
        timestamp: Timestamp.now()
      };
      const orderId = await this.addOrder(approvedOrder);

      // 2. Split items by department
      const menuItems = await this.getMenuItems(pendingOrder.userId);
      const { kitchenItems, barItems } = this.splitItemsByDepartment(pendingOrder.items, menuItems);

      // 3. Send to departments
      if (kitchenItems.length > 0) {
        await this.sendToDepartment(orderId, pendingOrder.userId, kitchenItems, 'kitchen');
      }
      if (barItems.length > 0) {
        await this.sendToDepartment(orderId, pendingOrder.userId, barItems, 'bar');
      }

      // 4. Update billing and clean up
      await this.addToTableBill(pendingOrder.userId, pendingOrder.tableNumber, pendingOrder.items);
      await deleteDoc(doc(db, 'pendingOrders', pendingOrderId));
      
      return orderId;
    } catch (error) {
      console.error('Error approving order:', error);
      throw error;
    }
  }

  private splitItemsByDepartment(items: OrderItem[], menuItems: MenuItem[]) {
    const kitchenItems: OrderItem[] = [];
    const barItems: OrderItem[] = [];

    items.forEach(item => {
      const menuItem = menuItems.find(mi => mi.id === item.id);
      (menuItem?.department === 'bar' ? barItems : kitchenItems).push(item);
    });

    return { kitchenItems, barItems };
  }

  private async sendToDepartment(
    orderId: string, 
    userId: string, 
    items: OrderItem[], 
    department: 'kitchen' | 'bar'
  ) {
    await addDoc(collection(db, `${department}Orders`), {
      orderId,
      userId,
      items,
      status: 'pending',
      createdAt: Timestamp.now(),
      department
    });
  }

  // =======================
  // Department Order Tracking
  // =======================
  async getKitchenOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'kitchenOrders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt // Map createdAt to timestamp for consistency
      } as Order));
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      throw error;
    }
  }

  async getBarOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'barOrders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt
      } as Order));
    } catch (error) {
      console.error('Error fetching bar orders:', error);
      throw error;
    }
  }

  // =======================
  // Core Order Management
  // =======================
  async addOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        timestamp: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // =======================
  // Table Bill Management
  // =======================
  async addToTableBill(userId: string, tableNumber: string, items: OrderItem[]): Promise<void> {
    try {
      const existingBill = await this.getTableBill(userId, tableNumber);
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.15;
      const total = subtotal + tax;

      if (existingBill) {
        await updateDoc(doc(db, 'tableBills', existingBill.id), {
          items: [...existingBill.items, ...items],
          subtotal: existingBill.subtotal + subtotal,
          tax: existingBill.tax + tax,
          total: existingBill.total + total,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'tableBills'), {
          userId,
          tableNumber,
          items,
          subtotal,
          tax,
          total,
          status: 'active',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating table bill:', error);
      throw error;
    }
  }

  async getTableBill(userId: string, tableNumber: string): Promise<TableBill | null> {
    try {
      const q = query(
        collection(db, 'tableBills'),
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber),
        where('status', '==', 'active'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as TableBill;
    } catch (error) {
      console.error('Error fetching table bill:', error);
      throw error;
    }
  }

  // =======================
  // Utility Methods
  // =======================
  async markOrderAsComplete(orderId: string, department: 'kitchen' | 'bar'): Promise<void> {
    try {
      // Find the department order
      const q = query(
        collection(db, `${department}Orders`),
        where('orderId', '==', orderId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await updateDoc(doc(db, `${department}Orders`, snapshot.docs[0].id), {
          status: 'completed',
          completedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error marking order as complete:', error);
      throw error;
    }
  }
// Add this to your FirebaseService class
async getMenuStats(userId: string): Promise<MenuStats> {
  try {
    const [orders, menuItems] = await Promise.all([
      this.getOrders(userId),
      this.getMenuItems(userId)
    ]);

    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalViews = menuItems.reduce((sum, item) => sum + (item.views || 0), 0);

    // Calculate popular items
    const itemOrderCounts: Record<string, { name: string; orders: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemOrderCounts[item.id]) {
          const menuItem = menuItems.find(mi => mi.id === item.id);
          itemOrderCounts[item.id] = {
            name: menuItem?.name || item.name,
            orders: 0
          };
        }
        itemOrderCounts[item.id].orders += item.quantity;
      });
    });

    const popularItems = Object.entries(itemOrderCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    // Calculate monthly revenue
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
    console.error('Error calculating menu stats:', error);
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
    .slice(-6); // Last 6 months
}
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();