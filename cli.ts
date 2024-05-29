import { parseArgs } from "@std/cli/parse-args";
import * as colors from "@std/fmt/colors";
import { readAll } from "@std/io";
import scrapboxToReView from "./mod.ts";

const options = parseArgs(Deno.args, {
  string: ["_"],
  boolean: ["help", "version"],
  alias: { "h": "help", "v": "version" },
});

const usage = `sb2re - Convert Scrapbox text to Re:VIEW

${colors.bold("Usage")}
    cat input | sb2re [options] > out.re
    sb2re input [options] > out.re
    sb2re input out.re [options]

${colors.bold("Options")}
    -h, --help                Show this help.
    -v, --version             Print version info
    --base-heading-level      Specify the largest heading level (Default: 3. This means \`[*** ]\` corresponds to Re:VIEW's \`==\`)`;

if (options.help) {
  console.log(usage);
  Deno.exit(0);
}

if (options.version) {
  const { default: denoConfig } = await import("./deno.json", {
    with: { type: "json" },
  });
  console.log(denoConfig.version);
  Deno.exit(0);
}

const baseHeadingLevel = options["base-heading-level"] as unknown;
if (baseHeadingLevel !== undefined && typeof baseHeadingLevel !== "number") {
  console.error("Error: base-heading-level option should be number");
  Deno.exit(1);
}

const src = await readSource();
const result = scrapboxToReView(src, {
  baseHeadingLevel,
  logger: {
    error(message: string) {
      console.error(colors.bold(colors.red(message)));
    },
    warn(message: string) {
      console.warn(message);
    },
  },
});

if (options._[1] === "-" || options._[1] === undefined) {
  console.log(result.replace(/\n$/, ""));
} else {
  await Deno.writeTextFile(options._[1].toString(), result);
}

async function readSource() {
  if (options._.length === 0 || options._[0] === "-") {
    // read from stdin
    if (Deno.stdin.isTerminal()) {
      console.log(colors.bold(colors.red("Specify input file.")));
      Deno.exit(1);
    }
    const buf = await readAll(Deno.stdin);
    return new TextDecoder().decode(buf);
  } else {
    return await Deno.readTextFile(options._[0].toString());
  }
}
