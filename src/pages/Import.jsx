import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import ImportItem from '../components/ImportItem';
import Button from '../components/Button';
import axios from '../constants/axios';
import { SEMESTERS, YEARS, DEPARTMENTS } from '../constants';

class Import extends Component {
  dropStudents = () => {
    console.log("Dropping students")
    axios.post('student/deleteall', { data: 'nothing' }).then(function (response) {
      console.log(response)
    }).catch(function (err) {
      console.log("Axios DELETE error")
      console.log(err.response.data)

    })
  }

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
          <Button
          variant="round"
          text="Delete Student Data"
          onClick={() => this.dropStudents()}
          style={{ width: '200px'}}
        />
        </div>
      </Container>
    );
  }
}

export default Import;