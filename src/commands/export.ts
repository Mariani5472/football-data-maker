import "dotenv/config";
import { db } from "@/database/connection.ts";
import { Exporter } from "@/database/Exporter.ts";

try {
  await new Exporter(db).write();
  console.log("Created exports/brasileirao.mysql");
}
finally {
  await db.end();
}
