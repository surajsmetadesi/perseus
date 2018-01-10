/**
  * Demonstrates the rendered result of a Perseus question within an iframe.
  *
  * This mounts an ItemRenderer, HintRenderer, or ArticleRenderer(s)
  * (depending on the content given) and applies mobile styling if necessary.
  * NOTE(amy): The KA CMS preview relies on preview-frame.jsx in webapp's
  * perseus-preview-package (which largely duplicates this logic)
  */

const React = require("react");

const ItemRenderer = require("./item-renderer.jsx");
const HintRenderer = require("./hint-renderer.jsx");
const ArticleRenderer = require("./article-renderer.jsx");
const TouchEmulator = require("../lib/touch-emulator.js");

const PreviewFrame = React.createClass({
    propTypes: {
        isMobile: React.PropTypes.bool.isRequired,
    },

    getInitialState: function() {
        return {};
    },

    componentDidMount: function() {
        window.addEventListener("message", event => {
            const data = window.parent.iframeDataStore[event.data];

            if (data) {
                this.setState(data);
            }
        });

        window.parent.postMessage(
            window.frameElement.getAttribute("data-id"),
            "*"
        );

        this._updateParentWithHeight();

        if (window.MutationObserver) {
            // To know when to update the parent with the new iframe content
            // height, we listen to DOM mutations inside the iframe and
            // update the parent with the latest height every time a
            // mutation is detected.
            this._observer = new MutationObserver(() => {
                this._updateParentWithHeight();
            });

            this._observer.observe(document.getElementById("measured"), {
                childList: true,
                subtree: true,
                attributes: true,
            });
        }

        // In addition to mutation observers, we also periodically check the
        // height to capture the result of animations.
        setInterval(() => {
            this._updateParentWithHeight();
        }, 500);

        if (this.props.isMobile) {
            TouchEmulator();
        }

        // article-all means that we are rendering a full preview of an article
        if (this.state.type === "article-all") {
            document.body.style.overflow = "scroll";
        } else {
            document.body.style.overflow = "hidden";
        }
    },

    componentDidUpdate() {
        if (this.state.type === "article-all") {
            document.body.style.overflow = "scroll";
        } else {
            document.body.style.overflow = "hidden";
        }
    },

    componentWillUnmount() {
        if (this._observer) {
            this._observer.disconnect();
        }
    },

    _updateParentWithHeight: function() {
        let lowest = 0;
        ["#content-container", ".preview-measure"].forEach(selector => {
            Array.from(document.querySelectorAll(selector)).forEach(element => {
                lowest = Math.max(
                    lowest,
                    element.getBoundingClientRect().bottom
                );
            });
        });

        const bottomMargin = 30;

        window.parent.postMessage(
            {
                id: window.frameElement.getAttribute("data-id"),
                height: lowest + bottomMargin,
            },
            "*"
        );
    },

    render: function() {
        if (this.state.data) {
            const makeUpdatedData = (data) => ({
                ...data,
                workAreaSelector: "#workarea",
                hintsAreaSelector: "#hintsarea",
                apiOptions: {
                    ...data.apiOptions,
                    isMobile: this.props.isMobile,
                },
            });

            const isExercise =
                this.state.type === "question" || this.state.type === "hint";

            const perseusClass =
                "framework-perseus fonts-loaded " +
                (isExercise ? "bibliotron-exercise " : "bibliotron-article ") +
                (this.props.isMobile ? "perseus-mobile" : "");

            const linterContext = this.state.data.linterContext;

            if (this.state.type === "question") {
                return (
                    <div
                        className={perseusClass}
                        style={this.props.isMobile ? {} : {margin: "30px 0"}}
                        ref="container"
                    >
                        <ItemRenderer
                            {...makeUpdatedData(this.state.data)}
                            linterContext={linterContext}
                        />
                        <div id="workarea" style={{marginLeft: 0}} />
                        <div id="hintsarea" />
                    </div>
                );
            } else if (this.state.type === "hint") {
                return (
                    <div
                        className={perseusClass}
                        style={this.props.isMobile ? {} : {margin: "30px 0"}}
                        ref="container"
                    >
                        <HintRenderer
                            {...makeUpdatedData(this.state.data)}
                            linterContext={linterContext}
                        />
                    </div>
                );
            } else if (this.state.type === "article") {
                return (
                    <div
                        className={perseusClass}
                        style={this.props.isMobile ? {} : {margin: "30px 0"}}
                    >
                        <ArticleRenderer
                            {...makeUpdatedData(this.state.data)}
                            linterContext={linterContext}
                        />
                    </div>
                );
            } else if (this.state.type === "article-all") {
                return (
                    <div
                        className={perseusClass}
                        style={this.props.isMobile ? {} : {margin: "30px 0"}}
                    >
                        {this.state.data.map((data, i) => {
                            return (
                                <ArticleRenderer
                                    key={i}
                                    {...makeUpdatedData(data)}
                                    linterContext={linterContext}
                                />
                            );
                        })}
                    </div>
                );
            } else {
                return <div />;
            }
        } else {
            return <div />;
        }
    },
});

module.exports = PreviewFrame;
