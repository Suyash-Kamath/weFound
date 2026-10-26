import { Router } from "express";
import { Sticker } from "../models/Sticker.js";
import { Item } from "../models/Item.js";
import { asyncHandler } from "../middleware/errors.js";
import { serializePublicContactOptions } from "../utils/serializers.js";

const router = Router();

router.get("/s/:shortCode", asyncHandler(async (req, res) => {
  const sticker = await Sticker.findOne({ shortCode: req.params.shortCode }).lean();
  if (!sticker || sticker.status !== "active" || !sticker.itemId) {
    return res.status(404).json({ error: "Item not found" });
  }

  const item = await Item.findById(sticker.itemId).lean();
  if (!item) return res.status(404).json({ error: "Item not found" });

  return res.json({
    sticker: { id: sticker._id.toString(), shortCode: sticker.shortCode, status: sticker.status },
    item: {
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      category: item.category,
      estimatedValue: item.estimatedValue,
      returnInstructions: item.returnInstructions,
      contactOptions: serializePublicContactOptions(item.contactOptions),
      photos: item.photos,
    },
  });
}));

export default router;
