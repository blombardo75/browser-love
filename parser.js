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

class Segment {
    constructor(type, subsegments) {
        this.type = type;
        this.subsegments = subsegments;
    }

    toString() {
        return '[' + this.type + ']'
    }
}

function findClosingParentheses(s, startIndex) {
    var count = 1;
    var curIndex = startIndex;
    while (count!=0) {
        curIndex++;
        if (s[curIndex]=="(") {
            count++;
        } else if (s[curIndex]==")") {
            count--;
        }
    }
    return curIndex;
}

function findClosingBracket(s, startIndex) {
    var count = 1;
    var curIndex = startIndex;
    while (count!=0) {
        curIndex++;
        if (s[curIndex]=="[") {
            count++;
        } else if (s[curIndex]=="]") {
            count--;
        }
    }
    return curIndex;
}

function moveToNextToken(s, curIndex) {
    return s.indexOf('|', curIndex+1)+1;
}

function moveToPrevToken(s, curIndex) {
    return s.lastIndexOf('|', curIndex-2);
}

function findEnd(s, startIndex) {
    //startIndex is the start of the generating token, like "funcparams". whatever it is, start the count at 1 on the start of the next token
    //you can assume there is no "function" or "funcparams" after this point
    //increment for every do, if, decrement for every end
    var curIndex = moveToNextToken(s, startIndex);
    while (s.slice(curIndex, curIndex+5)!="|end|") {
        if (s.slice(curIndex, curIndex+4)=="|do|" || s.slice(curIndex, curIndex+4)=="|if|") {
            curIndex = findEnd(s, curIndex)
        }
        curIndex = moveToNextToken(s, curIndex);
    }
    return curIndex
}

