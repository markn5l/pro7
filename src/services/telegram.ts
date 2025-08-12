import axios from 'axios';
import { Order } from '../types';

const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8'; // Replace with your actual bot token
const GROUP_CHAT_ID = -1002701066037;  // Target user ID
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramService {
  async sendMessage(message: string): Promise<boolean> {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: GROUP_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      });
      
      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendPhoto(photo: File, caption: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('chat_id', GROUP_CHAT_ID);
      formData.append('photo', photo);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram photo:', error);
      return false;
    }
  }

  async sendOrderNotification(order: Order): Promise<boolean> {
    const orderItems = order.items
      .map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
      .join('\n');

    const message = `
🍽️ <b>New Order - Table ${order.tableNumber}</b>

${orderItems}

💰 <b>Total: $${order.totalAmount.toFixed(2)}</b>
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}
    `.trim();

    return this.sendMessage(message);
  }

  async sendPaymentConfirmation(order: Order, paymentMethod: string, screenshot: File): Promise<boolean> {
    const orderItems = order.items
      .map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
      .join('\n');

    const caption = `
💳 <b>Payment Confirmation - Table ${order.tableNumber}</b>

${orderItems}

💰 <b>Total: $${order.totalAmount.toFixed(2)}</b>
💳 <b>Method:</b> ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}

📸 <b>Payment Screenshot Attached</b>
    `.trim();

    return this.sendPhoto(screenshot, caption);
  }
  async sendWaiterCall(tableNumber: string): Promise<boolean> {
    const message = `📞 <b>Table ${tableNumber} is calling the waiter</b>\n🕐 ${new Date().toLocaleString()}`;
    return this.sendMessage(message);
  }

  async sendBillRequest(tableNumber: string): Promise<boolean> {
    const message = `💸 <b>Table ${tableNumber} is requesting the bill</b>\n🕐 ${new Date().toLocaleString()}`;
    return this.sendMessage(message);
  }

  async sendDailySummary(summary: {
    totalOrders: number;
    totalRevenue: number;
    mostOrderedItems: Array<{ name: string; count: number }>;
    mostActiveTable: string;
    waiterCalls: number;
    billRequests: number;
  }): Promise<boolean> {
    const topItems = summary.mostOrderedItems
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${item.name} (${item.count} orders)`)
      .join('\n');

    const message = `
📊 <b>Daily Summary Report</b>
📅 ${new Date().toLocaleDateString()}

📈 <b>Orders:</b> ${summary.totalOrders}
💰 <b>Revenue:</b> $${summary.totalRevenue.toFixed(2)}
🏆 <b>Most Active Table:</b> ${summary.mostActiveTable}

🍽️ <b>Top Ordered Items:</b>
${topItems}

📞 <b>Waiter Calls:</b> ${summary.waiterCalls}
💸 <b>Bill Requests:</b> ${summary.billRequests}
    `.trim();

    return this.sendMessage(message);
  }
}

export const telegramService = new TelegramService();