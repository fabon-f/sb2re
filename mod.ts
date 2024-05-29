import { scrapboxParser } from "./deps.ts";

type Logger = {
  error: (message: string) => unknown;
  warn: (message: string) => unknown;
};

type ReViewOption = {
  baseHeadingLevel?: number;
  logger?: Logger;
};

export type ConverterOption = ReViewOption & scrapboxParser.ParserOption;

function generateReView(
  ast: scrapboxParser.Page,
  option: ReViewOption = {},
): string {
  const baseHeadingLevel = option.baseHeadingLevel || 3;
  const logger = option.logger || {
    error(message: string) {
      console.error(message);
    },
    warn(message: string) {
      console.warn(message);
    },
  };

  let out = "";
  const state = {
    inItemization: false,
    inBlockQuote: false,
  };

  for (const n of ast) {
    if (n.type === "title") {
      out += `= ${n.text}`;
      out += "\n\n";
    } else {
      if (n.indent === 0 && state.inItemization) {
        // 箇条書き終了
        state.inItemization = false;
        out += "\n";
      }

      if (
        !(n.type === "line" && n.indent === 0 && n.nodes.length !== 0 &&
          n.nodes[0].type === "quote") && state.inBlockQuote
      ) {
        // 引用終了
        state.inBlockQuote = false;
        out += "//}\n\n";
      }

      if (
        n.type === "line" && n.indent === 0 && n.nodes.length !== 0 &&
        n.nodes[0].type === "quote"
      ) {
        // 引用
        if (!state.inBlockQuote) {
          // 引用開始
          state.inBlockQuote = true;
          out += "//quote{\n";
        }
        out += `${
          n.nodes[0].nodes.map((n) => nodeToReView(n, logger)).join("")
        }\n`;
        continue;
      }

      if (n.indent !== 0) {
        // 箇条書き
        if (!state.inItemization) {
          // 箇条書き開始
          state.inItemization = true;
        }
        if (n.type === "line") {
          const lineContent = n.nodes.map((n) => nodeToReView(n, logger)).join(
            "",
          );
          out += ` ${"*".repeat(n.indent)} ${lineContent}\n`;
          continue;
        } else {
          if (n.type === "table") {
            // 箇条書きの中の表、現時点では非対応
            logger.error(
              `Table inside itemization not supported: ${n.fileName}`,
            );
          }
          if (n.type === "codeBlock") {
            // 箇条書きの中のコードブロック、現時点では非対応
            logger.error(
              `Code block inside itemization not supported: ${n.fileName}`,
            );
          }
          out += ` ${"*".repeat(n.indent)}\n`;
          continue;
        }
      }

      if (n.type === "codeBlock" && n.indent === 0) {
        // コードブロック
        out += `//emlist[${
          escapeBlockCommandOption(n.fileName)
        }]{\n${n.content}\n//}\n\n`;
        continue;
      }
      if (n.type === "table" && n.indent === 0) {
        // 表
        out += `${generateReViewTable(n, logger)}\n\n`;
        continue;
      }
      if (
        n.type === "line" && n.indent === 0 && n.nodes.length !== 0 &&
        n.nodes[0].type === "commandLine"
      ) {
        // コマンドライン
        out += `//cmd{\n${n.nodes[0].raw}\n//}\n\n`;
        continue;
      }
      if (
        n.type === "line" && n.indent !== 0 && n.nodes.length !== 0 &&
        n.nodes[0].type === "quote"
      ) {
        // 箇条書きの中の引用、現時点では非対応
        logger.error(
          `Blockquote inside itemization not supported: ${n.nodes[0].raw}`,
        );
      }
      if (
        n.type === "line" && n.nodes.length === 1 &&
        n.nodes[0].type === "decoration" && n.nodes[0].rawDecos != "*" &&
        /^\*+$/.test(n.nodes[0].rawDecos)
      ) {
        // 見出し
        const boldNode = n.nodes[0];
        if (boldNode.rawDecos.length <= baseHeadingLevel) {
          const header = "=".repeat(
            baseHeadingLevel + 2 - boldNode.rawDecos.length,
          );
          if (
            boldNode.nodes.length === 1 && boldNode.nodes[0].type === "image"
          ) {
            out += `//indepimage[${
              escapeBlockCommandOption(boldNode.nodes[0].src)
            }]\n\n`;
            continue;
          }
          out += `${header} ${
            boldNode.nodes.map((n) => nodeToReView(n, logger)).join("")
          }`;
          out += "\n\n";
          continue;
        }
      }
      if (
        n.type === "line" && n.nodes.length === 1 &&
        (n.nodes[0].type === "image" || n.nodes[0].type === "strongImage")
      ) {
        // 画像
        // とりあえずsrcそのまま入れる
        out += `//indepimage[${escapeBlockCommandOption(n.nodes[0].src)}]\n\n`;
        continue;
      }
      if (
        n.type === "line" && n.nodes.length === 1 &&
        n.nodes[0].type === "formula"
      ) {
        out += `//texequation{\n${n.nodes[0].formula}\n//}`;
        continue;
      }
      if (n.type === "line") {
        out += n.nodes.map((n) => nodeToReView(n, logger)).join("");
        out += "\n\n";
      }
    }
  }

  return out.replaceAll(/\n{2,}/g, "\n\n").replace(/\n*$/, "\n");
}

