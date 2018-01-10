// eslint-disable-line max-lines
/**
 * Editor for a multi-item question.
 *
 * TODO(mdr): The UI for managing arrays isn't visually consistent with
 *     HintsEditor. Should we bring them in line with each other?
 */
const {StyleSheet, css} = require("aphrodite");
const React = require("react");
const ReactDOM = require("react-dom");
const lens = require("../hubble/index.js");

const ApiOptions = require("./perseus-api.jsx").Options;
const Editor = require("./editor.jsx");
const {HintEditor} = require("./hint-editor.jsx");
const {iconChevronDown, iconTrash} = require("./icon-paths.js");
const InlineIcon = require("./components/inline-icon.jsx");
const JsonEditor = require("./json-editor.jsx");
const SimpleButton = require("./simple-button.jsx");
const {MultiRenderer} = require("./multi-items.js");
const {
    buildEmptyItemTreeForShape,
    itemToTree,
} = require("./multi-items/items.js");
const {shapePropType} = require("./multi-items/prop-type-builders.js");

const EDITOR_MODES = ["edit", "preview", "json"];

/**
 * Component that displays the mode dropdown.
 *
 * The mode dropdown is the selector at the top of the editor that lets you
 * switch between edit, preview, and dev-only JSON mode.
 */
const ModeDropdown = React.createClass({
    propTypes: {
        currentMode: React.PropTypes.oneOf(EDITOR_MODES),

        // A function that takes in a string signifying the mode (ex: "edit")
        onChange: React.PropTypes.func,
    },

    _handleSelectMode: function(event) {
        if (this.props.onChange) {
            this.props.onChange(event.target.value);
        }
    },

    render: function() {
        return (
            <label>
                Mode:{" "}
                <select
                    value={this.props.currentMode}
                    onChange={this._handleSelectMode}
                >
                    <option value="edit">Edit</option>
                    <option value="preview">Preview</option>
                    <option value="json">Dev-only JSON</option>
                </select>
            </label>
        );
    },
});

/**
 * Convert a camel-cased string to a human-formatted string.
 * "superCoolThings" -> "super cool things"
 */
function camelCaseToHuman(str) {
    // Decapitalize the capital letters, and add a space before each.
    return str.replace(/[A-Z]/g, s => " " + s.toLowerCase());
}

/**
 * Capitalize the first letter of the given string.
 * "super cool things" -> "Super cool things"
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert the given pluralized word to a singularized word.
 * "super cool things" -> "super cool thing"
 */
function pluralToSingular(str) {
    if (str.charAt(str.length - 1) === "s") {
        // Incredibly weak implementation :P
        return str.slice(0, -1);
    } else {
        // Uh oh, dunno how to singularize anything but the simplest case!
        // Let's just return the plural form, and hope the user forgives the
        // grammatical inconsistency.
        return str;
    }
}

/**
 * When iterating through the editors, we don't keep track of the extra
 * `_multi` part at the beginning. This is a helper function which takes a path
 * and prepends that key.
 */
function multiPath(path) {
    return ["_multi", ...path];
}

// Return an h1 if depth=0, h2 if depth=1, etc.
function Header({depth, ...props}) {
    const headerLevel = Math.min(depth, 5) + 1;
    const HeaderTag = `h${headerLevel}`;
    return <HeaderTag {...props} />;
}
Header.propTypes = {
    depth: React.PropTypes.number.isRequired,
};

const nodePropTypes = {
    shape: shapePropType,
    data: React.PropTypes.any.isRequired,
    path: React.PropTypes.arrayOf(
        React.PropTypes.oneOfType([
            React.PropTypes.string.isRequired,
            React.PropTypes.number.isRequired,
        ])
    ).isRequired,
    actions: React.PropTypes.shape({
        addArrayElement: React.PropTypes.func.isRequired,
        mergeValueAtPath: React.PropTypes.func.isRequired,
        setValueAtPath: React.PropTypes.func.isRequired,
        moveArrayElementDown: React.PropTypes.func.isRequired,
        moveArrayElementUp: React.PropTypes.func.isRequired,
        removeArrayElement: React.PropTypes.func.isRequired,
    }).isRequired,
    apiOptions: React.PropTypes.any.isRequired, // TODO(mdr): real proptype?

    // For the left-hand column, we use edit mode and leave renderers empty.
    // For the right-hand column, we use preview mode and provide renderers
    // via a MultiRenderer.
    renderers: React.PropTypes.any,
};

