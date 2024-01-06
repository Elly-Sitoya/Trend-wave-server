const { Router } = require("express");
const {
  createPost,
  getPosts,
  getSinglePost,
  getCatPost,
  getUserPosts,
  editPost,
  deletePost,
} = require("../controllers/postsControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.get("/", getPosts);
router.get("/:id", getSinglePost);
router.post("/", authMiddleware, createPost);
router.patch("/:id", authMiddleware, editPost);
router.get("/categories/:category", getCatPost);
router.delete("/:id", authMiddleware, deletePost);
router.get("/users/:id", getUserPosts);

module.exports = router;
