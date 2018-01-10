const assert = require("assert");
const nodeUtil = require("util");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const _ = require("underscore");

const PerseusMarkdown = require("../perseus-markdown.jsx");
const parse = PerseusMarkdown.parse;
const characterCount = PerseusMarkdown.characterCount;

// TODO(aria): Don't duplicate these two methods from simple-markdown:

// A pretty-printer that handles `undefined` and functions better
// than JSON.stringify
// Important because some AST node fields can be undefined, and
// if those don't show up in the assert output, it can be
// very confusing to figure out how the actual and expected differ
const prettyPrintAST = (ast) => {
    return nodeUtil.inspect(ast, {
        depth: null,
        colors: false,
    });
};

const validateParse = function(parsed, expected) {
    if (!_.isEqual(parsed, expected)) {
        const parsedStr = prettyPrintAST(parsed);
        const expectedStr = prettyPrintAST(expected);
        // assert.fail doesn't seem to print the
        // expected and actual anymore, so we just
        // throw our own exception.
        throw new Error("Expected:\n" +
            expectedStr +
            "\n\nActual:\n" +
            parsedStr
        );
    }
};

const htmlThroughReact = function(parsed) {
    const output = PerseusMarkdown.basicOutput(parsed);
    const rawHtml = ReactDOMServer.renderToStaticMarkup(
        React.DOM.div(null, output)
    );
    const innerHtml = rawHtml
        .replace(/^<div>/, '')
        .replace(/<\/div>$/, '');
    const simplifiedHtml = innerHtml
        .replace(/>\n*/g, '>')
        .replace(/\n*</g, '<')
        .replace(/\s+/g, ' ');
    return simplifiedHtml;
};

const htmlFromMarkdown = function(source) {
    return htmlThroughReact(parse(source));
};

const assertParsesToReact = function(source, html) {
    const actualHtml = htmlFromMarkdown(source);
    if (actualHtml !== html) {
        console.warn(actualHtml); // eslint-disable-line no-console
        console.warn(html); // eslint-disable-line no-console
    }
    assert.strictEqual(actualHtml, html);
};

const validateCount = (source, expectedCount) => {
    assert.equal(characterCount(source),
                 expectedCount,
                 "characterCount(" + source + ") !== " + expectedCount);
};

