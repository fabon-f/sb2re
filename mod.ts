import { scrapboxParser } from "./deps.ts"

type ReViewOption = {
    baseHeadingLevel? : number;
};

export type ConverterOption = ReViewOption & scrapboxParser.ParserOption;

function generateReView(ast: scrapboxParser.Page, option: ReViewOption = {}): string {
    const baseHeadingLevel = option.baseHeadingLevel || 3;

    let out = "";
    const state = {
        inItemization: false,
        inBlockQuote: false
    };

    for (const n of ast) {
        if (n.type === "title") {
            out += `= ${n.text}`;
            out += "\n\n";
        } else {
            if (n.type === "line" && n.indent === 0 && n.nodes.length !== 0 && n.nodes[0].type === "quote") {
                // 引用
                if (!state.inBlockQuote) {
                    // 引用開始
                    state.inBlockQuote = true;
                    out += "//quote{\n";
                }
                out += `${n.nodes[0].nodes.map(nodeToReView).join("")}\n`;
                continue;
            } else {
                if (state.inBlockQuote) {
                    // 引用終了
                    state.inBlockQuote = false;
                    out += "//}\n\n";
                }
            }
            if (n.type === "codeBlock" && n.indent === 0) {
                // コードブロック
                out += `//emlist[${escapeBlockCommandOption(n.fileName)}]{\n${n.content}\n//}\n\n`;
                continue;
            }
            if (n.type === "table" && n.indent === 0) {
                // 表
                out += `${generateReViewTable(n)}\n\n`;
                continue;
            }
            if (n.type === "line" && n.indent === 0 && n.nodes.length !== 0 && n.nodes[0].type === "commandLine") {
                // コマンドライン
                out += `//cmd{\n${n.nodes[0].raw}\n//}\n\n`;
                continue;
            }
            if (n.type === "line" && n.indent !== 0 && n.nodes.length !== 0 && n.nodes[0].type === "quote") {
                // 箇条書きの中の引用、現時点では非対応
                console.error(`Blockquote inside itemization not supported: ${n.nodes[0].raw}`);
            }
            if (n.type === "line" && n.indent !== 0) {
                // 箇条書き
                if (!state.inItemization) {
                    // 箇条書き開始
                    state.inItemization = true;
                }
                const lineContent = n.nodes.map(nodeToReView).join("");
                out += ` ${"*".repeat(n.indent)} ${lineContent}\n`;
                continue;
            } else {
                if (state.inItemization) {
                    // 箇条書き終了
                    state.inItemization = false;
                    out += "\n";
                }
            }
            if (n.type === "line" && n.nodes.length === 1 && n.nodes[0].type === "decoration" && n.nodes[0].rawDecos != "*" && /^\*+$/.test(n.nodes[0].rawDecos)) {
                // 見出し
                const boldNode = n.nodes[0];
                const header = "=".repeat(baseHeadingLevel + 2 - boldNode.rawDecos.length);
                if (boldNode.nodes[0].type !== "plain") { throw new Error("inside header") }
                out += `${header} ${boldNode.nodes[0].text}`;
                out += "\n\n";
                continue;
            }
            if (n.type === "line" && n.nodes.length === 1 && n.nodes[0].type === "image") {
                // 画像
                // とりあえずsrcそのまま入れる
                out += `//indepimage[${escapeBlockCommandOption(n.nodes[0].src)}]\n\n`;
                continue;
            }
            if (n.type === "line") {
                out += n.nodes.map(nodeToReView).join("");
                out += "\n\n";
            }
        }
    }

    return out;
}

function generateReViewTable(node: scrapboxParser.Table) {
    const headerColumns = node.cells[0];
    if (headerColumns === undefined) {
        return `//emtable[${escapeBlockCommandOption(node.fileName)}]{\n//}`;
    }
    const headerText = generateReViewTableColumn(headerColumns);
    const borderText = "------------";
    return `//emtable[${escapeBlockCommandOption(node.fileName)}]{
${headerText}
${borderText}
${node.cells.slice(1).map(generateReViewTableColumn).join("\n")}
//}`;
}

function generateReViewTableColumn(column: scrapboxParser.Node[][]): string {
    return column.map(cell => cell.map(nodeToReView).join("")).join("\t");
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
            return `@<href>{${escapeHrefUrl(href)}}`;
        }
        return node.content === "" ? `@<href>{${escapeHrefUrl(node.href)}}` : `@<href>{${escapeHrefUrl(node.href)}, ${escapeHrefUrl(node.content)}}`;
    } else if (node.type === "hashTag") {
        console.error(`Can't convert relative links. Please use absolute links instead: ${node.raw}`);
        return node.raw;
    } else if (node.type === "strong") {
        return `@<strong>{${escapeInlineCommand(node.nodes.map(nodeToReView).join(""))}}`;
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
        }, escapeInlineCommand(node.nodes.map(nodeToReView).join("")));
    } else if (node.type === "code") {
        return `@<code>{${escapeInlineCommand(node.text)}}`;
    } else if (node.type === "formula") {
        return `@<m>{${escapeInlineCommand(node.formula)}}`;
    } else if (node.type === "image") {
        return `@<icon>{${escapeInlineCommand(node.src)}}`;
    } else if (node.type === "plain") {
        return node.text;
    } else {
        return node.raw;
    }
}

function escapeInlineCommand(content: string): string {
    return content.replaceAll("}", "\\}").replace(/\\$/, "\\\\")
}

function escapeHrefUrl(href: string) {
    return escapeInlineCommand(href).replaceAll(",", "\\,");
}

function escapeBlockCommandOption(option: string) {
    return option.replaceAll("]", "\\]");
}

export default function scrapboxToReView(src: string, option: ConverterOption = {}): string {
    const ast = scrapboxParser.parse(src, option);
    return generateReView(ast, option);
}
