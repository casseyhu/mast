import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import Pagination from 'react-bootstrap/Pagination';
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
    sortBy: '',
    page: 1,
    numPerPage: Math.ceil((window.innerHeight - 350) / 30),
    maxPage: 1
  }

  addStudent = () => {
    this.props.history.push({
      pathname: '/student/edit'
    })
  }

  setSortField = (field) => {
    this.setState({ sortBy: field }, this.sortStudents)
  }

  sortStudents = () => {
    let sortBy = this.state.sortBy;
    let students = this.state.students;
    students.sort(function (a, b) {
      if (sortBy === "gradSemYear") {
        let aGradSemYear = a.gradYear * 100 + (a.gradSem === "Fall" ? 8 : 2);
        let bGradSemYear = b.gradYear * 100 + (b.gradSem === "Fall" ? 8 : 2);
        return aGradSemYear - bGradSemYear;
      }
      if (typeof a[sortBy] === "string")
        return a[sortBy].localeCompare(b[sortBy]);
      else if (typeof a[sortBy] === "number" || typeof a[sortBy] === "boolean")
        if (a === null)
          return 1;
        else if (b === null)
          return -1;
        return a[sortBy] - b[sortBy];
    });
    this.setState({ students })
  }

  handleResize = () => {
    let numPerPage = Math.max(1, Math.ceil((window.innerHeight - 350) / 30))
    let maxPage = Math.ceil(this.state.students.length / numPerPage)
    this.setState({
      numPerPage: numPerPage,
      maxPage: maxPage,
      page: Math.min(this.state.page, maxPage)
    })
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    axios.get('student'
    ).then(response => {
      this.setState({
        students: response.data,
        numPerPage: Math.ceil((window.innerHeight - 350) / 30),
        maxPage: Math.ceil(response.data.length / Math.ceil((window.innerHeight - 350) / 30))
      });
    }).catch(err => {
      console.log(err)
    });

    // axios.get('courseplanitem/findItem', {
    //   params: {
    //     grade: ""
    //   }
    // }).then(response => {
    //   const foundGrades = response.data;
    //   axios.get('courseplan')
    //     .then(response => {
    //       const coursePlans = response.data
    //       let id_dict = {}
    //       let course_plan_dict = {}
    //       for (let i = 0; i < coursePlans.length; i++) {
    //         id_dict[coursePlans[i].studentId] = coursePlans[i].coursePlanId
    //       }
    //       for (let i = 0; i < coursePlans.length; i++) {
    //         course_plan_dict[coursePlans[i].studentId] =
    //           foundGrades.filter(foundGrade => foundGrade.coursePlanId === id_dict[coursePlans[i].studentId])
    //       }
    //       this.setState({ coursePlan: course_plan_dict })
    //       console.log(this.state.coursePlan)
    //     }).catch(err => {
    //       console.log(err)
    //     })
    // }).catch(err => {
    //   console.log(err)
    // })

  }

  render() {
    let { students, page, numPerPage, maxPage } = this.state;
    return (
      <Container fluid className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Browse Student</h1>
          <Button variant="round" text="+ new student" onClick={() => { this.addStudent() }} style={{ marginTop: '1rem' }} />
        </div>
        {/* <hr style={{margin: "0.5rem 0"}}></hr> */}
        <BrowseSearchbar parentCallback={this.setSortField} />
        <div className="studentTable">
          <table >
            <thead>
              <tr style={{ cursor: "pointer" }}>
                <th scope='col' style={{ width: '13%' }} onClick={() => this.setSortField("lastName")}>Last Name</th>
                <th scope='col' style={{ width: '13%' }} onClick={() => this.setSortField("firstName")}>First Name</th>
                <th scope='col' style={{ width: '12%' }} onClick={() => this.setSortField("sbuId")}>Student ID</th>
                <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("satisfied")}>Satisfied</th>
                <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("pending")}>Pending</th>
                <th scope='col' style={{ width: '8%' }} onClick={() => this.setSortField("unsatisfied")}>Unsatisfied</th>
                <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("department")}>Degree</th>
                <th scope='col' style={{ width: '6%' }} onClick={() => this.setSortField("gpa")}>GPA</th>
                <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("entrySemYear")}>Entry</th>
                <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("gradSemYear")}>Grad</th>
                <th scope='col' style={{ width: '10%' }} onClick={() => this.setSortField("graduated")}>Graduated</th>
              </tr>
            </thead>
            <tbody>
              {students.slice((page - 1) * numPerPage, page * numPerPage).map(function (student) {
                return <tr   >
                  <td className="padleft">{student.lastName}</td>
                  <td className="padleft">{student.firstName}</td>
                  <td className="padleft">{student.sbuId}</td>
                  <td className="center">0</td>
                  <td className="center">0</td>
                  <td className="center">0</td>
                  <td className="center">{student.department}</td>
                  <td className="center">{student.gpa}</td>
                  <td className="center">{student.entrySem.slice(0, 2)} {student.entryYear % 2000}</td>
                  <td className="center">{student.gradSem.slice(0, 2)} {student.gradYear % 2000}</td>
                  <td className="center">{student.graduated ? "Yes" : "No"}</td>
                </tr>
              })}
            </tbody>
          </table>
          <Pagination style={{ float: 'right' }}>
            <Pagination.First disabled={page === 1} onClick={() => this.setState({ page: 1 })} />
            <Pagination.Prev disabled={page === 1} onClick={() => this.setState({ page: Math.max(page - 1, 1) })} />
            {(page > 3) && <Pagination.Ellipsis />}
            {(page - 2 > 0) && (
              <Pagination.Item onClick={() => this.setState({ page: page - 2 })}>{page - 2}</Pagination.Item>
            )}
            {(page - 1 > 0) && (
              <Pagination.Item onClick={() => this.setState({ page: page - 1 })}>{page - 1}</Pagination.Item>
            )}
            <Pagination.Item active >{page}</Pagination.Item>
            {(page + 1 <= maxPage) && (
              <Pagination.Item onClick={() => this.setState({ page: page + 1 })}>{page + 1}</Pagination.Item>
            )}
            {(page + 2 <= maxPage) && (
              <Pagination.Item onClick={() => this.setState({ page: page + 2 })}>{page + 2}</Pagination.Item>
            )}
            {(page + 3 <= maxPage) && <Pagination.Ellipsis />}
            <Pagination.Next disabled={page === maxPage} onClick={() => this.setState({ page: page + 1 })} />
            <Pagination.Last disabled={page === maxPage} onClick={() => this.setState({ page: maxPage })} />
          </Pagination>
        </div>
      </Container>
    );
  }
}

export default Browse;