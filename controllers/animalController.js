const mongoose = require('mongoose');
const Animal = mongoose.model('Animal');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

// options for multer (package that handles photo upload functionality)
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');

    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

// renders home page
exports.homePage = (req, res) => {
  res.render('index');
};

// renders add/edit animal page
exports.addAnimal = (req, res) => {
  res.render('editAnimal', { title: 'Add Animal' });
};

// reads image into memory
exports.upload = multer(multerOptions).single('photo');

// middleware that resizes image in case it is too big (prevents user from uploading 5MBs+ files)
exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next();
    return;
  }

  const extension = req.file.mimetype.split('/')[1];

  // putting a photo on the body will save it to DB, because we save req.body
  req.body.photo = `${uuid.v4()}.${extension}`;

  // resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(1200, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);

  // once we have written the photo to our filesystem, keep going!
  next();
};

// create an animal card and save it to DB
exports.createAnimal = async (req, res) => {
  req.body.author = req.user._id;

  const animal = await (new Animal(req.body)).save();

  req.flash('success', `Successfully Created ${animal.animal}.`);
  res.redirect(`/animal/${animal.slug}`);
};

// get animals' cards to display on a single page (index, animals pages)
exports.getAnimals = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 6;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all animals
  const animalsPromise = Animal
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Animal.count();

  const [animals, count] = await Promise.all([animalsPromise, countPromise]);
  const pages = Math.ceil(count / limit);

  if (!animals.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/animals/page/${pages}`);
    return;
  }

  res.render('animals', {
    title: 'Animals',
    animals,
    page,
    pages,
    count
  });
};

// check if current user is owner of animal card (privileges to edit it?)
const confirmOwner = (animal, user) => {
  if (!animal.author.equals(user._id)) {
    throw Error('You must own a animal in order to edit it!');
  }
};

// edit existing animal card
exports.editAnimal = async (req, res) => {
  // 1. Find the animal given the ID
  const animal = await Animal.findOne({ _id: req.params.id });

  // 2. confirm they are the owner of the animal (admin?)
  confirmOwner(animal, req.user);

  // 3. Render out the edit form so the user can update their animal
  res.render('editAnimal', { title: `Edit ${animal.animal}`, animal });
};

// update existing animal card
exports.updateAnimal = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';

  // find and update the animal card
  const animal = await Animal.findOneAndUpdate(
    { _id: req.params.id }, 
    req.body, 
    {
      new: true, // return the new animal instead of the old one
      runValidators: true
    }
  ).exec();

  // Redriect creator to the animal and tell them it worked
  req.flash('success', `Successfully updated <strong>${animal.animal}</strong>. <a href="/animal/${animal.slug}">View Animal →</a>`);
  res.redirect(`/animals/${animal._id}/edit`);
};

// delete animal from DB
exports.deleteAnimal = async (req, res) => {
  const animal = await Animal.remove(
    { _id: req.params.id }
  ).exec();

  req.flash('success', `Successfully deleted animal.`);
  res.json(animal);
};

// gets animal card by slug (url friendly name) - used when viewing an animal card
exports.getAnimalBySlug = async (req, res, next) => {
  const animal = await Animal
    .findOne({
      slug: req.params.slug
    })
    .populate('author');

  if (!animal) {
    next();
    return;
  }

  res.render('animal', { animal, title: animal.animal });
};

// filter by category/category
exports.getAnimalsByCategory = async (req, res) => {
  const category = req.params.category;
  const categoryQuery = category || { $exists: true, $ne: [] };

  const categoriesPromise = Animal.getCategoriesList();
  const animalsPromise = Animal.find({ categories: categoryQuery });
  const [categories, animals] = await Promise.all([categoriesPromise, animalsPromise]);


  res.render('category', { categories, title: 'Categories', category, animals });
};


exports.searchAnimals = async (req, res) => {
  const animals = await Animal
  // first find animals that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // the sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 5 results
  .limit(5);
  res.json(animals);
};

exports.mapAnimals = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 100000000 // 100000km (earth is 12742 km wide overall so it should fit all earth)
      }
    }
  };

  const animals = await Animal
    .find(q)
    .select('slug animal description location photo') // whitelist of fields to return from query
    .limit(100);
  res.json(animals);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

// 'hearts' animal to save it for later
exports.heartAnimal = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());

  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id } },
      { new: true }
    );
  res.json(user);
};

// fetches all animals that user has 'hearted'
exports.getHearts = async (req, res) => {
  const animals = await Animal.find({
    _id: { $in: req.user.hearts }
  });

  res.render('animals', { title: 'Hearted Animals', animals });
};