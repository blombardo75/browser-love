export const inputs = [
    ['aVertexPosition', false, 'vec2'],
    ['aColor', false, 'vec3']
];

export var Interface = {};

const canvas = document.getElementById("luaCanvas");
const gl = canvas.getContext("webgl");

var nextColorR = 1;
var nextColorG = 1;
var nextColorB = 1;
Interface.setColor = function(r, g, b) {
    nextColorR = r;
    nextColorG = g;
    nextColorB = b;
}

var positionQueue = [];
var colorQueue = [];
Interface.point = function(x, y) {
    positionQueue.push(2*x/canvas.width-1);
    positionQueue.push(1-2*y/canvas.height);
    colorQueue.push(nextColorR);
    colorQueue.push(nextColorG);
    colorQueue.push(nextColorB);
}

Interface.fillBg = function(r, g, b) {
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

Interface.sendPoints = function() {
    Interface.setProgram();
    Interface.updateAttribute('aVertexPosition', positionQueue, gl.DYNAMIC_DRAW);
    Interface.updateAttribute('aColor', colorQueue, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, positionQueue.length/2);
    positionQueue = [];
    colorQueue = [];
}