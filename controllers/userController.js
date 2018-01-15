const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const passport = require('passport');

// render login form
exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

// render registration form
exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

// back-end validations if user bypassed front-end ones via devtools
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    gmail_remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return;
  }

  next();
};

// registers user
exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  const register = promisify(User.register, User);
  try {
    await register(user, req.body.password);
  } catch (error) {
    if (error.name === 'UserExistsError') {
      req.flash('error', 'That email is already taken! Please choose another one.');
      res.redirect('/register');
      return;
    }

    return next(error);
  }
  next(); // middleware because user is logged in automatically via authController.login
};

// render account page
exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account' });
};

// update account (currenly works only for name, email is a readonly field)
exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const currentUser = await User.findOne({ _id: req.user._id });

  // if user removed 'readonly' attribute and decided to change his email - stop execution of update
  if (currentUser.email !== req.body.email) {
    updates.email = currentUser.email;
      req.flash('error', 'You cannot update the `readonly` email field!');
      res.redirect('back');
      return;
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );

  req.flash('success', 'Updated the profile!');
  res.redirect('back');
};
