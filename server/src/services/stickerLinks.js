import { Item } from "../models/Item.js";
import { Sticker } from "../models/Sticker.js";

// Item.stickerId and Sticker.itemId describe the same link, so every change
// goes through here to keep both sides in agreement. Callers must already have
// checked that the sticker and the item belong to the same user.
export async function linkStickerToItem(sticker, item) {
  // The sticker was on another item: that item no longer has a sticker.
  if (sticker.itemId && !sticker.itemId.equals(item._id)) {
    await Item.updateOne({ _id: sticker.itemId, stickerId: sticker._id }, { $set: { stickerId: null } });
  }
  // The item had another sticker: free it up so it can be mapped again.
  if (item.stickerId && !item.stickerId.equals(sticker._id)) {
    await Sticker.updateOne({ _id: item.stickerId, itemId: item._id }, { $set: { itemId: null, status: "pending" } });
  }

  await Sticker.updateOne({ _id: sticker._id }, { $set: { itemId: item._id, status: "active" } });
  await Item.updateOne({ _id: item._id }, { $set: { stickerId: sticker._id } });
}

export async function unlinkStickersFromItem(itemId) {
  await Sticker.updateMany({ itemId }, { $set: { itemId: null, status: "pending" } });
}
