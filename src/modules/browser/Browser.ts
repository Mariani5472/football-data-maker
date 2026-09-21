import { Builder, WebDriver } from "selenium-webdriver";

export class Browser {
  private browser: WebDriver | undefined;

  get() { return this.browser }

  async create(targetBrowser: string) {
    if (!targetBrowser) {
      throw new Error("adicione browser no dotenv!") //todo: fazer App error
    }

    this.browser = await new Builder()
      .forBrowser(targetBrowser)
      .build();

    this.browser
      .manage()
      .setTimeouts({
        implicit: 10000,
        pageLoad: 30000,
        script: 30000
      })

    return this.browser;
  }

  async quit() {
    if (this.browser) {
      await this.browser.quit();
    }
  }

}

