# Multi-User Menu Platform

A comprehensive platform where restaurant owners can create and manage their own digital menus with ordering capabilities.

## Features

### For Restaurant Owners (Admin Panel)
- **User Authentication**: Secure login/register system
- **Menu Management**: Add, edit, delete menu items and categories
- **Order Management**: View and manage all orders in real-time
- **Analytics Dashboard**: Track revenue, popular items, and customer insights
- **Bill Generation**: Automatic invoice creation for orders
- **Telegram Integration**: Receive orders directly in Telegram
- **Multi-table Support**: Handle multiple tables with unique URLs

### For Customers
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Multi-language Support**: English and Amharic
- **Order Types**: Dine-in or takeaway options
- **Payment Integration**: Upload payment screenshots
- **Real-time Updates**: Live menu availability and pricing

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Deployment**: Vercel
- **Charts**: Recharts
- **Icons**: Lucide React

## Setup Instructions

### 1. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Get your Firebase config

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

### 5. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Usage

### For Restaurant Owners
1. Register at `/register`
2. Login at `/login`
3. Access admin panel at `/admin`
4. Add menu items and categories
5. Share menu URL: `/menu/{userId}/table/{tableNumber}`

### For Customers
1. Scan QR code or visit menu URL
2. Browse menu items
3. Add items to cart
4. Place order or pay immediately
5. Receive confirmation

## Database Structure

### Collections
- `users` - Restaurant owner profiles
- `menuItems` - Menu items for each restaurant
- `categories` - Menu categories
- `orders` - Customer orders
- `bills` - Generated invoices
- `globalSettings` - Platform-wide settings

## Security Features
- Firebase Authentication
- User-specific data isolation
- Secure file uploads
- Protected admin routes
- Input validation and sanitization

## API Integration
- Telegram Bot API for notifications
- Firebase Storage for image uploads
- Real-time Firestore updates

## Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## License
MIT License - see LICENSE file for details