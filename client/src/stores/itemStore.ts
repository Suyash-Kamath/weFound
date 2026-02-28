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

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],
      stickers: [],
      scans: [],

      addItem: async (itemData) => {
        const response = await api.post('/items', itemData);
        const item: Item = {
          ...response.item,
          createdAt: new Date(response.item.createdAt),
          updatedAt: new Date(response.item.updatedAt),
        };
        set((state) => ({ items: [...state.items, item] }));
        if (item.stickerId) {
          await get().refreshStickers();
        }
        return item;
      },

      updateItem: async (id, updates) => {
        const response = await api.put(`/items/${id}`, updates);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...response.item, updatedAt: new Date(response.item.updatedAt) } : item
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
          items: response.items.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
        });
      },

      generateSticker: async () => {
        const response = await api.post('/stickers', { count: 1 });
        const sticker = response.stickers[0];
        const parsed: Sticker = {
          ...sticker,
          createdAt: new Date(sticker.createdAt),
          updatedAt: new Date(sticker.updatedAt),
        };
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
        const scan: Scan = {
          ...response.scan,
          timestamp: new Date(response.scan.timestamp),
        };
        set((state) => ({ scans: [...state.scans, scan] }));
        return scan;
      },

      getScansBySticker: (stickerId) => {
        return get().scans.filter((s) => s.stickerId === stickerId);
      },

      refreshStickers: async () => {
        const response = await api.get('/stickers');
        set({
          stickers: response.stickers.map((sticker: any) => ({
            ...sticker,
            createdAt: new Date(sticker.createdAt),
            updatedAt: new Date(sticker.updatedAt),
          })),
        });
      },

      loadScansForSticker: async (stickerId) => {
        const response = await api.get(`/scans/sticker/${stickerId}`);
        const nextScans = response.scans.map((scan: any) => ({
          ...scan,
          timestamp: new Date(scan.timestamp),
        }));
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
