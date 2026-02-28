import mongoose from "mongoose";

export async function connectDb(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
}
