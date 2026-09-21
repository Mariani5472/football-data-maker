import 'dotenv/config';
import { Browser } from '@/modules/browser/Browser.ts';
import { Scraper } from '@/modules/scraper/Scraper.ts';
import { desiredLeagues } from '@/config.ts';
import { JsonStorage } from '@/modules/storage/JsonStorage.ts';
import path from 'node:path';


async function main(): Promise<void> {
  const browser = new Browser();
  await browser.create(process.env.BROWSER ?? 'MicrosoftEdge');
  console.log(browser.get(), process.env.BROWSER);

  const storage = new JsonStorage(path.resolve(process.cwd(), "data"));
  storage.setRewrite(false);

  const scraper = new Scraper(browser, { storage });
  scraper.completeScrap(desiredLeagues);
}

main()
  .catch((error: unknown) => {
    console.log(error)
  });