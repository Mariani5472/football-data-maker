import 'dotenv/config';
import { Browser } from '@/modules/browser/Browser.ts';
import { Scraper } from '@/modules/scraper/Scraper.ts';
import { desiredLeagues } from '@/config.ts';


async function main(): Promise<void> {
  const browser = new Browser();
  browser.create(process.env.WEBSITE ?? 'MicrosoftEdge');

  const scraper = new Scraper(browser);
  scraper.completeScrap(desiredLeagues);
}

main()
  .catch((error: unknown) => {
    console.log(error)
  });