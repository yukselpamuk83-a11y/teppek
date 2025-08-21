// api/ingest-daily.js
module.exports = async (req, res) => {
  // ingest.js'i içeri alıp aynı fonksiyonu gün parametresiyle çağırıyoruz
  req.query = { ...(req.query || {}), days: '1' }; // son 24 saat
  const ingest = require('./ingest.js');
  return ingest(req, res);
};
