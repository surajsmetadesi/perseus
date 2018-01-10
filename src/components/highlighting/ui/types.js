// @flow

// Import the DOM-related types from the parent directory, and re-export them
// to the UI code.
import type {DOMHighlight, DOMHighlightSet, DOMRange} from "../types.js";
export type {DOMHighlight, DOMHighlightSet, DOMRange};

export type Position = {
    left: number,
    top: number,
};

export type Rect = Position & {
    width: number,
    height: number,
};

export type ZIndexes = {
    aboveContent: number,
    belowContent: number,
};
