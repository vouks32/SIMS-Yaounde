
var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
var today  = new Date(1717963694000);

const thisMin = new Date().getMinutes();
console.log(today.toLocaleDateString("fr-FR", options));
//console.log((60-thisMin)*60*1000);