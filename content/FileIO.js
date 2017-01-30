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
}

function logCodeExecute(c){
	var fs = require('fs');
	fs.appendFile('LogFile', new Date().toLocaleString() + " " + c + "\n", (err) => {
		if (err)
			throw err;
		console.log('The "data to append" was appended to file!');
	});
}

function standaloneEditorSave(filepath, content) {
// TODO: Check whether or not the file is being saved as a .js, .cs, or .py
// TODO: Allow the user to save his/her file to a specific location
// TODO: Allow the user to name his/her file respectively
	var fs = require('fs');
	var path = filepath;
	var data = content;
	//require('child_process').exec('start "" "c:\\test"');
	fs.writeFile(path, data, 'utf8', function(err) {
		if(err)
			console.error('Error: ' + err.message);
		else
			console.log('Successful write');
	});
}

function standaloneEditorLoad() {

}