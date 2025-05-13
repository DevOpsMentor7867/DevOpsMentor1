const express = require('express');
const router = express.Router();
const { getTools } = require('../controllers/tools');
const { getLabs } = require('../controllers/labs');
const { getLabQuestions } = require('../controllers/labMaterial');
const { scriptExecute,checkAnswer } = require('../controllers/script');
const { endLab } = require('../controllers/progress');

const authMiddleware = require('../middleware/userMiddleware');
const { linuxTerminal, stopAndDeleteContainer } = require("../controllers/terminal");
const { AnsiblelinuxTerminal, stopAndDeleteAnsibleContainer } = require('../controllers/AnsibleTerminal');

const asyncHandler = fn => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

// These routes are currently commented out, but I'm including them for future use

// router.post('/terminalrequest', authMiddleware, asyncHandler(linuxTerminal));
// router.post('/stopterminal', authMiddleware, asyncHandler(stopAndDeleteContainer));
router.get('/gettools', asyncHandler(getTools));
router.get('/:toolId/labs', asyncHandler(getLabs));
router.get('/labs/:labId/questions', asyncHandler(getLabQuestions));
router.post('/checkanswer', asyncHandler(scriptExecute));
router.post("/labs/:labId/endlab", asyncHandler(endLab));

module.exports = router;

