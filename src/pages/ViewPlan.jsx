import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import { NavLink, Redirect } from 'react-router-dom';
class ViewPlan extends Component {
  render() {
    let token = localStorage.getItem('jwt-token')
    if (!token)
        return <Redirect to="/"/>
    return (
      <div>THIS IS THE ViewPlan PAGE</div>
    );
  }
}

export default ViewPlan;