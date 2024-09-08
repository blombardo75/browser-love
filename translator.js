class NotSupportedError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
}

class Temporary {
	constructor(name, ...components) {
		this.name = name;
		this.components = components;
	}

	translate(t) {
		throw new NotSupportedError()
	}
}

/*
- (2.5.0) Multiple return values --> all functions return a list of return values
- (2.5.8) Functioncall with colon only evaluates the name once --> use a builtin function to convert the colon to the noncolon version
- (2.5.7) Table constructor with fields is equivalent to a "do...end" stat with a local t --> Make tableconstructor a builtin to create and return the local table
- (PIL 5.1) unpack() takes a table and returns its elements, string.find() returns 2 values
- (2.5) Adjust multiple return values (functioncall or vararg expressions) into just one, except for when it's the last element of an explist
	- AssignmentStatement (local or global), ForGenericStatement, ReturnStatement, and FunctionCall.args
- SCOPE: Make sure curly brackets in translated code correspond one-to-one with blocks in the original code
*/

class AST {
	translate(t) {
		if (!(this.constructor.name in unparsedCount)) {
			unparsedCount[this.constructor.name] = 0;
		}
		unparsedCount[this.constructor.name]++;
		unparsedCount.total++;
		return '['+this.constructor.name+']'
	}
}

class Block extends AST {
	constructor(statements) {
		super();
		this.statements = statements;
	}

	translate(t) {
		return t.statements.join('\n')
	}
}

class AssignmentStatement extends AST {
	constructor(isLocal, vars, exps) {
		super();
		this.isLocal = isLocal;
		this.vars = vars;
		this.exps = exps;
	}

	translate(t) {
		let translatedExps = '';
		if (this.exps.length && this.exps[this.exps.length-1] instanceof FunctionCallExpression) {
			//[exp1, exp2, ...functioncallexp]
			let newExps = [...t.exps];
			newExps[newExps.length-1] = '...' + this.exps[this.exps.length-1].t.call;
			translatedExps = '[' + newExps.join(',') + ']'
		} else {
			translatedExps = '[' + t.exps.join(',') + ']'
		}
		if (!this.vars.some(x => x instanceof BracketExpression || x instanceof DotExpression)) {
			return `${t.isLocal ? 'let ' : ''}[${t.vars.join(',')}] = ${translatedExps};`;
		} else {
			let returnS = `{let luainternal_assignmentTemp = ${translatedExps};`
			for(let i=0; i<this.vars.length; i++) {
				let curVar = this.vars[i];
				if (curVar instanceof BracketExpression) {
					returnS += `\nluabuiltin_bracketAssignment(${curVar.t.prefix}, ${curVar.t.exp}, luainternal_assignmentTemp[${i}]);`
				} else if (curVar instanceof DotExpression) {
					returnS += `\nluabuiltin_dotAssignment(${curVar.t.prefix}, "lua_${curVar.t.name}", luainternal_assignmentTemp[${i}]);`
				} else {
					returnS += `\n${t.vars[i]} = luainternal_assignmentTemp[${i}];`
				}
			}
			returnS += '}'
			return returnS
		}
	}
}
class LocalDeclaration extends AST {
	constructor(names) {
		super();
		this.names = names;
	}
}
class FunctionCallStatement extends AST {
	constructor(call) {
		super();
		this.call = call;
	}

	translate(t) {
		return t.call + ';'
	}
}
class DoStatement extends AST {
	constructor(block) {
		super();
		this.block = block;
	}
}
class WhileStatement extends AST {
	constructor(exp, block) {
		super();
		this.exp = exp;
		this.block = block;
	}

	translate(t) {
		return `while (${t.exp}) {${t.block}}`
	}
}
class RepeatStatement extends AST {
	constructor(block, exp) {
		super();
		this.block = block;
		this.exp = exp;
	}
}
class IfStatement extends AST {
	constructor(exps, blocks) {
		super();
		this.exps = exps;
		this.blocks = blocks;
	}

	translate(t) {
		let s = `if (${t.exps[0]}) {\n${t.blocks[0]}\n}`
		let curI = 1;
		while (curI<t.exps.length) {
			s += ` else if (${t.exps[curI]}) {\n${t.blocks[curI]}\n}`
			curI++;
		}
		if (curI<t.blocks.length) {
			s += ` else {\n${t.blocks[curI]}\n}`
		}
		return s
	}
}
class ForNumericStatement extends AST {
	constructor(name, exp1, exp2, exp3, block) {
		super();
		this.name = name;
		this.startExp = exp1;
		this.endExp = exp2;
		this.stepExp = exp3;
		this.block = block;
	}

