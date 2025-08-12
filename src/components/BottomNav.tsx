import React from 'react';
import { Home, ChefHat, Receipt, ShoppingCart, Settings, FileText } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onWaiterCall: () => void;
  onBillClick: () => void;
  onCartClick: () => void;
  onSettingsClick: () => void;
  cartItemCount: number;
  language: 'en' | 'am';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onWaiterCall,
  onBillClick,
  onCartClick,
  onSettingsClick,
  cartItemCount,
  language,
}) => {
  const t = useTranslation(language);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'home'
              ? 'text-green-600 bg-green-50'
              : 'text-gray-600 hover:text-green-600'
          }`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('home')}</span>
        </button>

        <button
          onClick={onWaiterCall}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <ChefHat className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('waiter')}</span>
        </button>

        <button
          onClick={onCartClick}
          className="relative flex flex-col items-center py-2 px-3 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
        >
          <ShoppingCart className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('cart')}</span>
          {cartItemCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </div>
          )}
        </button>

        <button
          onClick={onBillClick}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <FileText className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('bill')}</span>
        </button>

        <button
          onClick={onSettingsClick}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('settings')}</span>
        </button>
      </div>
    </div>
  );
};