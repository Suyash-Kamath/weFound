export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Sticker {
  id: string;
  shortCode: string;
  status: 'active' | 'inactive' | 'pending' | 'closed';
  userId: string;
  itemId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  photos: string[];
  estimatedValue?: number;
  stickerId: string;
  userId: string;
  contactOptions: ContactOptions;
  returnInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactOptions {
  showWhatsApp: boolean;
  showCall: boolean;
  showSms: boolean;
  showEmail: boolean;
  showInAppChat: boolean;
  whatsAppNumber?: string;
  phoneNumber?: string;
  email?: string;
}

export interface Scan {
  id: string;
  stickerId: string;
  timestamp: Date;
  deviceInfo: {
    os?: string;
    browser?: string;
    device?: string;
  };
  ip?: string;
  location?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  scanId: string;
  ownerId: string;
  finderId: string;
  itemId: string;
  status: 'active' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export const ITEM_CATEGORIES = [
  'Electronics',
  'Bags & Luggage',
  'Keys',
  'Wallets & Cards',
  'Documents',
  'Jewelry',
  'Clothing',
  'Sports Equipment',
  'Musical Instruments',
  'Books & Stationery',
  'Pets',
  'Other',
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];
