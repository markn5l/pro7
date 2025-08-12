import React, { useState } from 'react';
import { X, Plus, Minus, Clock, AlertTriangle } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuDetailProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

export const MenuDetail: React.FC<MenuDetailProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    onClose();
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden animate-slide-up flex flex-col shadow-xl">
        <div className="relative">
          <img
            src={item.photo || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={item.name}
            className="w-full h-36 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          {!item.available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Currently Unavailable</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
            <div className="mt-3">
              <span className="text-2xl font-bold text-green-600">
                ${item.price.toFixed(2)}
              </span>
              {item.popularity_score > 0 && (
                <div className="inline-flex items-center ml-3 text-yellow-500">
                  <span className="text-base">⭐</span>
                  <span className="ml-1 font-semibold text-sm">{item.popularity_score}/100</span>
                </div>
              )}
            </div>
          </div>

          {item.preparation_time > 0 && (
            <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">Preparation time: {item.preparation_time} minutes</span>
            </div>
          )}

          {item.ingredients && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Ingredients</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.ingredients}</p>
            </div>
          )}

          {item.allergens && (
            <div className="flex items-start text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-sm">Allergens: </span>
                <span className="text-sm">{item.allergens}</span>
              </div>
            </div>
          )}

          {(item.views > 0 || item.orders > 0) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Popularity</h3>
              <div className="flex space-x-4 text-xs text-gray-600">
                {item.views > 0 && <span>👁️ {item.views} views</span>}
                {item.orders > 0 && <span>🛒 {item.orders} orders</span>}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              {quantity > 1 && (
                <div className="text-gray-600 text-sm mb-1">
                  ${item.price.toFixed(2)} × {quantity}
                </div>
              )}
              <div className="text-xl font-bold text-green-600">
                Total: ${(item.price * quantity).toFixed(2)}
              </div>
            </div>

            <div className="flex items-center bg-gray-100 rounded-lg">
              <button
                onClick={decrementQuantity}
                className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-semibold text-base">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!item.available}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {item.available ? 'Add to Order' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};