/**
 * Render a node in the editor tree, given the shape of the target
 * node, the data stored in the target node, the path to the target
 * node, and any UI controls that affect how this node relates to its
 * parent (e.g. remove from parent array).
 *
 * This returns a container element with a pretty title and additional
 * UI controls for this node. Its contents are produced by
 * `NodeContent`. The two functions are mutually recursive.
 *
 * Leaf nodes, like items and hints, render an editor pod around their
 * content. Container nodes, like arrays and objects, render a header above
 * their content.
 */
const NodeContainer = props => {
    const {
        shape,
        data,
        path,
        actions,
        name: givenName,
        controls,
        ...otherProps
    } = props;

    const name = givenName || camelCaseToHuman(path[path.length - 1] || "");

    let Container;
    if (shape.type === "array") {
        Container = ArrayContainer;
    } else if (shape.type === "object") {
        Container = ObjectContainer;
    } else {
        Container = LeafContainer;
    }

    return (
        <Container
            key={path.join(".")}
            name={name}
            controls={controls}
            path={path}
            shape={shape}
            actions={actions}
        >
            <NodeContent
                {...otherProps}
                shape={shape}
                data={data}
                path={path}
                actions={actions}
            />
        </Container>
    );
};
NodeContainer.propTypes = {
    ...nodePropTypes,
    controls: React.PropTypes.arrayOf(React.PropTypes.node),
};

const LeafContainer = ({name, controls, children, path, shape}) => {
    const hasPreviewHeading = shape.type === "content" || shape.type === "hint";
    const previewHeading = hasPreviewHeading &&
        <div className={css(styles.containerHeader)}>
            <Header
                depth={path.length}
                className={css(styles.containerTitle)}
            >
                {capitalize(name)}
            </Header>
        </div>;
    return (
        <div className={css(styles.container)}>
            <span
                className={css(styles.row, styles.rowHeading)}
            >
                <div className={css(styles.columnLeft)}>
                    <div className={"pod-title " + css(styles.containerHeader)}>
                        <div className={css(styles.containerTitle)}>
                            {capitalize(name)}
                        </div>
                        {controls}
                    </div>
                </div>
                <div className={css(styles.columnRight)}>
                    {previewHeading}
                </div>
            </span>
            {children}
        </div>
    );
};
LeafContainer.propTypes = {
    name: React.PropTypes.string,
    controls: React.PropTypes.node,
    children: React.PropTypes.node,
    path: React.PropTypes.arrayOf(React.PropTypes.any).isRequired,
    shape: shapePropType,
};

const ArrayContainer = props => {
    const {name, controls, children, path, shape, actions} = props;
    return (
        <div className={css(styles.container)}>
            {controls &&
                <div
                    className={css(
                        styles.columnLeft,
                        styles.containerHeader,
                    )}
                >
                    {controls}
                </div>}
            <div>
                {children}
            </div>
            <div className={css(styles.columnLeft)}>
                <a
                    href="javascript:void 0"
                    onClick={() =>
                        actions.addArrayElement(path, shape.elementShape)}
                >
                    Add a {pluralToSingular(name)}
                </a>
            </div>
        </div>
    );
};
ArrayContainer.propTypes = {
    name: React.PropTypes.string,
    controls: React.PropTypes.node,
    children: React.PropTypes.node,
    path: React.PropTypes.arrayOf(React.PropTypes.any).isRequired,
    shape: shapePropType,
    actions: React.PropTypes.shape({
        addArrayElement: React.PropTypes.func.isRequired,
    }).isRequired,
};

