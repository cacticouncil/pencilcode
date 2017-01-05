function logAction(name, data){
	var fs = require('fs');
			  fs.open('LogFile', 'wx', (err, fd) => {
               // if (err) {
					// throw err;
			// }
				var outdata = "";
				//fs.appendFile('LogFile', 'data to append', 'utf8', callback);
				if (name === "~pickblock"){
					outdata = data.id;				}else{
				outdata = data.name;
			}fs.appendFile('LogFile', new Date().toLocaleString() + " " + name + " " + outdata + "\n", (err) => {
					if (err) throw err;
				console.log('The "data to append" was appended to file!');
					});
				});
			  //
}

function logCodeExecute(c){
	var fs = require('fs');
			fs.appendFile('LogFile', new Date().toLocaleString() + " " + c + "\n", (err) => {
					if (err) throw err;
				console.log('The "data to append" was appended to file!');
					});
}

