import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

class Suggest extends Component {
  render() {
    let token = localStorage.getItem('jwt-token')
    if (!token)
        return <Redirect to="/"/>
    return (
      <div>THIS IS THE Suggest Course Plan PAGE</div>
    );
  }
}

export default Suggest;