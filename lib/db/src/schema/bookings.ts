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
    // Minutes from midnight (e.g. 540 = 09:00, 615 = 10:15)
    startMinutes: integer("start_minutes").notNull(),
    notes: text("notes"),
    priceEgp: integer("price_egp").notNull().default(10),
    sessionsCount: integer("sessions_count").notNull().default(4),
    // pending | submitted | paid
    paymentStatus: text("payment_status").notNull().default("pending"),
    // vodafone_cash | instapay
    paymentMethod: text("payment_method"),
    paymentReference: text("payment_reference"),
    paymentProofUrl: text("payment_proof_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueSlot: uniqueIndex("bookings_unique_slot_idx").on(
      table.carId,
      table.weekStart,
      table.dayOfWeek,
      table.startMinutes,
    ),
  }),
);

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
