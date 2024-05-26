console.log(loveInterface.window.getWidth(), loveInterface.window.getHeight());

love = {
    window: {
        getWidth: loveInterface.window.getWidth,
        getHeight: loveInterface.window.getHeight
    }
}

print = loveInterface.temporary.print;

luaReady = true;