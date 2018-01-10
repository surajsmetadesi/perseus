/* globals __EDITOR__ */

// As new widgets get added here, please also make sure they get added in
// webapp perseus/traversal.py so they can be properly translated.
module.exports = [
    [
        require("./widgets/categorizer.jsx"),
        __EDITOR__ && require("./widgets/categorizer-editor.jsx"),
    ],
    [
        require("./widgets/cs-program.jsx"),
        __EDITOR__ && require("./widgets/cs-program-editor.jsx"),
    ],
    [
        require("./widgets/dropdown.jsx"),
        __EDITOR__ && require("./widgets/dropdown-editor.jsx"),
    ],
    [
        require("./widgets/explanation.jsx"),
        __EDITOR__ && require("./widgets/explanation-editor.jsx"),
    ],
    [
        require("./widgets/definition.jsx"),
        __EDITOR__ && require("./widgets/definition-editor.jsx"),
    ],
    [
        require("./widgets/grapher.jsx"),
        __EDITOR__ && require("./widgets/grapher-editor.jsx"),
    ],
    [
        require("./widgets/graded-group.jsx"),
        __EDITOR__ && require("./widgets/graded-group-editor.jsx"),
    ],
    [
        require("./widgets/graded-group-set.jsx"),
        __EDITOR__ && require("./widgets/graded-group-set-editor.jsx"),
    ],
    [
        require("./widgets/group.jsx"),
        __EDITOR__ && require("./widgets/group-editor.jsx"),
    ],
    [
        require("./widgets/iframe.jsx"),
        __EDITOR__ && require("./widgets/iframe-editor.jsx"),
    ],
    [
        require("./widgets/image.jsx"),
        __EDITOR__ && require("./widgets/image-editor.jsx"),
    ],
    [
        require("./widgets/interaction.jsx"),
        __EDITOR__ && require("./widgets/interaction-editor.jsx"),
    ],
    [
        require("./widgets/interactive-graph.jsx"),
        __EDITOR__ && require("./widgets/interactive-graph-editor.jsx"),
    ],
    [
        require("./widgets/lights-puzzle.jsx"),
        __EDITOR__ && require("./widgets/lights-puzzle-editor.jsx"),
    ],
    [
        require("./widgets/matrix.jsx"),
        __EDITOR__ && require("./widgets/matrix-editor.jsx"),
    ],
    [
        require("./widgets/matcher.jsx"),
        __EDITOR__ && require("./widgets/matcher-editor.jsx"),
    ],
    [
        require("./widgets/measurer.jsx"),
        __EDITOR__ && require("./widgets/measurer-editor.jsx"),
    ],
    [
        require("./widgets/molecule.jsx"),
        __EDITOR__ && require("./widgets/molecule-editor.jsx"),
    ],
    [
        require("./widgets/number-line.jsx"),
        __EDITOR__ && require("./widgets/number-line-editor.jsx"),
    ],
    [
        require("./widgets/orderer.jsx"),
        __EDITOR__ && require("./widgets/orderer-editor.jsx"),
    ],
    [
        require("./widgets/passage.jsx"),
        __EDITOR__ && require("./widgets/passage-editor.jsx"),
    ],
    [
        require("./widgets/passage-ref.jsx"),
        __EDITOR__ && require("./widgets/passage-ref-editor.jsx"),
    ],
    [
        require("./widgets/passage-ref-target.jsx"),
        __EDITOR__ && require("./widgets/passage-ref-target-editor.jsx"),
    ],
    [
        require("./widgets/plotter.jsx"),
        __EDITOR__ && require("./widgets/plotter-editor.jsx"),
    ],
    [
        require("./widgets/reaction-diagram.jsx"),
        __EDITOR__ && require("./widgets/reaction-diagram-editor.jsx"),
    ],
    [
        require("./widgets/sequence.jsx"),
        __EDITOR__ && require("./widgets/sequence-editor.jsx"),
    ],
    [
        require("./widgets/simulator.jsx"),
        __EDITOR__ && require("./widgets/simulator-editor.jsx"),
    ],
    [
        require("./widgets/sorter.jsx"),
        __EDITOR__ && require("./widgets/sorter-editor.jsx"),
    ],
    [
        require("./widgets/table.jsx"),
        __EDITOR__ && require("./widgets/table-editor.jsx"),
    ],
    [
        require("./widgets/transformer.jsx"),
        __EDITOR__ && require("./widgets/transformer-editor.jsx"),
    ],
    [
        require("./widgets/unit.jsx"),
        __EDITOR__ && require("./widgets/unit-editor.jsx"),
    ],
    [
        require("./widgets/video.jsx"),
        __EDITOR__ && require("./widgets/video-editor.jsx"),
    ],
    // These widgets are only used when testing things, so remove them in the
    // non-editor bundle.
    __EDITOR__ && [
        require("./widgets/example-graphie-widget.jsx"),
        require("./widgets/example-graphie-widget-editor.jsx"),
    ],
    __EDITOR__ && [
        require("./widgets/example-widget.jsx"),
        require("./widgets/example-widget-editor.jsx"),
    ],
    __EDITOR__ && [
        require("./widgets/simple-markdown-tester.jsx"),
        require("./widgets/simple-markdown-tester-editor.jsx"),
    ],
];