	translate(t) {
		return `{
			let luainternal_for1 = lua_tonumber(${t.startExp});
			let luainternal_for2 = lua_tonumber(${t.endExp});
			let luainternal_for3 = lua_tonumber(${t.stepExp});
			while((luainternal_for3 > 0 && luainternal_for1 <= luainternal_for2) || (luainternal_for3 <= 0 && luainternal_for1 >= luainternal_for2)) {
				//console.log('INTERAL', luainternal_for1, luainternal_for2, luainternal_for3)
				let lua_${t.name} = luainternal_for1;
				${t.block}
				luainternal_for1 += luainternal_for3;
			}
		}`
	}
}
class ForGenericStatement extends AST {
	constructor(names, exps, block) {
		super();
		this.names = names;
		this.exps = exps;
		this.block = block;
	}

	translate(t) {
		let translatedExps = '';
		if (this.exps.length && this.exps[this.exps.length-1] instanceof FunctionCallExpression) {
			//[exp1, exp2, ...functioncallexp]
			let newExps = [...t.exps];
			newExps[newExps.length-1] = '...' + this.exps[this.exps.length-1].t.call;
			translatedExps = '[' + newExps.join(',') + ']'
		} else {
			translatedExps = '[' + t.exps.join(',') + ']'
		}
		return `{
			let [luainternal_forf, luainternal_fors, luainternal_forvar] = ${translatedExps};
			while(true) {
				let [${t.names.map(x => 'lua_'+x).join(',')}] = luainternal_forf(luainternal_fors, luainternal_forvar);
				luainternal_forvar = lua_${t.names[0]};
				if (luaspecial_equalsnil(luainternal_forvar)) {break}
				${t.block}
			}
		}`
	}
}
class FunctionStatement extends AST {
	constructor(isLocal, name, hasColon, params, hasVararg, block) {
		super();
		this.local = isLocal;
		this.name = name;
		this.colon = hasColon;
		this.params = params;
		this.vararg = hasVararg;
		this.block = block;
	}

	translate(t) {
		if (this.colon !== null) {
			throw new NotSupportedError() //TODO
		}

		let s = this.local ? 'let ' : '';
		let newName = this.name.map(x => 'lua_'+x).join('.')
		s += newName
		s += ' = function('
		s += this.params.map(x => 'lua_'+x).join(', ')
		if (this.vararg) {
			s += '...luaspecial_vararg'
		}
		s += ') {\n'+t.block+'\n};'
		return s
	}
}
class ReturnStatement extends AST {
	constructor(exps) {
		super();
		this.exps = exps;
	}

	translate(t) {
		return 'return [' + t.exps.join(',') + '];'
	}
}
class BreakStatement extends AST {}

class NameExpression extends AST {
	constructor(name) {
		super();
		this.name = name;
	}

	translate(t) {
		return 'lua_'+t.name
	}
}
class BracketExpression extends AST {
	constructor(prefix, exp) {
		super();
		this.prefix = prefix;
		this.exp = exp;
	}

	translate(t) {
		return `luabuiltin_bracketexp(${t.prefix}, ${t.exp})`
	}
}
class DotExpression extends AST {
	constructor(prefix, name) {
		super();
		this.prefix = prefix;
		this.name = name;
	}

	translate(t) {
		return `luabuiltin_dotexp(${t.prefix}, "lua_${t.name}")`
	}
}
class FunctionCallExpression extends AST {
	constructor(functioncall) {
		super();
		this.call = functioncall;
	}

	translate(t) {
		return t.call + '[0]'
	}
}
class ParenExpression extends AST {
	constructor(exp) {
		super();
		this.exp = exp;
	}

	translate(t) {
		return '(' + t.exp + ')'
	}
}
class NilLiteral extends AST {}
class BooleanLiteral extends AST {
	constructor(value) {
		super();
		this.value = value;
	}
}
class NumberLiteral extends AST {
	constructor(raw) {
		super();
		this.raw = raw;
	}