function substitute(simple, goal) {
    //find a single thing to substitute
    //example: exp binop exp --> exp at a specific index in the string, label what kind of sub as well
    //return "|exp||binop||exp|", 12, "exp", "BinaryOperator"

    //bracketexp ::= '[' exp ']'
    //exp ::= function funcbody (what the manual called "function")
    //funcparams ::= '(' [parlist] ')'

    //all the ways to use the keyword end
    //do block end
    //if ... end
    //function ... end

    //console.log(simple, goal)
    if(simple=='|'+goal+"|") {
        console.log(simple);
        throw new NotSupportedError('Nothing to substitute')
    } else if (simple=="") {
        throw new NotSupportedError('Cannot substitute empty string')
    } else if (simple.split('|').length%2==0) {
        console.log(simple)
        throw new NotSupportedError('Bad simple')
    }

    var guaranteedReplacements = [
        ['|{||}|', 'tableconstructor', 'TableConstructor'],
        ['|{||fieldlist||}|', 'tableconstructor', 'TableConstructor'],
        ['|[||exp||]|', 'bracketexp', 'BracketExp'],
        ['|+|', 'binop', 'BinOpSymbol'],
        ['|*|', 'binop', 'BinOpSymbol'],
        ['|/|', 'binop', 'BinOpSymbol'],
        ['|^|', 'binop', 'BinOpSymbol'],
        ['|%|', 'binop', 'BinOpSymbol'],
        ['|..|', 'binop', 'BinOpSymbol'],
        ['|<|', 'binop', 'BinOpSymbol'],
        ['|<=|', 'binop', 'BinOpSymbol'],
        ['|>|', 'binop', 'BinOpSymbol'],
        ['|>=|', 'binop', 'BinOpSymbol'],
        ['|==|', 'binop', 'BinOpSymbol'],
        ['|~=|', 'binop', 'BinOpSymbol'],
        ['|and|', 'binop', 'BinOpSymbol'],
        ['|or|', 'binop', 'BinOpSymbol'],
        ['|not|', 'unop', 'UnOpSymbol'],
        ['|#|', 'unop', 'UnOpSymbol'],
        ['|nil|', 'exp', 'PrimitiveExpression'],
        ['|false|', 'exp', 'PrimitiveExpression'],
        ['|true|', 'exp', 'PrimitiveExpression'],
        ['|Number|', 'exp', 'PrimitiveExpression'],
        ['|function||funcbody|', 'exp', 'FunctionExpression'],
        ['|(||parlist||)|', 'funcparams', 'FuncParams'],
        ['|funcparams||block||end|', 'funcbody', 'FunctionBody'],
        ['|local||function||Name||funcbody|', 'stat', 'LocalFunctionStatement'],
        ['|function||funcname||funcbody|', 'stat', 'NonLocalFunctionStatement'],
        ['|for||namelist||in||explist||do||block||end|', 'stat', 'ForGenericStatement'],
        ['|for||Name||=||exp||,||exp||do||block||end|', 'stat', 'ForNumericNoStepStatement'],
        ['|for||Name||=||exp||,||exp||,||exp||do||block||end|', 'stat', 'ForNumericStepStatement'],
        ['|while||exp||do||block||end|', 'stat', 'WhileStatement'],
        ['|local||namelist||=||explist|', 'stat', 'LocalAssignmentStatement'],
        ['|(||explist||)|', 'args', 'ExplistArgs'],
        ['|prefixexp||args|', 'functioncall', 'NoColonFunctionCall'],
        ['|prefixexp||:||Name||args|', 'functioncall', 'ColonFunctionCall'],
        ['|break|', 'stat', 'BreakStatement'],
        ['|varlist||=||explist|', 'stat', 'AssignmentStatement']
    ]
    var foundReplace = guaranteedReplacements.find(g => simple.includes(g[0]));
    if (foundReplace) {
        let [replaceStr,newStr,subType] = foundReplace;
        return [replaceStr, simple.indexOf(replaceStr), newStr, subType]
    }
    if (simple.includes('{')) {
        let start = simple.lastIndexOf('|{|');
        let end = simple.indexOf('|}|', start);
        let inner = simple.slice(start+3, end);
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "fieldlist");
        return [rawStr, startIndex+start+3, newStr, subType]
    }
    //no curly brackets here
    if (simple.includes('[')) {
        let start = simple.lastIndexOf('|[|');
        let end = simple.indexOf('|]|', start);
        let inner = simple.slice(start+3, end);
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
        return [rawStr, startIndex+start+3, newStr, subType]
    }
    //no square brackets here
    if (simple.includes('|function|')) {
        let start = simple.lastIndexOf('|function|')
        if (simple[start+11]=='(') {
            //function expression, but the funcbody is not compressed
            let closeParenIndex = findClosingParentheses(simple, start+11);
            if (closeParenIndex==start+14) {
                //there was nothing inside the parens!
                return ['|(||)|', start+10, 'funcparams', 'FuncParams']
            }
            let inner = simple.slice(start+13, closeParenIndex-1);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "parlist");
            return [rawStr, startIndex+start+13, newStr, subType]
        } else if (simple.slice(start).startsWith('|function||funcparams|')) {
            let endI = findEnd(simple, start+10);
            let inner = simple.slice(start+21, endI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
            return [rawStr, startIndex+start+21, newStr, subType]
        } else if (simple.slice(start).includes('|funcbody|')) {
            let funcbodyI = simple.indexOf('|funcbody|', start)
            let inner = simple.slice(start+10, funcbodyI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "funcname");
            return [rawStr, startIndex+start+10, newStr, subType]
        } else if (simple.slice(start).includes('|funcparams|')) {
            let startI = simple.indexOf('|funcparams|', start);
            let endI = findEnd(simple, startI);
            let inner = simple.slice(startI+12, endI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
            return [rawStr, startIndex+startI+12, newStr, subType]
        } else {
            //you have an unpaired parenthesis
            let startParen = simple.indexOf('|(|', start);
            let endParen = findClosingParentheses(simple, startParen+1)-1;
            if (endParen==startParen+3) {
                return ['|(||)|', startParen, 'funcparams', 'FuncParams']
            }
            let inner = simple.slice(startParen+3, endParen);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "parlist");
            return [rawStr, startIndex+startParen+3, newStr, subType]
        }
    }
    //no function keyword --> exp has no stat
    if (goal=="fieldlist") {
        //token is a fieldsep IFF it is a comma or semicolon not contained in brackets
        let fieldlistRegex = /^\|field\|(\|fieldsep\|\|field\|)*(\|fieldsep\|)?$/
        if (fieldlistRegex.test(simple)) {
            return [simple, 0, 'fieldlist', 'FieldList']
        } else {
            //partition everything into fields and fieldseps and return the first one
            let i=0;
            while (i<simple.length) {
                if (simple[i]==',' || simple[i]==';') {
                    return ['|'+simple[i]+'|', i-1, 'fieldsep', 'FieldSep']
                }
                i = simple[i]=='(' ? findClosingParentheses(simple, i) : simple[i]=='[' ? findClosingBracket(simple, i) : (i+1);
            }
            let offset = 0;
            while (simple.startsWith('|field|')) {
                offset += 17;
                simple = simple.slice(17);
            }
            if (simple.includes('|fieldsep|')) {
                simple = simple.slice(0, simple.indexOf('|fieldsep|'))
            }
            let [rawStr, startIndex, newStr, subType] = substitute(simple, "field");
            return [rawStr, offset+startIndex, newStr, subType]
        }
    } else if (goal=="field") {
        if (simple=="|bracketexp||=||exp|") {
            return [simple, 0, goal, 'BracketField']
        }
        if (simple.startsWith('|bracketexp|')) {
            let inner = simple.slice(15);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+15, newStr, subType]
        } else if (simple=="|Name||=||exp|") {
            return [simple, 0, goal, 'NameField']
        } else if (simple.startsWith('|Name||=|')) {
            let inner = simple.slice(9);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+9, newStr, subType]
        } else if (simple=="|exp|") {
            return [simple, 0, "field", 'ExpField']
        } else {
            return substitute(simple, "exp");
        }
    } else if (goal=="parlist") {
        if (simple=="|...|") {
            return [simple, 0, 'parlist', 'OnlyVarargParlist']
        } else if (simple=="|namelist||,||...|") {
            return [simple, 0, 'parlist', 'VarargParlist']
        } else if (simple=="|namelist|") {
            return [simple, 0, 'parlist', 'NoVarargParlist']
        } else if (simple.startsWith('|...|')) {
            let lastComma = simple.lastIndexOf('|,|')
            return [simple.slice(0, lastComma), 0, 'namelist', 'NameList']
        } else {
            return [simple, 0, 'namelist', 'NameList']
        }
    } else if (goal=="funcname") {
        return [simple, 0, goal, 'FuncName']
    } else if (goal=="namelist") {
        return [simple, 0, 'namelist', 'NameList']
    }

    if (simple.includes('|for|')) {
        let start = simple.lastIndexOf('|for|')
        if (simple.slice(start).startsWith('|for||Name||=|')) {
            //for numeric
            let realCommaIndices = [];
            for (let i = start; i<simple.indexOf('|do|', start); i++) {
                if (simple.slice(i, i+3)=='|,|') {
                    realCommaIndices.push(i);
                }
                if (simple.slice(i, i+3)=='|(|') {
                    i = findClosingParentheses(simple, i+1);
                }
            }
            if (!simple.slice(start).startsWith('|for||Name||=||exp||,|')) {
                //do first exp
                let inner = simple.slice(start+14, realCommaIndices[0]);
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
                return [rawStr, startIndex+start+14, newStr, subType]
            }
            if (!simple.slice(start).startsWith('|for||Name||=||exp||,||exp||do|') && !simple.slice(start).startsWith('|for||Name||=||exp||,||exp||,|')) {
                //do second exp
                //count real commas to figure out whether the exp ends on "," or "do"
                let inner = simple.slice(start+22, realCommaIndices.length>1 ? realCommaIndices[1] : simple.indexOf('|do|', start));
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
                return [rawStr, startIndex+start+22, newStr, subType]
            }
            if (simple.slice(start).startsWith('|for||Name||=||exp||,||exp||,|') && !simple.slice(start).startsWith('|for||Name||=||exp||,||exp||,||exp||do|')) {
                //do third exp
                let inner = simple.slice(start+30, simple.indexOf('|do|', start));
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
                return [rawStr, startIndex+start+30, newStr, subType]
            }
            //do block
            let doI = simple.indexOf('|do|', start);
            let endI = findEnd(simple, doI);
            let inner = simple.slice(doI+4, endI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
            return [rawStr, startIndex+doI+4, newStr, subType]
        } else {
            //for generic
            if (!(simple.slice(start, start+19)=='|for||namelist||in|')) {
                //do the namelist
                let inI = simple.indexOf('|in|', start)
                let inner = simple.slice(start+5, inI)
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "namelist");
                return [rawStr, startIndex+start+5, newStr, subType]
            }
            if (!(simple.slice(start, start+32)=='|for||namelist||in||explist||do|')) {
                //do the explist
                let doI = simple.indexOf('|do|', start)
                let inner = simple.slice(start+19, doI)
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "explist");
                return [rawStr, startIndex+start+19, newStr, subType]
            }
            //do the block
            let endI = findEnd(simple, start+28)
            let inner = simple.slice(start+32, endI)
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
            return [rawStr, startIndex+start+32, newStr, subType]
        }
    } else if (simple.includes('|if|')) {
        let start = simple.lastIndexOf('|if|');
        if (!simple.slice(start).startsWith('|if||exp||then|')) {
            //first exp
            let endI = simple.indexOf('|then|', start)
            let inner = simple.slice(start+4, endI)
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+start+4, newStr, subType]
        } else if (!simple.slice(start).startsWith('|if||exp||then||block||elseif|') && !simple.slice(start).startsWith('|if||exp||then||block||else|') && !simple.slice(start).startsWith('|if||exp||then||block||end|')) {
            //first block
            let endI = Math.min(...['elseif', 'else', 'end'].map(s => simple.indexOf('|'+s+'|', start)).filter(i => i!=-1));
            let inner = simple.slice(start+15, endI)
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
            return [rawStr, startIndex+start+15, newStr, subType]
        }
        let origSimple = simple;
        let offset = start+22;
        simple = simple.slice(start+22);
        while (simple.startsWith('|elseif||exp||then||block||elseif|') || simple.startsWith('|elseif||exp||then||block||else|') || simple.startsWith('|elseif||exp||then||block||end|')) {
            offset += 26;
            simple = simple.slice(26);
        }
        if (simple.startsWith('|elseif||exp||then|')) {
            //do elseif block
            let endI = Math.min(...['elseif', 'else', 'end'].map(s => simple.indexOf('|'+s+'|', 19)).filter(i => i!=-1));
            let inner = simple.slice(19, endI)
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
            return [rawStr, startIndex+offset+19, newStr, subType]
        } else if (simple.startsWith('|elseif|')) {
            //elseif exp
            let endI = simple.indexOf('|then|');
            let inner = simple.slice(8, endI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+offset+8, newStr, subType]
        }
        if (simple.startsWith('|else||block||end|')) {
            return [origSimple.slice(start, offset+18), start, 'stat', 'IfStatement']
        } else if (simple.startsWith('|end|')) {
            return [origSimple.slice(start, offset+5), start, 'stat', 'IfStatement']
        }
        //last else block
        let end = findEnd(origSimple, start);
        let elseStart = origSimple.indexOf('|else|', start);
        let inner = origSimple.slice(elseStart+6, end);
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
        return [rawStr, startIndex+elseStart+6, newStr, subType]
    } else if (simple.includes('|while|')) {
        let start = simple.lastIndexOf('|while|');
        if (!simple.slice(start).startsWith('|while||exp||do|')) {
            //exp
            let endI = simple.indexOf('|do|', start)
            let inner = simple.slice(start+7, endI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+start+7, newStr, subType]
        }
        //block
        let endI = simple.indexOf('|end|', start)
        let inner = simple.slice(start+16, endI);
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
        return [rawStr, startIndex+start+16, newStr, subType]
    } else if (simple.includes('|local|')) {
        let start = simple.lastIndexOf('|local|');
        if (!simple.slice(start).startsWith('|local||namelist|')) {
            //namelist
            let endI = simple.indexOf('|=|', start)
            let inner = simple.slice(start+7, endI)
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "namelist");
            return [rawStr, startIndex+start+7, newStr, subType]
        }
    } else if (simple.includes('|do|')) {
        let start = simple.indexOf('|do|');
        if (simple.slice(start).startsWith('|do||block||end|')) {
            return ['|do||block||end|', start, 'stat', 'DoStatement']
        }
        let end = findEnd(simple, start);
        let inner = simple.slice(start+4, end);
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "block");
        return [rawStr, startIndex+start+4, newStr, subType]
    }

    if (simple.includes('|...|')) {
        //at this point it can't be a parlist
        let start = simple.lastIndexOf('|...|');
        return ['|...|', start, '|exp|', 'VarArgExpression']
    }

    let argPrevTokens = ['Name', 'prefixexp', ')', 'functioncall', 'var', 'args', 'tableconstructor', 'String', 'Name', 'bracketexp'].map(s => '|'+s+'|')
    if (simple.includes('|tableconstructor|')) {
        let maybeArgStart = simple.lastIndexOf('|tableconstructor|');
        let prevStart = moveToPrevToken(simple, maybeArgStart);
        if (prevStart==-1) {
            if (goal=="args") {
                return [simple, 0, goal, 'TableConstructorArgs']
            }
            return ['|tableconstructor|', 0, 'exp', 'TableConstructorExp']
        }
        let prevToken = simple.slice(prevStart, maybeArgStart);
        if (argPrevTokens.includes(prevToken)) {
            return ['|tableconstructor|', maybeArgStart, 'args', 'TableConstructorArgs']
        } else {
            return ['|tableconstructor|', maybeArgStart, 'exp', 'TableConstructorExp']
        }
    } else if (simple.includes('|String|')) {
        let maybeArgStart = simple.lastIndexOf('|String|');
        let prevStart = moveToPrevToken(simple, maybeArgStart);
        if (prevStart==-1) {
            if (goal=="args") {
                return [simple, 0, goal, 'StringArgs']
            }
            return ['|String|', 0, 'exp', 'PrimitiveExpression']
        }
        let prevToken = simple.slice(prevStart, maybeArgStart);
        if (argPrevTokens.includes(prevToken)) {
            return ['|String|', maybeArgStart, 'args', 'StringArgs']
        } else {
            return ['|String|', maybeArgStart, 'exp', 'PrimitiveExpression']
        }
    } else if (simple.includes('|(|')) {
        let maybeArgStart = simple.lastIndexOf('|(|');
        let maybeArgEnd = simple.indexOf('|)|', maybeArgStart);
        let prevStart = moveToPrevToken(simple, maybeArgStart);
        if (prevStart==-1) {
            if (goal=="args") {
                let inner = simple.slice(3, maybeArgEnd);
                if (inner=="") {
                    return ['|(||)|', maybeArgStart, 'args', 'EmptyParenArgs']
                }
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "explist");
                return [rawStr, startIndex+3, newStr, subType]
            }
            if (simple.startsWith('|(||exp||)|')) {
                return ['|(||exp||)|', 0, 'prefixexp', 'ParenExpPrefixexp']
            }
            let inner = simple.slice(3, maybeArgEnd);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+3, newStr, subType]
        }
        let prevToken = simple.slice(prevStart, maybeArgStart);
        if (argPrevTokens.includes(prevToken)) {
            let inner = simple.slice(maybeArgStart+3, maybeArgEnd);
            if (inner=="") {
                return ['|(||)|', maybeArgStart, 'args', 'EmptyParenArgs']
            }
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "explist");
            return [rawStr, startIndex+maybeArgStart+3, newStr, subType]
        } else {
            if (simple.slice(maybeArgStart).startsWith('|(||exp||)|')) {
                return ['|(||exp||)|', maybeArgStart, 'prefixexp', 'ParenExpPrefixexp']
            }
            let inner = simple.slice(maybeArgStart+3, maybeArgEnd);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+maybeArgStart+3, newStr, subType]
        }
    }

    if (goal=="explist") {
        let explistRegex = /^\|exp\|(\|,\|\|exp\|)*$/;
        if (explistRegex.test(simple)) {
            return [simple, 0, goal, 'Explist']
        }
        let offset = 0;
        while (simple.startsWith('|exp||,|')) {
            offset+=8;
            simple = simple.slice(8)
        }
        let nextCommaIndex = -1;
        for (let i = 0; i<simple.length; i++) {
            if (simple.slice(i, i+3)=='|,|') {
                nextCommaIndex = i;
                break;
            }
            if (simple.slice(i, i+3)=='|(|') {
                i = findClosingParentheses(simple, i+1);
            }
        }
        if (nextCommaIndex==-1) {
            let [rawStr, startIndex, newStr, subType] = substitute(simple, "exp");
            return [rawStr, startIndex+offset, newStr, subType]
        }
        let inner = simple.slice(0, nextCommaIndex);
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
        return [rawStr, startIndex+offset, newStr, subType]
    } else if (goal=="block") {
        let blockRegex = /^(\|stat\|)+$/
        if (blockRegex.test(simple)) {
            return [simple, 0, goal, 'Block']
        }
        while (simple.startsWith('|stat|')) {
            let inner = simple.slice(6)
            let [rawStr, startIndex, newStr, subType] = substitute(inner, 'block')
            return [rawStr, startIndex+6, newStr, subType]
        }
        if (simple.includes('|return|')) {
            if (simple.endsWith('|return||explist|')) {
                return ['|return||explist|', simple.lastIndexOf('|return||explist|'), 'stat', 'ReturnStatement']
            } else {
                let start = simple.lastIndexOf('|return|')
                let inner = simple.slice(start+8)
                let [rawStr, startIndex, newStr, subType] = substitute(inner, 'explist')
                return [rawStr, startIndex+start+8, newStr, subType]
            }
        }
        if (simple.includes('|local|') && simple.slice(1).includes('|local|')) {
            let end = simple.slice(1).indexOf('|local|')+1;
            let inner = simple.slice(0, end);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, 'block')
            return [rawStr, startIndex, newStr, subType]
        }
        if (simple.startsWith('|functioncall|')) {
            return ['|functioncall|', 0, 'stat', 'FunctionCallStatement']
        }
    } else if (goal=='exp') {
        if (simple.startsWith('|Name|')) {
            return ['|Name|', 0, 'var', 'NameVar']
        }
        if (simple.startsWith('|var||bracketexp|') || simple.startsWith('|var||.||Name|')) {
            return ['|var|', 0, 'prefixexp', 'VarPrefixexp']
        }
        if (simple.startsWith('|prefixexp||bracketexp|')) {
            return ['|prefixexp||bracketexp|', 0, 'var', 'BracketVar']
        }
        if (simple.startsWith('|prefixexp||.||Name|')) {
            return ['|prefixexp||.||Name|', 0, 'var', 'DotVar']
        }
        let expRegex = /^((\|exp\|)|(\|binop\|)|(\|unop\|)|(\|-\|))+$/;
        if (expRegex.test(simple)) {
            return [simple, 0, goal, 'UnorderedOperatorExpression']
        }
        if (simple.includes('|binop|') || simple.includes('|unop|') || simple.includes('|-|')) {
            let offset = 0;
            while (simple.startsWith('|binop|') || simple.startsWith('|unop|') || simple.startsWith('|-|') || simple.startsWith('|exp||binop|') || simple.startsWith('|exp||unop|') || simple.startsWith('|exp||-|')) {
                let shift = moveToNextToken(simple, 0);
                offset += shift;
                simple = simple.slice(shift);
            }
            let endI = Math.min(...['binop', 'unop', '-'].map(s => simple.indexOf('|'+s+'|')).filter(i => i!=-1));
            let inner = simple.slice(0, endI);
            let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
            return [rawStr, startIndex+offset, newStr, subType]
        }
        //no operators
        if (simple=="|var|" || simple.startsWith('|var||args|') || simple.startsWith('|var||:|')) {
            return ['|var|', 0, 'prefixexp', 'VarPrefixexp']
        } else if (simple=="|prefixexp|") {
            return [simple, 0, goal, 'PrefixexpExpression']
        } else if (simple.includes('|functioncall|')) {
            return ['|functioncall|', simple.indexOf('|functioncall|'), 'prefixexp', 'FunctionCallPrefixexp']
        }
    }

    if (simple.includes('|args|')) {
        //search for the prefixexp
        let argIndex = simple.indexOf('|args|')
        let temp = simple.slice(0, argIndex)
        let a2 = argIndex;
        if (temp.endsWith('|:||Name|')) {
            temp = temp.slice(0, argIndex-9)
            a2 -= 9;
        }
        let scoop = 0;
        while (true) {
            if (temp.endsWith('|prefixexp|')) {
                scoop += 11
                break;
            } else if (temp.endsWith('|bracketexp|')) {
                scoop += 12;
                temp = temp.slice(0, temp.length-12);
            } else if (temp.endsWith('|.||Name|')) {
                scoop += 9;
                temp = temp.slice(0, temp.length-9);
            } else if (temp.endsWith('|Name|')) {
                scoop += 6;
                break;
            } else if (temp.endsWith('|var|')) {
                scoop += 5;
                break;
            } else if (temp.endsWith('|functioncall|')) {
                scoop += 14;
                break;
            } else {
                throw new NotSupportedError()
            }
        }
        let [rawStr, startIndex, newStr, subType] = substitute(simple.slice(a2-scoop, a2), 'prefixexp')
        return [rawStr, startIndex+a2-scoop, newStr, subType]
    }

    if (goal=="prefixexp") {
        if (simple.startsWith("|functioncall|")) {
            return ['|functioncall|', 0, 'prefixexp', 'FunctionCallPrefixexp']
        } else if (simple.startsWith('|Name|')) {
            return ['|Name|', 0, 'var', 'NameVar']
        } else if (simple=="|var|" || simple.startsWith('|var||bracketexp|') || simple.startsWith('|var||.||Name|')) {
            return ['|var|', 0, 'prefixexp', 'VarPrefixexp']
        } else if (simple.startsWith('|prefixexp||bracketexp|')) {
            return ['|prefixexp||bracketexp|', 0, 'var', 'BracketVar']
        } else if (simple.startsWith('|prefixexp||.||Name|')) {
            return ['|prefixexp||.||Name|', 0, 'var', 'DotVar']
        } else {
            console.log(simple)
            throw new NotSupportedError()
        }
    }

    if (simple.startsWith('|Name|')) {
        return ['|Name|', 0, 'var', 'NameVar']
    }

    if (goal=="varlist") {
        let varRegex = /^\|var\|(\|,\|\|var\|)*$/
        if (varRegex.test(simple)) {
            return [simple, 0, goal, 'Varlist']
        }
        let offset = 0;
        while (simple.startsWith('|var||,|')) {
            offset += 8;
            simple = simple.slice(8)
        }
        let inner = simple.includes('|,|') ? simple.slice(0, simple.indexOf('|,|')) : simple;
        let [rawStr, startIndex, newStr, subType] = substitute(inner, "var");
        return [rawStr, startIndex+offset, newStr, subType]
    } else if (goal=="var") {
        if (simple=='|Name|') {
            return [simple, 0, goal, 'NameVar']
        } else if (simple=="|prefixexp||bracketexp|") {
            return [simple, 0, goal, 'BracketVar']
        } else if (simple=="|prefixexp||.||Name|") {
            return [simple, 0, goal, 'DotVar']
        } else if (simple.endsWith('|bracketexp|')) {
            return substitute(simple.slice(0, simple.length-12), 'prefixexp')
        } else {
            return substitute(simple.slice(0, simple.length-9), 'prefixexp')
        }
    }

    if (simple.includes('|prefixexp||bracketexp|')) {
        return ['|prefixexp||bracketexp|', simple.indexOf('|prefixexp||bracketexp|'), 'var', 'BracketVar']
    } else if (simple.includes('|prefixexp||.||Name|')) {
        return ['|prefixexp||.||Name|', simple.indexOf('|prefixexp||.||Name|'), 'var', 'DotVar']
    } else if (simple.includes('|bracketexp|')) {
        let temp = simple.slice(0, simple.indexOf('|bracketexp|'));
        let oldTempLength = temp.length;
        let scoop = 0;
        while (true) {
            if (temp.endsWith('|prefixexp|')) {
                scoop += 11
                break;
            } else if (temp.endsWith('|bracketexp|')) {
                scoop += 12;
                temp = temp.slice(0, temp.length-12);
            } else if (temp.endsWith('|.||Name|')) {
                scoop += 9;
                temp = temp.slice(0, temp.length-9);
            } else if (temp.endsWith('|Name|')) {
                scoop += 6;
                break;
            } else if (temp.endsWith('|var|')) {
                scoop += 5;
                break;
            } else if (temp.endsWith('|functioncall|')) {
                scoop += 14;
                break;
            } else {
                throw new NotSupportedError()
            }
        }
        let [rawStr, startIndex, newStr, subType] = substitute(simple.slice(oldTempLength-scoop, oldTempLength), 'prefixexp')
        return [rawStr, startIndex+oldTempLength-scoop, newStr, subType]
    } else if (simple.includes('|.||Name|')) {
        let temp = simple.slice(0, simple.indexOf('|.||Name|'));
        let oldTempLength = temp.length;
        let scoop = 0;
        while (true) {
            if (temp.endsWith('|prefixexp|')) {
                scoop += 11
                break;
            } else if (temp.endsWith('|bracketexp|')) {
                scoop += 12;
                temp = temp.slice(0, temp.length-12);
            } else if (temp.endsWith('|.||Name|')) {
                scoop += 9;
                temp = temp.slice(0, temp.length-9);
            } else if (temp.endsWith('|Name|')) {
                scoop += 6;
                break;
            } else if (temp.endsWith('|var|')) {
                scoop += 5;
                break;
            } else if (temp.endsWith('|functioncall|')) {
                scoop += 14;
                break;
            } else {
                throw new NotSupportedError()
            }
        }
        let [rawStr, startIndex, newStr, subType] = substitute(simple.slice(oldTempLength-scoop, oldTempLength), 'prefixexp')
        return [rawStr, startIndex+oldTempLength-scoop, newStr, subType]
    } else if (simple.includes('|Name|')) {
        return ['|Name|', simple.indexOf('|Name|'), 'var', 'NameVar']
    }
    
    for (let i = 0; i<simple.length; i++) {
        if (simple.slice(i, i+3)=='|=|' && (i<9 || simple.slice(i-9, i)!="|varlist|") && (i<10 || simple.slice(i-10, i)!="|namelist|")) {
            if (simple.slice(i-5, i) != '|var|') {
                console.log(simple, goal)
                throw new NotSupportedError()
            }
            let scoop = 5;
            let temp = simple.slice(0, i-5);
            while (temp.endsWith('|var||,|')) {
                scoop += 8;
                temp = temp.slice(0, temp.length-8)
            }
            let [rawStr, startIndex, newStr, subType] = substitute(simple.slice(i-scoop, i), "varlist");
            return [rawStr, startIndex+i-scoop, newStr, subType]
        }
    }

    if (goal=="block") {
        if (!simple.startsWith('|repeat|') && !simple.startsWith('|local|') && !simple.startsWith('|varlist|')) {
            let endI = simple.indexOf('|=|')
            return substitute(simple.slice(0, endI), 'varlist')
        }
    }

    if (simple.includes('|var|')) {
        return ['|var|', simple.indexOf('|var|'), 'prefixexp', 'varPrefixexp']
    }

    if (simple.includes('|prefixexp|')) {
        return ['|prefixexp|', simple.indexOf('|prefixexp|'), 'exp', 'PrefixexpExpression']
    }

    if (goal=="block") {
        if (simple.startsWith('|varlist||=|') || simple.startsWith('|local||namelist||=|')) {
            let origSimple = simple;
            let initialOffset = simple[1]=="v" ? 12 : 20;
            let offset = initialOffset;
            simple = simple.slice(initialOffset);
            while (simple.startsWith('|exp||,|')) {
                offset += 8;
                simple = simple.slice(8);
            }
            let scoop = 0;
            let seenEnd = false;
            let temp = simple;
            while (!seenEnd) {
                if (temp=="") {
                    console.log(temp, simple);
                    throw new NotSupportedError()
                } else if (temp.startsWith('|-|')) {
                    scoop += 3;
                    temp = temp.slice(3);
                } else if (temp.startsWith('|unop|')) {
                    scoop += 6;
                    temp = temp.slice(6);
                } else if (temp.startsWith('|exp|')) {
                    scoop += 5;
                    temp = temp.slice(5);
                    seenEnd = true;
                } else if (temp.startsWith('|functioncall|')) {
                    scoop += 14;
                    temp = temp.slice(14);
                    seenEnd = true;
                } else {
                    console.log(temp, simple);
                    throw new NotSupportedError()
                }

                if (seenEnd) {
                    if (temp.startsWith('|-|')) {
                        scoop += 3;
                        temp = temp.slice(3);
                        seenEnd = false;
                    } else if (temp.startsWith('|binop|')) {
                        scoop += 7;
                        temp = temp.slice(7);
                        seenEnd = false;
                    }
                }
            }
            //let [rawStr, startIndex, newStr, subType] = substitute(origSimple.slice(12, offset+scoop), "explist");
            //return [rawStr, startIndex+12, newStr, subType]
            let inner = simple.slice(0, scoop)
            if (inner=="|exp|") {
                let [rawStr, startIndex, newStr, subType] = substitute(origSimple.slice(initialOffset, offset+5), "explist");
                return [rawStr, startIndex+initialOffset, newStr, subType]
            } else {
                let [rawStr, startIndex, newStr, subType] = substitute(inner, "exp");
                return [rawStr, startIndex+offset, newStr, subType]
            }
        } else if (simple.startsWith('|local|')) {
            return ['|local||namelist|', 0, 'stat', 'LocalDeclaration']
        }
    }

    console.log(simple, goal);
    throw new NotSupportedError("could not parse tokens")
}

