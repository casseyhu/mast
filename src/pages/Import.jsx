import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import ImportItem from '../components/ImportItem';
import { SEMESTERS, YEARS, DEPARTMENTS } from '../constants';

class Import extends Component {
  render() {
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