	translate(t) {
		return t.raw;
	}
}
class StringLiteral extends AST {
	constructor(raw) {
		super();
		this.raw = raw;
	}
}
class VarargExpression extends AST {}
class FunctionExpression extends AST {
	constructor(params, hasVararg, block) {
		super();
		this.params = params;
		this.vararg = hasVararg;
		this.block = block;
	}
}
class TableConstructor extends AST {
	constructor(fields) {
		super();
		this.fields = fields;
	}

	translate(t) {
		let numExps = 0;
		let keyVals = this.fields.map(f => {
			if (f instanceof BracketField) {
				return `${f.t.bracketExp}, ${f.t.value}`
			} else if (f instanceof NameField) {
				return `"lua_${f.t.name}", ${f.t.value}`
			} else {
				//ExpField
				return `${++numExps}, ${f.t.exp}`
			}
		});
		return `luabuiltin_tableconstructor(${keyVals.join(', ')})`
	}
}
class BinaryOperation extends AST {
	constructor(exp1, symbol, exp2) {
		super();
		this.exp1 = exp1;
		this.symbol = symbol;
		this.exp2 = exp2;
	}

	translate(t) {
		switch(t.symbol) {
			case '+':
				return `luabuiltin_binopPlus(${t.exp1}, ${t.exp2})`
			case '-':
				return `luabuiltin_binopMinus(${t.exp1}, ${t.exp2})`
			case '*':
				return `luabuiltin_binopMultiply(${t.exp1}, ${t.exp2})`
			case '/':
				return `luabuiltin_binopDivide(${t.exp1}, ${t.exp2})`
			case '^':
				return `luabuiltin_binopExponent(${t.exp1}, ${t.exp2})`
			case '%':
				return `luabuiltin_binopModulo(${t.exp1}, ${t.exp2})`
			case '..':
				return `luabuiltin_binopConcat(${t.exp1}, ${t.exp2})`
			case '<':
				return `luabuiltin_binopLess(${t.exp1}, ${t.exp2})`
			case '<=':
				return `luabuiltin_binopLeq(${t.exp1}, ${t.exp2})`
			case '>':
				return `luabuiltin_binopGreater(${t.exp1}, ${t.exp2})`
			case '>=':
				return `luabuiltin_binopGeq(${t.exp1}, ${t.exp2})`
			case '==':
				return `luabuiltin_binopEquals(${t.exp1}, ${t.exp2})`
			case '~=':
				return `luabuiltin_binopNeq(${t.exp1}, ${t.exp2})`
			case 'and':
				return `luabuiltin_binopAnd(${t.exp1}, ${t.exp2})`
			case 'or':
				return `luabuiltin_binopOr(${t.exp1}, ${t.exp2})`
			default:
				throw new NotSupportedError()
		}
	}
}
class UnaryOperation extends AST {
	constructor(symbol, exp) {
		super();
		this.symbol = symbol;
		this.exp = exp;
	}

	translate(t) {
		switch(t.symbol) {
			case '-':
				return `luabuiltin_unopMinus(${t.exp})`
			case '#':
				return `luabuiltin_unopLen(${t.exp})`
			case 'not':
				return `luabuiltin_unopNot(${t.exp})`
			default:
				throw new NotSupportedError()
		}
	}
}

class FunctionCall extends AST {
	constructor(prefix, hasColon, args) {
		super();
		this.prefix = prefix;
		this.colon = hasColon;
		this.args = args;
	}

	translate(t) {
		if (this.colon !== null) {
			throw new NotSupportedError() //TODO
		}
		return `${t.prefix}(${t.args.join(', ')})`
	}
}

class BracketField extends AST {
	constructor(exp1, exp2) {
		super();
		this.bracketExp = exp1;
		this.value = exp2;
	}

	translate(t) {}
}
class NameField extends AST {
	constructor(name, exp) {
		super();
		this.name = name;
		this.value = exp;
	}

	translate(t) {}
}
class ExpField extends AST {
	constructor(exp) {
		super();
		this.exp = exp;
	}

	translate(t) {}
}

