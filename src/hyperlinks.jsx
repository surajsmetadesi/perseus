/**
  * Provides a simple styled button
  *
  */

const React = require("react");
const { StyleSheet, css } = require("aphrodite");
const SimpleButton = require("./simple-button.jsx");

const Hyperlinks = React.createClass({

    move: function(a,e) {
        data0=data[a];
        var question=data0;
        const link = document.createElement("a");
        link.href =
            window.location.pathname +
            '?sampleeditor#content='+JSON.stringify(question);
        link.target = "_blank";
        link.click();
        e.preventDefault();
    },

    render: function () {

        return (
            <div><SimpleButton color={"orange"} onClick={this.move.bind(this,'1')}> 1</SimpleButton>
              <SimpleButton color={"orange"} onClick={this.move.bind(this,'2')}> 2</SimpleButton>
              <SimpleButton color={"orange"} onClick={this.move.bind(this,'3')}> 3</SimpleButton>
            </div>

        );
    }
});



module.exports = Hyperlinks;
