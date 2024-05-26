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
}

class Block {
	constructor(statements) {
		this.statements = statements;
	}
}

class AssignmentStatement {
	constructor(isLocal, vars, exps) {
		this.isLocal = isLocal;
		this.vars = vars;
		this.exps = exps;
	}
}
class LocalDeclaration {
	constructor(names) {
		this.names = names;
	}
}
class FunctionCallStatement {
	constructor(call) {
		this.call = call;
	}
}
class DoStatement {
	constructor(block) {
		this.block = block;
	}
}
class WhileStatement {
	constructor(exp, block) {
		this.exp = exp;
		this.block = block;
	}
}
class RepeatStatement {
	constructor(block, exp) {
		this.block = block;
		this.exp = exp;
	}
}
class IfStatement {
	constructor(exps, blocks) {
		this.exps = exps;
		this.blocks = blocks;
	}
}
class ForNumericStatement {
	constructor(name, exp1, exp2, exp3, block) {
		this.name = name;
		this.startExp = exp1;
		this.endExp = exp2;
		this.stepExp = exp3;
		this.block = block;
	}
}
class ForGenericStatement {
	constructor(names, exps, block) {
		this.names = names;
		this.exps = exps;
		this.block = block;
	}
}
class FunctionStatement {
	constructor(isLocal, name, hasColon, params, hasVararg, block) {
		this.local = isLocal;
		this.name = name;
		this.colon = hasColon;
		this.params = params;
		this.vararg = hasVararg;
		this.block = block;
	}
}
class ReturnStatement {
	constructor(exps) {
		this.exps = exps;
	}
}
class BreakStatement {}

class NameExpression {
	constructor(name) {
		this.name = name;
	}
}
class BracketExpression {
	constructor(prefix, exp) {
		this.prefix = prefix;
		this.exp = exp;
	}
}
class DotExpression {
	constructor(prefix, name) {
		this.prefix = prefix;
		this.name = name;
	}
}
class FunctionCallExpression {
	constructor(functioncall) {
		this.call = functioncall;
	}
}
class ParenExpression {
	constructor(exp) {
		this.exp = exp;
	}
}
class NilLiteral {}
class BooleanLiteral {
	constructor(value) {
		this.value = value;
	}
}
class NumberLiteral {
	constructor(raw) {
		this.raw = raw;
	}
}
class StringLiteral {
	constructor(raw) {
		this.raw = raw;
	}
}
class VarargExpression {}
class FunctionExpression {
	constructor(params, hasVararg, block) {
		this.params = params;
		this.vararg = hasVararg;
		this.block = block;
	}
}
class TableConstructor {
	constructor(fields) {
		this.fields = fields;
	}
}
class BinaryOperation {
	constructor(exp1, symbol, exp2) {
		this.exp1 = exp1;
		this.symbol = symbol;
		this.exp2 = exp2;
	}
}
class UnaryOperation {
	constructor(symbol, exp) {
		this.symbol = symbol;
		this.exp = exp;
	}
}

class FunctionCall {
	constructor(prefix, hasColon, args) {
		this.prefix = prefix;
		this.colon = hasColon;
		this.args = args;
	}
}

class BracketField {
	constructor(exp1, exp2) {
		this.bracketExp = exp1;
		this.value = exp2;
	}
}
class NameField {
	constructor(name, exp) {
		this.name = name;
		this.value = exp;
	}
}
class ExpField {
	constructor(exp) {
		this.exp = exp;
	}
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

function translate(segment) {
	console.log(segment);
	var ast = castAST(segment);
	console.log(ast);
	return 'lua_var = 1; console.log(lua_var);'
}

async function luaToJS(filename) {
	let rawText = await readFile(filename);
	let tokens = tokenize(rawText);
	let startNumTokens = tokens.length;
	let segment = await new Promise((resolve, reject) => {
		setupParse(tokens, 30, (numSubs, timeElapsed) => {
			//print(parsingStorage.doneParsing ? "1 token" : `${parsingStorage.astTokens.length} tokens`, '|', `${numSubs} subs (${parsingStorage.totalSubs} total)`, '|', `${timeElapsed.toFixed(4)} secs`)
			print(parsingStorage.doneParsing ? 'Parsing... 100%' : `Parsing... ${(100-100*parsingStorage.astTokens.length/startNumTokens).toFixed(1)}%`)
		}, () => resolve(parsingStorage.result));
		parse();
	});
	return translate(segment);
}