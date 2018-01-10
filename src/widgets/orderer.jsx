/* eslint-disable comma-dangle, max-len, no-console, no-unused-vars, no-var, one-var, react/forbid-prop-types, react/jsx-closing-bracket-location, react/jsx-indent-props, react/prop-types, react/sort-comp */
/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("underscore");

var Renderer = require("../renderer.jsx");
var Util = require("../util.js");

var ApiClassNames = require("../perseus-api.jsx").ClassNames;

const {
    linterContextProps,
    linterContextDefault,
} = require("../gorgon/proptypes.js");

var PlaceholderCard = React.createClass({
    propTypes: {
        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number.isRequired,
    },

    render: function() {
        return (
            <div
                className={"card-wrap " + ApiClassNames.INTERACTIVE}
                style={{width: this.props.width}}
            >
                <div
                    className="card placeholder"
                    style={{height: this.props.height}}
                />
            </div>
        );
    },
});

var DragHintCard = React.createClass({
    render: function() {
        return (
            <div className={"card-wrap " + ApiClassNames.INTERACTIVE}>
                <div className="card drag-hint" />
            </div>
        );
    },
});

var PropTypes = {
    position: React.PropTypes.shape({
        left: React.PropTypes.number,
        top: React.PropTypes.number,
    }),
};

var Card = React.createClass({
    propTypes: {
        floating: React.PropTypes.bool.isRequired,
        animating: React.PropTypes.bool,
        width: React.PropTypes.number,
        stack: React.PropTypes.bool,

        onMouseDown: React.PropTypes.func,
        onMouseMove: React.PropTypes.func,
        onMouseUp: React.PropTypes.func,

        // Used only for floating/animating cards
        startMouse: PropTypes.position,
        startOffset: PropTypes.position,
        animateTo: PropTypes.position,
        onAnimationEnd: React.PropTypes.func,
        linterContext: linterContextProps,
    },

    getDefaultProps: function() {
        return {
            stack: false,
            animating: false,
            linterContext: linterContextDefault,
        };
    },

    render: function() {
        var style = {};

        if (this.props.floating) {
            style = {
                position: "absolute",
                left: this.props.startOffset.left,
                top: this.props.startOffset.top,
            };
        }

        if (this.props.width) {
            style.width = this.props.width;
        }

        var className = ["card"];
        if (this.props.stack) {
            className.push("stack");
        }
        if (this.props.floating && !this.props.animating) {
            className.push("dragging");
            style.left += this.props.mouse.left - this.props.startMouse.left;
            style.top += this.props.mouse.top - this.props.startMouse.top;
        }

        // Pull out the content to get rendered
        var rendererProps = _.pick(this.props, "content");

        var onMouseDown = this.props.animating ? $.noop : this.onMouseDown;

        return (
            <div
                className={"card-wrap " + ApiClassNames.INTERACTIVE}
                style={style}
                onMouseDown={onMouseDown}
                onTouchStart={onMouseDown}
                onTouchMove={this.onMouseMove}
                onTouchEnd={this.onMouseUp}
                onTouchCancel={this.onMouseUp}
            >
                <div className={className.join(" ")}>
                    <Renderer
                        {...rendererProps}
                        linterContext={this.props.linterContext}
                    />
                </div>
            </div>
        );
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        // Cards in the bank or drag list don't usually change -- they only
        // reorder themselves -- so we want to skip the update to things a
        // little faster. We also need to re-render if the content changes,
        // which happens only in the editor. (We do want to update the floating
        // card on mouse move to update its position.)
        return (
            this.props.floating ||
            nextProps.floating ||
            this.props.content !== nextProps.content ||
            // TODO(alpert): Remove ref here after fixing facebook/react#1392.
            this.props.fakeRef !== nextProps.fakeRef
        );
    },

    componentDidMount: function() {
        this.mouseMoveUpBound = false;
    },

    componentDidUpdate: function(prevProps, prevState) {
        if (this.props.animating && !prevProps.animating) {
            // If we just were changed into animating, start the animation.
            // We pick the animation speed based on the distance that the card
            // needs to travel. (Why sqrt? Just because it looks nice -- with a
            // linear scale, far things take too long to come back.)
            var ms =
                15 *
                Math.sqrt(
                    Math.sqrt(
                        Math.pow(
                            this.props.animateTo.left -
                                this.props.startOffset.left,
                            2
                        ) +
                            Math.pow(
                                this.props.animateTo.top -
                                    this.props.startOffset.top,
                                2
                            )
                    )
                );
            $(ReactDOM.findDOMNode(this)).animate(
                this.props.animateTo,
                Math.max(ms, 1),
                this.props.onAnimationEnd
            );
        }
    },

    componentWillUnmount: function() {
        // Event handlers should be unbound before component unmounting, but
        // just in case...
        if (this.mouseMoveUpBound) {
            console.warn("Removing an element with bound event handlers.");

            this.unbindMouseMoveUp();
            Util.resetTouchHandlers();
        }
    },

    bindMouseMoveUp: function() {
        this.mouseMoveUpBound = true;
        $(document).on("mousemove", this.onMouseMove);
        $(document).on("mouseup", this.onMouseUp);
    },

    unbindMouseMoveUp: function() {
        this.mouseMoveUpBound = false;
        $(document).off("mousemove", this.onMouseMove);
        $(document).off("mouseup", this.onMouseUp);
    },

    onMouseDown: function(event) {
        event.preventDefault();
        var loc = Util.extractPointerLocation(event);
        if (loc) {
            this.bindMouseMoveUp();
            this.props.onMouseDown && this.props.onMouseDown(loc, this);
        }
    },

    onMouseMove: function(event) {
        event.preventDefault();
        var loc = Util.extractPointerLocation(event);
        if (loc) {
            this.props.onMouseMove && this.props.onMouseMove(loc);
        }
    },

    onMouseUp: function(event) {
        event.preventDefault();
        var loc = Util.extractPointerLocation(event);
        if (loc) {
            this.unbindMouseMoveUp();
            this.props.onMouseUp && this.props.onMouseUp(loc);
        }
    },
});

