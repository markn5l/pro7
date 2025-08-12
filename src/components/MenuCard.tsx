import React from 'react';
import { MenuItem } from '../types';
import { useMenuTheme } from '../hooks/useMenuTheme';

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
  theme?: 'classic' | 'modern' | 'elegant' | 'minimal';
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onClick, theme = 'classic' }) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'modern':
        return {
          card: 'bg-white rounded-2xl shadow-lg border-0 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl',
          image: 'aspect-square relative overflow-hidden',
          content: 'p-4',
          title: 'font-bold text-gray-900 text-base mb-2 line-clamp-2',
          description: 'text-gray-500 text-sm mb-3 line-clamp-2',
          price: 'font-black text-blue-600 text-xl',
          unavailable: 'absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm',
          prepTime: 'absolute top-3 right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium'
        };
      case 'elegant':
        return {
          card: 'bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md border border-gray-200 overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-lg hover:border-gray-300',
          image: 'aspect-square relative overflow-hidden',
          content: 'p-4',
          title: 'font-serif font-semibold text-gray-800 text-base mb-2 line-clamp-2',
          description: 'text-gray-600 text-sm mb-3 line-clamp-2 italic',
          price: 'font-serif font-bold text-amber-600 text-lg',
          unavailable: 'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center',
          prepTime: 'absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded font-medium'
        };
      case 'minimal':
        return {
          card: 'bg-white rounded border border-gray-100 overflow-hidden cursor-pointer transform transition-all duration-150 hover:border-gray-300',
          image: 'aspect-square relative overflow-hidden',
          content: 'p-3',
          title: 'font-medium text-gray-900 text-sm mb-1 line-clamp-2',
          description: 'text-gray-500 text-xs mb-2 line-clamp-2',
          price: 'font-semibold text-gray-900 text-base',
          unavailable: 'absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center',
          prepTime: 'absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded'
        };
      default: // classic
        return {
          card: 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-md',
          image: 'aspect-square relative overflow-hidden',
          content: 'p-3',
          title: 'font-semibold text-gray-900 text-sm mb-1 line-clamp-2',
          description: 'text-gray-600 text-xs mb-2 line-clamp-2',
          price: 'font-bold text-green-600 text-lg',
          unavailable: 'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center',
          prepTime: 'absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div
      onClick={onClick}
      className={styles.card}
    >
      <div className={styles.image}>
        <img
          src={item.photo || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {!item.available && (
          <div className={styles.unavailable}>
            <span className="text-white font-semibold text-sm">Unavailable</span>
          </div>
        )}
        {item.preparation_time > 0 && (
          <div className={styles.prepTime}>
            {item.preparation_time}min
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>
          {item.name}
        </h3>
        <p className={styles.description}>
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span className={styles.price}>
            ${item.price.toFixed(2)}
          </span>
          {item.popularity_score > 0 && (
            <div className="flex items-center text-yellow-500 text-xs">
              <span>⭐</span>
              <span className="ml-1">{item.popularity_score}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};