import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["need", "offer"] }).notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  commune: text("commune").notNull(),
  availability: text("availability").notNull(),
  status: text("status", { enum: ["active", "matched", "closed"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at").notNull(),
});

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id")
    .notNull()
    .references(() => announcements.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id")
    .notNull()
    .references(() => announcements.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  roles: text("roles").notNull(),
  commune: text("commune").notNull(),
  categories: text("categories").notNull(),
  availability: text("availability"),
  createdAt: integer("created_at").notNull(),
});
