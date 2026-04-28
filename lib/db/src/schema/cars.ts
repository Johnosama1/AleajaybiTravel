import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  transmission: text("transmission").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
});

export type Car = typeof carsTable.$inferSelect;
export type InsertCar = typeof carsTable.$inferInsert;
