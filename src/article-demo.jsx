/**
 * Demonstrates the rendered result of a Perseus article
 */

const React = require("react");
const ArticleEditor = require("./article-editor.jsx");
const StatefulArticleEditor = require("./stateful-article-editor.jsx");
const Util = require("./util.js");

const defaultArticle = [
    {
        content: "",
        images: {},
        widgets: {},
    },
];

const ArticleDemo = React.createClass({
    propTypes: {
        content: React.PropTypes.any.isRequired,
    },

    getDefaultProps() {
        return {
            content: defaultArticle,
        };
    },

    getInitialState: function() {
        return {
            isMobile: navigator.userAgent.indexOf("Mobile") !== -1,
        };
    },

    componentDidMount: function() {
        window.addEventListener("resize", this._handleResize);
    },

    componentWillUnmount: function() {
        window.removeEventListener("resize", this._handleResize);
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

    _handleResize() {
        const isMobile = navigator.userAgent.indexOf("Mobile") !== -1;
        if (this.state.isMobile !== isMobile) {
            this.setState({isMobile});
        }
    },

    getEditorProps() {
        const {isMobile} = this.state;

        return {
            json: this.props.content,
            imageUploader: function(image, callback) {
                setTimeout(callback, 1000, "http://fake.image.url");
            },
            apiOptions: {
                customKeypad: isMobile,
                onFocusChange: function(newPath, oldPath) {
                    console.log("onFocusChange", newPath, oldPath); // eslint-disable-line no-console
                },
                trackInteraction: function(trackData) {
                    console.log( // eslint-disable-line no-console
                        "Interaction with",
                        trackData.type,
                        trackData
                    );
                },
                isMobile,
            },

            useNewStyles: true,
            componentClass: ArticleEditor,

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
        return (
            <div id="perseus-index">
                <div id="extras">
                    <button onClick={this.serialize}>serialize</button>{" "}
                    <button onClick={this.scorePreview}>score</button>{" "}
                    <button onClick={this.permalink}>permalink</button>{" "}
                </div>
                <div style={{margin: 20}}>
                    <StatefulArticleEditor
                        ref="editor"
                        {...this.getEditorProps()}
                    />
                </div>
            </div>
        );
    },
});

module.exports = ArticleDemo;
