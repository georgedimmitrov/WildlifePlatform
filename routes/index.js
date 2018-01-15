const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(animalController.getAnimals));
router.get('/animals', catchErrors(animalController.getAnimals));
router.get('/animals/page/:page', catchErrors(animalController.getAnimals));

// show /add page if user is logged in and admin
router.get('/add', 
  authController.isLoggedIn,
  authController.isAdmin,
  animalController.addAnimal
);

router.post('/add',
  animalController.upload,
  catchErrors(animalController.resize),
  catchErrors(animalController.createAnimal)
);

router.post('/add/:id',
  animalController.upload,
  catchErrors(animalController.resize),
  catchErrors(animalController.updateAnimal)
);


router.get('/animals/:id/edit', catchErrors(animalController.editAnimal));
router.get('/animal/:slug', catchErrors(animalController.getAnimalBySlug));

router.get('/categories', catchErrors(animalController.getAnimalsByCategory));
router.get('/categories/:category', catchErrors(animalController.getAnimalsByCategory));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.get('/map', animalController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(animalController.getHearts));

/*
  API
*/

router.get('/api/search', catchErrors(animalController.searchAnimals));
router.get('/api/animals/near', catchErrors(animalController.mapAnimals));
router.post('/api/animals/:id/heart', catchErrors(animalController.heartAnimal));

// remove animal
router.post('/api/remove/:id', catchErrors(animalController.deleteAnimal));


module.exports = router;