describe("perseus markdown", () => {
    describe("parser", () => {
        it("should parse math", () => {
            const parsed = parse("math $y = x + 1$");
            validateParse(parsed, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "math "},
                    {type: "math", content: "y = x + 1"},
                ],
            }]);

            const parsed2 = parse("hi $y = x + 1$ there");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "hi "},
                    {type: "math", content: "y = x + 1"},
                    {type: "text", content: " there"},
                ],
            }]);
        });

        it("should parse nested math", () => {
            const parsed = parse("math $y = \\text{$x + 1$}$");
            validateParse(parsed, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "math "},
                    {type: "math", content: "y = \\text{$x + 1$}"},
                ],
            }]);

            const parsed2 = parse(
                "math $ x^2 \\text{blah $math \\text{some $more math$} $ } $"
            );
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "math "},
                    {type: "math", content: " x^2 \\text{blah $math " +
                        "\\text{some $more math$} $ } "},
                ],
            }]);
        });

        it("should allow escaping in math", () => {
            const parsed = parse("math $\\\\$");
            validateParse(parsed, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "math "},
                    {type: "math", content: "\\\\"},
                ],
            }]);

            const parsed2 = parse("math $\\$$");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "math "},
                    {type: "math", content: "\\$"},
                ],
            }]);

            const parsed3 = parse("${$");
            validateParse(parsed3, [{
                type: "paragraph",
                content: [
                    {type: "unescapedDollar"},
                    {type: "text", content: "{"},
                    {type: "unescapedDollar"},
                ],
            }]);

            const parsed4 = parse("math $\\{$");
            validateParse(parsed4, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "math "},
                    {type: "math", content: "\\{"},
                ],
            }]);

            const parsed5 = parse("hello $ escaped dollar \\$ $ not math");
            validateParse(parsed5, [{
                type: "paragraph",
                content: [
                    {type: "text", content: "hello "},
                    {type: "math", content: " escaped dollar \\$ "},
                    {type: "text", content: " not math"},
                ],
            }]);

            const parsed6 = parse("$math$ not math $ oops extra dollar");
            validateParse(parsed6, [{
                type: "paragraph",
                content: [
                    {content: 'math', type: 'math'},
                    {content: ' not math ', type: 'text'},
                    {type: 'unescapedDollar'},
                    {content: ' oops extra dollar', type: 'text'},
                ],
            }]);
        });

        it("should parse block math", () => {
            const parsed = parse("$x + y = 7$");
            validateParse(parsed, [{
                type: "blockMath",
                content: "x + y = 7",
            }]);

            const parsed2 = parse("$x + y = 7$\nnot math");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {type: "math", content: "x + y = 7"},
                    {type: "text", content: "\nnot math"},
                ],
            }]);

            const parsed3 = parse("  $x + y = 7$  \n\n    \n$3 + 5 = 7$");
            validateParse(parsed3, [{
                type: "blockMath",
                content: "x + y = 7",
            }, {
                type: "blockMath",
                content: "3 + 5 = 7",
            }]);

            const parsed4 = parse("    $x + y = 7$");
            validateParse(parsed4, [{
                type: "codeBlock",
                content: "$x + y = 7$",
                lang: undefined,
            }]);

            const parsed5 = parse("> $x + y = 7$");
            validateParse(parsed5, [{
                type: "blockQuote",
                content: [{
                    type: "blockMath",
                    content: "x + y = 7",
                }],
            }]);
        });

        it("should break on paragraphs", () => {
            const parsed = parse(
                "hello $ single dollar paragraph\n\n not math $"
            );
            validateParse(parsed, [
                {
                    type: "paragraph",
                    content: [
                        {content: 'hello ', type: 'text'},
                        {type: 'unescapedDollar'},
                        {content: ' single dollar paragraph', type: 'text'},
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {content: ' not math ', type: 'text'},
                        {type: 'unescapedDollar'},
                    ],
                },
            ]);

            const parsed2 = parse("hello $ bad { math $");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {content: 'hello ', type: 'text'},
                    {type: 'unescapedDollar'},
                    {content: ' bad ', type: 'text'},
                    {content: '{ math ', type: 'text'},
                    {type: 'unescapedDollar'},
                ],
            }]);

        });

        it("should parse widget types and ids", () => {
            const parsed = parse("[[☃ test 1]]");
            validateParse(parsed, [{
                type: "paragraph",
                content: [{
                    type: "widget",
                    widgetType: "test",
                    id: "test 1",
                }],
            }]);

            const parsed2 = parse("[[☃ test 1]]+[[☃ input-number 2]]");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {
                        type: "widget",
                        widgetType: "test",
                        id: "test 1",
                    },
                    {
                        type: "text",
                        content: "+",
                    },
                    {
                        type: "widget",
                        widgetType: "input-number",
                        id: "input-number 2",
                    },
                ],
            }]);

            const parsed3 = parse("*[[☃ test 2]]* [[☃ input-number 1]]");
            validateParse(parsed3, [{
                type: "paragraph",
                content: [
                    {
                        type: "em",
                        content: [{
                            type: "widget",
                            widgetType: "test",
                            id: "test 2",
                        }],
                    },
                    {
                        type: "text",
                        content: " ",
                    },
                    {
                        type: "widget",
                        widgetType: "input-number",
                        id: "input-number 1",
                    },
                ],
            }]);
        });

        it("should allow escaping widget identifiers", () => {
            const parsed = parse("\\[[☃ test 1]]");
            validateParse(parsed, [{
                type: "paragraph",
                content: [
                    {content: "[", type: "text"},
                    {content: "[☃ test 1", type: "text"},
                    {content: "]", type: "text"},
                    {content: "]", type: "text"},
                ],
            }]);
        });

        it("should parse widgets next to each other as widgets", () => {
            const parsed = parse("[[☃ test 1]][[☃ test 2]]");
            validateParse(parsed, [{
                type: "paragraph",
                content: [
                    {type: "widget", widgetType: "test", id: "test 1"},
                    {type: "widget", widgetType: "test", id: "test 2"},
                ],
            }]);

            const parsed2 = parse("[[☃ test 1]] [[☃ test 2]]");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {type: "widget", widgetType: "test", id: "test 1"},
                    {type: "text", content: " "},
                    {type: "widget", widgetType: "test", id: "test 2"},
                ],
            }]);
        });

        it("should parse multiple columns", () => {
            const parsed = parse(
                "hi\n\n" +
                "=====\n\n" +
                "there\n\n"
            );
            validateParse(parsed, [{
                type: "columns",
                col1: [
                    {
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "hi",
                        }],
                    },
                ],
                col2: [
                    {
                        type: "paragraph",
                        content: [{
                            type: "text",
                            content: "there",
                        }],
                    },
                ],
            }]);
        });

        it("should ignore lists in jipt mode", () => {
            const parsed = parse(
                "1. test\n\n" +
                "2. boo\n\n",
                {isJipt: true}
            );

            validateParse(parsed, [{
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "1",
                }, {
                    type: "text",
                    content: ". test",
                }],
            }, {
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "2",
                }, {
                    type: "text",
                    content: ". boo",
                }],
            }]);

            const parsed2 = parse(
                "* test\n\n" +
                "* boo\n\n",
                {isJipt: true}
            );

            validateParse(parsed2, [{
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "* test",
                }],
            }, {
                type: "paragraph",
                content: [{
                    type: "text",
                    content: "* boo",
                }],
            }]);
        });

        it("should detect unescaped dollars", () => {
            const parsed = parse("$");
            validateParse(parsed, [{
                type: "paragraph",
                content: [{type: "unescapedDollar"}],
            }]);

            const parsed2 = parse("hello $ single dollar");
            validateParse(parsed2, [{
                type: "paragraph",
                content: [
                    {content: 'hello ', type: 'text'},
                    {type: 'unescapedDollar'},
                    {content: ' single dollar', type: 'text'},
                ],
            }]);
        });

    });

    describe("output", () => {
        it("should output paragraphs", () => {
            assertParsesToReact(
                "para!",
                // This is overridden in Renderer
                '<div class="paragraph">para!</div>'
            );
        });

        it("should output columns", () => {
            assertParsesToReact(
                "col1\n\n" +
                "=====\n\n" +
                "col2",
                '<div class="perseus-two-columns">' +
                '<div class="perseus-column">' +
                '<div class="perseus-column-content">' +
                '<div class="paragraph">col1</div>' +
                '</div>' +
                '</div>' +
                '<div class="perseus-column">' +
                '<div class="sat-header-grafting-area"></div>' +
                '<div class="perseus-column-content">' +
                '<div class="sat-skill-subscore-grafting-area"></div>' +
                '<div class="paragraph">col2</div>' +
                '<div class="sat-grafting-area"></div>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        });

        it("should render ```alt screenreader blocks", () => {
            assertParsesToReact(
                "```alt\n" +
                "screenreader-only text!\n" +
                "```",
                // I'm not sure this is the best order; it looks like
                // code is parsed before paragraphs, and then the
                // paragraph is parsed internally.
                '<div class="perseus-markdown-alt perseus-sr-only">' +
                '<div class="paragraph">' +
                'screenreader-only text!' +
                '</div>' +
                '</div>'
            );
        });
    });

    describe("characterCount", () => {
        it("should ignore Markdown and widgets but count TeX", () => {
            validateCount("", 0);
            validateCount("-------", 0);

            validateCount("  foo bar baz", 11);
            // Relies on new features of simple-markdown not-yet-landed in
            // perseus
            // TODO(aria): Re-enable once we upgrade simple-markdown
            //validateCount("- foo bar baz", 11);
            validateCount("# foo bar baz", 11);

            validateCount("[text](resource)", 4);
            validateCount("header 1 | header 2\n" +
                          "- | -\n" +
                          "data 1 | data 2\n" +
                          "data 3 | data 4", 40);

            validateCount("  ☃ test 1  ", 8);
            validateCount("[[☃ test 1]]", 0);

            validateCount(" 1234 ", 4);
            validateCount("$1234$", 4);
        });

        it("should only count multiple sequential spaces within code", () => {
            validateCount("a s  d   f    ", 7);
            validateCount("    " + "a s  d   f    ", 14);

            validateCount(" 1  2  3 ", 5);
            validateCount("`1  2  3`", 7);

            validateCount("123   4 5  6 7   890", 15);
            validateCount("123  `4 5  6 7`  890", 16);
        });

        it("should count spaces between inline elements", () => {
            validateCount("foo to the bar", 14);
            validateCount("foo *to the* bar", 14);
            validateCount("foo $to the$ bar", 14);
        });

        it("should not count spaces between block elements", () => {
            validateCount("foo\n\nbar", 6);
            validateCount(" foo \n\n bar ", 6);
            validateCount("foo\n\n[[☃ test 1]]\n\nbar", 6);
            validateCount(" foo \n\n [[☃ test 1]] \n\n bar ", 6);
        });
    });
});
