
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('request', req => {
    if (req.url().toLowerCase().includes('export') || req.url().toLowerCase().includes('csv')) {
      console.log('Intercepted:', req.url());
    }
  });
  page.on('download', download => {
    console.log('Download URL:', download.url());
  });
  console.log('Loading page...');
  await page.goto('https://sheet.zohopublic.in/sheet/published/d2d2yb86595b18bed4fa2ab5407c9845a6a24', { waitUntil: 'networkidle' });
  console.log('Loaded.');
  await page.waitForTimeout(2000);
  await browser.close();
})();
