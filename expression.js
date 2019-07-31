var Tuple = /** @class */ (function () {
    function Tuple() {
    }
    return Tuple;
}());
function firstToken(expression, position) {
    var ops = ['=', '>', '<'];
    var nextposition = expression.length;
    var nextOperator = '';
    ops.forEach(function (op) {
        var newposition = expression.indexOf(op, position);
        if (newposition === -1) {
        }
        else {
            if (newposition < nextposition) {
                nextposition = newposition;
            }
            nextOperator = op;
        }
    });
    var tuple = new Tuple();
    tuple.value = expression.substring(position, nextposition);
    tuple.operator = nextOperator;
    tuple.nextposition = nextposition + nextOperator.length;
    return tuple;
}
function tokenize(expression) {
    var position = -1;
    while (position < expression.length) {
        var tuple = firstToken(expression, position);
        position = tuple.nextposition;
        console.log(tuple.value, tuple.operator);
    }
    return "Hello, " + expression;
}
console.log(tokenize('name=bill'));
//# sourceMappingURL=expression.js.map