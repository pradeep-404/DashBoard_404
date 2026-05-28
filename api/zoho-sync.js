export default async function handler(req, res) {
  let fetchUrl = process.env.SHEET_SHARE_LINK || 'https://docs.google.com/spreadsheets/d/1mmXK5hc-ai48J9LvsPAXvCAGrvmLIG4kokpux8wk3D0/export?format=xlsx';

  try {
    let urlObj = new URL(fetchUrl);
    if (urlObj.hostname.includes('zoho')) {
      if (urlObj.pathname.includes('/open/')) {
        urlObj.pathname = urlObj.pathname.replace('/open/', '/published/');
      }
      if (urlObj.pathname.includes('/published/') || urlObj.pathname.includes('/publishedsheet/')) {
        urlObj.searchParams.set('download', 'xlsx');
        fetchUrl = urlObj.toString();
      }
    }
    if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/edit')) {
      urlObj.pathname = urlObj.pathname.replace('/edit', '/export');
      urlObj.search = '?format=xlsx';
      fetchUrl = urlObj.toString();
    }
  } catch (e) {}

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(500).send(`Remote sheet returned status ${response.status}`);
    }
    
    let filename = 'sheet_sync.xlsx';
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename="')) {
      filename = disposition.split('filename="')[1]?.split('"')[0] || filename;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length < 10000 && buffer.toString('utf-8').trim().startsWith('<') && buffer.toString('utf-8').toLowerCase().includes('<html')) {
        return res.status(500).send("Link returned an HTML website instead of raw data.\\n\\nIf using Google Sheets: ensure the link is 'Anyone with the link can view' or you used 'Publish to web' as XLSX.\\nIf using Zoho: ensure the link is generated from File -> Publish -> Microsoft Excel.");
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('x-filename', filename);
    res.send(buffer);
  } catch (e) {
    res.status(500).send(`Failed to fetch remote sheet: ${e.message}`);
  }
}
