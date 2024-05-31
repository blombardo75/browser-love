async function setupWebGL() {
    webGLInterface = {};
    
    const canvas = document.getElementById("luaCanvas");
    const gl = canvas.getContext("webgl");

    if (gl === null) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    const names = ['colorPoints', 'uniformPoints'];

    var shaderStorage = {programs: {}, interfaces: {}, curProgram: null};
    shaderStorage.setProgram = function(name) {
        if (this.curProgram !== name) {
            gl.useProgram(this.programs[name]);
            this.interfaces[name].remakeBuffers();
            this.curProgram = name;
        }
    }
    
    for (var i=0; i<names.length; i++) {
        const name = names[i];
        const [shaderProgram, shaderInterface] = await makeShader(gl, shaderStorage, name);
        shaderStorage.programs[name] = shaderProgram;
        shaderStorage.interfaces[name] = shaderInterface;
    }

    webGLInterface.colorAttribute = function() {
        webGLInterface.setColor = shaderStorage.interfaces['colorPoints'].setColor;
        webGLInterface.point = shaderStorage.interfaces['colorPoints'].point;
        webGLInterface.fillBg = shaderStorage.interfaces['colorPoints'].fillBg;
        webGLInterface.sendPoints = shaderStorage.interfaces['colorPoints'].sendPoints;
    }
    webGLInterface.colorUniform = function() {
        webGLInterface.setColor = shaderStorage.interfaces['uniformPoints'].setColor;
        webGLInterface.point = shaderStorage.interfaces['uniformPoints'].point;
        webGLInterface.fillBg = shaderStorage.interfaces['uniformPoints'].fillBg;
        webGLInterface.sendPoints = shaderStorage.interfaces['uniformPoints'].sendPoints;
    }
    webGLInterface.curUsing = false;
    webGLInterface.colorAttribute();

    webGLInterface.switch = function() {
        if (this.curUsing) {
            webGLInterface.colorAttribute();
        } else {
            webGLInterface.colorUniform();
        }
        this.curUsing = !this.curUsing
    }
}