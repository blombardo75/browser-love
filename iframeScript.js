backgroundColor = [0, 0, 0]

lua_love = {
    lua_graphics: {
        lua_getWidth: function () {return [loveInterface.graphics.getWidth()]},
        lua_getHeight: function () {return [loveInterface.graphics.getHeight()]},
        lua_setColor: function(r, g, b) {loveInterface.temporary.setColor(r, g, b)},
        lua_points: function(...args) {
            for (let i=0; i<args.length; i+=2) {
                loveInterface.temporary.point(args[i], args[i+1])
            }
        },
        lua_getBackgroundColor: function() {
            return backgroundColor
        },
        lua_setBackgroundColor: function(r, g, b) {
            backgroundColor = [r, g, b]
        }
    }
}

lua_love.lua_init = function() {}
lua_love.lua_draw = function() {}
lua_love.lua_update = function(dt) {}
lua_love.lua_mousepressed = function() {}

lua_print = loveInterface.temporary.print;
print = console.log;

luabuiltin_tableconstructor = function(...args) {
    let newTable = {builtinlen: 0} //TODO args
    for (let i=0; i<args.length; i+=2) {
        luabuiltin_bracketAssignment(newTable, args[i], args[i+1])
    }
    return newTable
}

luabuiltin_bracketAssignment = function(prefix, keyExp, val) {
    prefix[keyExp] = val
    if (keyExp==prefix.builtinlen+1) {
        prefix.builtinlen++;
    }
}

luabuiltin_bracketexp = function(prefix, keyExp) {
    return prefix[keyExp]
}

luabuiltin_binopLess = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a<b
    }
    throw new NotSupportedError()
}

luabuiltin_binopGreater = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a>b
    }
    throw new NotSupportedError()
}

luabuiltin_binopGeq = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a>=b
    }
    throw new NotSupportedError()
}

luabuiltin_binopNeq = function(a, b) {
    return !luabuiltin_binopEquals(a, b)
}

luabuiltin_binopEquals = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a==b
    } else if (typeof a === "object" && typeof b === "object") {
        return a==b
    }
    console.log(a, b)
    throw new NotSupportedError()
}

luabuiltin_binopMinus = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a-b
    }
    throw new NotSupportedError()
}

luabuiltin_binopPlus = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a+b
    }
    throw new NotSupportedError()
}

luabuiltin_binopMultiply = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a*b
    }
    print(a, b)
    throw new NotSupportedError()
}

luabuiltin_binopDivide = function(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a/b
    }
    print(a, b)
    throw new NotSupportedError()
}

luabuiltin_unopMinus = function(a) {
    if (typeof a === "number") {
        return -a
    }
    throw new NotSupportedError()
}

luabuiltin_unopLen = function(a) {
    if (typeof a === "object") {
        return a.builtinlen
    }
    throw new NotSupportedError()
}

luabuiltin_binopAnd = function(a, b) {
    if (typeof a === "boolean" && typeof b === "boolean") {
        return a&&b
    }
    console.log(a, b)
    throw new NotSupportedError()
}

luabuiltin_dotAssignment = function(prefix, keyStr, val) {
    prefix[keyStr] = val
}

luabuiltin_dotexp = function(prefix, keyStr) {
    return prefix[keyStr]
}

lua_tonumber = function(a) {
    if (typeof a === "number") return a;
    throw new NotSupportedError()
}

lua_table = {
    lua_insert: function(arr, newItem) {
        arr[arr.builtinlen+1] = newItem;
        arr.builtinlen++;
    },
    lua_remove: function(arr, index) {
        for (let i=index; i<arr.builtinlen; i++) {
            arr[i] = arr[i+1];
        }
        arr[arr.builtinlen] = undefined;
        arr.builtinlen--;
    }
}

lua_math = {
    lua_random: function() {
        return [Math.random()]
    },
    lua_pi: Math.PI,
    lua_cos: function(x) {return [Math.cos(x)]},
    lua_sin: function(x) {return [Math.sin(x)]},
    lua_sqrt: function(x) {return [Math.sqrt(x)]},
    lua_acos: function(x) {return [Math.acos(x)]}
}

luabuiltin_tobool = function (a) {
    if(typeof a==="object") {
        return true
    } else if (typeof a === "undefined") {
        return false
    }
    throw new NotSupportedError()
}

luaspecial_equalsnil = function (a) {
    if(typeof a==="number") return false;
    if(typeof a==="undefined") return true;
    console.log(a)
    throw new NotSupportedError()
}

lua_ipairs = function(a) {
    let iter = function(b, i) {
        i++;
        let v = b[i];
        if (luabuiltin_tobool(v)) {
            return [i, v]
        }
        return [undefined]
    }
    return [iter, a, 0]
}

drawWrapper = function(realDraw) {
    return () => {
        loveInterface.temporary.fillBg(...backgroundColor)
        realDraw()
        loveInterface.temporary.sendPoints()
    }
}

luaReady = true;