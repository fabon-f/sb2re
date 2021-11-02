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

Deno.test("Heading with baseHeaderLevel", () => {
    const sbContent = `hoge
[**** hoge]
[*** fuga]`;
    const reviewCode = `= hoge
== hoge
=== fuga
`;
    assertEquals(scrapboxToReView(sbContent, { baseHeaderLevel: 4 }), reviewCode)
});
