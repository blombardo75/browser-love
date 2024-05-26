function setupLoveInterface() {
    const canvas = document.getElementById("luaCanvas");

    loveInterface = {
        window: {},
        temporary: {}
    }

    loveInterface.window.getHeight = function() {
        return canvas.getBoundingClientRect().height
    }

    loveInterface.window.getWidth = function() {
        return canvas.getBoundingClientRect().width
    }

    loveInterface.temporary.fillBg = function(r, g, b) {
        webGLInterface.fillBg(r, g, b);
    }

    loveInterface.temporary.point = function(x, y) {
        webGLInterface.point(x, y);
    }

    loveInterface.temporary.setColor = function(r, g, b) {
        webGLInterface.setColor(r, g, b);
    }

    loveInterface.temporary.sendPoints = function() {
        webGLInterface.sendPoints();
    }

    loveInterface.temporary.print = print;
}