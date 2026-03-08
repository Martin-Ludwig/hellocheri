import { Database } from "bun:sqlite";
import { readFileSync } from "fs";

const db = new Database("lists.db");
db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

export { db };
