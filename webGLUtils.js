function createProgram(gl, shaders) {
    const program = gl.createProgram();
    shaders.forEach(shader => gl.attachShader(program, shader))
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(program)}`);
        return null;
    }

    return program
}

function createShader(gl, sourceText, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, sourceText);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var message = `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`;
        gl.deleteShader(shader);
        throw new Error(message);
    }
    return shader;
}

function makeStandardProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
    return createProgram(gl, [vertexShader, fragmentShader]);
}

function createVectorBuffer(gl, n, location) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, n, gl.FLOAT, false, 0, 0);
    return buffer;
}

function makeLocations(gl, program, inputs) {
    var locations = {}
    inputs.forEach(([name, isUniform, dataType]) => {
        locations[name] = isUniform ? gl.getUniformLocation(program, name) : gl.getAttribLocation(program, name)
    });
    return locations
}

function makeBuffers(gl, inputs, locations) {
    var buffers = {};
    inputs.forEach(([name, isUniform, dataType]) => {
        if (!isUniform) {
            switch(dataType) {
                case 'vec2':
                    var n = 2;
                    break;
                case 'vec3':
                    var n = 3;
                    break;
                case 'vec4':
                    var n = 4;
                    break;
                default:
                    throw new NotSupportedError()
            }
            buffers[name] = createVectorBuffer(gl, n, locations[name])
        }
    });
    return buffers;
}