function orderExpression(comps) {
	if (comps.length==1) {
		return comps[0]
	}
	
	let i=comps.length-1;
	while (i>=0) {
		if (comps[i]=='not' || comps[i]=='#' || (comps[i]=='-' && (i==0 || typeof comps[i-1]==='string'))) {
			comps.splice(i, 2, new UnaryOperation(comps[i], comps[i+1]))
		} else if (comps[i]=='^') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		}
		i--;
	}

	var symbols = ['*', '/', '%']
	i = 0;
	while (i<comps.length) {
		if (symbols.includes(comps[i])) {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		} else {
			i++;
		}
	}

	symbols = ['+', '-']
	i = 0;
	while (i<comps.length) {
		if (symbols.includes(comps[i])) {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		} else {
			i++;
		}
	}

	i=comps.length-1;
	while (i>=0) {
		if (comps[i]=='..') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], '..', comps[i+1]))
		}
		i--;
	}

	symbols = ['<', '>', '<=', '>=', '~=', '==']
	i = 0;
	while (i<comps.length) {
		if (symbols.includes(comps[i])) {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], comps[i], comps[i+1]))
		} else {
			i++;
		}
	}

	i = 0;
	while (i<comps.length) {
		if (comps[i]==='and') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], 'and', comps[i+1]))
		} else {
			i++;
		}
	}

	i = 0;
	while (i<comps.length) {
		if (comps[i]==='or') {
			comps.splice(i-1, 3, new BinaryOperation(comps[i-1], 'or', comps[i+1]))
		} else {
			i++;
		}
	}

	return comps[0]
}

function castAST(segment) {
	var type = segment.type;
	var components = segment.subsegments.map(s => (s instanceof Segment) ? castAST(s) : s);
	switch (type) {
		case "Block":
			return new Block(components)
		case "Identifier":
			return new Temporary("Name", components[0].raw)
		case "NumberLiteral":
			return new NumberLiteral(components[0].raw)
		case "NameVar":
			return new NameExpression(components[0].components[0])
		case "BracketVar":
			return new BracketExpression(components[0], components[1].components[0])
		case "DotVar":
			return new DotExpression(components[0], components[2].components[0])
		case "BracketExp":
			return new Temporary(type, components[1])
		case "VarPrefixexp":
		case "PrefixexpExpression":
		case "PrimitiveExpression":
		case "TableConstructorExp":
			return components[0]
		case "FunctionCallPrefixexp":
			return new FunctionCallExpression(components[0])
		case "ParenExpPrefixexp":
			return new ParenExpression(components[1])
		case "UnorderedOperatorExpression":
			return orderExpression(components.map(c => (c instanceof Token) ? c.raw : (c instanceof Temporary) ? c.components[0] : c))
		case "BinOpSymbol":
			return new Temporary(type, components[0].raw)
		case "UnOpSymbol":
			return new Temporary(type, components[0].raw)
		case "StringLiteral":
			return new StringLiteral(components[0].raw)
		case "Explist":
		case "Varlist":
		case "FieldList":
			return new Temporary(type, ...components.filter((elem, i) => !(i%2)))
		case "NameList":
			return new Temporary(type, ...components.filter((elem, i) => !(i%2)).map(c => c.components[0]))
		case "FuncName":
			if (components.length==1) {
				return new Temporary(type, false, components[0].components[0])
			}
			var hasColon = components[components.length-2].raw==":";
			return new Temporary(type, hasColon, ...components.filter((elem, i) => !(i%2)).map(c => c.components[0]))
		case "FuncParams":
			if (components.length==2) {
				return new Temporary('Parlist', false)
			}
			return components[1]
		case "TableConstructor":
			if (components.length==2) {
				return new TableConstructor([])
			}
			return new TableConstructor(components[1].components)
		case "OnlyVarargParlist":
			return new Temporary('Parlist', true)
		case "VarargParlist":
			return new Temporary('Parlist', true, ...components[0].components)
		case "NoVarargParlist":
			return new Temporary('Parlist', false, ...components[0].components)
		case "AssignmentStatement":
			return new AssignmentStatement(false, components[0].components, components[2].components)
		case "LocalAssignmentStatement":
			return new AssignmentStatement(true, components[1].components, components[3].components)
		case "EmptyParenArgs":
			return new Temporary("Args")
		case "ExplistArgs":
			return new Temporary("Args", ...components[1].components)
		case "FieldSep":
			return new Temporary(type)
		case "BracketExp":
			return new components[1]
		case "BracketField":
			return new BracketField(components[0], components[2])
		case "NameField":
			return new NameField(components[0].components[0], components[2])
		case "ExpField":
			return new ExpField(components[0])
		case "FunctionBody":
			return new Temporary(type, components[0], components[1])
		case "NoColonFunctionCall":
			return new FunctionCall(components[0], null, components[1].components)
		case "ColonFunctionCall":
			return new FunctionCall(components[0], components[2].components[0], components[3].components)
		case "FunctionCallStatement":
			return new FunctionCallStatement(components[0])
		case "NonLocalFunctionStatement":
			var funcname = components[1].components;
			var funcbody = components[2].components;
			var hasColon = funcname[0];
			var trueName = hasColon ? funcname.slice(1,-1) : funcname.slice(1);
			var colon = hasColon ? funcname[funcname.length-1] : null;
			var hasVararg = funcbody[0].components[0];
			var params = funcbody[0].components.slice(1);
			var body = funcbody[1];
			return new FunctionStatement(false, trueName, colon, params, hasVararg, body);
		case "ForNumericNoStepStatement":
			return new ForNumericStatement(components[1].components[0], components[3], components[5], new NumberLiteral('1'), components[7])
		case "ForNumericStepStatement":
			return new ForNumericStatement(components[1].components[0], components[3], components[5], components[7], components[9])
		case "ForGenericStatement":
			return new ForGenericStatement(components[1].components, components[3].components, components[5])
		case "WhileStatement":
			return new WhileStatement(components[1], components[3])
		case "ReturnStatement":
			if (components.length==1) {
				return new ReturnStatement([])
			}
			return new ReturnStatement(components[1].components)
		case "BreakStatement":
			return new BreakStatement()
		case "IfStatement":
			var newComps = components.filter((elem, i) => i%2);
			return new IfStatement(newComps.filter(c => !(c instanceof Block)), newComps.filter(c => c instanceof Block))
		case "FunctionExpression":
			var funcbody = components[1].components;
			var hasVararg = funcbody[0].components[0];
			var params = funcbody[0].components.slice(1);
			var body = funcbody[1];
			return new FunctionExpression(params, hasVararg, body);
		case "LocalFunctionStatement":
			var funcbody = components[3].components;
			var hasVararg = funcbody[0].components[0];
			var params = funcbody[0].components.slice(1);
			var body = funcbody[1];
			return new FunctionStatement(true, [components[2].components[0]], null, params, hasVararg, body);
		case "DoStatement":
			return new DoStatement(components[1])
		case "VarArgExpression":
			return new VarargExpression()
		case "TableConstructorArgs":
			return new Temporary("Args", components[0])
		case "StringArgs":
			return new Temporary("Args", components[0])
		case "LocalDeclaration":
			return new LocalDeclaration(components[1].components)
		default:
			throw new NotSupportedError(`Bad segment type: ${type}`)
	}
}

