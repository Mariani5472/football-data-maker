import "dotenv/config";

import { Browser } from "@/modules/browser/Browser.ts";
import { Scraper } from "@/modules/scraper/Scraper.ts";
import { desiredLeagues } from "@/config.ts";

import { Database } from "@/database/Database.ts";
import { LeagueRepository } from "@/database/repositories/LeagueRepository.ts";
import { TeamRepository } from "@/database/repositories/TeamRepository.ts";

async function main(): Promise<void> {
  const browser = new Browser();
  const database = new Database();

  try {
    console.log("🌐 Iniciando browser...");

    await browser.create(
      process.env.BROWSER ?? "MicrosoftEdge",
    );

    const scraper = new Scraper(browser);

    /*
     * 1. Scrape das ligas
     */
    console.log("🏆 Scraping das ligas...");

    const leagues = await scraper.scrapLeagues(
      desiredLeagues,
    );

    console.log(
      `✅ ${leagues.length} liga(s) encontrada(s).`,
    );

    /*
     * 2. Extrai os times das ligas
     */
    const teamEssentials = leagues
      .flatMap((league) => league.teams)
      .filter(
        (team, index, array) =>
          array.findIndex(
            (item) => item.id === team.id,
          ) === index,
      );

    console.log(
      `⚽ ${teamEssentials.length} time(s) encontrado(s).`,
    );

    /*
     * 3. Scrape dos times
     */
    console.log("🔎 Scraping dos times...");

    const teams = await scraper.scrapTeams(
      teamEssentials,
    );

    console.log(
      `✅ ${teams.length} time(s) processado(s).`,
    );

    /*
     * 4. Extrai managers
     */
    const managerEssentials = teams
      .map((team) => team.manager)
      .filter(
        (manager, index, array) =>
          array.findIndex(
            (item) => item.id === manager.id,
          ) === index,
      );

    console.log(
      `👔 ${managerEssentials.length} técnico(s) encontrado(s).`,
    );

    /*
     * 5. Extrai venues
     */
    const venueEssentials = teams
      .map((team) => ({
        id: team.venue.id,
        venueSlug: team.venue.slug,
        countrySlug: team.venue.country.slug,
      }))
      .filter(
        (venue, index, array) =>
          array.findIndex(
            (item) => item.id === venue.id,
          ) === index,
      );

    console.log(
      `🏟️ ${venueEssentials.length} estádio(s) encontrado(s).`,
    );

    /*
     * 6. Extrai players
     */
    const playerEssentials = teams
      .flatMap((team) => team.players)
      .filter(
        (player, index, array) =>
          array.findIndex(
            (item) => item.id === player.id,
          ) === index,
      );

    console.log(
      `👤 ${playerEssentials.length} jogador(es) encontrado(s).`,
    );

    /*
     * 7. Scrape dos dados detalhados
     */
    console.log("👔 Scraping dos técnicos...");

    const managers = await scraper.scrapManagers(
      managerEssentials,
    );

    console.log(
      `✅ ${managers.length} técnico(s) processado(s).`,
    );

    console.log("🏟️ Scraping dos estádios...");

    const venues = await scraper.scrapVenues(
      venueEssentials,
    );

    console.log(
      `✅ ${venues.length} estádio(s) processado(s).`,
    );

    console.log("👤 Scraping dos jogadores...");

    const players = await scraper.scrapPlayers(
      playerEssentials,
    );

    console.log(
      `✅ ${players.length} jogador(es) processado(s).`,
    );

    /*
     * 8. Persistência
     */
    const leagueRepository = new LeagueRepository();
    const teamRepository = new TeamRepository();

    console.log("💾 Iniciando persistência no PostgreSQL...");

    await database.transaction(async (client) => {
      /*
       * Primeiro países.
       *
       * Os repositories criam os países automaticamente
       * quando encontram uma entidade que os utiliza.
       */

      /*
       * Ligas
       */
      for (const league of leagues) {
        console.log(
          `  🏆 Salvando liga: ${league.name}`,
        );

        await leagueRepository.save(
          client,
          league,
        );

        await leagueRepository.saveLeagueTeams(
          client,
          league,
        );
      }

      /*
       * Managers
       *
       * Precisamos inserir managers antes dos teams porque
       * teams.manager_id referencia o manager logicamente.
       */
      for (const manager of managers) {
        console.log(
          `  👔 Salvando técnico: ${manager.name}`,
        );

        await teamRepository.saveManager(
          client,
          manager,
        );
      }

      /*
       * Venues
       */
      for (const venue of venues) {
        console.log(
          `  🏟️ Salvando estádio: ${venue.name}`,
        );

        await teamRepository.saveVenue(
          client,
          venue,
        );

        await teamRepository.saveVenueTeamRelation(
          client,
          venue,
        );
      }

      /*
       * Players
       */
      for (const player of players) {
        console.log(
          `  👤 Salvando jogador: ${player.name}`,
        );

        await teamRepository.savePlayer(
          client,
          player,
        );
      }

      /*
       * Teams
       *
       * Os relacionamentos manager/venue/player já existem
       * quando chegamos aqui.
       */
      for (const team of teams) {
        console.log(
          `  ⚽ Salvando time: ${team.name}`,
        );

        await teamRepository.save(
          client,
          team,
        );
      }
    });

    console.log("");
    console.log("======================================");
    console.log("✅ SEED FINALIZADO COM SUCESSO");
    console.log("======================================");
    console.log(`Ligas:       ${leagues.length}`);
    console.log(`Times:       ${teams.length}`);
    console.log(`Técnicos:    ${managers.length}`);
    console.log(`Estádios:    ${venues.length}`);
    console.log(`Jogadores:   ${players.length}`);
    console.log("======================================");
  } catch (error) {
    console.error("");
    console.error("❌ Erro durante o seed:");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    await browser.quit();
    await database.close();
  }
}

main();