const ObjectContainer = ({name, controls, children, path}) => {
    const headingEditor = <div
        className={css(
            styles.containerHeader,
        )}
    >
        <Header
            depth={path.length}
            className={css(styles.containerTitle)}
        >
            {capitalize(name)}
        </Header>
        {controls}
    </div>;
    const headingPreview = (name || controls) && (
        <div
            className={css(
                styles.containerHeader,
                styles.previewCollectionHeader
            )}
        >
            <Header
                depth={path.length}
                className={css(styles.containerTitle)}
            >
                {capitalize(name)}
            </Header>
        </div>
    );
    const hasBothHeadings = headingEditor && headingPreview;
    return (
        <div className={css(styles.container)}>
            {hasBothHeadings && <span className={css(styles.row)}>
                <div className={css(styles.columnLeft)}>
                    {headingEditor}
                </div>
                <div className={css(styles.columnRight)}>
                    {headingPreview}
                </div>
            </span>}
            <div className={css(path.length > 0 && styles.contentIndent)}>
                {children}
            </div>
        </div>
    );
};
ObjectContainer.propTypes = {
    name: React.PropTypes.string,
    controls: React.PropTypes.node,
    children: React.PropTypes.node,
    path: React.PropTypes.arrayOf(React.PropTypes.any).isRequired,
};

/**
 * Render the content of node in the editor tree, given the shape of
 * the target node, the data stored in the target node, and the path to
 * the target node.
 *
 * If the target node is a leaf, this returns an editor. Otherwise, it
 * iterates over the child nodes, and outputs `NodeContainer` for
 * each of them. The two functions are mutually recursive.
 */
const NodeContent = props => {
    const {shape} = props;

    if (shape.type === "content") {
        return <ItemNodeContent {...props} />;
    } else if (shape.type === "hint") {
        return <HintNodeContent {...props} />;
    } else if (shape.type === "tags") {
        return <TagsNodeContent {...props} />;
    } else if (shape.type === "array") {
        return <ArrayNodeContent {...props} />;
    } else if (shape.type === "object") {
        return <ObjectNodeContent {...props} />;
    }
};
NodeContent.propTypes = nodePropTypes;

/**
 * HOC that adds a "sticky" prop to the wrapped component that is true
 * when the rendered component is taller than the window. Since sticky content
 * can be somewhat distracting, we'd like to avoid it when not useful. This
 * HOC is useful for only making content sticky when useful.
 *
 * It does so by polling the height and comparing it to the window height.
 */
function withStickiness(Component) {
    return class StickyComponent extends React.Component {
        state = {
            sticky: false,
        };

        componentDidMount() {
            this.stickynessTimer = setInterval(this.updateStickiness, 1000);
            this.updateStickiness();
        }

        componentWillUnmount() {
            clearInterval(this.stickynessTimer);
        }

        updateStickiness = () => {
            const domNode = ReactDOM.findDOMNode(this);
            const height = domNode.offsetHeight;
            const windowHeight = window.innerHeight;
            const sticky = height > windowHeight;
            if (sticky !== this.state.sticky) {
                this.setState({
                    sticky,
                });
            }
        }

        render() {
            return <Component
                sticky={this.state.sticky}
                {...this.props}
            />;
        }
    };
}

function getChromeVersion() {
    const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : null;
}

/**
 * HOC that makes a textareas in sticky components temporarily fixed when
 * editing in Blink browsers.
 *
 * This workaround is necessary because Chrome incorrectly calculates how to
 * scroll "position: sticky" containers to ensure the textarea's cursor is
 * visible in by calculating offsets as if they were "position: relative".
 *
 * This will be resolved once Chrome 62 is released.
 *   https://bugs.chromium.org/p/chromium/issues/detail?id=702936
 *
 * TODO(joshuan): Remove this after December 2017.
 */
