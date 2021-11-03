import scrapboxToReView, { ConverterOption } from "../mod.ts"
import { asserts } from "./test_helper.ts"

const { assertEquals } = asserts;

function assertConvertion(sbContent: string, reviewCode: string, option?: ConverterOption) {
    assertEquals(scrapboxToReView(sbContent, option).trim(), reviewCode.trim());
}

Deno.test("Heading", () => {
    const sbContent = `hoge
[*** hoge]
[** fuga]`;
    const reviewCode = `= hoge

== hoge

=== fuga
`;
    assertConvertion(sbContent, reviewCode);
});

Deno.test("Heading with baseHeadingLevel", () => {
    const sbContent = `hoge
[**** hoge]
[*** fuga]`;
    const reviewCode = `= hoge

== hoge

=== fuga
`;
    assertConvertion(sbContent, reviewCode, { baseHeadingLevel: 4 });
});

Deno.test("Decoration", () => {
    const sbContent = "[[Bold]][* Bold][**/- BoldStrikeItalic]";
    const reviewCode = "@<strong>{Bold}@<strong>{Bold}@<strong>{@<del>{@<i>{BoldStrikeItalic}}}";
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("External Link", () => {
    const sbContent = "https://google.com [https://google.com] [https://google.com G] [G https://google.com]"
    const reviewCode = "@<href>{https://google.com} @<href>{https://google.com} @<href>{https://google.com, G} @<href>{https://google.com, G}";
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Link across projects", () => {
    const sbContent = "[/projectname][/projectname/pagename]";
    const reviewCode = "@<href>{https://scrapbox.io/projectname}@<href>{https://scrapbox.io/projectname/pagename}";
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Inline code", () => {
    const sbContent = "`code`";
    const reviewCode = "@<code>{code}";
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Formula", () => {
    const sbContent = "[$ E = mc^2]";
    const reviewCode = "@<m>{E = mc^2}";
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Multiline text", () => {
    const sbContent = "hoge\nfuga";
    const reviewCode = `hoge

fuga`;
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Itemization", () => {
    const sbContent = `foo
 hoge
\t\tfuga
  piyo
foo`;
    const reviewCode = `foo

 * hoge
 ** fuga
 ** piyo

foo`;
    assertConvertion(sbContent, reviewCode, { hasTitle: false });
});
