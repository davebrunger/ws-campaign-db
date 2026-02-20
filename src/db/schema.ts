import { int, primaryKey, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    age: int().notNull(),
    email: text().notNull().unique()
});

export type User = typeof usersTable.$inferInsert;

export const nodesTable = sqliteTable("node", {
    id: int().primaryKey({ autoIncrement: true }),
    type: text().notNull(),
    name: text().notNull()
}, (table) => [
    uniqueIndex("node_ux").on(table.name, table.type)
]);

export type Node = typeof nodesTable.$inferInsert;

export const edgesTable = sqliteTable("edge", {
    fromId : int().notNull().references(() => nodesTable.id),
    toId : int().notNull().references(() => nodesTable.id)
}, (table) => [
    primaryKey({columns : [table.fromId, table.toId]})
]);

export type Edge = typeof edgesTable.$inferInsert;

export const tagsTable = sqliteTable("tag", {
    id : int().primaryKey({autoIncrement : true}),
    name : text().notNull().unique()
})

export type Tag = typeof tagsTable.$inferInsert;

export const nodeTagsTable = sqliteTable("nodeTag", {
    nodeId : int().notNull().references(() => nodesTable.id),
    tagId : int().notNull().references(() => tagsTable.id)
}, (table) => [
    primaryKey({columns : [table.nodeId, table.tagId]})
]);