function simpleToSegment(simple, goal, astTokens, maxSubs) {
    var numSubs = 0;
    maxSubs = Math.floor(maxSubs);
    while (simple!=`|${goal}|`) {
        if (numSubs==maxSubs) {
            return [false, numSubs, [simple, astTokens]]
        }
        var [rawStr, startIndex, newStr, subType] = substitute(simple, goal);
        var numRawTokens = (rawStr.split('|').length - 1)/2;
        var numStartTokens = (simple.slice(0, startIndex).split('|').length-1)/2;
        var endIndex = startIndex + rawStr.length;
        var newAstToken = new Segment(subType, astTokens.slice(numStartTokens, numStartTokens+numRawTokens));

        if (rawStr!=simple.slice(startIndex, startIndex+rawStr.length)) {
            console.log(rawStr, startIndex, newStr, subType);
            throw new NotSupportedError('Bad Substitution: Wrong Index')
        }
        if ((startIndex!=0 && simple[startIndex-1] != '|') || (simple.length>endIndex && simple[endIndex]!='|')) {
            console.log(rawStr, startIndex, newStr, subType);
            throw new NotSupportedError('Bad Substitution')
        }

        simple = `${simple.slice(0, startIndex)}|${newStr}|${simple.slice(endIndex)}`;
        astTokens = astTokens.slice(0, numStartTokens).concat([newAstToken]).concat(astTokens.slice(numStartTokens+numRawTokens));
        //console.log((simple.split('|').length-1)/2, rawStr, '-->', newStr, '[' + subType + ']');
        numSubs++;
    }
    return [true, numSubs, astTokens[0]]
}

