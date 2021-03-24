import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

class ViewStudent extends Component {
  render() {
    let token = localStorage.getItem('jwt-token')
    if (!token)
        return <Redirect to="/"/>
    return (
      <div>THIS IS THE ViewStudent PAGE</div>
    );
  }
}

export default ViewStudent;