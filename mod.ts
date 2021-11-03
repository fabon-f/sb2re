import { scrapboxParser } from "./deps.ts"

type ReViewOption = {
    baseHeadingLevel? : number;
};

function generateReView(ast: scrapboxParser.Page, option: ReViewOption = {}): string {
    const baseHeadingLevel = option.baseHeadingLevel || 3;

    let out = "";

    for (const n of ast) {
        if (n.type === "title") {
            out += `= ${n.text}`;
            out += "\n";
        } else if (n.type === "line") {
            if (n.nodes.length === 1 && n.nodes[0].type === "decoration" && /^\*+$/.test(n.nodes[0].rawDecos)) {
                // 見出し
                const boldNode = n.nodes[0];
                const header = "=".repeat(baseHeadingLevel + 2 - boldNode.rawDecos.length);
                if (boldNode.nodes[0].type !== "plain") { throw new Error("inside header") }
                out += `${header} ${boldNode.nodes[0].text}`;
                out += "\n";
            }
        }
    }

    return out;
}

export default function scrapboxToReView(src: string, option?: ReViewOption): string {
    const ast = scrapboxParser.parse(src);
    return generateReView(ast, option);
}
