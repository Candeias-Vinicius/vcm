const User = require('../models/User');

function findById(id) {
  return User.findById(id);
}

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

function findOne(query) {
  return User.findOne(query);
}

function create({ nick, email, password_hash }) {
  return User.create({ nick, email, password_hash });
}

function save(user) {
  return user.save();
}

module.exports = {
  findById,
  findByEmail,
  findByNick,
  findByLoginInput,
  findDuplicate,
  findOne,
  create,
  save,
};
