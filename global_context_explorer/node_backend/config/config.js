require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/museum_kiosk',
    jwtSecret: process.env.JWT_SECRET || 'default_secret',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    mlPythonPath: process.env.ML_PYTHON_PATH || 'python',
    mlPipelineDir: process.env.ML_PIPELINE_DIR || '../backend_ml_models',
    nodeEnv: process.env.NODE_ENV || 'development',
};
