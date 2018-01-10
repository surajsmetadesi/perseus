/**
  * Demonstrates the main Perseus editor
  *
  * This is ran by demo-perseus.js and handles adding debugger
  * buttons and their event listeners above a StatefulEditorPage
  */

const React = require("react");
const StatefulEditorPage = require("./stateful-editor-page.jsx");
const EditorPage = require("./editor-page.jsx");
const Util = require("./util.js");
const Renderability = require("./renderability.jsx");

const defaultQuestion = {
    question: {
        content: "",
        images: {},
        widgets: {},
    },
    answerArea: {
        calculator: false,
    },
    itemDataVersion: {
        major: 0,
        minor: 1,
    },
    hints: [],
};

const EditorDemo = React.createClass({
    propTypes: {
        problemNum: React.PropTypes.number,
        question: React.PropTypes.any.isRequired,
    },

    getDefaultProps: function() {
        return {
            question: defaultQuestion,
            problemNum: 1,
        };
    },

    getInitialState: function() {
        return {
            deviceType: "desktop",
            scratchpadEnabled: true,
        };
    },

    componentDidMount: function() {
        // Hacks to make debugging nicer
        window.editorPage = this.refs.editor.refs.editor;
        window.itemRenderer = window.editorPage.renderer;
    },

    serialize: function() {
        console.log(JSON.stringify(this.refs.editor.serialize(), null, 4)); // eslint-disable-line no-console
    },

    scorePreview: function() {
        console.log(this.refs.editor.scorePreview()); // eslint-disable-line no-console
    },

    _getContentHash: function() {
        return Util.strongEncodeURIComponent(
            JSON.stringify(this.refs.editor.serialize())
        );
    },

    permalink: function(e) {
        window.location.hash = `content=${this._getContentHash()}`;
        e.preventDefault();
    },

    viewRendered: function(e) {
        const link = document.createElement("a");
        link.href =
            window.location.pathname +
            `?renderer#content=${this._getContentHash()}`;
        link.target = "_blank";
        link.click();
        e.preventDefault();
    },

    inputVersion: function(e) {
        e.preventDefault();
        // print whether or not this item consists only of
        // input-numbers and numeric-inputs.
        // just for versioning testing
        console.log( // eslint-disable-line no-console
            Renderability.isItemRenderableByVersion(
                this.refs.editor.serialize(),
                {
                    "::renderer::": {major: 100, minor: 0},
                    group: {major: 100, minor: 0},
                    sequence: {major: 100, minor: 0},
                    "input-number": {major: 100, minor: 0},
                    "numeric-input": {major: 100, minor: 0},
                }
            )
        );
    },

    saveWarnings: function(e) {
        e.preventDefault();
        console.log(this.refs.editor.getSaveWarnings()); // eslint-disable-line no-console
    },

    getEditorProps() {
        const {deviceType} = this.state;
        const isMobile = deviceType === "phone" || deviceType === "tablet";

        return {
            ...this.props.question,
            problemNum: this.props.problemNum,
            developerMode: true,
            imageUploader: function(image, callback) {
                setTimeout(
                    callback,
                    1000,
                    "https://cdn.kastatic.org/images/khan-logo-vertical-transparent.png"
                ); // eslint-disable-line max-len
            },
            apiOptions: {
                onFocusChange: function(newPath, oldPath) {
                    console.log("onFocusChange", newPath, oldPath); // eslint-disable-line no-console
                },
                customKeypad: isMobile,
                isMobile,
                setDrawingAreaAvailable: enabled => {
                    this.setState({
                        scratchpadEnabled: enabled,
                    });
                },
            },
            componentClass: EditorPage,
            onPreviewDeviceChange: deviceType => {
                this.setState({deviceType});
            },
            previewDevice: deviceType,
            /* eslint-disable max-len */
            frameSource: `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0">

                    <link rel="stylesheet" type="text/css" href="stylesheets/local-only/khan-site.css" />
                    <link rel="stylesheet" type="text/css" href="stylesheets/local-only/khan-exercise.css" />
                    <link rel="stylesheet" type="text/css" href="lib/katex/katex.css" />
                    <link rel="stylesheet" type="text/css" href="lib/font-awesome.min.css">
                    <link rel="stylesheet" type="text/css" href="lib/mathquill/mathquill.css" />
                    <link rel="stylesheet" type="text/css" href="stylesheets/perseus-admin-package/devices.min.css" />

                    <link rel="stylesheet/less" type="text/css" href="stylesheets/exercise-content-package/perseus.less" />
                    <link rel="stylesheet/less" type="text/css" href="stylesheets/perseus-admin-package/editor.less" />
                    <style>
                        body {
                            min-width: 0 !important;
                            /* overrides body { min-width: 1000px; } in khan-site.css */

                            overflow: hidden;
                        }
                    </style>

                    <script>less = {env: 'development', logLevel: 1};</script>
                    <script src="lib/less.js"></script>
                </head>
                <body>
                    <div id="content-container">
                    </div>
                    <script src="lib/babel-polyfills.min.js"></script>
                    <script src="lib/jquery.js"></script>
                    <script src="lib/underscore.js"></script>
                    <script src="lib/react-with-addons.js"></script>
                    <script src="lib/mathjax/2.1/MathJax.js?config=KAthJax-730d56e87e9c926b91584f6030314815&amp;delayStartupUntil=configured"></script>
                    <script src="lib/katex/katex.js"></script>
                    <script src="lib/mathquill/mathquill-basic.js"></script>
                    <script src="lib/kas.js"></script>
                    <script src="lib/i18n.js"></script>
                    <script src="lib/jquery.qtip.js"></script>
                    <script src="build/frame-perseus.js"></script>
                </body>
            </html>`,
            /* eslint-enable max-len */
        };
    },

    render: function() {
        const editorProps = this.getEditorProps();

        return (
            <div id="perseus-index">
                <div className="extras">
                    <button onClick={this.serialize}>serialize</button>{" "}
                    <button onClick={this.scorePreview}>score</button>{" "}
                    <button onClick={this.permalink}>permalink</button>{" "}
                    <button onClick={this.viewRendered}>
                        view rendered
                    </button>{" "}
                    <button onClick={this.inputVersion}>
                        contains only inputs?
                    </button>{" "}
                    <button onClick={this.saveWarnings}>
                        save warnings
                    </button>{" "}
                    <span>Seed:{this.props.problemNum} </span>{" "}
                    <span>
                        Scratchpad:{this.state.scratchpadEnabled
                            ? "enabled"
                            : "disabled"}
                    </span>
                </div>
                <StatefulEditorPage
                    key={this.props.question}
                    ref="editor"
                    {...editorProps}
                />
            </div>
        );
    },
});

module.exports = EditorDemo;
