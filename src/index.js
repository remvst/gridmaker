'use strict';

const Config = require('./config');

const COLORS = ['black', 'white', 'blue', 'red', 'green'];
const KEY_SEPARATOR = ',';

window.addEventListener('DOMContentLoaded', () =>{
    const canvas = document.createElement('canvas');
    canvas.width = Config.CANVAS_WIDTH;
    canvas.height = Config.CANVAS_HEIGHT;
    canvas.addEventListener('click', click, false);
    document.querySelector('#canvas-container').appendChild(canvas);

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
        if (event.keyCode === 38) startRow--;
        if (event.keyCode === 39) startCol++;
        if (event.keyCode === 40) startRow++;

        console.log(event.keyCode);

        render();
    }, false);

    render();

    function render() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderCells();
        renderGrid();

        document.querySelector('#export-textarea').value = JSON.stringify(toJSON());
    }

    function renderGrid() {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        for (let i = 0 ; i < Math.max(rows, cols) ; i++) {
            ctx.fillRect(0, i * Config.CELL_SIZE - 1, Config.CANVAS_WIDTH, 2);
            ctx.fillRect(i * Config.CELL_SIZE - 1, 0, 2, Config.CANVAS_WIDTH);
        }
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

    function click(event) {
        const rect = canvas.getBoundingClientRect();

        const x = canvas.width * ((event.pageX - rect.left) / rect.width);
        const y = canvas.height * ((event.pageY - rect.top) / rect.height);

        const row = Math.floor(y / Config.CELL_SIZE) + startRow;
        const col = Math.floor(x / Config.CELL_SIZE) + startCol;

        setValue(row, col, (getValue(row, col) + 1) % COLORS.length);

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