parsingStorage = {
    readyToParse: false,
    doneParsing: false
}

function setupParse(tokens, msPerUpdate, onUpdate=null, onDone=null) {
    parsingStorage.simpleTokens = tokens.map(token => token.simple).join('');
    parsingStorage.astTokens = tokens.map(token => {
        switch(token.type) {
            case "string":
                return new Segment("StringLiteral", [token])
            case "number":
                return new Segment("NumberLiteral", [token])
            case "name":
                return new Segment("Identifier", [token])
            default:
                return token
        }
    })
    parsingStorage.msPerUpdate = msPerUpdate;
    parsingStorage.onUpdate = onUpdate;
    parsingStorage.onDone = onDone;
    parsingStorage.totalSubs = 0;
    parsingStorage.readyToParse = true;
    parsingStorage.doneParsing = false;
}

function parse() {
    if (parsingStorage.readyToParse && !parsingStorage.doneParsing) {
        let start = performance.now();
        let maxSubs = Math.max(2500*parsingStorage.msPerUpdate/parsingStorage.astTokens.length, 1);
        let [done, numSubs, result] = simpleToSegment(parsingStorage.simpleTokens, "block", parsingStorage.astTokens, maxSubs);
        let timeElapsed = (performance.now()-start)/1000;
        parsingStorage.totalSubs += numSubs;
        if (done) {
            parsingStorage.result = result;
            parsingStorage.doneParsing = true;
            parsingStorage.onUpdate(numSubs, timeElapsed);
            parsingStorage.onDone();
        } else {
            [parsingStorage.simpleTokens, parsingStorage.astTokens] = result;
            parsingStorage.onUpdate(numSubs, timeElapsed);
            setTimeout(parse, 0)
        }
    }
}