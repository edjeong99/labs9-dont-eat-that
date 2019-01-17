import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { withFirebase } from './firebase';
import { addAllergy, getAllergies, deleteAllergy } from '../actions/index';
import PasswordChangeForm from './auth/passwordChange';

const DeleteAllergySpan = styled.span`
  color: red;
  cursor: pointer;
`;
class Settings extends React.Component {
  state = {
    email: '',
    password: '',
    allergy: ''
  };
  componentDidMount() {
    this.props.getAllergies();
  }
  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };
  onAddAllergy = e => {
    this.props.addAllergy(this.state.allergy.toLowerCase());
    this.setState({ allergy: '' });
  };

  render() {
    if (this.props.allergies) {
      return (
        <div>
          <h1>Settings</h1>
          <div>
            <h2>User Account</h2>
            <br />
            <PasswordChangeForm />
          </div>

          <div>
            <h2>Allergies</h2>
            <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
              {this.props.allergies.map((allergy, i) => {
                if (typeof allergy === 'object') {
                  return (
                    <li key={i}>
                      {allergy.name}{' '}
                      <DeleteAllergySpan
                        onClick={() => this.props.deleteAllergy(allergy.name)}
                      >
                        X
                      </DeleteAllergySpan>
                    </li>
                  );
                } else {
                  return (
                    <li key={i}>
                      {allergy}{' '}
                      <DeleteAllergySpan
                        onClick={() => this.props.deleteAllergy(allergy)}
                      >
                        X
                      </DeleteAllergySpan>
                    </li>
                  );
                }
              })}
            </ul>
            <label htmlFor="allergy" />
            <input
              type="text"
              name="allergy"
              id="allergy"
              placeholder="Please enter an allergy..."
              value={this.state.allergy}
              onChange={this.onChange}
            />
            <button onClick={this.onAddAllergy}>Add Allergy</button>
          </div>
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}

const mapStateToProps = state => {
  return {
    allergies: state.usersReducer.user.allergies
  };
};

export default connect(
  mapStateToProps,
  { addAllergy, getAllergies, deleteAllergy }
)(compose(withFirebase)(Settings));
