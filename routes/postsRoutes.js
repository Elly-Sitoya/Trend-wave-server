const { Router } = require("express");

const router = Router();

router.get("/", (req, res, next) => {
  res.json("Posts route");
});

module.exports = router;
