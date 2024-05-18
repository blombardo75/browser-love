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

function startProject(init, draw, update, onError) {
    var lastRun = performance.now();
    var hitError = false;

    function updateWithDt() {
        var time = performance.now();
        update((time-lastRun)/1000);
        lastRun = time;
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
            try {
                draw()
            } catch (error) {
                hitError = true;
                onError(error);
            }
            requestAnimationFrame(drawLoop);
        }
    }

    init()
    for (let i=0; i<10; i++) {
        updateLoop();
    }
    requestAnimationFrame(drawLoop)
}

window.onload = (event) => {
    clearConsole();
	fullTest();
};