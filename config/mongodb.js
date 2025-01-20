import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on('connected', () => console.log("DB Connected"));

  try {
    await mongoose.connect(`${process.env.MONGODB_URI}bookmytutor`);
  } catch (error) {
    console.log("Database connection failed: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
