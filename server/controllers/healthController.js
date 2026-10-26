
const getHealth = (req, res) => {
  res.json({
    success: true,
    message: "Agentic AI Website Builder backend is running",
  });
};

module.exports = { getHealth };
