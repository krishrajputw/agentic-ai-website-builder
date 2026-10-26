
const express = require("express");
const { testGemini } = require("../controllers/aiController");

const router = express.Router();

router.post("/test", testGemini);

module.exports = router;
