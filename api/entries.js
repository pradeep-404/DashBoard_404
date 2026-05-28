let entries = [];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(entries);
  } else if (req.method === 'POST') {
    entries = req.body;
    res.status(200).json({ success: true, count: entries.length });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
