console.log(loveInterface.window.getWidth(), loveInterface.window.getHeight());

love = {
    window: {
        getWidth: loveInterface.window.getWidth,
        getHeight: loveInterface.window.getHeight
    }
}

love.init = function() {}
love.draw = function() {}
love.update = function(dt) {}
love.mousepressed = function() {}

print = loveInterface.temporary.print;

luaReady = true;