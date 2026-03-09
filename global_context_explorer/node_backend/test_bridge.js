require('dotenv').config();
const { execFile } = require('child_process');
const path = require('path');
const config = require('./config/config');

const pythonPath = path.resolve(config.mlPythonPath);
console.log('Python path:', pythonPath);

execFile(pythonPath, ['-c', 'import torch_geometric; print("SUCCESS:", torch_geometric.__version__)'], (error, stdout, stderr) => {
    if (error) {
        console.log('ERROR:', error.message);
        console.log('STDERR:', stderr);
        return;
    }
    console.log('STDOUT:', stdout.trim());
});
