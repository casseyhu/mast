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
    coursePlan: {},
    grades: {},
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
    this.setState({ students })
  }

  componentDidMount() {
    axios.get('student'
    ).then(response => {
      this.setState({ students: response.data });
    }).catch(err => {
      console.log(err)
    });

    axios.get('courseplanitem/findItem',{
      params: {
        grade: ""
      }}).then(response => {
        const foundGrades = response.data;
        axios.get('courseplan')
        .then(response => {
          const coursePlans = response.data
          let id_dict = {}
          let course_plan_dict = {}
          for(let i = 0; i < coursePlans.length; i++){
            id_dict[coursePlans[i].studentId] = coursePlans[i].coursePlanId
          }
          for(let i = 0; i < coursePlans.length; i++){
            course_plan_dict[coursePlans[i].studentId] = 
                        foundGrades.filter(foundGrade => foundGrade.coursePlanId === id_dict[coursePlans[i].studentId])
          }
          this.setState({ coursePlan: course_plan_dict })
          console.log(this.state.coursePlan)
        }).catch(err => {
          console.log(err)
        })
      }).catch(err => {
        console.log(err)
      })
    
}

  render() {
    return (
      <Container fluid className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Browse Student</h1>
          <Button variant="round" text="+ new student" onClick={() => { this.addStudent() }} style={{ marginTop: '1.5rem' }} />
        </div>
        <div >
          <BrowseSearchbar parentCallback={this.setSortField} />
          <div className="studentTable">
            <table className="studentTable" style={{ borderColor: 'inherit' }}>
              <thead>
                <tr style={{ cursor: "pointer" }}>
                  <th scope='col' style={{ width: '13%' }} onClick={() => this.setSortField("lastName")}>Last Name</th>
                  <th scope='col' style={{ width: '13%' }} onClick={() => this.setSortField("firstName")}>First Name</th>
                  <th scope='col' style={{ width: '12%' }} onClick={() => this.setSortField("sbuId")}>Student ID</th>
                  <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("satisfied")}>Satisfied</th>
                  <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("pending")}>Pending</th>
                  <th scope='col' style={{ width: '8%' }} onClick={() => this.setSortField("unsatisfied")}>Unsatisfied</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("degree")}>Degree</th>
                  <th scope='col' style={{ width: '6%' }} onClick={() => this.setSortField("gpa")}>GPA</th>
                  <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("entrySemYear")}>Entry</th>
                  <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("gradSemYear")}>Grad</th>
                  <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("graduated")}>Graduated</th>
                </tr>
              </thead>
              <tbody>
                {this.state.students && this.state.students.map(function (student) {
                  return <tr   >
                    <td className="padleft">{student.lastName}</td>
                    <td className="padleft">{student.firstName}</td>
                    <td className="padleft">{student.sbuId}</td>
                    <td className="center">0</td>
                    <td className="center">0</td>
                    <td className="center">0</td>
                    <td className="center">{student.department}</td>
                    <td className="center">{student.gpa}</td>
                    <td className="center">{student.entrySem == "Fall" ? "Fa" : "Sp"} {student.entryYear % 2000}</td>
                    <td className="center">{student.gradSem == "Fall" ? "Fa" : "Sp"} {student.gradYear % 2000}</td>
                    <td className="center">{student.graduated ? "Yes" : "No"}</td>
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