import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default(""),
  imageData: text("image_data").notNull(),
  carTransmission: text("car_transmission"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Offer = typeof offersTable.$inferSelect;
export type InsertOffer = typeof offersTable.$inferInsert;
