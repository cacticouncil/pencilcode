function logAction(name, data){
	var fs = require('fs');
	fs.open('LogFile', 'wx', (err, fd) => { 
    var outdata = "";
	if (name === "~pickblock"){
		outdata = data.id;}
		else{
			outdata = data.name;
		   }fs.appendFile('LogFile', new Date().toLocaleString() + " " + name + " " + outdata + "\n", (err) =>{
			if (err) throw err;
			//console.log('The "data to append" was appended to file!');
			});
	});
}

function logCodeExecute(c){
	var fs = require('fs');
	fs.appendFile('LogFile', new Date().toLocaleString() + " " + c + "\n", (err) => {
		if (err)
			throw err;
		//console.log('The "data to append" was appended to file!');
	});
}

var app = require('electron').remote; // Load remote compnent that contains the dialog dependency
var dialog = app.dialog; // Load the dialogs component of the OS
var fs = require('fs'); // Load the file explorer to execute our common tasks (CRUD)

/* Save File Methods*/
function standaloneEditorCoffeeScriptSaveAs(coffeeScriptContent) {
	var data = coffeeScriptContent;
	dialog.showSaveDialog({ filters: [{ name: 'coffeescript', extensions: ['coffee'] }]}, function(fileName) {
		if(fileName == undefined)
			return;
		fs.writeFile(fileName, data, 'utf8', function(err) {
			if(err)
				console.error('Error: ' + err.message);
			else
			{
				dialog.showMessageBox({ message: 'The CoffeeScript file has been saved!', buttons: ["Ok"] });
				console.log('Successful write');
			}
		});
	});
}

function standaloneEditorJavaScriptSaveAs(javaScriptContent) {
	var data = javaScriptContent;
	dialog.showSaveDialog({ filters: [{ name: 'javascript', extensions: ['js'] }]}, function(fileName) {
		if(fileName == undefined)
			return;
		fs.writeFile(fileName, data, 'utf8', function(err) {
			if(err)
				console.error('Error: ' + err.message);
			else
			{
				dialog.showMessageBox({ message: 'The JavaScript file has been saved!', buttons: ["Ok"] });
				console.log('Successful write');
			}
		});
	});
}

function standaloneEditorPythonSaveAs(pythonContent) {
	var data = pythonContent;
	dialog.showSaveDialog({ filters: [{ name: 'python', extensions: ['py'] }]}, function(fileName) {
		if(fileName == undefined)
			return;
		fs.writeFile(fileName, data, 'utf8', function(err) {
			if(err)
				console.error('Error: ' + err.message);
			else
			{
				dialog.showMessageBox({ message: 'The Python file has been saved!', buttons: ["Ok"] });
				console.log('Successful write');
			}
		});
	});
}