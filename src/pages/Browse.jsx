import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import { Redirect } from 'react-router-dom';
class Browse extends Component {
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
      <div>THIS IS THE BROWSE PAGE</div>
    );
  }
}

export default Browse;