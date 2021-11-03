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
            } else {
                out += n.nodes.map(nodeToReView).join("");
            }
        }
    }

    return out;
}

function nodeToReView(node: scrapboxParser.Node): string {
    if (node.type === "link") {
        if (node.pathType === "relative") {
            console.error(`Can't convert relative links. Please use absolute links instead: ${node.raw}`);
            return node.raw;
        }
        if (node.pathType === "root") {
            console.info(`An internal link to a Scrapbox's page is used: ${node.raw}`);
            const href = new URL(node.href, "https://scrapbox.io").href;
            return `@<href>{${href}}`;
        }
        return node.content === "" ? `@<href>{${node.href}}` : `@<href>{${node.href}, ${node.content}}`;
    } else if (node.type === "hashTag") {
        console.error(`Can't convert relative links. Please use absolute links instead: ${node.raw}`);
        return node.raw;
    } else if (node.type === "strong") {
        return `@<strong>{${node.nodes.map(nodeToReView).join("")}}`;
    } else if (node.type === "decoration") {
        return node.decos.reduce((inside, decoration) => {
            if (/\*-[0-9]*/.test(decoration)) {
                return `@<strong>{${inside}}`;
            } else if (decoration === "/") {
                return `@<i>{${inside}}`;
            } else if (decoration === "-") {
                return `@<del>{${inside}}`;
            }
            return inside;
        }, node.nodes.map(nodeToReView).join(""));
    } else if (node.type === "code") {
        return `@<code>{${node.text}}`;
    } else if (node.type === "formula") {
        return `@<m>{${node.formula}}`;
    } else if (node.type === "plain") {
        return node.text;
    } else {
        return node.raw;
    }
}

export default function scrapboxToReView(src: string, option: ReViewOption & scrapboxParser.ParserOption = {}): string {
    const ast = scrapboxParser.parse(src, option);
    return generateReView(ast, option);
}
