import React from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { OrderItem } from '../types';

interface CartModalProps {
  items: OrderItem[];
  totalAmount: number;
  tableNumber: string;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  items,
  totalAmount,
  tableNumber,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
}) => {
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-600 mb-5 text-sm">Add some delicious items to get started!</p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden animate-slide-up flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 bg-gray-50 rounded-xl p-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                <p className="text-green-600 text-sm font-medium">${item.price.toFixed(2)} each</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-white rounded-lg border">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-semibold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">${item.total.toFixed(2)}</p>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-green-600">${totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={onPlaceOrder}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Place Order (Pay Later)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
