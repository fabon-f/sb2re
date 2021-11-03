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
