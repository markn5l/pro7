import React from 'react';
import { Utensils, Wifi } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface TableHeaderProps {
  tableNumber: string;
  language: 'en' | 'am';
  orderType: 'dine-in' | 'takeaway';
}

export const TableHeader: React.FC<TableHeaderProps> = ({ 
  tableNumber, 
  language, 
  orderType 
}) => {
  const t = useTranslation(language);

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('table')} {tableNumber}</h1>
            <p className="text-green-100 text-sm">{t('welcome')}</p>
            <div className="flex items-center mt-1">
              <span className="text-xs bg-green-500 bg-opacity-30 px-2 py-1 rounded-full">
                {orderType === 'dine-in' ? t('dineIn') : t('takeaway')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-green-100">
          <Wifi className="w-4 h-4" />
          <span className="text-sm">Connected</span>
        </div>
      </div>
    </div>
  );
};