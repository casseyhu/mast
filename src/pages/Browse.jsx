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
    sortBy: ""
  }

  addStudent = () => {
    this.props.history.push({
      pathname: '/student/edit'
    })
    console.log("redirect to add student page")
  }

  setSortField = (field) => {
    console.log("User pressed search, query happened, back in Browse.jsx")
    this.setState({ sortBy: field }, this.sortStudents)
  }

  sortStudents = () => {
    let sortBy = this.state.sortBy;
    let students = this.state.students;
    students.sort(function (a, b) {
      if (sortBy === "gradSemYear") {
        let aGradSemYear = a.gradYear * 100 + (a.gradSem == "Fall" ? 8 : 2);
        let bGradSemYear = b.gradYear * 100 + (b.gradSem == "Fall" ? 8 : 2);
        return aGradSemYear - bGradSemYear;
      }
      if (typeof a[sortBy] === "string")
        return a[sortBy].localeCompare(b[sortBy]);
      else if (typeof a[sortBy] === "number" || typeof a[sortBy] === "boolean")
        return a[sortBy] - b[sortBy];
    });
    this.setState({students})
  }

  componentDidMount() {
    axios.get('/student'
    ).then(response => {
      const foundStudents = response.data;
      this.setState({students: foundStudents});
    }).catch(err => {
      console.log(err)
    }); 

    axios.get('/degree'
    ).then(response => {
      const foundDegrees = response.data;
      const students = this.state.students;
      let degrees = {}
      for (let i = 0; i < foundDegrees.length; i++) {
        degrees[foundDegrees[i].degreeId] = foundDegrees[i].dept;
      }
      for (let i = 0; i < students.length; i++) {
        students[i].degree = degrees[students[i].degreeId];
      }
      this.setState({students});
    }).catch(err => {
      console.log(err)
    });  
  }

  render() {
    return (
      <Container fluid className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Browse Student</h1>
          <Button variant="round" text="+ new student" onClick={() => { this.addStudent() }} style={{ marginTop: '1.5rem' }} />
        </div>
        <div >
          <BrowseSearchbar parentCallback={this.setSortField}/>
          <div className="studentTable">
            <table className="studentTable" style={{ borderColor: 'inherit' }}>
              <thead>
                <tr style={{cursor: "pointer"}}>
                  <th scope='col' style={{ width: '13%' }} onClick={() => this.setSortField("lastName")}>Last Name</th>
                  <th scope='col' style={{ width: '12%' }} onClick={() => this.setSortField("firstName")}>First Name</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("sbuId")}>Student ID</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("satisfied")}>Satisfied</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("pending")}>Pending</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("unsatisfied")}>Unsatisfied</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("degree")}>Degree</th>
                  <th scope='col' style={{ width: '5%' }} onClick={() => this.setSortField("gpa")}>GPA</th>
                  <th scope='col' style={{ width: '5%' }} onClick={() => this.setSortField("entrySemYear")}>Entry</th>
                  <th scope='col' style={{ width: '5%' }} onClick={() => this.setSortField("gradSemYear")}>Grad</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("graduated")}>Graduated</th>
                </tr>
              </thead>
              <tbody>
                {this.state.students && this.state.students.map(function (student) {
                  return <tr>
                    <td>{student.lastName}</td>
                    <td>{student.firstName}</td>
                    <td>{student.sbuId}</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>{student.degree}</td>
                    <td>{student.gpa}</td>
                    <td>{student.entrySem == "Fall" ? "F" : "S"} {student.entryYear%2000}</td>
                    <td>{student.gradSem == "Fall" ? "F" : "S"} {student.gradYear%2000}</td>
                    <td>{student.graduated ? "Yes" : "No"}</td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    );
  }
}

export default Browse;