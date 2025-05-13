const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    
});

const Tool = mongoose.model("Tool", toolSchema, "Tools");

module.exports = Tool;
