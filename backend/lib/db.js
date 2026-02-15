import mongoose from "mongoose";

export const connectDB = async () => {

    mongoose.connection.on("connected", () => {
        console.log("Connected to MongoDB");
    });

  try {
    await mongoose.connect(`${process.env.MONGO_URI}/chat-app`);
  }catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};


