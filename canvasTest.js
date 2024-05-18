function draw() {
    //ctx.fillStyle = "green";
    //ctx.fillRect(10, 10, 150, 100);
    drawCount++;
    print(`${Math.round(updateCount/totalTime)} updates/sec, ${(drawCount/totalTime).toFixed(3)} draws/sec`)
}

function update(dt) {
    totalTime+=dt;
    updateCount++;
}

function init() {
    ctx = document.getElementById("luaCanvas").getContext("2d");
    totalTime = 0;
    updateCount = 0;
    drawCount = 0;
}