function getLineEnding(rawText) {
    var firstNewline = rawText.indexOf('\n');
    return (firstNewline>0 && rawText[firstNewline-1] === '\r') ? 'CRLF' : 'LF'
}

async function readFile(filename) {
	a = await fetch(filename).then(res => res.text());
	if (getLineEnding(a)=='CRLF') a = a.replaceAll('\r\n', '\n');
	return a;
}

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
                    throw new NotSupportedError(dataType)
            }
            buffers[name] = createVectorBuffer(gl, n, locations[name])
        }
    });
    return buffers;
}

async function makeShader(gl, shaderStorage, shaderName) {
    const vsSource = await readFile(`shaders/${shaderName}/vertex.glsl`);
    const fsSource = await readFile(`shaders/${shaderName}/fragment.glsl`);
    const module = await import(`/shaders/${shaderName}/interface.js`);
    const inputs = module.inputs;
    const shaderInterface = module.Interface;

    const shaderProgram = makeStandardProgram(gl, vsSource, fsSource);

    const locations = makeLocations(gl, shaderProgram, inputs);

    shaderInterface.setProgram = function() {
        shaderStorage.setProgram(shaderName);
    }
    shaderInterface.remakeBuffers = function() {
        this.buffers = makeBuffers(gl, inputs, locations);
    }
    shaderInterface.locations = locations;

    shaderInterface.updateAttribute = function(name, newData, usage) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newData), usage);
    }

    shaderInterface.updateUniform = function(name, ...values) {
        n = values.length;
        gl[`uniform${n}f`](this.locations[name], ...values);
    }

    return [shaderProgram, shaderInterface];
}