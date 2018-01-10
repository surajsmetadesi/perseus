/* eslint-disable object-curly-spacing */
/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

/* global i18n */

const {StyleSheet, css} = require("aphrodite");
const _ = require("underscore");
const React = require("react");
const classNames = require("classnames");

const {ClassNames} = require("../../perseus-api.jsx");
const sharedStyles = require("../../styles/shared.js");
const styleConstants = require("../../styles/constants.js");
const mediaQueries = require("../../styles/media-queries.js");

const ToggleableRadioButton = require("./toggleable-radio-button.jsx");
const ChoiceIcon = require("./choice-icon.jsx");
const OptionStatus = require("./option-status.jsx");

const focusedStyleMixin = {
    backgroundColor: styleConstants.satSelectedBackgroundColor,
    outline: `2px solid ${styleConstants.satBlue}`,
    // Render the outline higher than the next element's border
    zIndex: 1,
};

const intermediateCheckboxPadding = `16px 16px`;
const intermediateCheckboxPaddingPhone = `12px 16px`;

const Choice = React.createClass({
    propTypes: {
        // TODO(kevinb) use Options.propTypes from perseus-api.jsx
        // This change will also require make sure that item-renderer.jsx and
        // server-item-renderer.jsx have appropriate defaults for apiOptions
        // because many of the properties on Options.propTypes are required.
        apiOptions: React.PropTypes.shape({
            satStyling: React.PropTypes.bool,
            isMobile: React.PropTypes.bool,
            styling: React.PropTypes.shape({
                radioStyleVersion: React.PropTypes.oneOf([
                    "intermediate",
                    "final",
                ]),
                primaryProductColor: React.PropTypes.string,
            }),
            readOnly: React.PropTypes.bool,
        }),
        checked: React.PropTypes.bool,
        className: React.PropTypes.string,
        rationale: React.PropTypes.node,
        content: React.PropTypes.node,
        correct: React.PropTypes.bool,
        deselectEnabled: React.PropTypes.bool,
        disabled: React.PropTypes.bool,
        editMode: React.PropTypes.bool,
        groupName: React.PropTypes.string,
        isLastChoice: React.PropTypes.bool, // Needed for border styling
        // This indicates the position of the choice relative to others
        // (so that we can display a nice little (A), (B), etc. next to it)
        // Also used to generate an id for each input.
        pos: React.PropTypes.number,
        reviewMode: React.PropTypes.bool,
        showRationale: React.PropTypes.bool,
        showCorrectness: React.PropTypes.bool,
        type: React.PropTypes.string,

        // Indicates whether the user has "crossed out" this choice, meaning
        // that they don't think it's correct. This value does not affect
        // scoring or other behavior; it's just a note for the user's
        // reference.
        crossedOut: React.PropTypes.bool,

        // A callback indicating that this choice has changed. Its argument is
        // an object with two keys: `checked` and `crossedOut`. Each contains a
        // boolean value specifying the new checked and crossed-out value of
        // this choice.
        onChange: React.PropTypes.func,
    },

    statics: {
        styles: StyleSheet.create({
            pos: {
                display: "none",
            },

            description: {
                display: "inline-block",
                width: "100%",
            },

            satDescription: {
                display: "block",
                position: "relative",
                boxSizing: "border-box",
                cursor: "pointer",
                marginLeft: 0,
                padding: "17px 14px",
            },

            satDescriptionInputFocused: {
                ...focusedStyleMixin,
            },

            satDescriptionInputActive: {
                ...focusedStyleMixin,
                backgroundColor: styleConstants.satActiveBackgroundColor,
            },

            satDescriptionCorrect: {
                color: styleConstants.satCorrectColor,
            },

            satDescriptionCorrectChecked: {
                backgroundColor: styleConstants.satCorrectBackgroundColor,
            },

            satDescriptionIncorrectChecked: {
                color: styleConstants.satIncorrectColor,
                backgroundColor: styleConstants.satIncorrectBackgroundColor,
            },

            input: {
                display: "inline-block",
                width: 20,
                margin: 3,
                marginLeft: -20,
                marginRight: 0,
                float: "none",
            },

            satReviewInput: {
                pointerEvents: "none",
            },

            satRadioOptionContent: {
                userSelect: "text",
                display: "block",
                marginLeft: 45,
                // Overriding here, not sure why typically set
                // to "cursor: default" in js
                cursor: "inherit",
            },

            satReviewRadioOptionContent: {
                fontWeight: "bold",
            },

            satCheckboxOptionContent: {
                position: "absolute",
                display: "block",
                top: "50%",
                margin: "-16px 0 0 0",
                width: "auto",
            },

            choiceIconWrapper: {
                display: "flex",
                marginRight: 12,

                // NOTE(mdr): Without this style, the bubbles shrink on iOS
                //     when answer text gets long.
                flexShrink: 0,
            },

            optionStatusContainer: {
                display: "block",
            },

            rationale: {
                display: "block",
            },

            nonSatRationale: {
                padding: intermediateCheckboxPadding,
                paddingTop: 0,
                marginLeft: 44,
                [mediaQueries.smOrSmaller]: {
                    padding: intermediateCheckboxPaddingPhone,
                    paddingTop: 0,
                },
            },

            satReviewRationale: {
                marginTop: 13,
                marginLeft: 45,
            },

            label: {
                display: "block",
            },

            responsiveLabel: {
                WebkitTapHighlightColor: "transparent",
                display: "flex",
            },

            satLabel: {
                cursor: "pointer",
            },

            intermediateResponsiveCheckbox: {
                display: "flex",
                alignItems: "center",

                padding: intermediateCheckboxPadding,
                [mediaQueries.smOrSmaller]: {
                    padding: intermediateCheckboxPaddingPhone,
                },
            },
            intermediateResponsiveCheckboxReview: {
                alignItems: 'flex-start',
            },

            crossOutLink: {
                textAlign: "right",
                alignSelf: "center",
                width: 100,
            },
        }),
    },

    getDefaultProps: function() {
        return {
            checked: false,
            classSet: {},
            disabled: false,
            editMode: false,
            showRationale: false,
            type: "radio",
            pos: 0,
        };
    },

    getInitialState: function() {
        return {
            isInputFocused: false,
            isInputActive: false,
        };
    },

    componentWillUpdate(nextProps) {
        if (this.state.isInputFocused && nextProps.disabled) {
            this.setState({
                isInputFocused: false,
            });
        }
    },

    onInputFocus: function() {
        this.setState({isInputFocused: true});
    },

    onInputBlur: function() {
        this.setState({isInputFocused: false});
    },

    onInputMouseDown: function(e) {
        if (e.type === "mousedown" && this.justFinishedTouch) {
            return;
        }

        this.setState({isInputActive: true});

        // Simulate Chrome's radio button behavior in all browsers: when the
        // mouse goes down or up, the radio button should become focused.
        // That way, the newly-selected answer becomes highlighted after click.
        if (this.props.apiOptions.satStyling && this._input) {
            this._input.focus();
        }
    },

    onInputMouseUp: function(e) {
        if (e.type === "mouseup" && this.justFinishedTouch) {
            return;
        }

        // NOTE(emily): We do some special handling here of touch events to
        // make the "active" effect look better. In particular, when you click
        // using touch events, we get a series of events going
        // touchstart -> (delay) -> touchend -> mousedown -> mouseup -> click
        // In order to make sure that we don't turn the active state of and on
        // and off again during the touchend -> mousedown -> mouseup series, we
        // set a flag (this.justFinishedTouch) after the touchend, and ignore
        // the mousedown and mouseup events. Then, a little while later, we
        // turn the flag off. Instead of turning the active state off right at
        // the beginning, we wait for a little bit to sync it up better with
        // the click event.
        if (e.type === "touchend") {
            this.justFinishedTouch = true;

            setTimeout(() => {
                this.setState({isInputActive: false});
                this.justFinishedTouch = false;
            }, 10);
            return;
        }

        this.setState({isInputActive: false});

        // Simulate Chrome's radio button behavior in all browsers: when the
        // mouse goes down or up, the radio button should become focused.
        // That way, the newly-selected answer becomes highlighted after click.
        if (this.props.apiOptions.satStyling && this._input) {
            this._input.focus();
        }
    },

    onInputMouseOut: function() {
        this.setState({isInputActive: false});
    },

    inputRef: function(ref) {
        this._input = ref;
    },

    renderOptionStatus() {
        const {correct, checked, reviewMode} = this.props;
        // Option status is shown only in review mode, and excluded for SAT
        if (!reviewMode || this.props.apiOptions.satStyling) {
            return;
        }
        return <OptionStatus
            checked={checked}
            correct={correct}
        />;
    },

    renderChoiceIcon() {
        const {
            radioStyleVersion,
            primaryProductColor,
        } = this.props.apiOptions.styling;
        const finalStyles =
            typeof radioStyleVersion === "undefined"
                ? false
                : radioStyleVersion === "final";

        if (!finalStyles && !this.props.apiOptions.satStyling) {
            return null;
        }

        return (
            <ChoiceIcon
                pos={this.props.pos}
                correct={this.props.correct}
                pressed={this.state.isInputActive}
                focused={this.state.isInputFocused}
                checked={this.props.checked}
                showCorrectness={this.props.showCorrectness}
                reviewMode={this.props.reviewMode}
                product={this.props.apiOptions.satStyling ? "sat" : "library"}
                primaryProductColor={primaryProductColor}
            />
        );
    },

    // NOTE(mdr): This method expects to be auto-bound. If this component is
    //     converted to an ES6 class, take care to auto-bind this method!
    _toggleCrossOut: function() {
        const willBeCrossedOut = !this.props.crossedOut;

        if (willBeCrossedOut) {
            // If we're crossing out a checked option, let's also uncheck it.
            this._sendChange({checked: false, crossedOut: true});
        } else {
            this._sendChange({crossedOut: false});
        }
    },

    // Call `this.props.onChange` with the given values. Any keys that are not
    // specified will be filled in with the current value. (For example, if
    // `checked` is specified but `crossedOut` is not, then `crossedOut` will
    // be filled in with `this.props.crossedOut`.)
    //
    // This enables us to use shorthand inside this component, while
    // maintaining a consistent API for the parent.
    _sendChange: function(newValues) {
        const checked = newValues.checked != null
            ? newValues.checked
            : this.props.checked;

        const crossedOut = newValues.crossedOut != null
            ? newValues.crossedOut
            : this.props.crossedOut;

        this.props.onChange({checked, crossedOut});
    },

    render: function() {
        const styles = Choice.styles;
        const sat = this.props.apiOptions.satStyling;
        const isMobile = this.props.apiOptions.isMobile;

        const {radioStyleVersion} = this.props.apiOptions.styling;
        const finalStyles =
            typeof radioStyleVersion === "undefined"
                ? false
                : radioStyleVersion === "final";

        const className = classNames(
            this.props.className,
            "checkbox-label",
            css(
                styles.label,
                isMobile && sharedStyles.disableTextSelection,
                !sat && styles.responsiveLabel,
                sat && styles.satLabel
            )
        );

        // There's two different input components we could use (the builtin
        // input component, or the ToggleableRadioButton component). These are
        // the props that we will pass to either.
        const commonInputProps = {
            type: this.props.type,
            name: this.props.groupName,
            id: `${this.props.groupName}-choice-${this.props.pos}`,
            checked: this.props.checked,
            disabled: this.props.disabled,
            onFocus: this.onInputFocus,
            onBlur: this.onInputBlur,
            className: css(
                // intermediate styles are not different for radio and
                // checkbox, and have a separate active state.
                !finalStyles && sharedStyles.perseusInteractive,
                !finalStyles && styles.input,
                !finalStyles && sharedStyles.responsiveInput,
                !finalStyles && !sat && sharedStyles.responsiveRadioInput,
                !finalStyles &&
                    !sat &&
                    this.state.isInputActive &&
                    sharedStyles.responsiveRadioInputActive,
                finalStyles && sharedStyles.perseusSrOnly,
                sat && sharedStyles.perseusSrOnly,
                sat && this.props.reviewMode && styles.satReviewInput
            ),
        };

        let input = null;
        if (this.props.type === "radio") {
            // This is a special radio button that allows a user to deselect
            // it by merely clicking/selecting it again.
            input = (
                <ToggleableRadioButton
                    onChecked={willBeChecked => {
                        this._sendChange({checked: willBeChecked});
                    }}
                    inputRef={this.inputRef}
                    {...commonInputProps}
                />
            );
        } else {
            input = (
                <input
                    onChange={event => {
                        this._sendChange({checked: event.target.checked});
                    }}
                    ref={this.inputRef}
                    {...commonInputProps}
                />
            );
        }

        const {reviewMode, correct, checked, isLastChoice} = this.props;
        // HACK: while most of the styling for rendering SAT items is handled
        // via aphrodite, we also need to assign normal CSS classnames here to
        // special-case the coloring of MathJax formulas (see .MathJax .math in
        // stylesheets/task-package/tasks.less)
        const satCorrectChoice = sat && reviewMode && correct;
        const satIncorrectChecked = sat && reviewMode && !correct && checked;
        const descriptionClassName = classNames(
            "description",
            satCorrectChoice && "sat-correct",
            satIncorrectChecked && "sat-incorrect",
            css(
                !sat && styles.description,
                sat &&
                    this.state.isInputFocused &&
                    styles.satDescriptionInputFocused,
                sat &&
                    this.state.isInputActive &&
                    styles.satDescriptionInputActive,
                sat && styles.satDescription,
                satCorrectChoice && styles.satDescriptionCorrect,
                satCorrectChoice &&
                    checked &&
                    styles.satDescriptionCorrectChecked,
                satIncorrectChecked && styles.satDescriptionIncorrectChecked,
                sat && isLastChoice && styles.satDescriptionLastChoice
            )
        );

        const checkboxContentClassName = classNames(
            "checkbox",
            css(
                sharedStyles.perseusInteractive,
                !sat && styles.choiceIconWrapper,
                sat && styles.satCheckboxOptionContent
            )
        );

        const checkboxAndOptionClassName = classNames(
            "checkbox-and-option",
            css(!sat && styles.intermediateResponsiveCheckbox,
                !sat && reviewMode &&
                styles.intermediateResponsiveCheckboxReview)
        );

        const rationaleClassName = classNames(
            "perseus-radio-rationale-content",
            css(
                styles.rationale,
                !sat && styles.nonSatRationale,
                sat && styles.satReviewRationale
            )
        );

        // In edit mode, we must allow selection of the contentEditable
        // element inside, therefore we cannot use a label, which makes
        // selection of anything inside automatically select the input
        // element instead
        const LabelOrDiv = this.props.editMode ? "div" : "label";

        const showCrossOut =
            !this.props.showCorrectness && !sat &&
            // HACK(mdr): This should go behind a real flag; this is just a
            //     quick hack so I can ship this code for review (and maybe
            //     land before the Nov 2017 TSM) before overcommitting to arch.
            //     https://app.asana.com/0/329800276300868/467694510751339
            document.location.href.indexOf("PERSEUS-HACK-SHOW-CROSS-OUT") >= 0;

        // We want to show the choices as dimmed out when the choices are
        // disabled. However, we don't want to do this in the SAT product and
        // we also don't want to do this when we're in review mode in the
        // content library.
        const showDimmed =
            (!sat && !reviewMode && this.props.apiOptions.readOnly) ||
            // HACK(mdr): This is a temporary way of showing the crossedOut
            //     state. Eventually, we'll have custom visuals for this state,
            //     at which point we'll remove this condition.
            //     https://app.asana.com/0/329800276300868/467694510751336
            (showCrossOut && this.props.crossedOut);

        return (
            <LabelOrDiv
                htmlFor={!this.props.editMode && commonInputProps.id}
                className={className}
                style={{opacity: showDimmed ? 0.5 : 1.0}}
            >
                <div
                    className={descriptionClassName}
                    onMouseDown={this.onInputMouseDown}
                    onMouseUp={this.onInputMouseUp}
                    onMouseOut={this.onInputMouseOut}
                    onTouchStart={this.onInputMouseDown}
                    onTouchEnd={this.onInputMouseUp}
                >
                    <div className={checkboxAndOptionClassName}>
                        <span className={checkboxContentClassName}>
                            {input}
                            {this.renderChoiceIcon()}
                        </span>
                        {/* A pseudo-label. <label> is slightly broken on iOS,
                        so this works around that. Unfortunately, it is
                        simplest to just work around that everywhere. */}
                        <span
                            className={classNames(
                                ClassNames.RADIO.OPTION_CONTENT,
                                ClassNames.INTERACTIVE,
                                css(
                                    sat && styles.satRadioOptionContent,
                                    sat &&
                                        reviewMode &&
                                        styles.satReviewRadioOptionContent
                                )
                            )}
                            style={{cursor: "default"}}
                        >
                            <div className={css(styles.optionStatusContainer)}>
                                {this.renderOptionStatus()}
                            </div>
                            <div>
                                {this.props.content}
                            </div>
                        </span>
                    </div>
                    {this.props.showRationale &&
                        <div className={rationaleClassName}>
                            {this.props.rationale}
                        </div>}
                </div>
                {showCrossOut && <a
                    href="javascript:void 0"
                    onClick={this._toggleCrossOut}
                    className={css(styles.crossOutLink)}
                >
                    {this.props.crossedOut
                        ? i18n.i18nDoNotTranslate("Uncross out")
                        : i18n.i18nDoNotTranslate("Cross out")}
                </a>}
            </LabelOrDiv>
        );
    },
});

module.exports = Choice;
