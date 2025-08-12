import React from 'react';
import { X, Receipt, CreditCard } from 'lucide-react';
import { TableBill } from '../types';

interface BillModalProps {
  tableBill: TableBill | null;
  tableNumber: string;
  businessName: string;
  onClose: () => void;
  onPaymentOrder: () => void;
}



export const BillModal: React.FC<BillModalProps> = ({
  tableBill,
  tableNumber,
  businessName,
  onClose,
  onPaymentOrder,
}) => {
  if (!tableBill) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Outstanding Bill</h2>
          <p className="text-gray-600 mb-5 text-sm">Table {tableNumber} has no current orders.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden animate-slide-up flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Current Bill</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close bill"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Business Header */}
          <div className="text-center mb-6 pb-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
            <p className="text-gray-600">Table {tableNumber}</p>
            <p className="text-sm text-gray-500">
              {new Date(tableBill.updatedAt).toLocaleString()}
            </p>
          </div>

          {/* Bill Items */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-900">Items Ordered</h3>
            {tableBill.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Bill Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${tableBill.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({((tableBill.tax / tableBill.subtotal) * 100).toFixed(0)}%):</span>
              <span className="font-medium">${tableBill.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">${tableBill.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <button
              onClick={onPaymentOrder}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Pay Now
            </button>
            <p className="text-xs text-gray-500 text-center">
              You'll be able to select your payment method in the next step
            </p>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Close Bill
          </button>
        </div>
      </div>
    </div>
  );
};