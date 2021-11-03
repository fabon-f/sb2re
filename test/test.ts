import scrapboxToReView from "../mod.ts"
import { asserts } from "./test_helper.ts"

const { assertEquals } = asserts;

Deno.test("Heading", () => {
    const sbContent = `hoge
[*** hoge]
[** fuga]`;
    const reviewCode = `= hoge
== hoge
=== fuga
`;
    assertEquals(scrapboxToReView(sbContent), reviewCode)
});

Deno.test("Heading with baseHeadingLevel", () => {
    const sbContent = `hoge
[**** hoge]
[*** fuga]`;
    const reviewCode = `= hoge
== hoge
=== fuga
`;
    assertEquals(scrapboxToReView(sbContent, { baseHeadingLevel: 4 }), reviewCode)
});

Deno.test("Decoration", () => {
    const sbContent = "[[Bold]][* Bold][**/- BoldStrikeItalic]";
    const reviewCode = "@<strong>{Bold}@<strong>{Bold}@<strong>{@<del>{@<i>{BoldStrikeItalic}}}";
    assertEquals(scrapboxToReView(sbContent, { hasTitle: false }), reviewCode);
});

Deno.test("External Link", () => {
    const sbContent = "https://google.com [https://google.com] [https://google.com G] [G https://google.com]"
    const reviewCode = "@<href>{https://google.com} @<href>{https://google.com} @<href>{https://google.com, G} @<href>{https://google.com, G}";
    assertEquals(scrapboxToReView(sbContent, { hasTitle: false }), reviewCode);
});

Deno.test("Link across projects", () => {
    const sbContent = "[/projectname][/projectname/pagename]";
    const reviewCode = "@<href>{https://scrapbox.io/projectname}@<href>{https://scrapbox.io/projectname/pagename}";
    assertEquals(scrapboxToReView(sbContent, { hasTitle: false }), reviewCode);
});

Deno.test("Inline code", () => {
    const sbContent = "`code`";
    const reviewCode = "@<code>{code}";
    assertEquals(scrapboxToReView(sbContent, { hasTitle: false }), reviewCode);
});

Deno.test("Formula", () => {
    const sbContent = "[$ E = mc^2]";
    const reviewCode = "@<m>{E = mc^2}";
    assertEquals(scrapboxToReView(sbContent, { hasTitle: false }), reviewCode);
});
