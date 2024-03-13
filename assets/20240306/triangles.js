/**
 * Copyright 2024 Ryan Deak
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/**
 * Draw a set of triangles to be animated when clicked.
 * 
 * @param {string} containerDiv - The id of the div that will contain the svg element.
 * @param {number} gridDelta - The distance between grid lines
 * @param {number} numGrids - The number of grid locations (num squares in grid)
 * @param {number} radius - The radius of the corners of the rectangles in triangles
 * @param {number} duration - The duration of the animations in milliseconds
 */
function triangles(
    containerDiv,
    gridDelta = 20,
    numGrids = 13,
    radius = 6,
    duration = 500,
) {
    const UP = "up";
    const DOWN = "down";
    const LEFT = "left";
    const RIGHT = "right";

    const STATE_TRANS_DIRS = [
        [RIGHT, UP, UP, LEFT, LEFT, DOWN, DOWN, RIGHT],
        [LEFT, LEFT, DOWN, DOWN, RIGHT, RIGHT, UP, UP],
        [RIGHT, UP, UP, LEFT, LEFT, DOWN, DOWN, RIGHT],
        [DOWN, DOWN, RIGHT, RIGHT, UP, UP, LEFT, LEFT]
    ];

    const STATE_TRANS_INDS = [
        [0, 2, 4, 6],
        [1, 3, 5, 7],
        [1, 3, 5, 7],
        [0, 2, 4, 6]
    ];

    const STATE_TRANS_IND_DIRS = [
        [UP, LEFT, DOWN, RIGHT],
        [DOWN, RIGHT, UP, LEFT],
        [RIGHT, UP, LEFT, DOWN],
        [LEFT, DOWN, RIGHT, UP]
    ];

    const CENTER_COLOR = "#008B0299";

    const TRI_COLORS = [
        "#4CAF5099",  // green
        "#00968899",  // teale
        "#2196F399",  // blue
        "#673AB799",  // purple
        "#B8000099",  // red
        "#FF690099",  // orange
        "#FFEB3B99",  // yellow
        "#CDDC3999"   // yellow green
    ];

    /**
     * GLOBAL State Variables
     * 
     * The state of the animation is determined by the value of STATE_NUM.
     * transitions should go from 0 -> 1 -> 2 -> 3 -> 0 -> ...
     * 
     *   state 0: SSE is directly below center
     *   state 1: 8-way symmetry, transition from state 0
     *   state 2: SSE is directly below center
     *   state 3: 8-way symmetry, transition from state 1
     */
    var STATE_NUM = 0;

    function zip(a, b) {
        return a.map((k, i) => [k, b[i]]);
    }

    /**
     * Create a snap canvas
     * @param {string} containerDiv - The id of the div that will contain the svg
     * @param {string} svgId - The id of the svg
     * @param {string} svgClass - The class
     * @returns {object} - The snap canvas
     */
    function snapCanvas(containerDiv, svgId, svgClass) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (svgId) {
            svg.id = svgId;
        }
        if (svgClass) {
            svg.className = svgClass;
        }

        document.getElementById(containerDiv).appendChild(svg);
        return Snap(svg);
    }

    function createGraphPaper(snap, gridSize, delta, offset) {
        delta = delta || 50;
        offset = offset || 0;
        const upperBound = offset + gridSize * delta;
        const lines = [];
        
        for (var i = 0; i <= gridSize; i ++) {
            const x = i * delta + offset;
            lines.push(snap.line(x, 0, x, upperBound));
            lines.push(snap.line(0, x, upperBound, x));
        }

        var group = snap.group();
        for (const line of lines) {
            group.add(line);
        }

        return group;
    }

    function rect(snap, gridDelta, gridOffset, xi, yi, length, direction, radius) {
        // radius = radius || 0;
        direction = direction || RIGHT;
        switch (direction) {
            case LEFT:
                return snap.rect(
                    (xi - length + 1) * gridDelta + gridOffset,
                    yi * gridDelta + gridOffset,
                    length * gridDelta,
                    gridDelta,
                    radius
                );
            case RIGHT:
                return snap.rect(
                    xi * gridDelta + gridOffset,
                    yi * gridDelta + gridOffset,
                    length * gridDelta,
                    gridDelta,
                    radius
                );
            case UP:
                return snap.rect(
                    xi * gridDelta + gridOffset,
                    (yi - length + 1) * gridDelta + gridOffset,
                    gridDelta,
                    length * gridDelta,
                    radius
                );
            case DOWN:
                return snap.rect(
                    xi * gridDelta + gridOffset,
                    yi * gridDelta + gridOffset,
                    gridDelta,
                    length * gridDelta,
                    radius
                );
            default:
                throw new Error(`Invalid direction: ${direction}`);
        }
    }

    // ==================================================
    // Triangle drawing functions
    // ==================================================

    function tri_ene(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const ene = snap.group();
        for (var i = 1; i <= n; i++) {
            ene.add(rect(snap, gridDelta, gridOffset, cc+i, cr, i, UP, radius));
        }
        return ene;
    }

    function tri_nne(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const nne = snap.group();
        for (var i = 1; i <= n; i++) {
            nne.add(rect(snap, gridDelta, gridOffset, cc+1, cr-i, i, RIGHT, radius));
        }
        return nne;
    }

    function tri_nnw(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const nnw = snap.group();
        for (var i = 1; i <= n; i++) {
            nnw.add(rect(snap, gridDelta, gridOffset, cc, cr-i, i, LEFT, radius));
        }
        return nnw;
    }

    function tri_wnw(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const wnw = snap.group();
        for (var i = 1; i <= n; i++) {
            wnw.add(rect(snap, gridDelta, gridOffset, cc-i, cr-1, i, UP, radius));
        }
        return wnw;
    }

    function tri_wsw(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const wsw = snap.group();
        for (var i = 1; i <= n; i++) {
            wsw.add(rect(snap, gridDelta, gridOffset, cc-i, cr, i, DOWN, radius));
        }
        return wsw;
    }

    function tri_ssw(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const ssw = snap.group();
        for (var i = 1; i <= n; i++) {
            ssw.add(rect(snap, gridDelta, gridOffset, cc-1, cr+i, i, LEFT, radius));
        }
        return ssw;
    }

    function tri_sse(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const sse = snap.group();
        for (var i = 1; i <= n; i++) {
            sse.add(rect(snap, gridDelta, gridOffset, cc, cr+i, i, RIGHT, radius));
        }
        return sse;
    }

    function tri_ese(snap, cr, cc, n, gridDelta, gridOffset, radius) {
        const ese = snap.group();
        for (var i = 1; i <= n; i++) {
            ese.add(rect(snap, gridDelta, gridOffset, cc+i, cr+1, i, DOWN, radius));
        }
        return ese;
    }

    function locProp(direction) {
        if (direction === LEFT || direction === RIGHT) {
            return "x";
        } else if (direction === UP || direction === DOWN) {
            return "y";
        } else {
            throw new Error(`Invalid direction: ${direction}`);
        }
    }

    function deltaSign(direction) {
        if (direction === LEFT || direction === UP) {
            return -1;
        } else if (direction === RIGHT || direction === DOWN) {
            return 1;
        } else {
            throw new Error(`Invalid direction: ${direction}`);
        }
    }

    function animateGroup(group, gridDelta, direction, duration, distance) {
        distance = distance || 1;
        const prop = locProp(direction);
        const delta = deltaSign(direction) * gridDelta * distance;
        for (const el of group.children()) {
            const attrs = {};
            attrs[prop] = parseInt(el.attr(prop)) + delta;
            el.animate(attrs, duration);
        }
    }

    function animateAll(tris, gridDelta, duration) {
        const stateNum = undefined !== STATE_NUM ? STATE_NUM : 0;
        duration = duration || 500;

        zip(tris, STATE_TRANS_DIRS[stateNum]).forEach(([tri, dir]) => {
            animateGroup(tri, gridDelta, dir, duration);
        });

        zip(
            STATE_TRANS_INDS[stateNum], STATE_TRANS_IND_DIRS[stateNum]
        ).forEach(([i, dir]) => {
            animateGroup(tris[i], gridDelta, dir, duration);
        });

        STATE_NUM = (stateNum + 1) % 4;
    }

    function main() {
        const gridOffset = 0;
        const cr = cc = Math.floor(numGrids / 2);  // center row, column
        const triHeight = cr - 2;

        const gridAttrs = {
            stroke: "#6666aa33",
            strokeWidth: 3
        };

        const rectAttrs = {
            stroke: "#000",
            strokeWidth: 2,
        }

        var snap = snapCanvas(containerDiv, "svg");

        // Draw graph paper.
        var graphPaper = createGraphPaper(snap, numGrids, gridDelta, gridOffset);
        graphPaper.attr(gridAttrs);

        // Draw center square.
        const center_sq = rect(snap, gridDelta, gridOffset, cc, cr, 1, RIGHT, radius);
        center_sq.attr(Object.assign({}, rectAttrs, {fill: CENTER_COLOR}));

        // Draw 8 triangles.
        const tris = zip([
            // Triangles listed from 0 - 2pi radians.
            tri_ene, tri_nne, tri_nnw, tri_wnw, tri_wsw, tri_ssw, tri_sse, tri_ese
        ], TRI_COLORS).map(([fn, color]) => {
            // Draw
            const t = fn(
                snap, cr, cc, triHeight, gridDelta, gridOffset, radius
            )

            // Fill in props differently for each triangle.
            return t.attr(Object.assign({}, rectAttrs, {fill: color}));
        });

        // Clicking animates triangle movement.
        document.getElementById("svg").onclick = () => {
            animateAll(tris, gridDelta, duration);
        }
    }

    // ==================================================
    // Main entry point: Draw on ready.
    // ==================================================
    document.addEventListener("DOMContentLoaded", function(event) {
        main();
    });
}
