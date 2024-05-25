class Token {
    constructor(raw, type) {
        this.raw = raw;
        this.type = type;
        switch(type) {
            case "string":
                this.simple = "String";
                break;
            case "number":
                this.simple = "Number";
                break
            case "name":
                this.simple = "Name";
                break;
            case "keyword":
                this.simple = this.raw;
                break;
            case "special":
                this.simple = this.raw;
                break;
            default:
                throw new NotSupportedError(`Bad token type: ${type}`)
        }
        this.simple = '|' + this.simple + '|';
    }

    toString() {
        return this.simple
    }
}

function tokenize(rawText) {
    let alphaNum = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890_";
    let keywords = "and break do else elseif end false for function if in local nil not or repeat return then true until while".split(' ');
    let specials = "+ - * / % ^ # = == ~= < > <= >= ( ) { } [ ] ; : , . .. ...".split(' ');
    //string of letters, digits, and underscores is a token
    //name or keyword
    //special tokens, including semicolon
    //literal strings
    //long strings
    //number (javascript recognizes all formats)
    //comment
    //long comment
    var tokens = [];
    while (rawText.length) {
        var chars = 1;
        var type = "skip";
        if (" \t\n".includes(rawText[0])) {
            //whitespace
        } else if (rawText.startsWith('--')) {
            if (/^--\[=*\[/.test(rawText)) {
                //long comment
                throw new NotSupportedError('Long Comment')
            } else {
                //normal comment
                chars = rawText.includes('\n') ? rawText.indexOf('\n') : rawText.length;
            }
        } else if (rawText[0]=="'" || rawText[0]=='"') {
            type="string";
            let endRegex = rawText[0]=="'" ? /(^')|([^\\](\\\\)*')/ : /(^")|([^\\](\\\\)*")/;
            let m = endRegex.exec(rawText.slice(1));
            chars = m.index + m[0].length + 1;
        } else if (/^\[=*\[/.test(rawText)) {
            throw new NotSupportedError('Long String')
        } else if ("0123456789".includes(rawText[0])) {
            type="number";
            while (rawText.length>chars && (alphaNum+".").includes(rawText[chars])) {
                chars++;
            }
        } else if (alphaNum.includes(rawText[0])) {
            type="name";
            while (rawText.length>chars && alphaNum.includes(rawText[chars])) {
                chars++;
            }
            if (keywords.includes(rawText.slice(0, chars))) {
                type = "keyword"
            }
        } else if (specials.some(s => rawText.startsWith(s))) {
            let matches = specials.filter(s => rawText.startsWith(s));
            chars = matches[matches.length-1].length;
            type="special";
        } else {
            throw new NotSupportedError(`Unknown Token: ${rawText.slice(25)}`)
        }
        if (type!="skip") tokens.push(new Token(rawText.slice(0, chars), type));
        rawText = rawText.slice(chars);
    }
    console.log(`${tokens.length} tokens`)
    return tokens;
}