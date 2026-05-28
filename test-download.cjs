const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('download', async (download) => {
    console.log('Download triggered:', download.url());
    console.log('Suggested filename:', download.suggestedFilename());
    const path = await download.path();
    console.log('Downloaded to:', path);
    const content = require('fs').readFileSync(path, 'utf8');
    console.log('Content snippet:', content.substring(0, 200));
  });

  console.log('Navigating...');
  await page.goto('https://sheet.zohopublic.in/sheet/publishedsheet/eed67541ab124d6d0126c522bf9ee624f51738fbf950f9a227046622e38610f6?type=grid&download=csv', { waitUntil: 'networkidle' });
  console.log('Done.');
  
  await page.waitForTimeout(5000);
  await browser.close();
})();