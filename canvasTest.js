lua_love.lua_draw = function() {
    //ctx.fillStyle = "green";
    //ctx.fillRect(10, 10, 150, 100);
    drawCount++;
    print(`${Math.round(updateCount/totalTime)} updates/sec, ${(drawCount/totalTime).toFixed(3)} draws/sec`)
}

lua_love.lua_update = function(dt) {
    totalTime+=dt;
    updateCount++;
}

lua_love.lua_init = function() {
    totalTime = 0;
    updateCount = 0;
    drawCount = 0;
}

lua_love.lua_mousepressed = function(x, y) {}