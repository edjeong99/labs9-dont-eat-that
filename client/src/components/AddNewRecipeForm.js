import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactQuill from 'react-quill';
import axios from 'axios';
import { addRecipe, autoComIng, resetAutoCom, getAllergies } from '../actions';
import { Form } from 'semantic-ui-react';
import styled from 'styled-components';
// import MyDropzone from './FileDrop';

// const AutoComDiv = styled.div`
//   width: 500px;
//   position: relative;
//   display: inline-block;
// `;

const AutoComItemsDiv = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 40px;
  border: 1px solid #d4d4d4;
  z-index: 10;

  div {
    cursor: pointer;
    background-color: #fff;
    border-bottom: 1px solid #d4d4d4;
  }
`;

const AddNewRecipeFormDiv = styled.div`
  padding: 20px;

  h2 {
    font-size: 1.6rem;
    margin-top: 15px;
    margin-bottom: 10px;
  }
`;

const emptyIng = { name: '', quantity: '', unit: '', unitsList: [] };

class AddNewRecipeForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      description: '',
      numIngredients: 3,
      ingredients: [emptyIng, emptyIng, emptyIng],
      focuses: [{ focus: false }, { focus: false }, { focus: false }],
      edamam: 'https://api.edamam.com/api/food-database',
      edamamAppId: '4747cfb2',
      edamamAppKey: '37224beb59fbab5b4b81b0e394d8b46e'
    };
  }

  componentDidMount() {
    this.props.getAllergies();
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
            otherIng.push(emptyIng);
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
      let ingArray = this.state.ingredients.slice();
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
    this.props.addRecipe(recipeObj);
    this.setState({
      name: '',
      description: '',
      ingredients: [emptyIng, emptyIng, emptyIng]
    });
    this.props.history.push('/recipes');
  };

  onClickAutocomplete = (i, item) => {
    let ingredients = this.state.ingredients.slice();
    ingredients[i].name = item;
    console.log('here');
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
    console.log("checkUnits is firing");
    if (ev.target.value !== '') {
      const ingNum = Number(ev.target.name.slice(4));
      const encoded = encodeURIComponent(ev.target.value);
      const url = `${this.state.edamam}/parser?ingr=${encoded}&app_id=${
        this.state.edamamAppId
        }&app_key=${this.state.edamamAppKey}`;
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
      if (res.data.hints.length) {
        res.data.hints[0].measures.map(measure => {
          unitArr.push(measure.label);
          return null;
        });
      } else {
        unitArr.push('Gram');
      }
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
    let ingredientRows = [];
    for (let i = 0; i < this.state.numIngredients; i++) {
      ingredientRows.push(
        <Form.Group key={`row${i}`}>
          <Form.Input width="10" onBlur={this.checkUnits} name={`name${i}`}>
            {/* <AutoComDiv> */}
              <input
                type="text"
                placeholder="Ingredient Name"
                name={`name${i}`}
                value={this.state.ingredients[i].name}
                autoComplete="new-password"
                onChange={e => {
                  this.ingHandler(e);
                  this.props.autoComIng(this.state.ingredients[i].name);
                }}
                onFocus={() => this.onFocus(i)}
                // onBlur={this.checkUnits}
                style={this.ingAllergyWarning(i)}
              />
              {this.props.autoCom && this.state.focuses[i].focus && (
                <AutoComItemsDiv>
                  {this.props.autoCom.map(item => {
                    return (
                      <div
                        key={item}
                        onClick={e => this.onClickAutocomplete(i, item, e)}
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
              placeholder="Ingredient Quantity"
              name={`quty${i}`}
              value={this.state.ingredients[i].quantity}
              onChange={this.ingHandler}
              onFocus={() => this.onBlur(i)}
            />
          </Form.Input>
          <Form.Select width="5">
            <select name={`unit${i}`} onChange={this.ingHandler}>
                <option key="A">A</option>
                <option key="B">B</option>
                <option key="C">C</option>
              {this.state.ingredients[i].unitsList.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Form.Select>
        </Form.Group>
      );
    }
    return (
      <AddNewRecipeFormDiv>
        <h2>Upload New Recipe</h2>
        <Form onSubmit={this.submitHandler} autoComplete="off">
          <Form.Group widths="equal">
            <Form.Field width="6">
              <input
                type="text"
                placeholder="Recipe Name"
                name="name"
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
          <ReactQuill
            value={this.state.description}
            onChange={html => this.quillHandler(html)}
            modules={AddNewRecipeForm.modules}
            formats={AddNewRecipeForm.formats}
            style={{height: "150px"}}
          />
          <br />
          {(!this.state.name || !this.state.description) && (
            <p>
              Please provide a name, description, and ingredients before
              submitting a recipe!
            </p>
          )}
          {localStorage.getItem('uid') ? (
            <Form.Button type="submit">Save Recipe</Form.Button>
          ) : (
            <React.Fragment>
              <Form.Button type="submit" disabled>
                  Save Recipe
              </Form.Button>
              <p>Please Log In to Add a Recipe!</p>
            </React.Fragment>
          )}
        </Form>
      </AddNewRecipeFormDiv>
    );
  }
}

AddNewRecipeForm.modules = {
  toolbar: [
    [{ header: '1' }, { header: '2' }, { font: [] }],
    [{ size: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [
      { list: 'ordered' },
      { list: 'bullet' },
      { indent: '-1' },
      { indent: '+1' }
    ],
    ['link'],
    ['clean']
  ],
  clipboard: {
    // toggle to add extra line breaks when pasting HTML:
    matchVisual: false
  }
};
AddNewRecipeForm.formats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'indent',
  'link'
];

const mapStateToProps = state => {
  return {
    autoCom: state.nutritionReducer.autoComIng,
    allergies: state.usersReducer.user.allergies
  };
};

export default connect(
  mapStateToProps,
  { addRecipe, autoComIng, resetAutoCom, getAllergies }
)(AddNewRecipeForm);
