// Source: https://stackoverflow.com/questions/37469768/infix-to-binary-expression-tree

//abstract base-class
class ExpressionNode {
    compute(context){ throw new Error("not implemented") }
    toString(){ throw new Error("not implemented") }
}

//leaf-nodes
class ValueNode extends ExpressionNode{
    public value: any;
    constructor(value){ 
        super();
        this.value = value; 
    }
    compute(){ return this.value; }
    toString(){ return JSON.stringify(this.value); }
}

class PropertyNode extends ExpressionNode{
    public property: any;
    constructor(property){
        super();
        this.property = property;
    }
    compute(context){ return context[this.property]; }
    toString(){ return String(this.property); }
}

//tree-nodes
class UnaryNode extends ExpressionNode{

    public static operators = ["NOT"];
    public op: string;
    public node: ExpressionNode;

    constructor(op, node){
        if(!(node instanceof ExpressionNode)){
            throw new Error("invalid node passed")
        }
        super();
        this.op = op;
        this.node = node;
    }
    compute(context){
        var v:any = this.node.compute(context);
        switch(this.op){
            case "NOT": return !v;
        }
        throw new Error("operator not implemented '"+this.op+"'");
    }
    toString(){
        return  "( " + this.op + " " + this.node.toString() + " )";
    }   
}


class BinaryNode extends ExpressionNode{

    public static  operators = [
        "*","/","+","-",
        ">","<","<=",">=","!=","=",
        "AND","OR",
    ]

    public left: ExpressionNode;
    public op: string;
    public right: ExpressionNode;

    constructor(op:any, l:any, r:any){
        if(!(l instanceof ExpressionNode && r instanceof ExpressionNode)){
            throw new Error("invalid node passed")
        }
        super();
        this.op = op;
        this.left = l;
        this.right = r;
    }

    compute(context){
        let l:any = this.left.compute(context);
        let r:any = this.right.compute(context);
        switch(this.op){
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
        throw new Error("operator not implemented '"+ this.op + "'");
    }

    toString(){
        return "( " + this.left.toString() + " " + this.op + " " + this.right.toString() + " )";
    }
}

//dot is kind of special:
class DotNode extends BinaryNode{
    constructor(l:any, r:any){
        /*
        if(!(l instanceof PropertyNode || l instanceof DotNode)){
            throw new Error("invalid left node")
        }
        */
        if(!(r instanceof PropertyNode)){
            throw new Error("invalid right node")
        }
        super(".", l, r);
    }

    compute(context){
        //especially because of this composition:
        //fetch the right property in the context of the left result
        return this.right.compute( this.left.compute(context) );
    }
    toString(){
        return this.left.toString() + "." + this.right.toString();
    }
}

function escapeForRegex(str){
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
            .sort((a,b) => b.length-a.length) //so that ">=" is added before "=" and ">", for example
            .map(escapeForRegex)
            .join("|"),

        //properties
        //has to be after the operators
        /[a-zA-Z$_][a-zA-Z0-9$_]*/.source,

        //remaining (non-whitespace-)chars, just in case
        //has to be at the end
        /\S/.source
    ].map(s => "("+ s +")").join("|"), "g");

function parse(str){
    var tokens = [];
    //abusing str.replace() as a RegExp.forEach
    str.replace(tokenParser, function(token, number, op, property){
        if(number){
            token = new ValueNode(+number);
        }else if(property){
            token = new PropertyNode(property);
        }else if(!op){
            throw new Error("unexpected token '"+token+"'");
        }
        tokens.push(token);
    });

    for(var i; (i=tokens.indexOf(".")) > -1; ){
        tokens.splice(i-1, 3, new DotNode(tokens[i-1], tokens[i+1]))
    }

    for(var i,j; (i=tokens.lastIndexOf("(")) > -1 && (j=tokens.indexOf(")", i)) > -1;){
        tokens.splice(i, j+1-i, process(tokens.slice(i+1, j)));
    }
    if(~tokens.indexOf("(") || ~tokens.indexOf(")")){
        throw new Error("mismatching brackets");
    }

    return process(tokens);
}

function process(tokens){
    UnaryNode.operators.forEach(token => {
        for(var i=-i; (i=tokens.indexOf(token, i+1)) > -1;){
            tokens.splice(i, 2, new UnaryNode(token, tokens[i+1]));
        }
    })

    BinaryNode.operators.forEach(token => {
        for(var i=1; (i=tokens.indexOf(token, i-1)) > -1;){
            tokens.splice(i-1, 3, new BinaryNode(token, tokens[i-1], tokens[i+1]));
        }
    });

    if(tokens.length !== 1){
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
}

var expression = "((a.source = id)AND (target= id) AND ( NOT( color != blue) OR ( age<= 23 )))";
var tree = parse(expression);
//var tree = parse("1=1=age+10>30"); //to test operator precedence

console.log(tree.compute(data));
console.log(tree.toString());
// console.log(JSON.stringify(tree, null, 2));
