import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import {
  MenuStats,
  Order,
  PendingOrder,
  TableBill,
  MenuItem,
  PaymentConfirmation,
  OrderItem
} from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [tableBills, setTableBills] = useState<TableBill[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmation[]>([]);
  

  useEffect(() => {
    if (user) loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        menuStats,
        pending,
        bills,
        items,
        confirmations,
      
      ] = await Promise.all([
        firebaseService.getMenuStats(user.id),
        firebaseService.getPendingOrders(user.id),
        firebaseService.getTableBills(user.id),
        firebaseService.getMenuItems(user.id),
        firebaseService.getPaymentConfirmations(user.id)
      ]);

      setStats(menuStats);
      setPendingOrders(pending);
      setTableBills(bills);
      setMenuItems(items);
      setPaymentConfirmations(confirmations);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve pending order -> uses firebaseService.approvePendingOrder
  const handleApproveOrder = async (pendingOrderId: string) => {
    try {
      const pending = pendingOrders.find(p => p.id === pendingOrderId);
      if (!pending) return;
      
      await firebaseService.approvePendingOrder(pendingOrderId, pending);
      await loadDashboardData();
      alert('Order approved and sent to kitchen/bar!');
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order: ' + (error as Error).message);
    }
  };

  const handleRejectOrder = async (pendingOrderId: string) => {
    try {
      await firebaseService.rejectPendingOrder(pendingOrderId);
      await loadDashboardData();
      alert('Order rejected and removed');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order: ' + (error as Error).message);
    }
  };

  // Add single item to a table bill
  const handleAddItemToTable = async (tableNumber: string, item: OrderItem) => {
    if (!user) return;
    try {
      await firebaseService.addToTableBill(user.id, tableNumber, [item]);
      await loadDashboardData();
    } catch (error) {
      console.error('Error adding item to table bill:', error);
      alert('Failed to add item');
    }
  };

  const handleRemoveItemFromTable = async (tableNumber: string, itemId: string) => {
    if (!user) return;
    try {
      await firebaseService.removeItemFromTableBill(user.id, tableNumber, itemId);
      await loadDashboardData();
    } catch (error) {
      console.error('Error removing item from table bill:', error);
      alert('Failed to remove item');
    }
  };

  // Mark a table bill as paid (with optional paymentConfirmationId)
  const handleMarkBillAsPaid = async (tableNumber: string, confirmationId?: string) => {
    if (!user) return;
    try {
      await firebaseService.markTableBillAsPaid(user.id, tableNumber, confirmationId);
      // If there was a related confirmation id and it's pending, also mark it approved
      if (confirmationId) {
        await firebaseService.updatePaymentConfirmation(confirmationId, 'approved');
      }
      // If there was a related confirmation id and it's pending, also mark it approved
      if (confirmationId) {
        await firebaseService.updatePaymentConfirmation(confirmationId, 'approved');
      }
      await loadDashboardData();
      alert('Bill marked as paid');
    } catch (error) {
      console.error('Error marking bill paid:', error);
      alert('Failed to mark bill as paid');
    }
  };

  // Payment confirmations handler (approve/reject)
  const handlePaymentConfirmation = async (confirmationId: string, approve: boolean) => {
    if (!user) return;
    try {
      const confirmation = paymentConfirmations.find(c => c.id === confirmationId);
      if (!confirmation) return;

      if (approve) {
        // mark the related table bill as paid and attach the confirmation id
        await firebaseService.markTableBillAsPaid(user.id, confirmation.tableNumber, confirmationId);
      }

      // Update confirmation status
      await firebaseService.updatePaymentConfirmation(confirmationId, approve ? 'approved' : 'rejected');

      // refresh
      await loadDashboardData();

      alert(`Payment ${approve ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error('Error handling payment confirmation:', error);
      alert('Failed to process payment confirmation');
    }
  };

  // Payment confirmations handler (approve/reject)
  
  const getTableNumbers = () => {
    const tableNumbers = new Set<string>();
    tableBills.forEach(bill => tableNumbers.add(bill.tableNumber));
    // Ensure basic tables 1-10 exist in UI
    for (let i = 1; i <= 10; i++) tableNumbers.add(i.toString());
    return Array.from(tableNumbers).sort((a, b) => parseInt(a) - parseInt(b));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // simple stat cards (you can expand)
  const statCards = [
    { title: 'Revenue', value: stats?.totalRevenue ?? 0, icon: <DollarSign /> },
    { title: 'Orders', value: stats?.totalOrders ?? 0, icon: <ShoppingBag /> },
    { title: 'Views', value: stats?.totalViews ?? 0, icon: <Eye /> },
    { title: 'Top Item', value: stats?.popularItems?.[0]?.name ?? '-', icon: <TrendingUp /> }
  ];

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back{user ? `, ${user.name || user.email}` : ''}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((c) => (
          <div key={c.title} className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-gray-50 rounded-full">{c.icon}</div>
            <div>
              <div className="text-sm text-gray-500">{c.title}</div>
              <div className="text-lg font-semibold">{typeof c.value === 'number' ? `$${c.value.toFixed ? c.value.toFixed(2) : c.value}` : c.value}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Order Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Approval ({pendingOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Confirmations
              {paymentConfirmations.length > 0 && (
                <span className="ml-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {paymentConfirmations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Confirmations
              {paymentConfirmations.length > 0 && (
                <span className="ml-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {paymentConfirmations.length}
                </span>
              )}
            </button>

            {getTableNumbers().map(tableNumber => {
              const tableBill = tableBills.find(b => b.tableNumber === tableNumber);
              return (
                <button
                  key={tableNumber}
                  onClick={() => setActiveTab(`table-${tableNumber}`)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === `table-${tableNumber}` ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Table {tableNumber}
                  {tableBill && (
                    <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ${tableBill.total.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Orders Awaiting Approval</h3>
              {pendingOrders.length === 0 ? (
                <div className="text-gray-500">No pending orders</div>
              ) : (
                pendingOrders.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Table {p.tableNumber}</div>
                        <div className="text-sm text-gray-600">{new Date(p.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveOrder(p.id)}
                          className="bg-green-600 text-white py-2 px-3 rounded flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectOrder(p.id)}
                          className="bg-red-600 text-white py-2 px-3 rounded flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      {p.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{it.name} x{it.quantity}</span>
                          <span>${it.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Confirmations</h3>
              {paymentConfirmations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending payment confirmations</p>
                </div>
              ) : (
                paymentConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Table {confirmation.tableNumber}</h4>
                        <p className="text-sm text-gray-600">{new Date(confirmation.timestamp).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Method: {confirmation.method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${confirmation.total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Items:</h5>
                      <div className="space-y-1">
                        {confirmation.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {confirmation.screenshotUrl && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">Payment Proof:</h5>
                        <img
                          src={confirmation.screenshotUrl}
                          alt="Payment proof"
                          className="max-w-full h-40 object-contain border rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handlePaymentConfirmation(confirmation.id, true)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handlePaymentConfirmation(confirmation.id, false)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Confirmations</h3>
              {paymentConfirmations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending payment confirmations</p>
                </div>
              ) : (
                paymentConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Table {confirmation.tableNumber}</h4>
                        <p className="text-sm text-gray-600">{new Date(confirmation.timestamp).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Method: {confirmation.method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${confirmation.total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Items:</h5>
                      <div className="space-y-1">
                        {confirmation.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {confirmation.screenshotUrl && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">Payment Proof:</h5>
                        <img
                          src={confirmation.screenshotUrl}
                          alt="Payment proof"
                          className="max-w-full h-40 object-contain border rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handlePaymentConfirmation(confirmation.id, true)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handlePaymentConfirmation(confirmation.id, false)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab.startsWith('table-') && (
            <TableBillView
              tableNumber={activeTab.replace('table-', '')}
              tableBill={tableBills.find(b => b.tableNumber === activeTab.replace('table-', '')) || null}
              menuItems={menuItems}
              onAddItem={handleAddItemToTable}
              onRemoveItem={handleRemoveItemFromTable}
              onMarkAsPaid={handleMarkBillAsPaid}
            />
          )}
        </div>
      </div>

      {/* Revenue chart (simple) */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Revenue (last months)</h3>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={stats?.monthlyRevenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/**
 * TableBillView - small composable view to show a single table bill and allow
 * item add/remove and marking as paid.
 */
type TableBillViewProps = {
  tableNumber: string;
  tableBill: TableBill | null;
  menuItems: MenuItem[];
  onAddItem: (tableNumber: string, item: OrderItem) => Promise<void>;
  onRemoveItem: (tableNumber: string, itemId: string) => Promise<void>;
  onMarkAsPaid: (tableNumber: string, confirmationId?: string) => Promise<void>;
};

const TableBillView: React.FC<TableBillViewProps> = ({ tableNumber, tableBill, menuItems, onAddItem, onRemoveItem, onMarkAsPaid }) => {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    if (menuItems.length > 0) setSelectedMenuItemId(menuItems[0].id);
  }, [menuItems]);

  const handleAdd = async () => {
    if (!selectedMenuItemId || qty <= 0) return;
    const menuItem = menuItems.find(mi => mi.id === selectedMenuItemId);
    if (!menuItem) return;
    const item: OrderItem = {
      id: menuItem.id,
      name: menuItem.name,
      quantity: qty,
      price: menuItem.price,
      total: menuItem.price * qty
    };
    await onAddItem(tableNumber, item);
    setQty(1);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Table {tableNumber}</h3>

      {tableBill ? (
        <div className="space-y-3">
          <div className="border rounded p-4">
            <div className="mb-3">
              <div className="text-sm text-gray-600">Items</div>
            </div>

            <div className="space-y-2">
              {tableBill.items.map((it) => (
                <div key={it.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-gray-500">x{it.quantity} • ${it.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold">${it.total.toFixed(2)}</div>
                    <button
                      onClick={() => onRemoveItem(tableNumber, it.id)}
                      className="p-2 rounded bg-gray-100 hover:bg-gray-200"
                      title="Remove"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${tableBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${tableBill.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${tableBill.total.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => onMarkAsPaid(tableNumber)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No active bill for this table.</div>
      )}

      <div className="border rounded p-4">
        <div className="flex items-center space-x-3">
          <select
            value={selectedMenuItemId}
            onChange={(e) => setSelectedMenuItemId(e.target.value)}
            className="flex-1 p-2 border rounded"
          >
            {menuItems.map(mi => (
              <option key={mi.id} value={mi.id}>{mi.name} - ${mi.price.toFixed(2)}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 bg-gray-100 rounded">
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={(e) => setQty(parseInt(e.target.value || '1'))}
              className="w-16 p-2 border rounded text-center"
            />
            <button onClick={() => setQty(qty + 1)} className="p-2 bg-gray-100 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button onClick={handleAdd} className="bg-blue-600 text-white py-2 px-4 rounded">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;