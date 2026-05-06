const https = require('https');
https.get('https://m.facebook.com/mace.org.mn/photos/a.503461013125634/2515242961947419/?type=3', { headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' } }, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    let images = data.match(/https:\\\/\\\/scontent.*?\.jpg[^"']*/gi);
    if (images) {
      console.log('escaped:', images.map(s => s.replace(/\\/g, '')).slice(0, 3));
    } else {
      let images2 = data.match(/https:\/\/scontent.*?\.jpg[^"']*/gi);
      console.log('unescaped:', images2 ? images2.slice(0, 3) : null);
    }
  });
});
