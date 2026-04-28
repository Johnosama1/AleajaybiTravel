import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const bookingsTable = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    carId: integer("car_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    weekStart: date("week_start").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    hour: integer("hour").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueSlot: uniqueIndex("bookings_unique_slot_idx").on(
      table.carId,
      table.weekStart,
      table.dayOfWeek,
      table.hour,
    ),
  }),
);

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
