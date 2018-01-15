require('dotenv').config({ path: __dirname + '/../variables.env' });
const fs = require('fs');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise;

// models need to be imported once
const Animal = require('../models/Animal');
const User = require('../models/User');

const animals = JSON.parse(fs.readFileSync(__dirname + '/animals.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync(__dirname + '/users.json', 'utf-8'));

async function deleteData() {
  await Animal.remove();
  await User.remove();
  console.log('Data Deleted.');
  process.exit();
}

async function loadData() {
  try {
    await Animal.insertMany(animals);
    await User.insertMany(users);
    console.log('Data Inserted.');
    process.exit();
  } catch(e) {
    console.log('\n Error! Make sure to drop the existing database first with.\n\n\t npm run deletesample\n\n\n');
    console.log(e);
    process.exit();
  }
}
if (process.argv.includes('--delete')) {
  deleteData();
} else {
  loadData();
}