function createTranslatedObj(ast) {
	let newObj = {};
	Object.entries(ast).forEach(([name, value]) => {
		newObj[name] = (value instanceof AST) ? translate(value) : (value instanceof Array && value[0] instanceof AST) ? value.map(translate) : value;
	});
	return newObj
}

function translate(ast) {
	let t = createTranslatedObj(ast);
	ast.t = t;
	let result = ast.translate(t);
	classesToPrint = [];
	if (result!='['+ast.constructor.name+']' && classesToPrint.some(x => ast instanceof x)) {
		console.log(ast);
		console.log(t);
		console.log(result);
	}
	return result;
}

async function luaToJS(rawLua, debug=false) {
	let tokens = tokenize(rawLua);
	let segment = parse(tokens);
	let start = performance.now();
	let ast = castAST(segment);
	if (debug) {
		console.log(ast);
	}
	unparsedCount = {total: 0};
	let finalJS = translate(ast);
	if (debug) {
		console.log(finalJS);
		let a = [...Object.keys(unparsedCount)].filter(k => k!='total').map(k => [k, unparsedCount[k]]);
		a.sort((a,b) => b[1]-a[1]);
		console.log(`TOTAL UNPARSED: ${unparsedCount.total}\n` + a.map(([k, v]) => `${k} - ${v}`).join('\n'))
		print(`${unparsedCount.total} unparsed`);
	}
	if (unparsedCount.total) {
		console.log(`failed to translate ${unparsedCount.total} segment${unparsedCount.total==1 ? '' : 's'}`)
		return ''
	} else {
		console.log(`translated in ${(performance.now()-start).toFixed(1)} ms`);
		return finalJS
	}
}