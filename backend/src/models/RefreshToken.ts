import { Schema, model, Document } from "mongoose";

export interface IRefreshToken extends Document {
  empId: string;
  token: string;
  expiresAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  empId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true }
});

// Auto-delete document from DB when expiresAt is reached (TTL index)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
