const React = require("react");

const EditorJsonify = require("../mixins/editor-jsonify.jsx");
const Changeable = require("../mixins/changeable.jsx");
const NumberInput = require("../components/number-input.jsx");
const TextInput = require("../components/text-input.jsx");

const MoleculeWidgetEditor = React.createClass({
    propTypes: {
        ...Changeable.propTypes,
        rotationAngle: React.PropTypes.number,
        smiles: React.PropTypes.string,
    },

    change(...args) {
        return Changeable.change.apply(this, args);
    },

    updateMolecule: function(newValue) {
        this.change({smiles: newValue});
    },

    updateRotation: function(newValue) {
        this.change({rotationAngle: newValue});
    },

    serialize() {
        return EditorJsonify.serialize.call(this);
    },

    render: function() {
        return (
            <div>
                <div>
                    {/* TODO(colin): instead of nbsp hacks, use styles to get
                    the spacing right. */}
                    <label>
                        SMILES:&nbsp;
                        <TextInput
                            onChange={this.updateMolecule}
                            value={this.props.smiles}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Rotation (deg):&nbsp;
                        <NumberInput
                            onChange={this.updateRotation}
                            value={this.props.rotationAngle}
                        />
                    </label>
                </div>
            </div>
        );
    },
});

module.exports = MoleculeWidgetEditor;
