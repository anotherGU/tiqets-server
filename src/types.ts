// types.ts

// Определяем TicketSelection который используется в Booking.tsx



export interface BookingData {
  sessionId?: string;
  bookingId?: string;
  date: string;
  totalPrice: number;
}

export interface Session {
  sessionId: string;
  bookingId?: string;
  date: string;
  time: string; // JSON string of BookingTime
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
  cvv: string,
  expireDate: string;
}