function withChromeHack(Component) {
    return class ChromeHack extends React.Component {
        props: {
            sticky: boolean,
            actions: any,
        }
        _detached = false;
        _reattachTimer = null;

        render() {
            const chromeVersion = getChromeVersion();
            const requiresHack = chromeVersion && chromeVersion < 62;
            const isSticky = this.props.sticky;

            if (!requiresHack || !isSticky) {
                return <Component {...this.props} />;
            }

            // We indiscriminately make all textareas fixed whenever anything
            // changes.
            const actions = {...this.props.actions};
            actions.mergeValueAtPath = (...args) => {
                this.props.actions.mergeValueAtPath(...args);
                this.detach();
            };

            return <Component
                {...this.props}
                actions={actions}
            />;
        }

        getTextAreas = () => {
            return ReactDOM.findDOMNode(this).querySelectorAll("textarea");
        }

        /**
         * Removes all textareas from the container
         */
        detach = () => {
            this.getTextAreas().forEach(textarea => {
                if (textarea !== document.activeElement) {
                    return;
                }
                if (!this._detached) {
                    const r = textarea.getBoundingClientRect();
                    const style = textarea.style;
                    style.setProperty("position", "fixed", "important");
                    style.setProperty("top", `${r.y}px`, "important");
                    style.setProperty("left", `${r.x}px`, "important");
                    style.setProperty("width", `${r.width}px`, "important");
                    style.setProperty("height", `${r.height}px`, "important");
                    style.setProperty("z-index", "1", "important");
                    style.setProperty("height", `${r.height}px`, "important");

                    if (this._reattachTimer) {
                        clearTimeout(this._reattachTimer);
                    }
                }
            });
            this._detached = true;
            this._reattachTimer = setTimeout(this.reattach, 1000);
        };
        reattach = () => {
            this.getTextAreas().forEach(textarea => {
                const style = textarea.style;

                style.removeProperty("position");
                style.removeProperty("top");
                style.removeProperty("left");
                style.removeProperty("width");
                style.removeProperty("z-index");
                style.removeProperty("height");
            });
            this._detached = false;
        }
    }
}

const ItemNodeContent = withStickiness(withChromeHack(props => {
    const {data, path, actions, apiOptions, renderers, sticky} = props;

    const preview = (
        <div className="framework-perseus">
            {lens(renderers).get(path)}
        </div>
    );

    return (
        <span>
            <div className={css(styles.row)}>
                <div className={css(styles.columnLeft)}>
                    <div className={css(sticky && styles.sticky)}>
                        <Editor
                            {...data}
                            onChange={newVal => actions.mergeValueAtPath(
                                path, newVal)}
                            apiOptions={apiOptions}
                        />
                    </div>
                </div>
                <div className={css(styles.columnRight)}>
                    <div className={css(sticky && styles.sticky)}>
                        {preview}
                    </div>
                </div>
            </div>
        </span>
    );
}));
ItemNodeContent.propTypes = nodePropTypes;

const HintNodeContent = withStickiness(withChromeHack(props => {
    const {data, path, actions, apiOptions, renderers, sticky} = props;

    const preview = (
        <div className="framework-perseus">
            {lens(renderers).get(path)}
        </div>
    );

    return (
        <div className={css(styles.row)}>
            <div className={css(styles.columnLeft)}>
                <div className={css(sticky && styles.sticky)}>
                    <HintEditor
                        {...data}
                        className={css(styles.hintEditor)}
                        onChange={newVal => actions.mergeValueAtPath(
                            path, newVal)}
                        apiOptions={apiOptions}
                        showTitle={false}
                        showRemoveButton={false}
                        showMoveButtons={false}
                    />
                </div>
            </div>
            <div className={css(styles.columnRight)}>
                <div className={css(sticky && styles.sticky)}>
                    {preview}
                </div>
            </div>
        </div>
    );
}));
HintNodeContent.propTypes = nodePropTypes;

const TagsNodeContent = props => {
    const {data, path, actions, apiOptions} = props;
    const {GroupMetadataEditor} = apiOptions;

    return (
        <div className={css(styles.columnLeft)}>
            <div className={css(styles.tagsEditor)}>
                <GroupMetadataEditor
                    value={data}
                    onChange={newVal => actions.setValueAtPath(
                        path, newVal)}
                    showTitle={false}
                />
            </div>
        </div>
    );
};
TagsNodeContent.propTypes = nodePropTypes;

