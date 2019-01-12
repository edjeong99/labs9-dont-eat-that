// THIS IS DRAFT Version -- structure of this page will be discussed
// app.js is main component that contains three main part of display
// Top Menu component include app logo, search bar and login/signup
// SideMenu component has list of menu including recipe, billing, setting...
// DisplayRecipesViewer will control/manage the main part of the service, including display list of recipes,
// whole recipes, add/edit/delete, billing, setting...

import React, { Component } from 'react';
import { Route, NavLink } from 'react-router-dom';
import { Elements, StripeProvider } from 'react-stripe-elements';
import styled from 'styled-components';

import './App.css';
import DisplayRecipesViewer from './viewer/DisplayRecipesViewer.js';
import AddNewRecipeForm from './components/AddNewRecipeForm';
import { withFirebase } from './components/firebase';
import SingleRecipe from './components/SingleRecipe';
import SignUp from './components/auth/signUp';
import SignIn from './components/auth/signIn';
import SignOut from './components/auth/signOut';
import CheckoutForm from './components/CheckoutForm';

const NavDiv = styled.div`
  display: flex;
  justify-content: space-evenly;
`;

class App extends Component {
  // componentDidMount and componentWillUnmout is used to check if user is loggedin
  // it will make state changes when user login or out.
  // guide provide other way that remove this.  that require more higher order components.
  // but that method would be hard to use redux state management
  // it might be good to use higher order components and not using redux...

  componentDidMount() {
    this.listener = this.props.firebase.auth.onAuthStateChanged(authUser => {
      // will make change with redux
      authUser ? console.log('logged IN') : console.log('logged OUT');

      // ? this.setState({ authUser })
      // : this.setState({ authUser: null });
    });
  }
  componentWillUnmount() {
    this.listener();
  }
  render() {
    return (
      <StripeProvider apiKey="pk_test_Alg5oAZ6fNYUyT65GQtla9et">
        <div className="App">
          <NavDiv>
            <NavLink to="/recipes">Recipes List</NavLink>
            <NavLink to="/recipes/new">New Recipe</NavLink>
            <NavLink to="/signup">Sign Up</NavLink>
            <NavLink to="/signin">Sign In</NavLink>
            <NavLink to="/billing">Billing</NavLink>
            <NavLink to="/signout">Sign Out</NavLink>
          </NavDiv>

          <Route path="/signup" component={SignUp} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signout" component={SignOut} />
          <Route
            path="/billing"
            render={props => (
              <Elements>
                <CheckoutForm {...props} />
              </Elements>
            )}
          />
          <Route path="/recipes" component={DisplayRecipesViewer} />
          <Route exact path="/recipes/new" component={AddNewRecipeForm} />
          <Route exact path="/recipes/one/:id" component={SingleRecipe} />
        </div>
      </StripeProvider>
    );
  }
}

export default withFirebase(App);
