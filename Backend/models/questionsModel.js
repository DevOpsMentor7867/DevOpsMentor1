const mongoose = require("mongoose");

const labQuestionsSchema = new mongoose.Schema({
    lab_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lab',  
        required: true 
    },
    questions_data: [
        {
            question_number: { 
                type: Number, 
                required: true 
            },
            question: { 
                type: String, 
                required: true 
            },
            script: { 
                type: String, 
                required: true 
            },
            hints: { 
                type: [String], 
                default: [] 
            }
        }
    ]
});


const LabQuestion = mongoose.model("LabQuestion", labQuestionsSchema, "LabQuestions");

module.exports = LabQuestion;