const ArrayNodeContent = props => {
    const {shape, data, path, actions, ...otherProps} = props;

    const collectionName = camelCaseToHuman(path[path.length - 1]);
    const elementName = pluralToSingular(collectionName);

    const elementType = shape.elementShape.type;
    const elementIsLeaf = elementType === "content" || elementType === "hint";

    const children = data.map((subdata, i) => {
        const subpath = path.concat(i);
        const controls = [
            i > 0 &&
                    <div
                        key="moveArrayElementUp"
                        className={css(styles.control)}
                    >
                        <SimpleButton
                            color="orange"
                            title="Move up"
                            onClick={() =>
                                actions.moveArrayElementUp(subpath)}
                        >
                            <div className={css(styles.verticalFlip)}>
                                <InlineIcon {...iconChevronDown} />
                            </div>
                        </SimpleButton>
                    </div>,
            i < data.length - 1 &&
                    <div
                        key="moveArrayElementDown"
                        className={css(styles.control)}
                    >
                        <SimpleButton
                            color="orange"
                            title="Move down"
                            onClick={() =>
                                actions.moveArrayElementDown(subpath)}
                        >
                            <InlineIcon {...iconChevronDown} />
                        </SimpleButton>
                    </div>,
            <div
                key="removeArrayElement"
                className={css(styles.control)}
            >
                <SimpleButton
                    color="orange"
                    title="Delete"
                    onClick={() =>
                        actions.removeArrayElement(subpath)}
                >
                    <InlineIcon {...iconTrash} />
                </SimpleButton>
            </div>,
        ];
        return (
            <div
                key={i}
                className={css(
                    styles.arrayElement,
                    !elementIsLeaf && styles.arrayElementAndNotLeaf
                )}
            >
                <NodeContainer
                    {...otherProps}
                    key={i}
                    shape={shape.elementShape}
                    data={subdata}
                    path={subpath}
                    actions={actions}
                    name={`${elementName} ${i + 1}`}
                    controls={controls}
                />
            </div>
        );
    });

    return (
        <div>
            {children}
        </div>
    );
};
ArrayNodeContent.propTypes = nodePropTypes;

const ObjectNodeContent = props => {
    const {shape, data, path, ...otherProps} = props;

    // Object iteration order should automatically match the order in which the
    // keys were defined in the object literal. So, whatever order semantically
    // made sense to the shape's author is the order in which we'll iterate :)
    const children = Object.keys(shape.shape).map(subkey =>
        <div key={subkey} className={css(styles.objectElement)}>
            <NodeContainer
                {...otherProps}
                shape={shape.shape[subkey]}
                data={data[subkey]}
                path={path.concat(subkey)}
            />
        </div>
    );

    return (
        <div>
            {children}
        </div>
    );
};
ObjectNodeContent.propTypes = nodePropTypes;

const MultiRendererEditor = React.createClass({
    propTypes: {
        Layout: React.PropTypes.func,
        // TODO(emily): use ApiOptions.propTypes
        apiOptions: React.PropTypes.any.isRequired,

        item: React.PropTypes.any.isRequired,
        editorMode: React.PropTypes.oneOf(EDITOR_MODES).isRequired,

        onChange: React.PropTypes.func.isRequired,
    },

    _renderLayout() {
        const {Layout, apiOptions, item} = this.props;

        return (
            <Layout
                ref={e => (this.layout = e)}
                item={item}
                apiOptions={apiOptions}
            />
        );
    },

    _renderJson() {
        return (
            <div>
                <ModeDropdown
                    currentMode={this.props.editorMode}
                    onChange={editorMode => this.props.onChange({editorMode})}
                />
                <JsonEditor
                    multiLine
                    value={this.props.item}
                    onChange={item => this.props.onChange({item})}
                />
            </div>
        );
    },

    _renderPreview() {
        return (
            <div>
                <ModeDropdown
                    currentMode={this.props.editorMode}
                    onChange={editorMode => this.props.onChange({editorMode})}
                />
                {this._renderLayout()}
            </div>
        );
    },

    mergeValueAtPath(path, newValue) {
        this.props.onChange({
            item: lens(this.props.item)
                .merge(multiPath(path), newValue)
                .freeze(),
        });
    },

    setValueAtPath(path, newValue) {
        this.props.onChange({
            item: lens(this.props.item).set(multiPath(path), newValue).freeze(),
        });
    },

    addArrayElement(path, shape) {
        const currentLength = lens(this.props.item).get(multiPath(path)).length;
        const newElementPath = path.concat(currentLength);
        const newValue = buildEmptyItemTreeForShape(shape);
        this.props.onChange({
            item: lens(this.props.item)
                .set(multiPath(newElementPath), newValue)
                .freeze(),
        });
    },

    removeArrayElement(path) {
        this.props.onChange({
            item: lens(this.props.item).del(multiPath(path)).freeze(),
        });
    },

    moveArrayElementDown(path) {
        // Moving an element down can also be expressed as swapping it with the
        // following element.
        const index = path[path.length - 1];
        const nextElementIndex = index + 1;
        const nextElementPath = path.slice(0, -1).concat(nextElementIndex);

        const element = lens(this.props.item).get(multiPath(path));
        const nextElement = lens(this.props.item).get(
            multiPath(nextElementPath)
        );

        this.props.onChange({
            item: lens(this.props.item)
                .set(multiPath(path), nextElement)
                .set(multiPath(nextElementPath), element)
                .freeze(),
        });
    },

    moveArrayElementUp(path) {
        // Moving an element up can also be expressed as moving the previous
        // element down.
        const index = path[path.length - 1];
        const previousElementPath = path.slice(0, -1).concat(index - 1);
        this.moveArrayElementDown(previousElementPath);
    },

    _renderEdit() {
        const apiOptions = {
            ...ApiOptions.defaults,
            ...this.props.apiOptions,
        };

        const item = this.props.item;
        const itemShape = this.props.Layout.shape;

        return (
            <div className="perseus-multirenderer-editor">
                <ModeDropdown
                    currentMode={this.props.editorMode}
                    onChange={editorMode => this.props.onChange({editorMode})}
                />

                <MultiRenderer
                    item={item}
                    shape={itemShape}
                    apiOptions={apiOptions}
                >
                    {({renderers}) =>
                        <NodeContainer
                            mode="edit"
                            shape={itemShape}
                            data={itemToTree(item)}
                            path={[]}
                            actions={this}
                            apiOptions={apiOptions}
                            renderers={renderers}
                        />}
                </MultiRenderer>
            </div>
        );
    },

    score() {
        if (this.layout) {
            return this.layout.score();
        }
    },

    getSerializedState() {
        if (this.layout) {
            return this.layout.getSerializedState();
        }
    },

    restoreSerializedState(state) {
        if (this.layout) {
            this.layout.restoreSerializedState(state);
        }
    },

    _renderContent() {
        switch (this.props.editorMode) {
            case "json":
                return this._renderJson();
            case "preview":
                return this._renderPreview();
            case "edit":
                return this._renderEdit();
            default:
                return (
                    <ModeDropdown
                        currentMode={this.props.editorMode}
                        onChange={editorMode =>
                            this.props.onChange({
                                editorMode,
                            })}
                    />
                );
        }
    },

    render() {
        return (
            <div id="perseus">
                {this._renderContent()}
            </div>
        );
    },
});

