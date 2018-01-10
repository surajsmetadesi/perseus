import Rule from "../rule.js";

module.exports = Rule.makeRule({
    name: "link-click-here",
    severity: Rule.Severity.WARNING,
    selector: "link",
    pattern: /click here/i,
    message: `Inappropriate link text:
Do not use the words "click here" in links.`,
});
