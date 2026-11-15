import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
// Owner-scoped prototype. A revision lease prevents lost updates across tabs.
export const erpWorkspaces = sqliteTable("erp_workspaces", {
 ownerId: text("owner_id").primaryKey(),
 payload: text("payload").notNull(),
 revision: integer("revision").notNull().default(0),
 updatedAt: text("updated_at").notNull()
});
