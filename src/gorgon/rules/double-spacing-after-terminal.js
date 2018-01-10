import Rule from "../rule.js";

module.exports = Rule.makeRule({
    name: "double-spacing-after-terminal",
    severity: Rule.Severity.BULK_WARNING,
    selector: "paragraph",
    pattern: /[.!\?] {2}/i,
    message: `Use a single space after a sentence-ending period, or
any other kind of terminal punctuation.`,
});
