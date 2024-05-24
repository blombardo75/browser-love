function setupWebGL() {
    webGLInterface = {};
    
    const canvas = document.getElementById("luaCanvas");
    const gl = canvas.getContext("webgl");

    if (gl === null) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    const vsSource = `
        attribute vec2 aVertexPosition;
        attribute vec3 aColor;
        varying vec4 vColor;
        void main() {
            gl_PointSize = 1.0;
            gl_Position = vec4(aVertexPosition, 0, 1);
            vColor = vec4(aColor, 1);
        }
    `;
    
    const fsSource = `
        precision mediump float;
        varying vec4 vColor;
        void main() {
            gl_FragColor = vColor;
        }
    `;

    const inputs = [
        ['aVertexPosition', false, 'vec2'],
        ['aColor', false, 'vec3']
        //['screenSize', true, 'vec2']
    ]

    const shaderProgram = makeStandardProgram(gl, vsSource, fsSource);
    gl.useProgram(shaderProgram);

    const locations = makeLocations(gl, shaderProgram, inputs);
    const buffers = makeBuffers(gl, inputs, locations);

    //gl.uniform2f(locations.screenSize, canvas.width, canvas.height);

    var nextColorR = 1;
    var nextColorG = 1;
    var nextColorB = 1;
    webGLInterface.setColor = function(r, g, b) {
        nextColorR = r;
        nextColorG = g;
        nextColorB = b;
    }

    var positionQueue = [];
    var colorQueue = [];
    webGLInterface.point = function(x, y) {
        positionQueue.push(2*x/canvas.width-1);
        positionQueue.push(1-2*y/canvas.height);
        colorQueue.push(nextColorR);
        colorQueue.push(nextColorG);
        colorQueue.push(nextColorB);
    }

    webGLInterface.fillBg = function(r, g, b) {
        gl.clearColor(r, g, b, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    webGLInterface.sendPoints = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionQueue), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aColor);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorQueue), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, positionQueue.length/2);
        positionQueue = [];
        colorQueue = [];
    }
}