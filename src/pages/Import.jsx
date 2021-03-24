import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import ImportItem from '../components/ImportItem';
import jwt_decode from 'jwt-decode';
import { Redirect } from 'react-router-dom';
import { SEMESTERS, YEARS, DEPARTMENTS } from '../constants';

class Import extends Component {
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
      <Container fluid="lg" className="container">
        <h1>Import Data</h1>
        <div className="flex-vertical">
          <ImportItem header="Course Information" type="PDF" sems={SEMESTERS} years={YEARS} depts={DEPARTMENTS} />
          <ImportItem header="Degree Requirements" type="JSON" />
          <ImportItem header="Course Offerings" type="CSV" />
          <ImportItem header="Student Data" first="Profile CSV" type="Course Plan CSV" />
          <ImportItem header="Grades" type="CSV" />
        </div>
      </Container>
    );
  }
}

export default Import;