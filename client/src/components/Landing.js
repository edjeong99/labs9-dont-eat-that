import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import ourColors from '../ColorScheme.js';

import { Button, Header, Responsive } from 'semantic-ui-react';
import MyComponent from './LandingPageAnimation.js';
// import { url } from 'inspector';

const LandingDiv = styled.div`
  height: 100%;
  p {
    margin: 0 auto 15px;
    padding: 10px 0 10px 10px;
    max-width: 500px;
    text-align: left;
    line-height: 1.5;
  }
`;

const Landing = props => {
  const headerStyles1 = () => {
    return {
      fontFamily: `Trebuchet MS, Arial, Helvetica, sans-serif`,
      textAlign: 'center',
      fontSize: '7rem',
      fontWeight: 'normal',
      margin: '10px 0 0 5%',
      lineHeight: 1.2
    };
  };
  const headerStyles2 = () => {
    return {
      fontFamily: `Roboto`,
      textAlign: 'center',
      fontWeight: 'normal',
      fontSize: '6rem',
      margin: '0 0 30px'
    };
  };
  return (
    <LandingDiv>
      <Responsive style={{ height: '90vh' }} minWidth={501}>
        <MyComponent/>
        <Header as='h1' style={headerStyles1()}>
          Don't
          <br />
          Eat
          <br />
          That
        </Header>
        <p style={{ background: ourColors.formColor, fontFamily: 'Roboto' }}>
          Trouble finding recipes that meet all your dietary needs? Don't Eat That is the app for you! Upload or collect your own recipes here, and we will make it easy to see recipes that meet your nutritional standards.
        </p>
        <Button
          onClick={e => props.history.push('/recipes')}
          style={{ background: ourColors.buttonColor, color: 'white' }}
        >
          Demo Site!
        </Button>
      </Responsive>
      <Responsive style={{ height: '90vh' }} maxWidth={500}>
        <Header as='h1' style={headerStyles2()}>
          Don't
          <br />
          Eat
          <br />
          That
        </Header>
        <Button
          onClick={e => props.history.push('/recipes')}
          style={{ background: ourColors.buttonColor, color: 'white' }}
        >
          Demo Site!
        </Button>
      </Responsive>
    </LandingDiv>
  );
};

const ConditionalLanding = args => (
  <Route
    {...args}
    render={props =>
      // Redirect to the Recipe List page if the user is logged in; otherwise display the nested Landing component defined above.
      localStorage.uid ? (
        <Redirect
          to={{
            pathname: '/recipes',
            state: { from: props.location }
          }}
        />
      ) : (
        <Landing {...props} />
      )
    }
  />
);

export default ConditionalLanding;
