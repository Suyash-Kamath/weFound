import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Item, Sticker, Scan } from '@/types';
import { api } from '@/lib/api';

interface ItemState {
  items: Item[];
  stickers: Sticker[];
  scans: Scan[];
  
  // Item actions
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemBySticker: (shortCode: string) => Item | undefined;
  refreshItems: () => Promise<void>;
  
  // Sticker actions
  generateSticker: (userId: string) => Promise<Sticker>;
  claimSticker: (stickerId: string) => Promise<boolean>;
  mapStickerToItem: (stickerId: string, itemId: string) => Promise<void>;
  deactivateSticker: (stickerId: string) => Promise<void>;
  refreshStickers: () => Promise<void>;
  
  // Scan actions
  recordScan: (stickerId: string, deviceInfo: Scan['deviceInfo'], location?: Scan['location']) => Promise<Scan>;
  getScansBySticker: (stickerId: string) => Scan[];
  loadScansForSticker: (stickerId: string) => Promise<void>;
}

const toId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.toString === "function") return value.toString();
  return String(value);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeSticker = (sticker: unknown): Sticker => {
  const source = asRecord(sticker);
  return {
    id: toId(source.id || source._id),
    shortCode: String(source.shortCode || ""),
    status: (source.status as Sticker["status"]) || "pending",
    userId: toId(source.userId),
    itemId: source.itemId ? toId(source.itemId) : undefined,
    createdAt: new Date(String(source.createdAt || Date.now())),
    updatedAt: new Date(String(source.updatedAt || Date.now())),
  };
};

const normalizeItem = (item: unknown): Item => {
  const source = asRecord(item);
  const photos = Array.isArray(source.photos) ? source.photos.filter((p): p is string => typeof p === "string") : [];
  return {
    id: toId(source.id || source._id),
    name: String(source.name || ""),
    description: source.description ? String(source.description) : "",
    category: String(source.category || ""),
    photos,
    estimatedValue: typeof source.estimatedValue === "number" ? source.estimatedValue : undefined,
    stickerId: source.stickerId ? toId(source.stickerId) : "",
    userId: toId(source.userId),
    contactOptions: source.contactOptions as Item["contactOptions"],
    returnInstructions: source.returnInstructions ? String(source.returnInstructions) : "",
    createdAt: new Date(String(source.createdAt || Date.now())),
    updatedAt: new Date(String(source.updatedAt || Date.now())),
  };
};

const normalizeScan = (scan: unknown): Scan => {
  const source = asRecord(scan);
  return {
    id: toId(source.id || source._id),
    stickerId: toId(source.stickerId),
    timestamp: new Date(String(source.timestamp || source.createdAt || Date.now())),
    deviceInfo: (source.deviceInfo as Scan["deviceInfo"]) || {},
    location: source.location as Scan["location"] | undefined,
  };
};

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],
      stickers: [],
      scans: [],

      addItem: async (itemData) => {
        const response = await api.post('/items', itemData);
        const item = normalizeItem(response.item);
        set((state) => ({ items: [...state.items, item] }));
        if (item.stickerId) {
          await get().refreshStickers();
        }
        return item;
      },

      updateItem: async (id, updates) => {
        const response = await api.put(`/items/${id}`, updates);
        const updatedItem = normalizeItem(response.item);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? updatedItem : item
          ),
        }));
      },

      deleteItem: async (id) => {
        await api.del(`/items/${id}`);
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
        await get().refreshStickers();
      },

      getItemBySticker: (shortCode) => {
        const sticker = get().stickers.find((s) => s.shortCode === shortCode);
        if (!sticker?.itemId) return undefined;
        return get().items.find((i) => i.id === sticker.itemId);
      },

      refreshItems: async () => {
        const response = await api.get('/items');
        set({
          items: response.items.map(normalizeItem),
        });
      },

      generateSticker: async () => {
        const response = await api.post('/stickers', { count: 1 });
        const parsed = normalizeSticker(response.stickers[0]);
        set((state) => ({ stickers: [...state.stickers, parsed] }));
        return parsed;
      },

      claimSticker: async (stickerId) => {
        const response = await api.post(`/stickers/${stickerId}/claim`, {});
        if (response?.sticker) {
          await get().refreshStickers();
          return true;
        }
        return false;
      },

      mapStickerToItem: async (stickerId, itemId) => {
        await api.post(`/stickers/${stickerId}/map`, { itemId });
        await get().refreshStickers();
      },

      deactivateSticker: async (stickerId) => {
        await api.post(`/stickers/${stickerId}/deactivate`, {});
        await get().refreshStickers();
      },

      recordScan: async (stickerId, deviceInfo, location) => {
        const response = await api.post('/scans', { stickerId, deviceInfo, location });
        const scan = normalizeScan(response.scan);
        set((state) => ({ scans: [...state.scans, scan] }));
        return scan;
      },

      getScansBySticker: (stickerId) => {
        return get().scans.filter((s) => s.stickerId === stickerId);
      },

      refreshStickers: async () => {
        const response = await api.get('/stickers');
        set({
          stickers: response.stickers.map(normalizeSticker),
        });
      },

      loadScansForSticker: async (stickerId) => {
        const response = await api.get(`/scans/sticker/${stickerId}`);
        const nextScans = response.scans.map(normalizeScan);
        set((state) => ({
          scans: [...state.scans.filter((scan) => scan.stickerId !== stickerId), ...nextScans],
        }));
      },
    }),
    {
      name: 'lostfound-items',
    }
  )
);
