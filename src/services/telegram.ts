import axios from 'axios';
import { Order, PendingOrder, OrderItem } from '../types';

const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8'; // Replace with your actual bot token
const ADMIN_CHAT_ID = -1002701066037;  // Admin notifications
const KITCHEN_CHAT_ID = -1002660493020; // Kitchen orders
const BAR_CHAT_ID = -1002859150516;     // Bar orders
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramService {
  async sendMessage(message: string, chatId: number = ADMIN_CHAT_ID): Promise<boolean> {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
      
      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendPhoto(photo: File, caption: string, chatId: number = ADMIN_CHAT_ID): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId.toString());
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

  async sendPendingOrderWithButtons(pendingOrder: PendingOrder): Promise<boolean> {
    const orderItems = pendingOrder.items
      .map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
      .join('\n');

    const message = `
🍽️ <b>New Order Pending Approval - Table ${pendingOrder.tableNumber}</b>

${orderItems}

💰 <b>Total: $${pendingOrder.totalAmount.toFixed(2)}</b>
🕐 <b>Time:</b> ${new Date(pendingOrder.timestamp).toLocaleString()}

⚠️ <b>Awaiting approval...</b>
    `.trim();

    const buttons = [
      [
        { text: '✅ Approve Order', callback_data: `approve_order_${pendingOrder.id}` },
        { text: '❌ Reject Order', callback_data: `reject_order_${pendingOrder.id}` }
      ]
    ];

    return this.sendMessageWithButtons(ADMIN_CHAT_ID, message, buttons);
  }

  async sendOrderToDepartment(order: Order, department: 'kitchen' | 'bar', departmentItems: OrderItem[]): Promise<boolean> {
    if (departmentItems.length === 0) return true;

    const chatId = department === 'kitchen' ? KITCHEN_CHAT_ID : BAR_CHAT_ID;
    const emoji = department === 'kitchen' ? '👨‍🍳' : '🍹';
    const departmentName = department === 'kitchen' ? 'Kitchen' : 'Bar';

    const orderItems = departmentItems
      .map(item => `• ${item.name} x${item.quantity}`)
      .join('\n');

    const message = `
${emoji} <b>${departmentName} Order - Table ${order.tableNumber}</b>

${orderItems}

🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}
📋 <b>Order ID:</b> ${order.id.slice(0, 8)}

<b>Status: APPROVED - Start Preparation</b>
    `.trim();

    const buttons = [
      [
        { text: '✅ Ready', callback_data: `ready_${department}_${order.id}` },
        { text: '⏰ Delay', callback_data: `delay_${department}_${order.id}` }
      ]
    ];

    return this.sendMessageWithButtons(chatId, message, buttons);
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

    return this.sendMessage(message, ADMIN_CHAT_ID);
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

    // Send photo first
    await this.sendPhoto(screenshot, caption, ADMIN_CHAT_ID);
    
    // Then send message with approve/reject buttons
    const paymentMessage = `
💳 <b>Payment Verification Needed - Table ${order.tableNumber}</b>

💰 <b>Amount: $${order.totalAmount.toFixed(2)}</b>
💳 <b>Method:</b> ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}
    `.trim();

    const buttons = [
      [
        { text: '✅ Accept Payment', callback_data: `approve_payment_${order.id}` },
        { text: '❌ Reject Payment', callback_data: `reject_payment_${order.id}` }
      ]
    ];
    
    return this.sendMessageWithButtons(ADMIN_CHAT_ID, paymentMessage, buttons);
  }

  async sendWaiterCall(tableNumber: string): Promise<boolean> {
    const message = `📞 <b>Table ${tableNumber} is calling the waiter</b>\n🕐 ${new Date().toLocaleString()}`;
    return this.sendMessage(message, ADMIN_CHAT_ID);
  }

  async sendBillRequest(tableNumber: string): Promise<boolean> {
    const message = `💸 <b>Table ${tableNumber} is requesting the bill</b>\n🕐 ${new Date().toLocaleString()}`;
    return this.sendMessage(message, ADMIN_CHAT_ID);
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
    
    return this.sendMessage(message, ADMIN_CHAT_ID);
  }

  async sendPaymentConfirmationWithButtons(confirmationId: string, tableNumber: string, total: number, method: string): Promise<boolean> {
    const message = `
💳 <b>Payment Verification Needed - Table ${tableNumber}</b>

💰 <b>Amount: $${total.toFixed(2)}</b>
💳 <b>Method:</b> ${method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();
    
    const buttons = [
      [
        { text: '✅ Accept Payment', callback_data: `approve_payment_${confirmationId}` },
        { text: '❌ Reject Payment', callback_data: `reject_payment_${confirmationId}` }
      ]
    ];
    
    return this.sendMessageWithButtons(ADMIN_CHAT_ID, message, buttons);
  }

  // New method to handle Telegram callback responses (for bot webhook)
  async handleTelegramCallback(callbackData: string, pendingOrders: any[], firebaseService: any): Promise<boolean> {
    try {
      if (callbackData.startsWith('approve_order_')) {
        const orderId = callbackData.replace('approve_order_', '');
        const pendingOrder = pendingOrders.find(p => p.id === orderId);
        
        if (pendingOrder) {
          await firebaseService.approvePendingOrder(orderId, pendingOrder);
          return true;
        }
      } else if (callbackData.startsWith('reject_order_')) {
        const orderId = callbackData.replace('reject_order_', '');
        await firebaseService.rejectPendingOrder(orderId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error handling Telegram callback:', error);
      return false;
    }
  }

  private async sendMessageWithButtons(chatId: number, message: string, buttons: any[]): Promise<boolean> {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
      return response.data.ok;
    } catch (error) {
      console.error('Error sending message with buttons:', error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();