const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

// log user in
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

// log user out
exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

// check if user is logged in
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
};

// check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'admin@abv.bg') {
    next();
    return;
  }

  req.flash('error', 'Oops you must be registered as an admin to do that!');
  res.redirect('back');
};

// user forgot password
exports.forgot = async (req, res) => {
  // 1. See if a user with that email exists
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    req.flash('error', 'No account with that email exists.');
    return res.redirect('/login');
  }

  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

  await mail.send({
    user,
    filename: 'password-reset',
    subject: 'Password Reset',
    resetURL
  });

  req.flash('success', `You have been emailed a password reset link.`);

  // 4. redirect to login page
  res.redirect('/login');
};

// used  to reset user's password
exports.reset = async (req, res) => {
  // find user that has the password reset token and the expires is greater than now
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // if there is a user, show the rest password form
  res.render('reset', { title: 'Reset your Password' });
};

// middleware that checks if passwords match exactly
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};

// update user's password in DB
exports.update = async (req, res) => {
  // find user that has the password reset token and the expires is greater than now
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);

  await setPassword(req.body.password);

  // get rid of unneeded fields in DB
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // save updated user to DB
  const updatedUser = await user.save();

  // login user automatically using passport's login method
  await req.login(updatedUser);

  req.flash('success', 'Your password has been reset! You are now logged in!');
  res.redirect('/');
};
