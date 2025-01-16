import axios from 'axios'
import * as dotenv from 'dotenv';
dotenv.config()


const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

export const sendAlert = async (message) => {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const params = {
          chat_id: chatId,
          text: {
            message,
            env: process.env.ENV,
            app_url: process.env.APP_URL
          },
        };
        const response = await axios.post(url, params);
        if (response.data.ok) {
            return console.log("Alert sent successfully:", response.data.result.text);
        }
        return console.error("Failed to send alert:", response.data.description);
    } catch (error) {
        console.error("Error sending alert:", error);
    }
};
