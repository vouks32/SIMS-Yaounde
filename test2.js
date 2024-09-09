
var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
var today  = new Date(1717963694000);

console.log(today.toLocaleDateString("fr-FR", options));