function clearConsole() {
    document.getElementById('luaConsole').innerHTML = '';
}

function print(...asd) {
	const displayLines = 25;
	const charsPerLine = 103;
    printedData = asd.map(a => `${a}`).join(' ');
	prevLines = document.getElementById('luaConsole').innerHTML!=='' ? document.getElementById('luaConsole').innerHTML.split('\n') : [];
	lines = prevLines;
	while (printedData.length>charsPerLine) {
		i = printedData.slice(0, charsPerLine).includes('\n') ? printedData.indexOf('\n') : charsPerLine;
		lines.push(printedData.slice(0, i));
		printedData = printedData.slice(i+1);
	}
    lines = lines.concat(printedData.split('\n'));
    document.getElementById('luaConsole').innerHTML = lines.slice(-displayLines).join('\n');
}

function setupCanvas(mousepressed) {
    let canvas = document.getElementById("luaCanvas");
    canvas.onmousedown = e => {
        let rect = canvas.getBoundingClientRect();
        mousepressed(e.clientX - rect.left, e.clientY - rect.top);
    };
    canvas.onselectstart = e => false;
}

projectStarted = false;
function startProject(init, draw, update, mousepressed, onError, updateLimit) {
    if (projectStarted) return;
    projectStarted = true;
    var lastRun = performance.now();
    var hitError = false;
    var hasUpdated = true;

    function updateWithDt() {
        var time = performance.now();
        update((time-lastRun)/1000);
        lastRun = time;
        hasUpdated = true;
    }

    function updateLoopCapped(waitTime) {
        if (!hitError) {
            try {
                updateWithDt()
            } catch (error) {
                hitError = true;
                onError(error);
            }
            setTimeout(updateLoopCapped, lastRun+waitTime-performance.now(), waitTime)
        }
    }

    function updateLoop() {
        if (!hitError) {
            let start = performance.now();
            try {
                while (performance.now()-start<0.4) {
                    updateWithDt()
                }
            } catch (error) {
                hitError = true;
                onError(error);
            }
            setTimeout(updateLoop, 0)
        }
    }

    function drawLoop() {
        if (!hitError) {
            if (hasUpdated) {
                hasUpdated = false;
                try {
                    draw()
                } catch (error) {
                    hitError = true;
                    onError(error);
                }
            }
            requestAnimationFrame(drawLoop);
        }
    }

    setupWebGL();
    setupCanvas(mousepressed);
    setupLoveInterface();
    try {
        init()
    } catch (error) {
        hitError = true;
        onError(error);
    }
    if (updateLimit) {
        updateLoopCapped(1000/updateLimit)
    } else {
        for (let i=0; i<10; i++) {
            updateLoop();
        }
    }
    requestAnimationFrame(drawLoop)
}

window.onload = (event) => {
    clearConsole();
	startProject(init, draw, update, mousepressed, (error) => {throw error});
};