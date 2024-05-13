# browser-love
(WIP) Love2d converted to JavaScript to be run in browser, designed to be faster than Emscripten.

Does not support C API.

Inspired by the [LoveWebBuilder](https://schellingb.github.io/LoveWebBuilder/).

Project includes...
- Tokenizer for Lua 5.1
- Parser from Lua 5.1 tokens to an Abstract Syntax Tree (AST)
- Translator from AST to JavaScript
- Love2d interface in browser