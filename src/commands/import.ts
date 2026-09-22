import "dotenv/config";
import { db } from "@/database/connection.ts";
import { ImportRepository } from "@/database/repositories/ImportRepository.ts";
import { Normalizer } from "@/modules/normalizer/Normalizer.ts";

const data = await new Normalizer().normalize();
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  await new ImportRepository(connection).import(data);
  await connection.commit();
  console.log(`Imported ${data.teams.length} teams and ${data.players.length} players.`);
}
catch (error) {
  await connection.rollback();
  throw error;
}
finally {
  connection.release();
  await db.end();
}
