import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function buildTailwind() {
    const scanner = new Scanner({
        sources: [
            {
                base: path.resolve(rootDir, "src"),
                pattern: "**/*",
                negated: false,
            },
        ],
    });

    const candidates = Array.from(scanner.scan());
    const inputCss = `@import "tailwindcss";`;

    const compiler = await compile(inputCss, {
        base: rootDir,
        onDependency: () => {},
    });

    const compiledCss = compiler.build(candidates);
    const outputPath = path.resolve(rootDir, "src/app/tailwind.css");

    fs.writeFileSync(outputPath, compiledCss, "utf8");
    console.log(`[Tailwind] Compiled ${candidates.length} candidates -> ${outputPath} (${compiledCss.length} bytes)`);
}

buildTailwind().catch((err) => {
    console.error("[Tailwind] Build failed:", err);
    process.exit(1);
});
