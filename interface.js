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

window.onload = (event) => {
    clearConsole();
	fullTest();
};