const fs = require('fs-extra')

const doSomeShit = (val)=>{
return val*6;
}
let js = {
    "x": 5,
    "to": function(f, val){ return f(val/2) },
    "from": function(f, val){ return f(val) }
}
let stringJS = JSON.stringify(js, function(key, value) {
    if (typeof value === "function") {
      return "/Function(" + value.toString() + ")/";
    }
    return value;
  });
fs.writeFileSync('./test-array.txt', stringJS)

let saved = JSON.parse(fs.readFileSync('./test-array.txt', { encoding: 'utf-8' }), function( key, value) {
    console.log(key)
    console.log("==========")
    
    if (typeof value === "string" &&
        value.startsWith("/Function(") &&
        value.endsWith(")/")) {
      value = value.substring(10, value.length - 2);
      return (0, eval)("(" + value + ")");
    }
    return value;
  });

console.log('function: ',saved)
console.log(saved.to(doSomeShit, 2))