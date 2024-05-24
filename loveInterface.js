function setupLoveInterface() {
    love = {
        window: {}
    }

    tempLove = {}

    let canvas = document.getElementById("luaCanvas");

    love.window.getHeight = function() {
        return canvas.getBoundingClientRect().height
    }

    love.window.getWidth = function() {
        return canvas.getBoundingClientRect().width
    }

    tempLove.fillBg = function(r, g, b) {
        webGLInterface.fillBg(r, g, b);
    }

    tempLove.point = function(x, y) {
        webGLInterface.point(x, y);
    }

    tempLove.setColor = function(r, g, b) {
        webGLInterface.setColor(r, g, b);
    }

    tempLove.sendPoints = function() {
        webGLInterface.sendPoints();
    }
}