/* eslint-disable comma-dangle, no-var, react/sort-comp */
/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var React = require("react");

var Changeable = require("../mixins/changeable.jsx");
var EditorJsonify = require("../mixins/editor-jsonify.jsx");

var ExampleGraphieWidget = require("./example-graphie-widget.jsx").widget;

/**
 * This is the widget's editor. This is what shows up on the left side
 * of the screen in the demo page. Only the question writer sees this.
 */
var ExampleGraphieWidgetEditor = React.createClass({
    propTypes: {
        ...Changeable.propTypes,
    },

    getDefaultProps: function() {
        return {
            correct: [4, 4],
            graph: {
                box: [340, 340],
                labels: ["x", "y"],
                range: [[-10, 10], [-10, 10]],
                step: [1, 1],
                gridStep: [1, 1],
                valid: true,
                backgroundImage: null,
                markings: "grid",
                showProtractor: false,
            },
        };
    },

    render: function() {
        return (
            <div>
                <ExampleGraphieWidget
                    graph={this.props.graph}
                    coord={this.props.correct}
                    onChange={this.handleChange}
                    apiOptions={this.props.apiOptions}
                />
            </div>
        );
    },

    change(...args) {
        return Changeable.change.apply(this, args);
    },

    handleChange: function(newProps) {
        if (newProps.coord) {
            this.change({
                correct: newProps.coord,
            });
        }
    },

    serialize() {
        return EditorJsonify.serialize.call(this);
    },
});

module.exports = ExampleGraphieWidgetEditor;
