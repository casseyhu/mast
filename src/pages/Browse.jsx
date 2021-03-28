import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import Button from '../components/Button';
// import Dropdown from '../components/Dropdown';
import axios from '../constants/axios';
import BrowseSearchbar from '../components/BrowseSearchbar';


class Browse extends Component {
  // the list can be filtered in various ways:
  // including student name (partial match),
  // graduation semester, course plan validity, and course plan completeness. 
  // for example, the GPD might want to list the students who plan to graduate 
  // in the coming semester and whose course plan is incomplete.

  // We will always show the list in ascending lastName by default. 
  state = {
    students: [],
  }

  addStudent = () => {
    this.props.history.push({
      pathname: '/student/edit'
    })
    console.log("redirect to add student page")
  }

  searchCallback = (searchResults) => {
    console.log("User pressed search, query happened, back in Browse.jsx")
    this.setState({ students: searchResults })
  }

  render() {
    return (
      <Container fluid className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Browse Student</h1>
          <Button variant="round" text="+ new student" onClick={() => { this.addStudent() }} style={{ marginTop: '1.5rem' }}/>
        </div>
        <div className="student_box">
        <BrowseSearchbar parentCallback={this.searchCallback} />
        <div className="studentTable">
          <table className="studentTable" style={{ borderColor: 'inherit' }}>
            <thead>
              <tr>
                <th scope='col' style={{ width: '10%' }}>Last Name</th>
                <th scope='col' style={{ width: '10%' }}>First Name</th>
                <th scope='col' style={{ width: '10%' }}>Student ID</th>
                <th scope='col' style={{ width: '10%' }}>Satisfied</th>
                <th scope='col' style={{ width: '10%' }}>Pending</th>
                <th scope='col' style={{ width: '10%' }}>Unsatisfied</th>
                <th scope='col' style={{ width: '10%' }}>Degree</th>
                <th scope='col' style={{ width: '10%' }}>GPA</th>
                <th scope='col' style={{ width: '10%' }}>Entry</th>
                <th scope='col' style={{ width: '10%' }}>Grad</th>
              </tr>
            </thead>
            <tbody>

            </tbody>
          </table>
        </div>
        {this.state.students && this.state.students.map(function (course) {
          return
          // <div>
          // Student data here, map it to be a row in a table as per our wireframe. 
          // </div>
        })}
        </div>
      </Container>
    );
  }
}

export default Browse;