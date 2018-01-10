const Perseus = require("./perseus.js");

module.exports = {
    itemVersion: require("./item-version"),
    ItemDiff: require("./diffs/item-diff.jsx"),
    ArticleDiff: require("./diffs/article-diff.jsx"),
    StatefulArticleEditor: require("./stateful-article-editor.jsx"),
    StatefulEditorPage: require("./stateful-editor-page.jsx"),
    ClassNames: require("./perseus-api.jsx").ClassNames,
    Util: require("./util.js"),
    ViewportResizer: require("./components/viewport-resizer.jsx"),
    DeviceFramer: require("./components/device-framer.jsx"),
    renderability: require("./renderability.jsx"),
    accessibility: require("./a11y.js"),
    i18n: require("./i18n.jsx"),
    ArticleEditor: require("./article-editor.jsx"),
    Editor: require("./editor.jsx"),
    EditorPage: require("./editor-page.jsx"),
    IframeContentRenderer: require("./iframe-content-renderer.jsx"),
    MultiRendererEditor: require("./multirenderer-editor.jsx"),
    Gorgon: require("./gorgon/gorgon.js"),
    JiptHack: require("./jipt-hack.jsx"),
    ...Perseus,
};
