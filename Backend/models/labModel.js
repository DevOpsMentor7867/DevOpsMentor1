const mongoose = require("mongoose");


const labSchema = new mongoose.Schema({
    tool_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Tool", 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    docker_image: { 
        type: String, 
        required: true 
    }
});


const Lab = mongoose.model("Lab", labSchema, "Labs");

module.exports = Lab;
