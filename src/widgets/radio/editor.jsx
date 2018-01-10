/* eslint-disable comma-dangle, indent, no-undef, no-var, object-curly-spacing, react/forbid-prop-types, react/jsx-closing-bracket-location, react/jsx-indent-props, react/sort-comp */
/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var React = require("react");
var _ = require("underscore");

var ApiOptions = require("../../perseus-api.jsx").Options;
var BaseRadio = require("./base-radio.jsx");
var Changeable = require("../../mixins/changeable.jsx");
var Editor = require("../../editor.jsx");
var {iconPlus, iconTrash} = require("../../icon-paths.js");
var InlineIcon = require("../../components/inline-icon.jsx");
var PropCheckBox = require("../../components/prop-check-box.jsx");

var ChoiceEditor = React.createClass({
    propTypes: {
        apiOptions: ApiOptions.propTypes,

        choice: React.PropTypes.object,
        showDelete: React.PropTypes.bool,
        onClueChange: React.PropTypes.func,
        onContentChange: React.PropTypes.func,
        onDelete: React.PropTypes.func,
    },

    render: function() {
        var checkedClass = this.props.choice.correct ? "correct" : "incorrect";
        var placeholder = "Type a choice here...";

        if (this.props.choice.isNoneOfTheAbove) {
            placeholder = this.props.choice.correct
                ? "Type the answer to reveal to the user..."
                : "None of the above";
        }

        var editor = (
            <Editor
                ref={"content-editor"}
                apiOptions={this.props.apiOptions}
                content={this.props.choice.content || ""}
                widgetEnabled={false}
                placeholder={placeholder}
                disabled={
                    this.props.choice.isNoneOfTheAbove &&
                    !this.props.choice.correct
                }
                onChange={this.props.onContentChange}
            />
        );

        var clueEditor = (
            <Editor
                ref={"clue-editor"}
                apiOptions={this.props.apiOptions}
                content={this.props.choice.clue || ""}
                widgetEnabled={false}
                placeholder={i18n._(`Why is this choice ${checkedClass}?`)}
                onChange={this.props.onClueChange}
            />
        );

        var deleteLink = (
            <a
                className="simple-button orange delete-choice"
                href="#"
                onClick={this.props.onDelete}
                title="Remove this choice"
            >
                <InlineIcon {...iconTrash} />
            </a>
        );

        return (
            <div className="choice-clue-editors">
                <div className={`choice-editor ${checkedClass}`}>
                    {editor}
                </div>
                <div className="clue-editor">
                    {clueEditor}
                </div>
                {this.props.showDelete && deleteLink}
            </div>
        );
    },
});

