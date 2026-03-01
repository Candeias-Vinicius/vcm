const User = require('../models/User');

function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

function findByNick(nick) {
  return User.findOne({ nick });
}

function findByLoginInput(input) {
  const isEmail = input.includes('@');
  return isEmail ? findByEmail(input) : findByNick(input);
}

function findDuplicate(email, nick) {
  return User.findOne({ $or: [{ email: email.toLowerCase() }, { nick }] });
}

function create({ nick, email, password_hash }) {
  return User.create({ nick, email, password_hash });
}

function save(user) {
  return user.save();
}

module.exports = {
  findByEmail,
  findByNick,
  findByLoginInput,
  findDuplicate,
  create,
  save,
};