var NORMAL = "normal",
    AUTO = "auto",
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical";

var Orderer = React.createClass({
    propTypes: {
        correctOptions: React.PropTypes.array,
        current: React.PropTypes.array,
        height: React.PropTypes.oneOf([NORMAL, AUTO]),
        layout: React.PropTypes.oneOf([HORIZONTAL, VERTICAL]),
        options: React.PropTypes.array,
        trackInteraction: React.PropTypes.func.isRequired,
        linterContext: linterContextProps,
    },

    getDefaultProps: function() {
        return {
            current: [],
            options: [],
            correctOptions: [],
            height: NORMAL,
            layout: HORIZONTAL,
            linterContext: linterContextDefault,
        };
    },

    getInitialState: function() {
        return {
            current: [],
            dragging: false,
            placeholderIndex: null,
        };
    },

    componentWillReceiveProps: function(nextProps) {
        if (!_.isEqual(this.props.current, nextProps.current)) {
            this.setState({current: nextProps.current});
        }
    },

    render: function() {
        // This is the card we are currently dragging
        var dragging =
            this.state.dragging &&
            <Card
                ref="dragging"
                floating={true}
                content={this.state.dragContent}
                startOffset={this.state.offsetPos}
                startMouse={this.state.grabPos}
                mouse={this.state.mousePos}
                width={this.state.dragWidth}
                onMouseUp={this.onRelease}
                onMouseMove={this.onMouseMove}
                key={this.state.dragKey || "draggingCard"}
                linterContext={this.props.linterContext}
            />;

        // This is the card that is currently animating
        var animating =
            this.state.animating &&
            <Card
                floating={true}
                animating={true}
                content={this.state.dragContent}
                startOffset={this.state.offsetPos}
                width={this.state.dragWidth}
                animateTo={this.state.animateTo}
                onAnimationEnd={this.state.onAnimationEnd}
                key={this.state.dragKey || "draggingCard"}
                linterContext={this.props.linterContext}
            />;

        // This is the list of draggable, rearrangable cards
        var sortableCards = _.map(
            this.state.current,
            function(opt, i) {
                return (
                    <Card
                        ref={"sortable" + i}
                        fakeRef={"sortable" + i}
                        floating={false}
                        content={opt.content}
                        width={opt.width}
                        key={opt.key}
                        linterContext={this.props.linterContext}
                        onMouseDown={
                            this.state.animating
                                ? $.noop
                                : this.onClick.bind(null, "current", i)
                        }
                    />
                );
            },
            this
        );

        if (this.state.placeholderIndex != null) {
            var placeholder = (
                <PlaceholderCard
                    ref="placeholder"
                    width={this.state.dragWidth}
                    height={this.state.dragHeight}
                    key="placeholder"
                />
            );
            sortableCards.splice(this.state.placeholderIndex, 0, placeholder);
        }

        var anySortableCards = sortableCards.length > 0;
        sortableCards.push(dragging, animating);

        // If there are no cards in the list, then add a "hint" card
        var sortable = (
            <div className="perseus-clearfix draggable-box">
                {!anySortableCards && <DragHintCard />}
                <div ref="dragList">
                    {sortableCards}
                </div>
            </div>
        );

        // This is the bank of stacks of cards
        var bank = (
            <div ref="bank" className="bank perseus-clearfix">
                {_.map(
                    this.props.options,
                    (opt, i) => {
                        return (
                            <Card
                                ref={"bank" + i}
                                floating={false}
                                content={opt.content}
                                stack={true}
                                key={i}
                                linterContext={this.props.linterContext}
                                onMouseDown={
                                    this.state.animating
                                        ? $.noop
                                        : this.onClick.bind(null, "bank", i)
                                }
                                onMouseMove={this.onMouseMove}
                                onMouseUp={this.onRelease}
                            />
                        );
                    },
                    this
                )}
            </div>
        );

        return (
            <div
                className={
                    "draggy-boxy-thing orderer " +
                    "height-" +
                    this.props.height +
                    " " +
                    "layout-" +
                    this.props.layout +
                    " " +
                    "above-scratchpad blank-background " +
                    "perseus-clearfix " +
                    ApiClassNames.INTERACTIVE
                }
                ref="orderer"
            >
                {bank}
                {sortable}
            </div>
        );
    },

    onClick: function(type, index, loc, draggable) {
        var $draggable = $(ReactDOM.findDOMNode(draggable));
        var list = this.state.current.slice();

        var opt;
        var placeholderIndex = null;

        if (type === "current") {
            // If this is coming from the original list, remove the original
            // card from the list
            list.splice(index, 1);
            opt = this.state.current[index];
            placeholderIndex = index;
        } else if (type === "bank") {
            opt = this.props.options[index];
        }

        this.setState({
            current: list,
            dragging: true,
            placeholderIndex: placeholderIndex,
            dragKey: opt.key,
            dragContent: opt.content,
            dragWidth: $draggable.width(),
            dragHeight: $draggable.height(),
            grabPos: loc,
            mousePos: loc,
            offsetPos: $draggable.position(),
        });
    },

    onRelease: function(loc) {
        var draggable = this.refs.dragging;
        if (draggable == null) {
            return;
        }
        var inCardBank = this.isCardInBank(draggable);
        var index = this.state.placeholderIndex;

        // Here, we build a callback function for the card to call when it is
        // done animating
        var onAnimationEnd = () => {
            var list = this.state.current.slice();

            if (!inCardBank) {
                // Insert the new card into the position
                var newCard = {
                    content: this.state.dragContent,
                    key: _.uniqueId("perseus_draggable_card_"),
                    width: this.state.dragWidth,
                };

                list.splice(index, 0, newCard);
            }

            this.props.onChange({
                current: list,
            });
            this.setState({
                current: list,
                dragging: false,
                placeholderIndex: null,
                animating: false,
            });
            this.props.trackInteraction();
        };

        // Find the position of the card we should animate to
        // TODO(alpert): Update mouse position once more before animating?
        var offset = $(ReactDOM.findDOMNode(draggable)).position();
        var finalOffset = null;
        if (inCardBank) {
            // If we're in the card bank, go through the options to find the
            // one with the same content
            _.each(
                this.props.options,
                function(opt, i) {
                    if (opt.content === this.state.dragContent) {
                        var card = ReactDOM.findDOMNode(this.refs["bank" + i]);
                        finalOffset = $(card).position();
                    }
                },
                this
            );
        } else if (this.refs.placeholder != null) {
            // Otherwise, go to the position that the placeholder is at
            finalOffset = $(
                ReactDOM.findDOMNode(this.refs.placeholder)
            ).position();
        }

        if (finalOffset == null) {
            // If we didn't find a card to go to, simply make the changes we
            // would have made at the end. (should only happen if we are
            // messing around with card contents, and not on the real site)
            onAnimationEnd();
        } else {
            this.setState({
                offsetPos: offset,
                animateTo: finalOffset,
                onAnimationEnd: onAnimationEnd,
                animating: true,
                dragging: false,
            });
        }
    },

    onMouseMove: function(loc) {
        var draggable = this.refs.dragging;
        if (draggable == null) {
            return;
        }

        var index;
        if (this.isCardInBank(draggable)) {
            index = null;
        } else {
            index = this.findCorrectIndex(draggable, this.state.current);
        }

        this.setState({
            mousePos: loc,
            placeholderIndex: index,
        });
    },

    findCorrectIndex: function(draggable, list) {
        // Find the correct index for a card given the current cards.
        var isHorizontal = this.props.layout === HORIZONTAL,
            $dragList = $(ReactDOM.findDOMNode(this.refs.dragList)),
            leftEdge = $dragList.offset().left,
            topEdge = $dragList.offset().top,
            midWidth =
                $(ReactDOM.findDOMNode(draggable)).offset().left - leftEdge,
            midHeight =
                $(ReactDOM.findDOMNode(draggable)).offset().top - topEdge,
            index = 0,
            sumWidth = 0,
            sumHeight = 0;

        if (isHorizontal) {
            _.each(
                list,
                function(opt, i) {
                    var card = ReactDOM.findDOMNode(this.refs["sortable" + i]);
                    var outerWidth = $(card).outerWidth(true);
                    if (midWidth > sumWidth + outerWidth / 2) {
                        index += 1;
                    }
                    sumWidth += outerWidth;
                },
                this
            );
        } else {
            _.each(
                list,
                function(opt, i) {
                    var card = ReactDOM.findDOMNode(this.refs["sortable" + i]);
                    var outerHeight = $(card).outerHeight(true);
                    if (midHeight > sumHeight + outerHeight / 2) {
                        index += 1;
                    }
                    sumHeight += outerHeight;
                },
                this
            );
        }

        return index;
    },

    isCardInBank: function(draggable) {
        if (draggable == null) {
            return false;
        }

        var isHorizontal = this.props.layout === HORIZONTAL,
            $draggable = $(ReactDOM.findDOMNode(draggable)),
            $bank = $(ReactDOM.findDOMNode(this.refs.bank)),
            draggableOffset = $draggable.offset(),
            bankOffset = $bank.offset(),
            draggableHeight = $draggable.outerHeight(true),
            bankHeight = $bank.outerHeight(true),
            bankWidth = $bank.outerWidth(true),
            dragList = ReactDOM.findDOMNode(this.refs.dragList),
            dragListWidth = $(dragList).width(),
            draggableWidth = $draggable.outerWidth(true);

        if (isHorizontal) {
            return (
                draggableOffset.top + draggableHeight / 2 <
                bankOffset.top + bankHeight
            );
        } else {
            return (
                draggableOffset.left + draggableWidth / 2 <
                bankOffset.left + bankWidth
            );
        }
    },

    getUserInput: function() {
        return {
            current: _.map(this.props.current, function(v) {
                return v.content;
            }),
        };
    },

    simpleValidate: function(rubric) {
        return Orderer.validate(this.getUserInput(), rubric);
    },
});

_.extend(Orderer, {
    validate: function(state, rubric) {
        if (state.current.length === 0) {
            return {
                type: "invalid",
                message: null,
            };
        }

        var correct = _.isEqual(
            state.current,
            _.pluck(rubric.correctOptions, "content")
        );

        return {
            type: "points",
            earned: correct ? 1 : 0,
            total: 1,
            message: null,
        };
    },
});

module.exports = {
    name: "orderer",
    displayName: "Orderer",
    widget: Orderer,
    isLintable: true,
};
