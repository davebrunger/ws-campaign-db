import { sql } from "drizzle-orm";
import { check, int, primaryKey, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core";

export const nodesTable = sqliteTable("node", {
    id: int().primaryKey({ autoIncrement: true }),
    type: text().notNull(),
    name: text().notNull(),
    summary: text().notNull()
}, (table) => [
    uniqueIndex("node_ux").on(table.name, table.type)
]);

export type Node = typeof nodesTable.$inferInsert;

export const edgesTable = sqliteTable("edge", {
    fromId : int().notNull().references(() => nodesTable.id),
    toId : int().notNull().references(() => nodesTable.id),
    type : text().notNull()
}, (table) => [
    primaryKey({columns : [table.fromId, table.toId]}),
    check("edge_type_non_empty", sql`length(${table.type}) > 0`)
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
