// Regenerates public/logos.svg — the sprite of every brand logo in
// src/data/logos.ts (see src/logo-sprite.ts). Add or change a logo there,
// then rerun
//
//   pnpm sync:logos
//
// and commit the SVG; a unit test fails when the two disagree.

import { writeFile } from "node:fs/promises";
import { LOGO_PATHS } from "../src/data/logos.ts";
import { logoSprite } from "../src/logo-sprite.ts";

const OUTPUT = new URL("../public/logos.svg", import.meta.url);

await writeFile(OUTPUT, logoSprite(LOGO_PATHS));
console.log(`Wrote ${Object.keys(LOGO_PATHS).length} logos to public/logos.svg`);
