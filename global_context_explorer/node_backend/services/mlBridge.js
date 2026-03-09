/**
 * ML Bridge Service
 * Spawns the Python pipeline_main.py as a child process
 * and parses the JSON output.
 */
const { execFile } = require('child_process');
const path = require('path');
const config = require('../config/config');

/**
 * Run the 7-Layer Causal Logic Engine for a given local event.
 *
 * @param {Object}  opts
 * @param {string}  opts.input        - Event name / text
 * @param {string}  [opts.date]       - Date string
 * @param {string}  [opts.location]   - Location string
 * @param {number}  [opts.topK=10]    - Number of results
 * @returns {Promise<Object>}         - Parsed JSON result from the pipeline
 */
async function runPipeline({ input, date, location, topK = 10 }) {
    return new Promise((resolve, reject) => {
        const pipelineDir = path.resolve(__dirname, '..', config.mlPipelineDir);
        const pythonPath = path.resolve(config.mlPythonPath);
        const scriptPath = path.join(pipelineDir, 'pipeline_main.py');

        const args = [
            scriptPath,
            '--input',
            input,
            '--top-k',
            String(topK),
            '--json-output',
        ];

        if (date) {
            args.push('--date', date);
        }
        if (location) {
            args.push('--location', location);
        }

        console.log('[ML Bridge] Spawning:', pythonPath);
        console.log('[ML Bridge] Args:', args.join(' '));

        const child = execFile(pythonPath, args, {
            cwd: pipelineDir,
            maxBuffer: 10 * 1024 * 1024, // 10 MB
            timeout: 5 * 60 * 1000, // 5 minutes
        }, (error, stdout, stderr) => {
            if (error) {
                return reject(
                    new Error(`Pipeline exited with code ${error.code}: ${stderr || error.message}`)
                );
            }

            // The pipeline may print log lines before the JSON block.
            // We look for the JSON block delimited by ===JSON_START=== / ===JSON_END===
            const startMarker = '===JSON_START===';
            const endMarker = '===JSON_END===';
            const startIdx = stdout.indexOf(startMarker);
            const endIdx = stdout.indexOf(endMarker);

            if (startIdx === -1 || endIdx === -1) {
                return reject(
                    new Error(
                        'Pipeline output did not contain JSON markers. Raw output: ' +
                        stdout.slice(0, 500)
                    )
                );
            }

            const jsonStr = stdout
                .substring(startIdx + startMarker.length, endIdx)
                .trim();

            try {
                const result = JSON.parse(jsonStr);
                resolve(result);
            } catch (parseErr) {
                reject(
                    new Error(
                        `Failed to parse pipeline JSON: ${parseErr.message}\nRaw: ${jsonStr.slice(0, 300)}`
                    )
                );
            }
        });
    });
}

/**
 * Add a new local event to the ML model's history CSV and rebuild nodes.
 *
 * @param {Object}  opts
 * @param {string}  opts.eventName
 * @param {string}  opts.date
 * @param {string}  opts.location
 * @param {string}  opts.description
 * @param {string}  [opts.purpose]
 * @param {string}  [opts.exhibitName]
 * @returns {Promise<Object>}
 */
async function addEventToHistory({ eventName, date, location, description, purpose = '', exhibitName = '', sources = '' }) {
    return new Promise((resolve, reject) => {
        const pipelineDir = path.resolve(__dirname, '..', config.mlPipelineDir);
        const pythonPath = path.resolve(config.mlPythonPath);
        const scriptPath = path.join(pipelineDir, 'add_history_event.py');

        const args = [
            scriptPath,
            '--event-name', eventName,
            '--date', date,
            '--location', location,
            '--description', description,
            '--purpose', purpose,
            '--exhibit', exhibitName,
            '--sources', sources,
            '--rebuild-nodes'
        ];

        console.log('[ML Bridge] Adding history event:', pythonPath, args.join(' '));

        execFile(pythonPath, args, { cwd: pipelineDir }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Failed to add history event: ${stderr || error.message}`));
            }
            console.log('[ML Bridge] add_history_event output:', stdout);

            // Extract assigned nodeId if present
            let assignedNodeId = null;
            const match = stdout.match(/===ASSIGNED_NODE_ID===(LOC_\d+)===/);
            if (match) {
                assignedNodeId = match[1];
            }

            resolve({ success: true, nodeId: assignedNodeId, output: stdout });
        });
    });
}

/**
 * Trigger background retraining of the GNN model.
 *
 * @returns {Promise<Object>}
 */
async function retrainModel() {
    return new Promise((resolve, reject) => {
        const pipelineDir = path.resolve(__dirname, '..', config.mlPipelineDir);
        const pythonPath = path.resolve(config.mlPythonPath);
        const scriptPath = path.join(pipelineDir, 'train_gnn.py');

        const args = [
            scriptPath,
            '--nodes', 'nodes_from_history.csv',
            '--edges', 'edges_template.csv',
            '--epochs', '200'
        ];

        console.log('[ML Bridge] Starting background retraining:', pythonPath, args.join(' '));

        // Redirect output to a log file
        const fs = require('fs');
        const logPath = path.join(pipelineDir, 'training.log');
        const out = fs.openSync(logPath, 'a');
        const err = fs.openSync(logPath, 'a');

        const { spawn } = require('child_process');
        const child = spawn(pythonPath, args, {
            cwd: pipelineDir,
            detached: true,
            stdio: ['ignore', out, err]
        });

        child.unref(); // Allow the parent process to exit independently

        resolve({ success: true, message: `Retraining started in background. Logs: ${logPath}` });
    });
}

/**
 * Remove a local event from the ML model's history CSV and rebuild nodes.
 *
 * @param {string} nodeId - The ID of the node to remove (e.g., LOC_043)
 * @returns {Promise<Object>}
 */
async function removeEventFromHistory(nodeId) {
    return new Promise((resolve, reject) => {
        const pipelineDir = path.resolve(__dirname, '..', config.mlPipelineDir);
        const pythonPath = path.resolve(config.mlPythonPath);
        const scriptPath = path.join(pipelineDir, 'remove_history_event.py');

        const args = [
            scriptPath,
            '--node-id', nodeId,
            '--rebuild-nodes'
        ];

        console.log('[ML Bridge] Removing history event:', pythonPath, args.join(' '));

        execFile(pythonPath, args, { cwd: pipelineDir }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Failed to remove history event: ${stderr || error.message}`));
            }
            console.log('[ML Bridge] remove_history_event output:', stdout);
            resolve({ success: true, output: stdout });
        });
    });
}

module.exports = { runPipeline, addEventToHistory, removeEventFromHistory, retrainModel };
