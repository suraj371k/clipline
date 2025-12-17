import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("please define mongodb uri environment variable");
  }
  await mongoose.connect(MONGODB_URI);
}

export default connectDB;