function generateReViewTable(node: scrapboxParser.Table, logger: Logger) {
  const headerColumns = node.cells[0];
  if (headerColumns === undefined) {
    return `//emtable[${escapeBlockCommandOption(node.fileName)}]{\n//}`;
  }
  const headerText = generateReViewTableColumn(headerColumns, logger);
  const borderText = "------------";
  return `//emtable[${escapeBlockCommandOption(node.fileName)}]{
${headerText}
${borderText}
${
    node.cells.slice(1).map((column) =>
      generateReViewTableColumn(column, logger)
    ).join("\n")
  }
//}`;
}

function generateReViewTableColumn(
  column: scrapboxParser.Node[][],
  logger: Logger,
): string {
  return column.map((cell) => cell.map((n) => nodeToReView(n, logger)).join(""))
    .join("\t");
}

function nodeToReView(node: scrapboxParser.Node, logger: Logger): string {
  if (node.type === "link") {
    if (node.pathType === "relative") {
      logger.error(
        `Can't convert relative links. Please use absolute links instead: ${node.raw}`,
      );
      return node.raw;
    }
    if (node.pathType === "root") {
      logger.warn(`An internal link to a Scrapbox's page is used: ${node.raw}`);
      const href = new URL(node.href, "https://scrapbox.io").href;
      return `@<href>{${escapeHrefUrl(href)}}`;
    }
    return node.content === ""
      ? `@<href>{${escapeHrefUrl(node.href)}}`
      : `@<href>{${escapeHrefUrl(node.href)}, ${escapeHrefUrl(node.content)}}`;
  } else if (node.type === "hashTag") {
    logger.error(
      `Can't convert relative links. Please use absolute links instead: ${node.raw}`,
    );
    return node.raw;
  } else if (node.type === "strong") {
    return `@<strong>{${
      escapeInlineCommand(
        node.nodes.map((n) => nodeToReView(n, logger)).join(""),
      )
    }}`;
  } else if (node.type === "decoration") {
    if (node.nodes.length === 1 && node.nodes[0].type === "image") {
      return nodeToReView(node.nodes[0], logger);
    }
    return node.decos.reduce(
      (inside, decoration) => {
        if (/\*-[0-9]*/.test(decoration)) {
          return `@<strong>{${inside}}`;
        } else if (decoration === "/") {
          return `@<i>{${inside}}`;
        } else if (decoration === "-") {
          return `@<del>{${inside}}`;
        }
        return inside;
      },
      escapeInlineCommand(
        node.nodes.map((n) => nodeToReView(n, logger)).join(""),
      ),
    );
  } else if (node.type === "code") {
    return `@<code>{${escapeInlineCommand(node.text)}}`;
  } else if (node.type === "formula") {
    return `@<m>{${escapeInlineCommand(node.formula)}}`;
  } else if (node.type === "image") {
    return `@<icon>{${escapeInlineCommand(node.src)}}`;
  } else if (node.type === "plain") {
    return node.text;
  } else if (node.type === "icon" || node.type === "strongIcon") {
    logger.warn(`An icon is used: ${node.raw}`);
    return `@<icon>{${node.path}.icon}`;
  } else {
    logger.error(`Unsupported syntax: ${node.raw}`);
    return node.raw;
  }
}

function escapeInlineCommand(content: string): string {
  return content.replaceAll("}", "\\}").replace(/\\$/, "\\\\");
}

function escapeHrefUrl(href: string) {
  return escapeInlineCommand(href).replaceAll(",", "\\,");
}

function escapeBlockCommandOption(option: string) {
  return option.replaceAll("]", "\\]");
}

export default function scrapboxToReView(
  src: string,
  option: ConverterOption = {},
): string {
  // 箇条書き/引用終了処理のため、番兵として最後に空行を入れる
  const ast = scrapboxParser.parse(src + "\n", option);
  return generateReView(ast, option);
}
