import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import { generatedPosts } from "../src/lib/_generated-posts";
import { editorialImage } from "../src/lib/editorial-image";

const results = [];
for (const post of generatedPosts) {
  const image = editorialImage(post.cover, post.title, "https://byimperiodog.com.br/blog/" + post.slug);
  if (!image) { results.push({ slug: post.slug, pass: false, reason: "missing-image" }); continue; }
  const metadata = await sharp(join("public", new URL(image.url).pathname)).metadata();
  results.push({ slug: post.slug, image: image.url, width: metadata.width, height: metadata.height,
    pass: metadata.width === image.width && metadata.height === image.height,
    largeImage: (metadata.width ?? 0) >= 1200 && (metadata.width ?? 0) * (metadata.height ?? 0) > 300_000,
  });
}
await mkdir(".audit-evidence", { recursive: true });
await writeFile(".audit-evidence/editorial-assets.json", JSON.stringify({ testedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify({ checked: results.length, valid: results.filter((r) => r.pass).length,
  largeImages: results.filter((r) => r.largeImage).length, belowLargeGuidance: results.filter((r) => !r.largeImage).map((r) => r.slug) }));
if (results.some((r) => !r.pass)) process.exitCode = 1;
