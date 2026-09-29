import sharp from 'sharp';

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error('用法: node scripts/optimize-image.mjs <输入图片> <输出.webp>');
  process.exit(1);
}

const MAX_BYTES = 300 * 1024;
let quality = 80;
let buffer;

do {
  buffer = await sharp(input)
    .rotate() // 依据 EXIF 自动纠正方向
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  if (buffer.length <= MAX_BYTES) break;
  quality -= 10;
} while (quality >= 40);

await sharp(buffer).toFile(output); // 落盘，校验通过

const kb = Math.round(buffer.length / 1024);
console.log(`${output} ${kb}KB (quality=${quality})`);

if (buffer.length > MAX_BYTES) {
  console.error(`警告: ${output} 仍超过 300KB，请更换主体更简洁的图片`);
  process.exit(1);
}
