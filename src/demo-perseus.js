/**
 * Loads the Perseus demo pages
 *
 * This file initializes the Khan globals and mounts Demo pages
 * to demonstrate and develop the Perseus application
 */

require("./perseus-env.js");
require("../data.js");


window.Khan = {
    Util: KhanUtil,
    error: function() {},
    query: {debug: ""},
    imageBase: "/images/",
};



const Perseus = (window.Perseus = require("./editor-perseus.js"));
const ReactDOM = (window.ReactDOM = React.__internalReactDOM);

const EditorDemo = require("./editor-demo.jsx");
const RendererDemo = require("./renderer-demo.jsx");
const ArticleDemo = require("./article-demo.jsx");
const MultirendererDemo = require("./multirenderer-demo.jsx");
const ItemDiffDemo = require("./item-diff-demo.jsx");
const ArticleDiffDemo = require("./article-diff-demo.jsx");
const SampleAppDemo = require("./sampleapp.jsx");
const SampleEditor= require("./sampleeditor.jsx");
const Hyperlinks= require("./hyperlinks.jsx");




const query = Perseus.Util.parseQueryString(window.location.hash.substring(1));
var question = query.content && JSON.parse(query.content);
const problemNum = Math.floor(Math.random() * 100);

// React router v20XX
const path = window.location.search.substring(1);
const a  = Math.floor(Math.random() * (3 - 0 + 1)) + 0;  



data0=data[a];
if(!question)
{
var question=data0;
//var question=JSON.parse(data0.question);
}

const routes = {
    // The value is spread across a React.createElement call
    hyperlinks:[Hyperlinks],
    sampleeditor:[SampleEditor,{question,problemNum}],
    sampleapp:[SampleAppDemo,{data0}],
    renderer: [RendererDemo, {question, problemNum}],
    article: [ArticleDemo, {content: question}],
    multirenderer: [MultirendererDemo, {item: question}],
    "item-diff": [ItemDiffDemo, {}],
    "article-diff": [ArticleDiffDemo, {}],
    "": [EditorDemo, {question, problemNum}],
};

Perseus.init({skipMathJax: false, loadExtraWidgets: true})
    .then(function() {
        ReactDOM.render(
            React.createElement(...(routes[path] || routes[""])),
            document.getElementById("perseus-container")
        );
    })
    .then(
        function() {},
        function(err) {
            console.error(err); // @Nolint
        }
    );
