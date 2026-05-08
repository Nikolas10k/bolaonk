const https = require('https');
function getLogoFromGE(slug) {
  return new Promise(resolve => {
    https.get('https://ge.globo.com/futebol/times/' + slug + '/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/https:\/\/s\.sde\.globo\.com\/media\/organizations\/[^"'\\]+\.(?:svg|png)/i);
        if (match) resolve(match[0]);
        else resolve(null);
      });
    });
  });
}
(async () => {
  console.log('Vasco: ' + await getLogoFromGE('vasco'));
  console.log('Corinthians: ' + await getLogoFromGE('corinthians'));
  console.log('Atletico-MG: ' + await getLogoFromGE('atletico-mg'));
  console.log('Remo: ' + await getLogoFromGE('remo'));
  console.log('Mirassol: ' + await getLogoFromGE('mirassol'));
})();
