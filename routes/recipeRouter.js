const express = require('express');

const db = require('../data/dbConfig');

const router = express.Router();

// get all recipes including others
router.get('/all', async (req, res) => {
  try {
    const recipes = await db('recipes'); // getting all recipes
    const recipesAndIng = recipes.map(async recipe => {
      // mapping over recipes and adding ingredients
      const ingredients = await db('ingredients')
        .join(
          'recipes-ingredients',
          'ingredients.id',
          'recipes-ingredients.ingredient_id'
        )
        .join('recipes', 'recipes.id', 'recipes-ingredients.recipe_id')
        .where({ 'recipes.id': recipe.id })
        .select(
          'ingredients.name',
          'recipes-ingredients.quantity',
          'ingredients.unit'
        );
      return { ...recipes, ingredients };
    });
    res.status(200).json(recipesAndIng);
  } catch (err) {
    res.status(500).json({
      message: 'The recipes information could not be retrieved',
      err
    });
  }
});

// get recipes for just the user
router.get('/:userid', (req, res) => {
  const id = req.params.userid; // need to somehow get user_id
  db('recipes')
    .where({ user_id: id })
    .then(recipes => res.status(200).json(recipes))
    .catch(err =>
      res.status(500).json({
        message: 'The recipes information could not be retrieved',
        err
      })
    );
});

// getting single recipe details
router.get('/one/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const recipe = await db('recipes')
      .where({ id: id })
      .first();
    const ingredients = await db('ingredients')
      .join(
        'recipes-ingredients',
        'ingredients.id',
        'recipes-ingredients.ingredient_id'
      )
      .join('recipes', 'recipes.id', 'recipes-ingredients.recipe_id')
      .where({ 'recipes.id': id })
      .select(
        'ingredients.name',
        'recipes-ingredients.quantity',
        'ingredients.unit'
      );
    if (!recipe || !ingredients) {
      res
        .status(404)
        .json({ message: "The recipe with the specified id doesn't exist." });
    } else {
      res.status(200).json({ ...recipe, ingredients: ingredients });
    }
  } catch (err) {
    res.status(500).json({
      message: 'The recipes information could not be retrieved',
      err
    });
  }
});

router.post('/create', async (req, res) => {
  const { name, description, firebaseid, ingredients } = req.body; // ingredients should be an array with each ingredient an object with a name, quantity, and unit
  if (name && description && firebaseid && ingredients) {
    try {
      const getUserId = await db('users')
        .where({ firebaseid })
        .first();
      const recipe = await db('recipes')
        .insert({
          // inserting into recipes database
          name: name,
          description: description,
          user_id: getUserId.id
        })
        .returning('id');
      await ingredients.map(async ingredient => {
        const ingredientSearch = await db('ingredients') // checking if ingredient already in database
          .where({ name: ingredient.name })
          .first();
        if (ingredientSearch === undefined) {
          const ingredientDone = await db('ingredients')
            .insert({
              // inserting into ingredients database if ingredient doesn't exist
              name: ingredient.name,
              unit: ingredient.unit
            })
            .returning('id');
          await db('recipes-ingredients').insert({
            // inserting into recipes-ingredients database
            recipe_id: recipe[0],
            ingredient_id: ingredientDone[0],
            quantity: ingredient.quantity
          });
        } else {
          await db('recipes-ingredients').insert({
            // inserting into recipes-ingredients database
            recipe_id: recipe[0],
            ingredient_id: ingredientSearch.id,
            quantity: ingredient.quantity
          });
        }
      });
      res.status(201).json(recipe[0]);
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: 'There was an error saving the recipe',
        err
      });
    }
  } else {
    res.status(400).json({ message: 'Please provide all fields.' });
  }
});

router.put('/edit/:id', async (req, res) => {
  const { name, description, firebaseid, ingredients } = req.body;
  const id = req.params.id;
  if (name && description && firebaseid && ingredients) {
    // checks if all fields in req.body
    const getUserId = await db('users') // getting userId in users table from firebaseid
      .where({ firebaseid })
      .first();
    const recipeUpdate = await db('recipes') // updates the recipe database
      .where({ id: id })
      .update({ name: name, description: description, user_id: getUserId })
      .returning('id');
    if (recipeUpdate) {
      // checks if recipeid actually exists
      await db('recipes-ingredients') // deletes current recipe-ingredient relations
        .where({ recipe_id: id })
        .del();
      await ingredients.map(async ingredient => {
        const ingredientSearch = await db('ingredients') // checking if ingredient already in database
          .where({ name: ingredient.name })
          .first();
        if (ingredientSearch === undefined) {
          const ingredientDone = await db('ingredients')
            .insert({
              // inserting into ingredients database if ingredient doesn't exist
              name: ingredient.name,
              unit: ingredient.unit
            })
            .returning('id');
          await db('recipes-ingredients').insert({
            // inserting recipe-ingredient relations into database if ingredient doesn't exist
            recipe_id: id,
            ingredient_id: ingredientDone[0],
            quantity: ingredient.quantity
          });
        } else {
          await db('recipes-ingredients').insert({
            // inserting recipe-ingredient relations into database if ingredient exists
            recipe_id: id,
            ingredient_id: ingredientSearch.id,
            quantity: ingredient.quantity
          });
        }
      });
      const recipe = await db('recipes') // rest is just formatting to return the recipe and ingredients
        .where({ id: id })
        .first();
      const ingredientList = await db('ingredients')
        .join(
          'recipes-ingredients',
          'ingredients.id',
          'recipes-ingredients.ingredient_id'
        )
        .join('recipes', 'recipes.id', 'recipes-ingredients.recipe_id')
        .where({ 'recipes.id': id })
        .select(
          'ingredients.name',
          'recipes-ingredients.quantity',
          'ingredients.unit'
        );
      res.status(200).json({ ...recipe, ingredients: ingredientList });
    } else {
      res
        .status(404)
        .json({ message: "The recipe with the specified id doesn't exist." });
    }
  } else {
    res.status(400).json({ message: 'Please provide all fields.' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db('recipes-ingredients') // deletes recipe in recipes-ingredients database
      .where({ recipe_id: id })
      .del();
    const recipe = await db('recipes') // deletes recipe in recipe database
      .where({ id: id })
      .del();
    if (recipe) {
      // checks to see if any deletion actually occured
      res.status(200).json(recipe);
    } else {
      res
        .status(400)
        .json({ message: "The recipe with the specified id doesn't exist." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'There was an error deleting the recipe',
      err
    });
  }
});

module.exports = router;
