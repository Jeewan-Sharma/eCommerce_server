const User = require("../models/users.models");
const createError = require("../utils/error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw next(createError(200, "User not found!"));
    }
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordMatch) {
      throw next(createError(200, "Wrong Password or Username"));
    }

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT,
      { expiresIn: "1h" }
    );
    const { password, isAdmin, ...otherDetails } = user._doc;

    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin, token: token });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    console.log(req.body);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await new User({
      ...req.body,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(200).json({ message: "User has been Created!" });
  } catch (err) {
    // code for dublicate key is 11000
    if (err.code === 11000) {
      console.log(err);

      next(createError(200, "Username, Email or Number already in use "));
    } else {
      next(err);
    }
  }
};

module.exports = {
  login,
  register,
};
