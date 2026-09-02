import { Buffer } from "node:buffer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIZE = 1024;
const source = join(__dirname, "../assets/images/asian-spices-logo.png");
const outDir = join(__dirname, "../assets/images");

async function transparentLogoBuffer(maxSize) {
  const { data, info } = await sharp(source)
    .trim({ threshold: 12 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = Buffer.from(data);

  for (let index = 0; index < pixels.length; index += channels) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];

    if (red > 238 && green > 238 && blue > 238) {
      pixels[index + 3] = 0;
    }
  }

  return sharp(pixels, { raw: { width, height, channels } })
    .resize(maxSize, maxSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function createAppIcon() {
  const logoSize = Math.round(SIZE * 0.72);
  const logo = await transparentLogoBuffer(logoSize);

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(outDir, "app-icon.png"));
}

async function createAdaptiveForeground() {
  const logoSize = Math.round(SIZE * 0.6);
  const logo = await transparentLogoBuffer(logoSize);

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(outDir, "adaptive-icon-foreground.png"));
}

async function createFavicon() {
  const logo = await transparentLogoBuffer(160);

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(outDir, "favicon.png"));
}

await createAppIcon();
await createAdaptiveForeground();
await createFavicon();

console.log("Generated app-icon.png, adaptive-icon-foreground.png, favicon.png");
