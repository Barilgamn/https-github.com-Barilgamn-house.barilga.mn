import https from 'https';

https.get('https://www.facebook.com/photo/?fbid=1380518810771165&set=a.445638697592519', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // try to find open graph tags first, they are more reliable
    const ogImageMatch = data.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
      console.log('og:image:', ogImageMatch[1].replace(/&amp;/g, '&'));
      return;
    }
    const matches = data.match(/https:\/\/[^"]+\.jpg/g);
    if (matches) {
      console.log(matches.slice(0, 5).join('\n'));
    } else {
      console.log('No matches');
    }
  });
});
