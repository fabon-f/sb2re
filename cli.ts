import { flags, io } from "./deps.ts"
import scrapboxToReView from "./mod.ts"

const options = flags.parse(Deno.args, { string: ["_"] });

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
        const lines = [];
        for await (const line of io.readLines(Deno.stdin)) {
            lines.push(line);
        }
        return lines.join("\n");
    } else {
        return await Deno.readTextFile(options._[0].toString());
    }
}
