export const inputs = [
    ['aVertexPosition', false, 'vec2'],
    ['uColor', true, 'vec3']
];

export var Interface = {};

const canvas = document.getElementById("luaCanvas");
const gl = canvas.getContext("webgl");

Interface.setColor = function(r, g, b) {
    Interface.setProgram();
    Interface.updateUniform('uColor', r, g, b);
}

var positionQueue = [];
Interface.point = function(x, y) {
    positionQueue.push(2*x/canvas.width-1);
    positionQueue.push(1-2*y/canvas.height);
}

Interface.fillBg = function(r, g, b) {
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

Interface.sendPoints = function() {
    Interface.setProgram();
    Interface.updateAttribute('aVertexPosition', positionQueue, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, positionQueue.length/2);
    positionQueue = [];
}