const HttpError = require("../models/errorModel");
const User = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ============================REGISTER NEW USER===============================
// POST: api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password) {
      return next(new HttpError("Fill all the fields", 422));
    }

    const newEmail = email.toLowerCase();

    const emailExists = await User.findOne({ email: newEmail });

    if (emailExists) {
      return next(new HttpError("Email already exists", 422));
    }

    if (password.trim().length < 6) {
      return next(new HttpError("Password must be atleast 6 characters", 422));
    }

    if (password != password2) {
      return next(new HttpError("Passwords do not match", 422));
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashPassword,
    });

    return res.status(200).json({ msg: `New user ${newUser.email} created` });
  } catch (error) {
    return next(new HttpError("User Registration Failed", 422));
  }
};

// ============================LOGIN A REGISTERED USER===============================
// POST: api/users/register
// UNPROTECTED
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new HttpError("Fill in all fields", 422));
    }

    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return next(new HttpError("Invalid credentials", 422));
    }

    const comparePassword = await bcryptjs.compare(password, user.password);

    if (!comparePassword) {
      return next(new HttpError("Incorrect password", 422));
    }

    const { _id: id, name } = user;

    const token = await jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.status(200).json({ token });
  } catch (error) {
    return next(
      new HttpError(`Login failed please check your credentials`, 422)
    );
  }
};

// ============================PATH TO USER PROFILE===============================
// POST: api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    return res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ============================CHANGE USER AVATAR (Profile picture)===============================
// POST: api/users/change-avatar
// PROTECTED
const changeAvatar = async (req, res, next) => {
  try {
    return res.json(req.files);
    console.log(req.files);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ============================EDIT USER DETAILS (From profile)===============================
// POST: api/users/edit-user
// PROTECTED
const editUser = async (req, res, next) => {
  res.send("Edit User Details");
};

// ============================Get authors===============================
// POST: api/users/authors
// UNPROTECTED
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    return res.status(200).json(authors);
  } catch (error) {
    return next(new HttpError(error));
  }
};
module.exports = {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getAuthors,
};
