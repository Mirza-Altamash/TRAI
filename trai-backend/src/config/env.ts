import dotenv from "dotenv";
import path from "path";

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/trai_citizen_hub",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "trai_access_secret_token_12345!@#",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "trai_refresh_secret_token_67890$%^",
};
