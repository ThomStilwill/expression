var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//abstract base-class
var GraphNode = /** @class */ (function () {
    function GraphNode() {
    }
    GraphNode.prototype.compute = function (context) { throw new Error("not implemented"); };
    GraphNode.prototype.toString = function () { throw new Error("not implemented"); };
    return GraphNode;
}());
//leaf-nodes
var ValueNode = /** @class */ (function (_super) {
    __extends(ValueNode, _super);
    function ValueNode(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    ValueNode.prototype.compute = function () { return this.value; };
    ValueNode.prototype.toString = function () { return JSON.stringify(this.value); };
    return ValueNode;
}(GraphNode));
var PropertyNode = /** @class */ (function (_super) {
    __extends(PropertyNode, _super);
    function PropertyNode(property) {
        var _this = _super.call(this) || this;
        _this.property = property;
        return _this;
    }
    PropertyNode.prototype.compute = function (context) { return context[this.property]; };
    PropertyNode.prototype.toString = function () { return String(this.property); };
    return PropertyNode;
}(GraphNode));
//tree-nodes
var UnaryNode = /** @class */ (function (_super) {
    __extends(UnaryNode, _super);
    function UnaryNode(op, node) {
        var _this = this;
        if (!(node instanceof GraphNode)) {
            throw new Error("invalid node passed");
        }
        _this = _super.call(this) || this;
        _this.op = op;
        _this.node = node;
        return _this;
    }
    UnaryNode.prototype.compute = function (context) {
        var v = this.node.compute(context);
        switch (this.op) {
            case "NOT": return !v;
        }
        throw new Error("operator not implemented '" + this.op + "'");
    };
    UnaryNode.prototype.toString = function () {
        return "( " + this.op + " " + this.node.toString() + " )";
    };
    UnaryNode.operators = ["NOT"];
    return UnaryNode;
}(GraphNode));
var BinaryNode = /** @class */ (function (_super) {
    __extends(BinaryNode, _super);
    function BinaryNode(op, l, r) {
        var _this = this;
        if (!(l instanceof GraphNode && r instanceof GraphNode)) {
            throw new Error("invalid node passed");
        }
        _this = _super.call(this) || this;
        _this.op = op;
        _this.left = l;
        _this.right = r;
        return _this;
    }
    BinaryNode.prototype.compute = function (context) {
        var l = this.left.compute(context);
        var r = this.right.compute(context);
        switch (this.op) {
            //logic operators
            case "AND": return l && r;
            case "OR": return l || r;
            //comparison-operators
            case "=": return l === r;
            case "<=": return l <= r;
            case ">=": return l >= r;
            case "!=": return l != r;
            case ">": return l > r;
            case "<": return l < r;
            //computational operators
            case "+": return l + r;
            case "-": return l - r;
            case "*": return l * r;
            case "/": return l / r;
        }
        throw new Error("operator not implemented '" + this.op + "'");
    };
    BinaryNode.prototype.toString = function () {
        return "( " + this.left.toString() + " " + this.op + " " + this.right.toString() + " )";
    };
    BinaryNode.operators = [
        "*", "/", "+", "-",
        ">", "<", "<=", ">=", "!=", "=",
        "AND", "OR",
    ];
    return BinaryNode;
}(GraphNode));
//dot is kind of special:
var DotNode = /** @class */ (function (_super) {
    __extends(DotNode, _super);
    function DotNode(l, r) {
        var _this = this;
        /*
        if(!(l instanceof PropertyNode || l instanceof DotNode)){
            throw new Error("invalid left node")
        }
        */
        if (!(r instanceof PropertyNode)) {
            throw new Error("invalid right node");
        }
        _this = _super.call(this, ".", l, r) || this;
        return _this;
    }
    DotNode.prototype.compute = function (context) {
        //especially because of this composition:
        //fetch the right property in the context of the left result
        return this.right.compute(this.left.compute(context));
    };
    DotNode.prototype.toString = function () {
        return this.left.toString() + "." + this.right.toString();
    };
    return DotNode;
}(BinaryNode));
function escapeForRegex(str) {
    return String(str).replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
}
//dynamically build my parsing regex:
var tokenParser = new RegExp([
    //numbers
    /\d+(?:\.\d*)?|\.\d+/.source,
    //string-literal
    //  /["](?:\\[\s\S]|[^"])+["]|['](?:\\[\s\S]|[^'])+[']/.source,
    //booleans
    //"true|false",
    //operators
    [".", "(", ")"].concat(UnaryNode.operators, BinaryNode.operators)
        .sort(function (a, b) { return b.length - a.length; }) //so that ">=" is added before "=" and ">", for example
        .map(escapeForRegex)
        .join("|"),
    //properties
    //has to be after the operators
    /[a-zA-Z$_][a-zA-Z0-9$_]*/.source,
    //remaining (non-whitespace-)chars, just in case
    //has to be at the end
    /\S/.source
].map(function (s) { return "(" + s + ")"; }).join("|"), "g");
function parse(str) {
    var tokens = [];
    //abusing str.replace() as a RegExp.forEach
    str.replace(tokenParser, function (token, number, op, property) {
        if (number) {
            token = new ValueNode(+number);
        }
        else if (property) {
            token = new PropertyNode(property);
        }
        else if (!op) {
            throw new Error("unexpected token '" + token + "'");
        }
        tokens.push(token);
    });
    for (var i; (i = tokens.indexOf(".")) > -1;) {
        tokens.splice(i - 1, 3, new DotNode(tokens[i - 1], tokens[i + 1]));
    }
    for (var i, j; (i = tokens.lastIndexOf("(")) > -1 && (j = tokens.indexOf(")", i)) > -1;) {
        tokens.splice(i, j + 1 - i, process(tokens.slice(i + 1, j)));
    }
    if (~tokens.indexOf("(") || ~tokens.indexOf(")")) {
        throw new Error("mismatching brackets");
    }
    return process(tokens);
}
function process(tokens) {
    UnaryNode.operators.forEach(function (token) {
        for (var i = -i; (i = tokens.indexOf(token, i + 1)) > -1;) {
            tokens.splice(i, 2, new UnaryNode(token, tokens[i + 1]));
        }
    });
    BinaryNode.operators.forEach(function (token) {
        for (var i = 1; (i = tokens.indexOf(token, i - 1)) > -1;) {
            tokens.splice(i - 1, 3, new BinaryNode(token, tokens[i - 1], tokens[i + 1]));
        }
    });
    if (tokens.length !== 1) {
        console.log("error: ", tokens.slice());
        throw new Error("something went wrong");
    }
    return tokens[0];
}
var data = {
    id: 12345,
    a: { source: 12345 },
    target: 12345,
    color: "#FF0",
    blue: "#00F",
    age: 20
};
var tree = parse("((a.source = id)AND (target= id) AND ( NOT( color != blue) OR ( age<= 23 )))");
//var tree = parse("1=1=age+10>30"); //to test operator precedence
console.log(tree.compute(data));
console.log(tree.toString());
// console.log(JSON.stringify(tree, null, 2));
//# sourceMappingURL=expression.js.map