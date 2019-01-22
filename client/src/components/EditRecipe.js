import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import ReactQuill from 'react-quill';
import { Form, Segment } from 'semantic-ui-react';
import {
  editRecipe,
  autoComIng,
  resetAutoCom,
  getRecipe,
  getAllergies
} from '../actions';
import styled from 'styled-components';

// const AutoComDiv = styled.div`
//   position: relative;
//   display: inline-block;
// `;

const AutoComItemsDiv = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  border: 1px solid #d4d4d4;
  z-index: 10;

  div {
    cursor: pointer;
    background-color: #fff;
    border-bottom: 1px solid #d4d4d4;
  }
`;

const EditRecipeFormDiv = styled.div`
  padding: 20px;

  h2 {
    font-size: 1.6rem;
    margin-top: 15px;
    margin-bottom: 10px;
  }
  .quill-div {
    min-height: 196px;
  }
`;

const emptyIng = { name: '', quantity: '', unit: '', unitsList: [] };
const edamam = 'https://api.edamam.com/api/food-database';
const edamamAppId = '4747cfb2';
const edamamAppKey = '37224beb59fbab5b4b81b0e394d8b46e';

class AddNewRecipeForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.recipe ? this.props.recipe.name : '',
      description: this.props.recipe ? this.props.recipe.description : '',
      numIngredients: this.props.recipe
        ? this.props.recipe.ingredients.length
        : 3,
      ingredients: this.props.recipe
        ? this.populateUnitsLists()
        : [emptyIng, emptyIng, emptyIng],
      focuses: this.props.recipe
        ? this.props.recipe.ingredients.map(ingredient => ({
            focus: false
          }))
        : [{ focus: false }, { focus: false }, { focus: false }]
    };
  }

  populateUnitsLists = () => {
    // Populate the unitsList property of each ingredient
    const ingArr = this.props.recipe.ingredients.slice(); // Copy ingredients from the db without unitsLists
    for (let i = 0; i < ingArr.length; i++) {
      if (ingArr[i].name !== '') {
        // To avoid pinging the API with empty string queries
        ingArr[i].unitsList = []; // Make sure there is a unitsList to add to
        const encoded = encodeURIComponent(ingArr[i].name); // Ready the ingredient name to be part of a URI
        const url = `${edamam}/parser?ingr=${encoded}&app_id=${edamamAppId}&app_key=${edamamAppKey}`;
        axios
          .get(url)
          .then(res => {
            const hints = res.data.hints;
            if (hints.length) {
              // If the API returned any results for our search
              hints[0].measures.map(measure => {
                // res.data.hints[0].measures[0].label is where the Units suggestions are
                ingArr[i].unitsList.push(measure.label);
                return null;
              });
            } else {
              ingArr[i].unitsList.push('Gram');
            }
          })
          .catch(err => {
            console.log({ error: err });
          });
      } else {
        ingArr[i].unitsList = ['Gram'];
      }
    }
    return ingArr;
  };

  componentDidMount() {
    const id = this.props.match.params.id;
    this.props.getRecipe(id);
    this.props.getAllergies();
    this.setState({
      ingredients: this.populateUnitsLists()
    });
  }

  quillHandler = html => {
    this.setState({ description: html });
  };

  typingHandler = e => {
    if (e.target.name === 'numIngredients') {
      // numIngredients needs certain logic
      let prevNumIng;
      const value = e.target.value; // declared since lost in async setState
      this.setState(prevState => {
        prevNumIng = prevState.numIngredients; // getting prevNumIng for later use
        if (prevNumIng > value) {
          return {
            numIngredients: value,
            ingredients: this.state.ingredients.slice(0, value),
            focuses: this.state.focuses.slice(0, value)
          };
        } else if (prevNumIng < value) {
          let otherIng = [];
          let otherFoc = [];
          for (let i = 0; i < value - prevNumIng; i++) {
            // getting extra rows for ing and foc
            otherIng.push({ name: '', quantity: '', unit: '' });
            otherFoc.push({ focus: false });
          }
          return {
            numIngredients: value,
            ingredients: [...this.state.ingredients, ...otherIng],
            focuses: [...this.state.focuses, ...otherFoc]
          };
        } else {
          return { numIngredients: value };
        }
      });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  };

  ingHandler = ev => {
    // Get which ingredient form field type is being handled: name, quty, or unit
    let rowType = ev.target.name.slice(0, 4);
    if (rowType === 'quty') {
      rowType = 'quantity';
    }
    // Get what number of row on the form is being handled
    let rowNum = Number(ev.target.name.slice(4));

    if (rowNum >= this.state.ingredients.length) {
      // If the user is creating a new ingredient
      let newObj = { [rowType]: ev.target.value }; // Make a new ingredient object
      this.setState({
        ingredients: [
          ...this.state.ingredients,
          newObj // Add new ingredient object to end of array in state
        ]
      });
      if (rowNum > this.state.ingredients.length) {
        ev.target.blur(); // Force them not to skip rows in the table
      }
    } else {
      // If modifying an ingredient that's already in state
      let ingArray = this.state.ingredients;
      let oldObj = ingArray[rowNum];
      let newObj = {
        ...oldObj,
        [rowType]: ev.target.value
      };
      ingArray[rowNum] = newObj;
      this.setState({
        ingredients: ingArray
      });
    }
  };

  submitHandler = ev => {
    ev.preventDefault();
    // Convert quantities to numbers
    let ingArray = this.state.ingredients;
    for (let i = 0; i < ingArray.length; i++) {
      ingArray[i].quantity = Number(ingArray[i].quantity);
    }

    // Package up the recipe object to be sent to the API
    // eslint-disable-next-line
    const firebaseid = localStorage.getItem('uid');
    let recipeObj = {
      name: this.state.name,
      description: this.state.description,
      firebaseid,
      ingredients: ingArray
    };
    // Call the action to send this object to POST a recipe
    this.props.editRecipe(this.props.match.params.id, recipeObj);
    this.setState({ name: '', description: '', ingredients: [] });
    this.props.history.push(`/recipes/one/${this.props.match.params.id}`);
  };

  onClickAutocomplete = (i, item) => {
    let ingredients = this.state.ingredients.slice();
    ingredients[i].name = item;
    this.setState({ ingredients }); // changing ingredient in state
    this.props.resetAutoCom(); // resets autoCom so menu will disappear
    this.onBlur(i); // changes focus to false
    this.checkAutoComUnits(i, item);
  };

  onFocus = index => {
    let focuses = this.state.focuses.slice();
    focuses[index].focus = true;
    this.setState({ focuses });
  };

  onBlur = index => {
    let focuses = this.state.focuses.slice();
    focuses[index].focus = false;
    this.setState({ focuses });
  };

  checkUnits = ev => {
    if (ev.target.value !== '') {
      const ingNum = Number(ev.target.name.slice(4));
      const encoded = encodeURIComponent(ev.target.value);
      const url = `${edamam}/parser?ingr=${encoded}&app_id=${edamamAppId}&app_key=${edamamAppKey}`;
      const unitArr = [];
      axios
        .get(url)
        .then(res => {
          const hints = res.data.hints;
          if (hints.length) {
            hints[0].measures.map(measure => {
              unitArr.push(measure.label);
              return null;
            });
          } else {
            unitArr.push('Gram');
          }
          const ingCopy = this.state.ingredients.slice();
          ingCopy[ingNum].unitsList = unitArr;
          ingCopy[ingNum].unit = unitArr[0];
          this.setState({ ingredients: ingCopy });
        })
        .catch(err => {
          console.log({ error: err });
        });
    }
  };

  checkAutoComUnits = async (i, item) => {
    try {
      const encoded = encodeURIComponent(item);
      const url = `${this.state.edamam}/parser?ingr=${encoded}&app_id=${
        this.state.edamamAppId
      }&app_key=${this.state.edamamAppKey}`;
      const unitArr = [];
      const res = await axios.get(url);
      res.data.hints[0].measures.map(measure => {
        unitArr.push(measure.label);
        return null;
      });
      const ingCopy = this.state.ingredients.slice();
      ingCopy[i].unitsList = unitArr;
      ingCopy[i].unit = unitArr[0];
      this.setState({ ingredients: ingCopy });
    } catch (err) {
      console.log(err);
    }
  };

  ingAllergyWarning = index => {
    const boolArr = this.props.allergies.map(
      allergy => allergy === this.state.ingredients[index].name
    );
    if (boolArr.includes(true)) {
      return { background: 'red' };
    } else {
      return {};
    }
  };

  render() {
    // Build the array of HTML inputs that will get inserted into the form
    if (this.props.recipe) {
      let ingredientRows = [];
      for (let i = 0; i < this.state.numIngredients; i++) {
        const unitOptions = [];
        this.state.ingredients[i].unitsList.map(unit => (
          unitOptions.push({ value: unit, text: unit })
        ));
        ingredientRows.push(
          <Form.Group key={`row${i}`}>
            {/* <AutoComDiv> */}
            <Form.Input width="10" onBlur={this.checkUnits} name={`name${i}`}>
              <input
                type="text"
                placeholder="Ingredient Name"
                name={`name${i}`}
                value={this.state.ingredients[i].name}
                autoComplete="new-password"
                onFocus={() => this.onFocus(i)}
                onChange={e => {
                  this.ingHandler(e);
                  this.props.autoComIng(this.state.ingredients[i].name);
                }}
                // onBlur={this.checkUnits}
                style={this.ingAllergyWarning(i)}
              />
              {this.props.autoCom && this.state.focuses[i].focus && (
                <AutoComItemsDiv>
                  {this.props.autoCom.map(item => {
                    return (
                      <div
                        key={item}
                        onClick={() => this.onClickAutocomplete(i, item)}
                      >
                        {item}
                      </div>
                    );
                  })}
                </AutoComItemsDiv>
              )}
            {/* </AutoComDiv> */}
            </Form.Input>
            <Form.Input width="4">
              <input
                type="text"
                placeholder="Quantity"
                name={`quty${i}`}
                value={this.state.ingredients[i].quantity}
                onChange={this.ingHandler}
                onFocus={() => this.onBlur(i)}
              />
            </Form.Input>
            <Form.Select width="5" options={unitOptions} />
            {/* <select name={`unit${i}`} onChange={this.ingHandler}>
              {this.state.ingredients[i].unitsList &&
                this.state.ingredients[i].unitsList.map(unit => (
                  <option value={unit}>{unit}</option>
                ))}
            </select>
            <br /> */}
          </Form.Group>
        );
      }
      return (
        <EditRecipeFormDiv>
          <Header as="h1" style={{ color: 'white' }}>
            Upload New Recipe
          </Header>
          <Segment inverted color="orange">
            <Form onSubmit={this.submitHandler} autoComplete="off" inverted>
              <Form.Group widths="equal">
                <Form.Field width="6">
                  <label htmlFor="recipe-name">Name</label>
                  <input
                    type="text"
                    placeholder="Recipe Name"
                    name="name"
                    id="recipe-name"
                    value={this.state.name}
                    onChange={this.typingHandler}
                    required
                  />
                </Form.Field>
                <Form.Field width="1">
                  <label htmlFor="numIngredients">Number of Ingredients:</label>
                  <input
                    type="number"
                    placeholder="3"
                    name="numIngredients"
                    id="numIngredients"
                    value={this.state.numIngredients}
                    onChange={this.typingHandler}
                  />
                </Form.Field>
              </Form.Group>
              {ingredientRows}
              <div className="quill-div">
                <ReactQuill
                  value={this.state.description}
                  onChange={html => this.quillHandler(html)}
                  modules={AddNewRecipeForm.modules}
                  formats={AddNewRecipeForm.formats}
                  style={{ minHeight: '150px', background: 'white', color: 'black' }}
                />
              </div>
              {(!this.state.name || !this.state.description) && (
                <p className="please-provide">
                  Please provide a name, description, and ingredients before
                  submitting a recipe!
                </p>
              )}
              <Form.Button type="submit">Save Recipe</Form.Button>
            </Form>
          </Segment>
        </EditRecipeFormDiv>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}

// AddNewRecipeForm.modules = {
//   toolbar: [
//     [{ header: '1' }, { header: '2' }, { font: [] }],
//     [{ size: [] }],
//     ['bold', 'italic', 'underline', 'strike', 'blockquote'],
//     [
//       { list: 'ordered' },
//       { list: 'bullet' },
//       { indent: '-1' },
//       { indent: '+1' }
//     ],
//     ['link'],
//     ['clean']
//   ],
//   clipboard: {
//     // toggle to add extra line breaks when pasting HTML:
//     matchVisual: false
//   }
// };
// AddNewRecipeForm.formats = [
//   'header',
//   'font',
//   'size',
//   'bold',
//   'italic',
//   'underline',
//   'strike',
//   'blockquote',
//   'list',
//   'bullet',
//   'indent',
//   'link'
// ];

const mapStateToProps = state => {
  return {
    autoCom: state.nutritionReducer.autoComIng,
    recipe: state.recipesReducer.recipe,
    allergies: state.usersReducer.user.allergies
  };
};

export default connect(
  mapStateToProps,
  { editRecipe, autoComIng, resetAutoCom, getRecipe, getAllergies }
)(AddNewRecipeForm);
