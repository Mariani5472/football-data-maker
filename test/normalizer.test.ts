import assert from "node:assert/strict";
import test from "node:test";
import { Normalizer } from "@/modules/normalizer/Normalizer.ts";

test("normalizes the checked-in raw collections deterministically", async () => {
  const first = await new Normalizer().normalize();
  const second = await new Normalizer().normalize();
  assert.equal(first.competitions.length, 3);
  assert.equal(first.teams.filter((team) => team.image !== null).length, 60);
  assert.ok(first.teams.length >= 60, "historical and relationship-only teams are retained as minimal records");
  assert.equal(first.players.length, 2292);
  assert.equal(first.managers.length, 58);
  assert.equal(first.venues.length, 58);
  assert.deepEqual(first.countries, second.countries);
  assert.ok(first.winners.every((winner) => winner.year && winner.teamExternalId));
});

test("creates historical seasons through winner years without inventing current context", async () => {
  const data = await new Normalizer().normalize();
  assert.ok(data.winners.some((winner) => winner.year === 2001));
  assert.ok(data.statistics.every((statistic) => statistic.payload && typeof statistic.sourceIndex === "number"));
});
