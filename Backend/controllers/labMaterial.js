const Bull = require("bull");
const { connectToDatabase, mongoose } = require('../db/mongoose');
const LabQuestion = require('../models/questionsModel'); 
const Lab = require('../models/labModel');


const getLabQuestionsQueue = new Bull("getLabQuestions", {
    redis: { port: 6379, host: "localhost" },
});


getLabQuestionsQueue.process(async (job) => {
    try {
        const labId = job.data.lab_id; 

        
        const labQuestions = await LabQuestion.find({ lab_id: labId }).populate("lab_id");
        return { labQuestions };
    } catch (error) {
        console.error(`Error processing getLabQuestions job:`, error);
        throw error; 
    }
});


module.exports.getLabQuestions = async (req, res) => {
    const { labId } =  req.params; 
    try {
        
        const job = await getLabQuestionsQueue.add(
            { lab_id: labId },
            {
                attempts: 3, 
                backoff: {
                    type: "exponential", 
                    delay: 2000, 
                },
            }
        );

        
        const result = await job.finished();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching lab questions:", error);
        res.status(500).json({ message: "Failed to fetch lab questions", error: error.message });
    }
};
