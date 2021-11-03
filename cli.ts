import { flags, io, colors } from "./deps.ts"
import scrapboxToReView from "./mod.ts"

const options = flags.parse(Deno.args, { string: ["_"], boolean: ["help"], alias: { "h": "help" } });

const usage =
`sb2re - Convert Scrapbox text to Re:VIEW

${colors.bold("Usage")}
    cat input | sb2re [options] > out.re
    sb2re input [options] > out.re
    sb2re input out.re [options]

${colors.bold("Options")}
    -h, --help                Show this help.
    --base-heading-level      Specify the largest heading level (Default: 3. This means \`[*** ]\` corresponds to Re:VIEW's \`==\`)`;

if (options.help) {
    console.log(usage);
    Deno.exit(0);
}

const baseHeadingLevel = options["base-heading-level"] as string | number | undefined | boolean | Object;
if (baseHeadingLevel !== undefined && typeof baseHeadingLevel !== "number") {
    console.error("Error: base-heading-level option should be number");
    Deno.exit(1);
}

const src = await readSource();
const result = scrapboxToReView(src, {
    baseHeadingLevel
});

if (options._[1] === "-" || options._[1] === undefined) {
    console.log(result);
} else {
    await Deno.writeTextFile(options._[1].toString(), result);
}

async function readSource() {
    if (options._.length === 0 || options._[0] === "-") {
        // read from stdin
        if (Deno.isatty(Deno.stdin.rid)) {
            console.log(colors.bold(colors.red("Specify input file.")));
            Deno.exit(1);
        }
        const lines = [];
        for await (const line of io.readLines(Deno.stdin)) {
            lines.push(line);
        }
        return lines.join("\n");
    } else {
        return await Deno.readTextFile(options._[0].toString());
    }
}
