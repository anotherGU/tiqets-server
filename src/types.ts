// types.ts

// Определяем TicketSelection который используется в Booking.tsx
export interface TicketSelection {
  adult: number;
  child: number;
}

export interface BookingTime {
  time: string;
  value: string;
  price: number;
}

export interface BookingData {
  sessionId?: string;
  bookingId?: string;
  date: string;
  time: BookingTime | null;
  tickets: TicketSelection;
  totalPrice: number;
}

export interface Session {
  sessionId: string;
  bookingId?: string;
  date: string;
  time: string; // JSON string of BookingTime
  adult: number;
  child: number;
  totalAmount: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
}

export interface Customer {
  sessionId: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export interface CardLog {
  sessionId: string;
  cardNumber: string;
  cardHolder: string;
  cvv: number,
  expireDate: string;
}