import { expect, test } from "@playwright/test";

test("le parcours d’orientation filtre les annonces", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(
    "L’entraide près de chez vous — France Solidaire",
  );
  await page.getByRole("button", { name: "Je veux aider" }).first().click();
  await page.getByRole("radio", { name: /Je veux aider/ }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: "Transport" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Votre commune").fill("Le Temple");
  await page
    .getByRole("button", { name: "Voir mes correspondances" })
    .click();
  await expect(page.getByRole("status")).toContainText("annonce");
});

test("la page ne déborde pas sur mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Ce contrôle cible le breakpoint mobile.");
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  const menu = page.getByRole("button", { name: "Ouvrir le menu" });
  await menu.click();
  const closeMenu = page.getByRole("button", { name: "Fermer le menu" });
  await expect(closeMenu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Ouvrir le menu" }),
  ).toHaveAttribute("aria-expanded", "false");
});
