import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import Container from "react-bootstrap/Container";
import Dropdown from '../components/Dropdown';
import { DEPARTMENTS } from '../constants';
import { Redirect } from 'react-router-dom';
class Bulletin extends Component {
  setDept = (e) =>{
    console.log(e)
    this.setState({
      dept: e.value
    })
  }
  render() {
    let token = localStorage.getItem('jwt-token')
    var decoded = jwt_decode(token)
    if (!token)
        return <Redirect to="/"/>
    return (
      <Container fluid="lg" className="container">
        <div className="flex-horizontal">
          <h1 style={{position: 'relative',width: '85%'}}>Bulletin</h1>
          <div style={{position: 'relative', marginTop: '5px'}}>
            <Dropdown variant="single" items={DEPARTMENTS} onChange={this.setDept} disabled={decoded.type==="student"}></Dropdown>
          </div>
      </div>
      <div className="flex-vertical">
        {/* <div className="box" style={{width: '95%', position: 'relative', borderStyle:'solid'}}>
          fa
        </div> */}
      </div>
      </Container>
    );
  }
}

export default Bulletin;