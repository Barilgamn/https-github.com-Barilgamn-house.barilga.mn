import https from 'https';
import fs from 'fs';

https.get('https://www.barilga.mn/files/9350f25743c84db482c07815432405f7.png?d=0', (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    let view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
    let width = view.getUint32(16);
    let height = view.getUint32(20);
    console.log(`Dimensions: ${width}x${height}`);
  });
});
