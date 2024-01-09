const path = require("path");
const Post = require("../models/postsModel");
const User = require("../models/userModel");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");

// =================================== CREATE POST
// POST: api/posts
// PROTECTED

const createPost = (req, res, next) => {
  try {
    let { title, category, description } = req.body;

    if (!title) {
      return next(new HttpError("Fill in title field ", 422));
    }
    if (!category) {
      return next(new HttpError("Fill in category field", 422));
    }
    if (!description) {
      return next(new HttpError("Fill in description field", 422));
    }
    if (!req.files || !req.files.thumbnail) {
      return next(new HttpError("Choose thumbnail", 422));
    }

    const { thumbnail } = req.files;
    // check the file size
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("Image is too large. It should be less than 2mb", 422)
      );
    }

    let fileName = thumbnail.name;
    fileName = fileName.split(".");
    const newFileName =
      fileName[0] + uuid() + "." + fileName[fileName.length - 1];

    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFileName),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFileName,
            creator: req.user.id,
          });

          if (!newPost) {
            return next(new HttpError("The post could not be created", 422));
          }

          //   find user and increase post count by 1
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

          return res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =================================== GET ALL POSTS
// GET: api/posts
// UNPROTECTED

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });

    if (!posts) {
      return next(new HttpError("No posts found", 404));
    }
    res.status(200).json({ posts, nbHits: posts.length });
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =================================== GET SINGLE POST
// GET: api/posts/:id
// UNPROTECTED

const getSinglePost = async (req, res, next) => {
  try {
    // return res.send(req.params.id);
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new HttpError(`No post with ${req.params.id} id found`, 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =================================== GET POSTS BY CATEGORY
// GET: api/posts/categories/:category
// UNPROTECTED

const getCatPost = async (req, res, next) => {
  try {
    const postCat = await Post.find({ category: req.params.category }).sort({
      createdAt: -1,
    });
    if (postCat.length < 1) {
      return next(
        new HttpError(
          `No posts with ${req.params.category} category found`,
          404
        )
      );
    }
    res.status(200).json(postCat);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =================================== GET AUTH POST
// GET: api/posts/users/:userId
// UNPROTECTED

const getUserPosts = async (req, res, next) => {
  try {
    const authors = await Post.find({ creator: req.params.id }).sort({
      createdAt: -1,
    });

    if (authors.length < 1) {
      return next(
        new HttpError(`No posts of author with ${req.params.id} id found`, 404)
      );
    }

    res.status(200).json(authors);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =================================== EDIT POST
// PATCH: api/posts/:id
// PROTECTED

const editPost = async (req, res, next) => {
  // const ownersPosts = await Post.find({ creator: req.user.id });
  // return res.send({ msg: "success", ownersPosts });

  try {
    let updatedPost;
    const { title, category, description } = req.body;
    if (!title || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields", 422));
    }

    // get old post from the database
    const oldPost = await Post.findById(req.params.id);

    if (req.user.id == oldPost.creator) {
      if (!req.files) {
        updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          { title, category, description },
          { new: true }
        );
      } else {
        // delete old thumbnail from upload
        fs.unlink(
          path.join(__dirname, "..", "/uploads", oldPost.thumbnail),
          async (err) => {
            if (err) {
              return next(new HttpError(err));
            }
          }
        );

        // Checking the thumbnail size
        const { thumbnail } = req.files;
        if (thumbnail.size > 2000000) {
          return next(
            new HttpError(
              "Thumbnail is too large. It should be less than 2mb",
              422
            )
          );
        }

        // Renaming the thumbnail
        let fileName = thumbnail.name;
        fileName = fileName.split(".");
        const newFileName =
          fileName[0] + uuid() + "." + fileName[fileName.length - 1];

        // Uploading the thumbnail to the server
        thumbnail.mv(
          path.join(__dirname, "..", "/uploads", newFileName),
          async (err) => {
            if (err) {
              return next(new HttpError(err));
            }
          }
        );

        updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            title,
            category,
            description,
            thumbnail: newFileName,
          },
          { new: true, runValidators: true }
        );
      }

      if (!updatedPost) {
        return next(new HttpError("Couldn't update the post", 400));
      }

      return res.status(200).json(updatedPost);
    } else {
      return next(new HttpError(`Could not edit the post`));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =================================== Delete POST
// DELETE : api/posts/:id
// PROTECTED

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    if (!postId) {
      return next(new HttpError("Post unavailable", 400));
    }

    const post = await Post.findById(postId);
    const fileName = post?.thumbnail;

    if (!post) {
      return next(new HttpError("No post found/ Already deleted", 404));
    }

    if (req.user.id == post.creator) {
      // delete thumbnail from uploads folder
      fs.unlink(
        path.join(__dirname, "..", "uploads", fileName),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          } else {
            await Post.findByIdAndDelete(postId);

            // Decrease the posts count in the db
            const currentUser = await User.findById(req.user.id);
            let postCounts = currentUser.posts - 1;

            await User.findByIdAndUpdate(req.user.id, { posts: postCounts });
          }
        }
      );
      return res.json(`Post ${postId} deleted successfully`);
    } else {
      return next(new HttpError("Post couldn't be deleted", 403));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPosts,
  getSinglePost,
  getCatPost,
  getUserPosts,
  editPost,
  deletePost,
};
