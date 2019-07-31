
class Tuple {
    value: string;
    operator: string;
    nextposition: number;
}


function firstToken(expression,position) {

    const ops = ['=', '>', '<'];
    let nextposition = expression.length;
    let nextOperator = '';
    
    ops.forEach(op => {
        const newposition = expression.indexOf(op,position);
        if(newposition === -1){

        } else {
 
            if(newposition < nextposition) {
                nextposition = newposition;
            }
            nextOperator = op;
        }
    });
    
    const tuple = new Tuple();
    tuple.value = expression.substring(position,nextposition);
    tuple.operator = nextOperator;
    tuple.nextposition = nextposition + nextOperator.length;

    return tuple;
}

function tokenize(expression) {

    let position = -1;

    while (position < expression.length) {

        let tuple = firstToken(expression,position);
        position = tuple.nextposition;
        console.log(tuple.value, tuple.operator);
    }

    return "Hello, " + expression;
}

console.log(tokenize('name=bill'));
