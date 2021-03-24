import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import { Redirect } from 'react-router-dom';
class Trends extends Component {
  render() {
    let token = localStorage.getItem('jwt-token')
    if (!token)
        return <Redirect to="/"/>
    var decoded = jwt_decode(token)
    if(decoded){
      if (decoded.type === 'student')
          this.props.history.push('/')
    }
    return (
      <div>THIS IS THE Trends PAGE</div>
    );
  }
}

export default Trends;