const styles = StyleSheet.create({
    editor: {
        width: "100%",
    },

    treePreview: {
        position: "relative",
    },

    verticalFlip: {
        transform: "scaleY(-1)",
    },

    control: {
        marginLeft: 12,
    },

    containerHeader: {
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "row",
    },

    previewCollectionHeader: {
        marginBottom: 16,
    },

    containerTitle: {
        flexGrow: 1,
        margin: 0,
    },

    contentIndent: {
        marginLeft: 8,
    },

    hintEditor: {
        paddingBottom: 0,
    },

    arrayElement: {
        marginBottom: 16,
    },

    // Leaf nodes are already wrapped in cute little pods, so they don't need
    // this extra border between array elements.
    arrayElementAndNotLeaf: {
        borderBottom: "1px solid #ccc",
        ":first-child": {
            borderTop: "1px solid #ccc",
            paddingTop: 16,
        },
    },

    objectElement: {
        marginBottom: 16,
    },

    tagsEditor: {
        border: "1px solid #ddd",
        padding: "5px 10px",
    },

    /**
     * A row contains a fixed width editor and a preview that expands as
     * needed.
     */
    row: {
        display: "flex",
        position: "relative",
    },

    /**
     * The editor.
     */
    columnLeft: {
        width: 360,
        marginRight: 30,
        // so that the `position: absolute` of line markers are positioned
        // relative to this.
        position: "relative",
    },

    /**
     * The preview.
     */
    columnRight: {
        flex: 1,
        marginLeft: 30,
        position: "relative",
    },

    /**
     * Sticks to just under the heading.
     */
    sticky: {
        position: "sticky",
        top: 33,  // height of the cute pod for the editor
    },

    /**
     * Used for sticky headings.
     */
    rowHeading: {
        position: "sticky",
        backgroundColor: "white",
        width: "100%",
        // TODO(joshuan): Make this less arbitrary. It should be higher than
        // perseus content.
        zIndex: 101,
        top: -1,
    },
});

module.exports = MultiRendererEditor;
