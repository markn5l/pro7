// Telegram webhook handler for Vercel
// This file should be placed in the api/ directory for Vercel deployment

const axios = require('axios');

// Firebase Admin SDK setup (you'll need to configure this)
// const admin = require('firebase-admin');

const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { callback_query } = req.body;
    
    if (callback_query) {
      const { data: callbackData, message, from } = callback_query;
      const chatId = message.chat.id;
      
      // Handle order approval/rejection
      if (callbackData.startsWith('approve_order_') || callbackData.startsWith('reject_order_')) {
        const orderId = callbackData.replace(/^(approve_order_|reject_order_)/, '');
        const isApproval = callbackData.startsWith('approve_order_');
        
        try {
          // Here you would integrate with your Firebase service
          // For now, we'll just send a confirmation message
          
          const responseMessage = isApproval 
            ? `✅ Order ${orderId.slice(0, 8)} has been approved and sent to kitchen/bar!`
            : `❌ Order ${orderId.slice(0, 8)} has been rejected.`;
          
          // Send confirmation message
          await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: responseMessage,
            parse_mode: 'HTML'
          });
          
          // Answer the callback query to remove the loading state
          await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
            callback_query_id: callback_query.id,
            text: isApproval ? 'Order approved!' : 'Order rejected!',
            show_alert: false
          });
          
        } catch (error) {
          console.error('Error processing order:', error);
          
          await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
            callback_query_id: callback_query.id,
            text: 'Error processing order. Please try again.',
            show_alert: true
          });
        }
      }
      
      // Handle kitchen/bar ready/delay responses
      else if (callbackData.includes('ready_') || callbackData.includes('delay_')) {
        const [action, department, orderId] = callbackData.split('_');
        const isReady = action === 'ready';
        const departmentName = department === 'kitchen' ? 'Kitchen' : 'Bar';
        
        const responseMessage = isReady 
          ? `✅ ${departmentName} marked order ${orderId.slice(0, 8)} as READY!`
          : `⏰ ${departmentName} reported delay for order ${orderId.slice(0, 8)}`;
        
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
          chat_id: chatId,
          text: responseMessage,
          parse_mode: 'HTML'
        });
        
        await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
          callback_query_id: callback_query.id,
          text: isReady ? 'Marked as ready!' : 'Delay reported!',
          show_alert: false
        });
      }
    }
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}