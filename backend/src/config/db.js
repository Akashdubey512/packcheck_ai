import mongoose from "mongoose";

export async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/packcheck_ai";
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.warn(`[Database Notice] MongoDB is not accessible (${err.message}). Operating with resilient storage repository.`);
  }
}

