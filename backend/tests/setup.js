import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/earlyedge_test';

export async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function closeDB() {
  await mongoose.connection.close();
}
