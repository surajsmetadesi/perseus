import Rule from "../rule.js";

module.exports = Rule.makeRule({
    name: "nested-lists",
    severity: Rule.Severity.WARNING,
    selector: "list list",
    message: `Nested lists:
nested lists are hard to read on mobile devices;
do not use additional indentation.`,
});
