const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const animalSchema = new mongoose.Schema({
  animal: {
    type: String,
    trim: true,
    required: 'Please enter animal!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  categories: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    habitat: {
      type: String,
      required: 'You must supply a habitat!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes
animalSchema.index({
  animal: 'text',
  description: 'text'
});

animalSchema.index({ location: '2dsphere' });

animalSchema.pre('save', async function(next) {
  if (!this.isModified('animal')) {
    next(); // skip it
    return;
  }
  this.slug = slug(this.animal);
  // find other animals that have a slug of tiger, tiger-1, tiger-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const animalsWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (animalsWithSlug.length) {
    this.slug = `${this.slug}-${animalsWithSlug.length + 1}`;
  }

  if (this.description && this.description.length) {
    this.description = this.description.replace(/\n/g, '<br />'); 
    // console.log(this.description);
  }

  next();
});

// get available categories for animal
animalSchema.statics.getCategoriesList = function() {
  return this.aggregate([
    // returns instance of Animal for each existing category (if 2 exist - 2 instances of Animal obj {}, {}) - in result each animal has one category
    { $unwind: '$categories' },
    // group everything based on category field and create a new field in each of those groups called count that 'sums' (increments) itself by 1 for each match
    { $group: { _id: '$categories', count: { $sum: 1 } } },
    // sort by count descending
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Animal', animalSchema);
