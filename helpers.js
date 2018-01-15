const fs = require('fs');

// "console.log" data in a template
exports.dump = (obj) => JSON.stringify(obj, null, 2);

exports.staticMap = ([lng, lat]) => `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=6&size=800x250&key=${process.env.MAP_KEY}&markers=${lat},${lng}&scale=2`;

// inserting an SVG
exports.icon = (name) => fs.readFileSync(`./public/images/icons/${name}.svg`);

// Some details about the site
exports.siteName = `Wildlife Platform`;

// nav
exports.menu = [
  { slug: '/animals', title: 'Animals' },
  { slug: '/categories', title: 'Categories' },
  { slug: '/map', title: 'Map' },
];

// admin nav
exports.adminMenu = [
  { slug: '/add', title: 'Add' }
];
