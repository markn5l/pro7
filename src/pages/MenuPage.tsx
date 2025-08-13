import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { MenuItem, TableBill } from '../types';
import { MenuCard } from '../components/MenuCard';
import { MenuDetail } from '../components/MenuDetail';
import { CartModal } from '../components/CartModal';
import { BillModal } from '../components/BillModal';
import { BottomNav } from '../components/BottomNav';
import { CategoryFilter } from '../components/CategoryFilter';
import { TableHeader } from '../components/TableHeader';
import { SettingsModal } from '../components/SettingsModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { PaymentModal } from '../components/PaymentModal';
import { useCart } from '../hooks/useCart';
import { useSettings } from '../hooks/useSettings';
import { firebaseService } from '../services/firebase';
import { telegramService } from '../services/telegram';
import { AnalyticsService } from '../services/analytics';
import { useTranslation } from '../utils/translations';
import { useMenuTheme } from '../hooks/useMenuTheme';

export const MenuPage: React.FC = () => {
  const { userId, tableNumber } = useParams<{ userId: string; tableNumber: string }>();
  const { theme } = useMenuTheme(userId);
  const { settings, updateSettings } = useSettings();
  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems,
  } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('home');
  const [tableBill, setTableBill] = useState<TableBill | null>(null);
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [analytics] = useState(() => new AnalyticsService(tableNumber || '1'));
  const t = useTranslation(settings.language);

  useEffect(() => {
    if (userId) {
      loadMenuItems();
      loadTableBill();
    }
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        loadTableBill();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadMenuItems = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const items = await firebaseService.getMenuItems(userId);
      setMenuItems(items);
      setUserExists(items.length > 0);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setUserExists(false);
    } finally {
      setLoading(false);
    }
  };

  const loadTableBill = async () => {
    if (!userId || !tableNumber) return;
    try {
      const bill = await firebaseService.getTableBill(userId, tableNumber);
      setTableBill(bill);
    } catch (error) {
      console.error('Error loading table bill:', error);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    analytics.trackItemView(item.id);
    firebaseService.updateMenuItem(item.id, { views: item.views + 1 });
    setSelectedItem(item);
  };

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    const pendingOrderData = {
      tableNumber: tableNumber || '1',
      userId: userId || '',
      items: cartItems,
      totalAmount: getTotalAmount(),
      timestamp: new Date().toISOString(),
    };

    analytics.trackOrder({ 
      id: 'temp', 
      ...pendingOrderData, 
      status: 'pending_approval',
      paymentStatus: 'pending'
    });
    
    try {
      const pendingOrderId = await firebaseService.addPendingOrder(pendingOrderData);
      setLastOrderId(pendingOrderId);
      
      // Send pending order with approve/reject buttons
      await telegramService.sendPendingOrderWithButtons({ 
        id: pendingOrderId, 
        ...pendingOrderData
      });
      
      clearCart();
      setShowCart(false);
      setTimeout(() => setShowFeedback(true), 2000);
      alert('Order submitted for approval! You will be notified once approved.');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handlePaymentOrder = () => {
    if (cartItems.length === 0) return;
    setShowCart(false);
    setShowPayment(true);
  };

  const handlePaymentSubmit = async (paymentData: { screenshot: File; method: string; screenshotUrl: string }) => {
    if (isPayingBill) {
      if (!tableBill) return;
      
      try {
        // Create payment confirmation record
        const paymentConfirmation = {
          tableNumber: tableBill.tableNumber,
          userId: userId || '',
          items: tableBill.items,
          subtotal: tableBill.subtotal,
          tax: tableBill.tax,
          total: tableBill.total,
          method: paymentData.method === 'bank_transfer' ? 'bank_transfer' : 'mobile_money',
          screenshotUrl: paymentData.screenshotUrl,
          timestamp: new Date().toISOString(),
          status: 'pending' as const
        };

        const confirmationId = await firebaseService.addPaymentConfirmation(paymentConfirmation);
        
        // Send to Telegram with approve/reject buttons
        await telegramService.sendPaymentConfirmationWithButtons(
          confirmationId,
          tableBill.tableNumber,
          tableBill.total,
          paymentData.method
        );
        
        setShowPayment(false);
        setTimeout(() => setShowFeedback(true), 2000);
        alert('Payment confirmation submitted! Please wait for admin approval.');
      } catch (error) {
        console.error('Error submitting payment:', error);
        alert('Failed to submit payment confirmation. Please try again.');
      } finally {
        setIsPayingBill(false);
      }
    } else {
      if (cartItems.length === 0) return;
      
      try {
        const pendingOrderData = {
          tableNumber: tableNumber || '1',
          userId: userId || '',
          items: cartItems,
          totalAmount: getTotalAmount(),
          paymentMethod: paymentData.method === 'bank_transfer' ? 'bank_transfer' : 'mobile',
        };

        const pendingOrderId = await firebaseService.addPendingOrder(pendingOrderData);
        setLastOrderId(pendingOrderId);
        
        // Create payment confirmation for new order
        const paymentConfirmation = {
          tableNumber: tableNumber || '1',
          userId: userId || '',
          items: cartItems,
          subtotal: getTotalAmount(),
          tax: getTotalAmount() * 0.15,
          total: getTotalAmount() * 1.15,
          method: paymentData.method === 'bank_transfer' ? 'bank_transfer' : 'mobile_money',
          screenshotUrl: paymentData.screenshotUrl,
          timestamp: new Date().toISOString(),
          status: 'pending' as const,
          orderId: pendingOrderId
        };

        const confirmationId = await firebaseService.addPaymentConfirmation(paymentConfirmation);
        
        // Send to Telegram with approve/reject buttons
        await telegramService.sendPaymentConfirmationWithButtons(
          confirmationId,
          tableNumber || '1',
          getTotalAmount() * 1.15,
          paymentData.method
        );
        
        clearCart();
        setShowPayment(false);
        setTimeout(() => setShowFeedback(true), 2000);
        alert('Payment confirmation submitted! Your order is pending approval.');
      } catch (error) {
        console.error('Error submitting payment:', error);
        alert('Failed to submit payment confirmation. Please try again.');
      }
    }
  };

  const handleWaiterCall = async () => {
    analytics.trackWaiterCall();
    try {
      await telegramService.sendWaiterCall(tableNumber || '1');
      alert(t('waiterCalled'));
    } catch (error) {
      console.error('Error calling waiter:', error);
      alert('Waiter call registered! (Note: Telegram notification may have failed)');
    }
  };

  const handleBillClick = () => {
    setShowBill(true);
  };

  const handleFeedbackSubmit = (feedback: any) => {
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.push(feedback);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    alert(t('thankYou'));
  };

  if (userExists === false) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TableHeader 
        tableNumber={tableNumber || '1'} 
        language={settings.language}
        orderType={settings.orderType}
      />
      
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="p-4 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              theme={theme}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      </div>

      {selectedItem && (
        <MenuDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && (
        <CartModal
          items={cartItems}
          totalAmount={getTotalAmount()}
          tableNumber={tableNumber || '1'}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onPlaceOrder={handlePlaceOrder}
          onPaymentOrder={handlePaymentOrder}
        />
      )}

      {showPayment && (
        <PaymentModal
          items={isPayingBill ? (tableBill?.items || []) : cartItems}
          totalAmount={isPayingBill ? (tableBill?.total || 0) : getTotalAmount()}
          tableNumber={tableNumber || '1'}
          onClose={() => {
            setShowPayment(false);
            setIsPayingBill(false);
          }}
          onPaymentSubmit={handlePaymentSubmit}
        />
      )}

      {showBill && (
        <BillModal
          tableBill={tableBill}
          tableNumber={tableNumber || '1'}
          businessName="Restaurant"
          onClose={() => setShowBill(false)}
          onPaymentOrder={() => {
            setIsPayingBill(true);
            setShowBill(false);
            setShowPayment(true);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={updateSettings}
        />
      )}

      {showFeedback && lastOrderId && (
        <FeedbackModal
          orderId={lastOrderId}
          tableNumber={tableNumber || '1'}
          language={settings.language}
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onWaiterCall={handleWaiterCall}
        onBillClick={handleBillClick}
        onCartClick={() => setShowCart(true)}
        onSettingsClick={() => setShowSettings(true)}
        cartItemCount={getTotalItems()}
        language={settings.language}
      />
    </div>
  );
};