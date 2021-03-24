import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
class Bulletin extends Component {
  render() {
    let token = localStorage.getItem('jwt-token')
    if (!token)
        return <Redirect to="/"/>
    return (
      <div>THIS IS THE Bulletin PAGE</div>
    );
  }
}

export default Bulletin;