var RadioEditor = React.createClass({
    propTypes: {
        ...Changeable.propTypes,
        apiOptions: ApiOptions.propTypes,
        choices: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                content: React.PropTypes.string,
                clue: React.PropTypes.string,
                correct: React.PropTypes.bool,
            })
        ),
        displayCount: React.PropTypes.number,
        randomize: React.PropTypes.bool,
        hasNoneOfTheAbove: React.PropTypes.bool,
        multipleSelect: React.PropTypes.bool,
        countChoices: React.PropTypes.bool,

        // TODO(kevinb): DEPRECATED: This is be used to force deselectEnabled
        // behavior on mobile but not on desktop.  When enabled, the user can
        // deselect a radio input by tapping on it again.
        deselectEnabled: React.PropTypes.bool,

        static: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            choices: [{}, {}],
            displayCount: null,
            randomize: false,
            hasNoneOfTheAbove: false,
            multipleSelect: false,
            countChoices: false,
            deselectEnabled: false,
        };
    },

    render: function() {
        var numCorrect = _.reduce(
            this.props.choices,
            function(memo, choice) {
                return choice.correct ? memo + 1 : memo;
            },
            0
        );
        return (
            <div>
                <div className="perseus-widget-row">
                    <a
                        href="https://docs.google.com/document/d/1frZf7yrWVWb1n4tVjqlzqVUiv1pn4cZXbxgP62-JDBY/edit#heading=h.8ng1isya19nu"
                        target="_blank"
                    >
                        Multiple choice style guide
                    </a>
                    <br />
                    <div className="perseus-widget-left-col">
                        <PropCheckBox
                            label="Multiple selections"
                            labelAlignment="right"
                            multipleSelect={this.props.multipleSelect}
                            onChange={this.onMultipleSelectChange}
                        />
                    </div>
                    <div className="perseus-widget-right-col">
                        <PropCheckBox
                            label="Randomize order"
                            labelAlignment="right"
                            randomize={this.props.randomize}
                            onChange={this.props.onChange}
                        />
                    </div>
                    {this.props.multipleSelect &&
                        <div className="perseus-widget-left-col">
                            <PropCheckBox
                                label="Specify number correct"
                                labelAlignment="right"
                                countChoices={this.props.countChoices}
                                onChange={this.onCountChoicesChange}
                            />
                        </div>}
                </div>

                <BaseRadio
                    ref="baseRadio"
                    multipleSelect={this.props.multipleSelect}
                    countChoices={this.props.countChoices}
                    numCorrect={numCorrect}
                    editMode={true}
                    labelWrap={false}
                    apiOptions={this.props.apiOptions}
                    choices={this.props.choices.map(function(choice, i) {
                        return {
                            content: (
                                <ChoiceEditor
                                    ref={`choice-editor${i}`}
                                    apiOptions={this.props.apiOptions}
                                    choice={choice}
                                    onContentChange={newProps => {
                                        if ("content" in newProps) {
                                            this.onContentChange(
                                                i,
                                                newProps.content
                                            );
                                        }
                                    }}
                                    onClueChange={newProps => {
                                        if ("content" in newProps) {
                                            this.onClueChange(
                                                i,
                                                newProps.content
                                            );
                                        }
                                    }}
                                    onDelete={this.onDelete.bind(this, i)}
                                    showDelete={this.props.choices.length >= 2}
                                />
                            ),
                            isNoneOfTheAbove: choice.isNoneOfTheAbove,
                            checked: choice.correct,
                        };
                    }, this)}
                    onChange={this.onChange}
                />

                <div className="add-choice-container">
                    <a
                        className="simple-button orange"
                        href="#"
                        onClick={this.addChoice.bind(this, false)}
                    >
                        <InlineIcon {...iconPlus} /> Add a choice{" "}
                    </a>

                    {!this.props.hasNoneOfTheAbove &&
                        <a
                            className="simple-button"
                            href="#"
                            onClick={this.addChoice.bind(this, true)}
                        >
                            <InlineIcon {...iconPlus} /> None of the above{" "}
                        </a>}
                </div>
            </div>
        );
    },

    change(...args) {
        return Changeable.change.apply(this, args);
    },

    onMultipleSelectChange: function(allowMultiple) {
        allowMultiple = allowMultiple.multipleSelect;

        var numCorrect = _.reduce(
            this.props.choices,
            function(memo, choice) {
                return choice.correct ? memo + 1 : memo;
            },
            0
        );

        if (!allowMultiple && numCorrect > 1) {
            var choices = _.map(this.props.choices, function(choice) {
                return _.defaults(
                    {
                        correct: false,
                    },
                    choice
                );
            });
            this.props.onChange({
                multipleSelect: allowMultiple,
                choices: choices,
            });
        } else {
            this.props.onChange({
                multipleSelect: allowMultiple,
            });
        }
    },

    onCountChoicesChange: function(count) {
        count = count.countChoices;
        this.props.onChange({countChoices: count});
    },

    onChange: function({checked}) {
        var choices = _.map(this.props.choices, (choice, i) => {
            return _.extend({}, choice, {
                correct: checked[i],
                content:
                    choice.isNoneOfTheAbove && !checked[i]
                        ? ""
                        : choice.content,
            });
        });

        this.props.onChange({choices: choices});
    },

    onContentChange: function(choiceIndex, newContent) {
        var choices = this.props.choices.slice();
        choices[choiceIndex] = _.extend({}, choices[choiceIndex], {
            content: newContent,
        });
        this.props.onChange({choices: choices});
    },

    onClueChange: function(choiceIndex, newClue) {
        var choices = this.props.choices.slice();
        choices[choiceIndex] = _.extend({}, choices[choiceIndex], {
            clue: newClue,
        });
        if (newClue === "") {
            delete choices[choiceIndex].clue;
        }
        this.props.onChange({choices: choices});
    },

    onDelete: function(choiceIndex, e) {
        e.preventDefault();

        var choices = this.props.choices.slice();
        var deleted = choices[choiceIndex];

        choices.splice(choiceIndex, 1);

        this.props.onChange({
            choices: choices,
            hasNoneOfTheAbove:
                this.props.hasNoneOfTheAbove && !deleted.isNoneOfTheAbove,
        });
    },

    addChoice: function(noneOfTheAbove, e) {
        e.preventDefault();

        var choices = this.props.choices.slice();
        var newChoice = {isNoneOfTheAbove: noneOfTheAbove};
        var addIndex = choices.length - (this.props.hasNoneOfTheAbove ? 1 : 0);

        choices.splice(addIndex, 0, newChoice);

        this.props.onChange(
            {
                choices: choices,
                hasNoneOfTheAbove:
                    noneOfTheAbove || this.props.hasNoneOfTheAbove,
            },
            () => {
                this.refs[`choice-editor${addIndex}`].refs[
                    "content-editor"
                ].focus();
            }
        );
    },

    setDisplayCount: function(num) {
        this.props.onChange({displayCount: num});
    },

    focus: function() {
        this.refs["choice-editor0"].refs["content-editor"].focus();
        return true;
    },

    getSaveWarnings: function() {
        if (!_.some(_.pluck(this.props.choices, "correct"))) {
            return ["No choice is marked as correct."];
        }
        return [];
    },

    serialize: function() {
        return _.pick(
            this.props,
            "choices",
            "randomize",
            "multipleSelect",
            "countChoices",
            "displayCount",
            "hasNoneOfTheAbove",
            "deselectEnabled"
        );
    },
});

module.exports = RadioEditor;
