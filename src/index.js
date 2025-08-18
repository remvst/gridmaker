'use strict';

const Config = require('./config');

const COLORS = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'purple'];
const KEY_SEPARATOR = ',';

const MOUSE = {
    row: 0,
    col: 0,
    down: false,
    erasing: false,
};

let CURRENT_VALUE = 0;

window.addEventListener('DOMContentLoaded', () =>{
    const canvas = document.createElement('canvas');
    canvas.width = Config.CANVAS_WIDTH;
    canvas.height = Config.CANVAS_HEIGHT;
    canvas.addEventListener('mousedown', mousedown, false);
    canvas.addEventListener('mousemove', mousemove, false);
    canvas.addEventListener('mouseup', mouseup, false);
    canvas.addEventListener('contextmenu', contextmenu, false);
    document.querySelector('#canvas-container').appendChild(canvas);

    for (let i = 1 ; i < COLORS.length ; i++) {
        const colorDiv = document.createElement('div');
        colorDiv.style.backgroundColor = COLORS[i];
        colorDiv.dataset.value = i;
        colorDiv.addEventListener('click', () => setCurrentValue(i), false);
        document.querySelector('#color-picker').appendChild(colorDiv);
    }

    setCurrentValue(1);

    const textArea = document.querySelector('#export-textarea');

    const ctx = canvas.getContext('2d');

    let startRow = 0;
    let startCol = 0;

    const rows = Config.CANVAS_HEIGHT / Config.CELL_SIZE;
    const cols = Config.CANVAS_WIDTH / Config.CELL_SIZE;

    const valuesMap = {};

    textArea.addEventListener('change', () => {
        startRow = 0;
        startCol = 0;

        Object.keys(valuesMap).forEach(key => {
            delete valuesMap[key];
        });

        const value = JSON.parse(textArea.value);
        value.forEach((array, row) => {
            array.forEach((value, col) => {
                setValue(row, col, value);
            });
        });

        render();
    }, false);

    window.addEventListener('keyup', event => {
        if (event.keyCode === 37) startCol--;
        else if (event.keyCode === 38) startRow--;
        else if (event.keyCode === 39) startCol++;
        else if (event.keyCode === 40) startRow++;
        else return;

        render();
    }, false);

    render();

    function setCurrentValue(value) {
        CURRENT_VALUE = value;

        for (const swatch of document.querySelectorAll('#color-picker div')) {
            if (CURRENT_VALUE === parseInt(swatch.dataset.value)) {
                swatch.classList.add('selected');
            } else {
                swatch.classList.remove('selected');
            }
        }
    }

    function render() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderCells();
        renderGrid();

        document.querySelector('#export-textarea').value = JSON.stringify(toJSON());
    }

    function renderGrid() {
        ctx.save();
        ctx.fillStyle = '#888';
        for (let i = 0 ; i < Math.max(rows, cols) ; i++) {
            ctx.fillRect(0, i * Config.CELL_SIZE - 1, Config.CANVAS_WIDTH, 1);
            ctx.fillRect(i * Config.CELL_SIZE - 1, 0, 1, Config.CANVAS_WIDTH);
        }
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            MOUSE.col * Config.CELL_SIZE,
            MOUSE.row * Config.CELL_SIZE,
            Config.CELL_SIZE,
            Config.CELL_SIZE,
        );
        ctx.restore();
    }

    function renderCells() {
        for (let row = 0 ; row < rows ; row++) {
            for (let col = 0 ; col < cols ; col++) {
                ctx.fillStyle = COLORS[getValue(row + startRow, col + startCol)];
                ctx.fillRect(
                    col * Config.CELL_SIZE,
                    row * Config.CELL_SIZE,
                    Config.CELL_SIZE,
                    Config.CELL_SIZE
                )
            }
        }
    }

    function contextmenu(e) {
        e.preventDefault();
    }

    function mousedown(e) {
        MOUSE.down = true;
        MOUSE.erasing = e.which === 3;
        mousemove(e);
    }

    function mouseup() {
        MOUSE.down = null;
    }

    function mousemove(event) {
        const rect = canvas.getBoundingClientRect();

        const x = canvas.width * ((event.pageX - rect.left) / rect.width);
        const y = canvas.height * ((event.pageY - rect.top) / rect.height);

        MOUSE.row = Math.floor(y / Config.CELL_SIZE) + startRow;
        MOUSE.col = Math.floor(x / Config.CELL_SIZE) + startCol;

        if (MOUSE.down) {
            setValue(MOUSE.row, MOUSE.col, MOUSE.erasing ? 0 : CURRENT_VALUE);
        }

        render();
    }

    function getValue(row, col) {
        return valuesMap[key(row, col)] || 0;
    }

    function setValue(row, col, value) {
        if (!value) {
            delete valuesMap[key(row, col)];
        } else {
            valuesMap[key(row, col)] = value;
        }
    }

    function key(row, col) {
        return `${row}${KEY_SEPARATOR}${col}`;
    }

    function parseKey(key) {
        const split = key.split(KEY_SEPARATOR);
        return {
            'row': split[0],
            'col': split[1],
        };
    }

    function findBound(array, property, reducer, initialValue) {
        return array.map(cell => cell[property]).reduce((acc, value) => {
            return reducer(acc, value);
        }, initialValue);
    }

    function toJSON() {
        const cells = Object.keys(valuesMap).map(parseKey);
        if (!cells.length) {
            return [[]];
        }

        const minRow = findBound(cells, 'row', Math.min, Number.MAX_SAFE_INTEGER);
        const minCol = findBound(cells, 'col', Math.min, Number.MAX_SAFE_INTEGER);

        const maxRow = findBound(cells, 'row', Math.max, Number.MIN_SAFE_INTEGER);
        const maxCol = findBound(cells, 'col', Math.max, Number.MIN_SAFE_INTEGER);

        const res = [];
        for (let row = minRow ; row <= maxRow ; row++) {
            const rowArray = [];
            res.push(rowArray);

            for (let col = minCol ; col <= maxCol ; col++) {
                rowArray.push(getValue(row, col))
            }
        }

        return res;
    }
});
