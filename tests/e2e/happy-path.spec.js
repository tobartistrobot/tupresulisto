const { test, expect } = require('@playwright/test');

test('Happy path: Complete Quote Creation Flow', async ({ page }) => {
  // Set a large viewport to ensure desktop UI is visible
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Visit homepage
  await page.goto('/');
  
  // 2. Wait for app to load
  await expect(page.locator('text=tupresulisto.com').first()).toBeVisible({ timeout: 20000 });

  // 3. Navigate to Quote Configurator
  // Use a more resilient selector for the nav button
  const quoteNav = page.locator('aside nav button').filter({ hasText: 'Presupuestador' });
  await expect(quoteNav).toBeVisible();
  await quoteNav.click();
  
  await expect(page.locator('text=Confeccionar')).toBeVisible();

  // 4. Fill Client Data
  await page.fill('label:has-text("Nombre") + input', 'John Doe');
  await page.fill('label:has-text("Teléfono") + input', '123456789');

  // 5. Select a Product
  // The product grid items have a specific structure. 
  // Let's target the first product card that is NOT locked.
  const productCard = page.locator('.grid div.group.bg-white').first();
  await expect(productCard).toBeVisible();
  await productCard.click();

  // 6. Configure Product Dimensions
  await expect(page.locator('text=UBICACIÓN')).toBeVisible();
  await page.fill('label:has-text("ANCHO") + input', '1200');
  await page.fill('label:has-text("ALTO") + input', '1500');

  // 7. Add to Quote
  const addButton = page.locator('button').filter({ hasText: 'AÑADIR' });
  await expect(addButton).toBeEnabled();
  await addButton.click();

  // 8. Verify it's in the cart
  await expect(page.locator('text=Tu Presupuesto')).toBeVisible();
  // Check that the item was added (name might vary based on products, but John Doe should be there in client data)
  await expect(page.locator('text=John Doe')).toBeVisible();

  // 9. Save the Quote
  const saveButton = page.locator('button').filter({ hasText: 'Guardar' });
  await saveButton.click();

  // 10. Verify Success State
  // The button text changes to ¡GUARDADO!
  await expect(page.locator('text=¡GUARDADO!')).toBeVisible({ timeout: 15000 });
});
