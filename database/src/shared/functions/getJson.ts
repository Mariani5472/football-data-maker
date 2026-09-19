import { By, until, WebDriver } from "selenium-webdriver";

export async function getJson<T>(
  driver: WebDriver,
  url: string
): Promise<T> {
  await driver.get(url);

  const body = await driver.wait(
    until.elementLocated(By.css("body")),
    15000
  );

  const text = await body.getText();

  try {
    return JSON.parse(text) as T;

  } catch {
    console.error(text.substring(0, 1000));

    throw new Error(
      `Não foi possível converter resposta em JSON: ${url} `
    );
  }
}