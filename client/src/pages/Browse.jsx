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
    grades: {},
    sortBy: '',
    filters: {},
    page: 1,
    numPerPage: Math.ceil((window.innerHeight - 350) / 30),
    maxPage: 1,
    ascending: {}
  }

  addStudent = () => {
    this.props.history.push({
      pathname: '/student',
      state: { 
        mode: 'Add',
        student: '',
        items: []
      }
    })
  }

  viewStudent = (student) => {
    axios.get('/courseplanitem/findItems', {
      params: {
        studentId: student.sbuId
      }
    }).then(response => {
      this.props.history.push({
        pathname: '/student',
        state: {
          mode: 'View',
          student: student,
          items: response.data
        }
      })
    }).catch(err => {
      console.log(err)
    });
  }

  setFilter = (filters) => {
    this.setState({ filters }, this.filter)
  }

  setSortField = (field, value) => {
    if (value == null) {
      if (this.state.ascending[field] == null) {
        this.setState({
          ascending: {
            [field]: true
          }
        })
      }
      else {
        this.setState({
          ascending: {
            [field]: !this.state.ascending[field]
          }
        })
      }
    }
    else {
      this.setState({
        ascending: {
          [field]: value
        }
      })
    }
    this.setState({ sortBy: field }, this.sortStudents);
  }

  filter = () => {
    axios.get('/student/filter', {
      params: {
        firstName: this.state.filters['firstName'],
        lastName: this.state.filters['lastName'],
        sbuId: this.state.filters['sbuId'],
        entrySem: this.state.filters['entrySem'],
        entryYear: this.state.filters['entryYear'],
        degree: this.state.filters['degree'],
        gradSem: this.state.filters['gradSem'],
        gradYear: this.state.filters['gradYear'],
        track: this.state.filters['track'],
        graduated: this.state.filters['graduated']
      }
    }).then(response => {
      this.setState({ students: response.data }, this.handleResize)
      this.setSortField(this.state.sortBy, this.state.ascending[this.state.sortBy])
    }).catch(err => {
      console.log(err)
    });
  }

  sortStudents = () => {
    let sortBy = this.state.sortBy;
    let students = this.state.students;
    let ascending = this.state.ascending[sortBy];
    students.sort(function (a, b) {
      if (sortBy === "gradSemYear") {
        let aGradSemYear = a.gradYear * 100 + (a.gradSem === "Fall" ? 8 : 2);
        let bGradSemYear = b.gradYear * 100 + (b.gradSem === "Fall" ? 8 : 2);
        return ascending ? aGradSemYear - bGradSemYear : bGradSemYear - aGradSemYear;
      }
      if (typeof a[sortBy] === "string")
        return ascending ? a[sortBy].localeCompare(b[sortBy]) : b[sortBy].localeCompare(a[sortBy]);
      else if (typeof a[sortBy] === "number" || typeof a[sortBy] === "boolean")
        if (a === null)
          return ascending ? 1 : -1;
        else if (b === null)
          return ascending ? -1 : 1;
      return ascending ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
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
          <Button variant="round" text="+ new student" onClick={this.addStudent} style={{ marginTop: '1rem' }} />
        </div>
        <BrowseSearchbar sortField={this.setSortField} filter={this.setFilter} />
        <div className="studentTable">
          <table >
            <thead>
              <tr style={{ cursor: "pointer" }}>
                <th scope='col' style={{ width: '12%' }} onClick={() => this.setSortField("lastName", null)}>Last Name</th>
                <th scope='col' style={{ width: '12%' }} onClick={() => this.setSortField("firstName", null)}>First Name</th>
                <th scope='col' style={{ width: '12%' }} onClick={() => this.setSortField("sbuId", null)}>Student ID</th>
                <th scope='col' style={{ width: '7%' }} onClick={() => this.setSortField("satisfied", null)}>S/P/U</th>
                <th scope='col' style={{ width: '8%' }} onClick={() => this.setSortField("department", null)}>Degree</th>
                <th scope='col' style={{ width: '20%' }} onClick={() => this.setSortField("track", null)}>Track</th>
                <th scope='col' style={{ width: '6%' }} onClick={() => this.setSortField("gpa", null)}>GPA</th>
                <th scope='col' style={{ width: '6%' }} onClick={() => this.setSortField("entrySemYear", null)}>Entry</th>
                <th scope='col' style={{ width: '6%' }} onClick={() => this.setSortField("gradSemYear", null)}>Grad</th>
                <th scope='col' style={{ width: '8%' }} onClick={() => this.setSortField("graduated", null)}>Graduated</th>
              </tr>
            </thead>
            <tbody>
              {students.slice((page - 1) * numPerPage, page * numPerPage).map((student, i) => {
                return <tr key={i} onClick={(e) => this.viewStudent(student)} style={{ cursor: 'pointer' }}>
                  <td className="padleft">{student.lastName}</td>
                  <td className="padleft">{student.firstName}</td>
                  <td className="padleft">{student.sbuId}</td>
                  <td className="center">{student.satisfied}/{student.pending}/{student.unsatisfied}</td>
                  <td className="center">{student.department}</td>
                  <td className="center">{student.track.substring(0, 22)}{student.track.length > 22 ? '...' : ''}</td>
                  <td className="center">{(student.gpa === null) ? "N/A" : Number(student.gpa).toFixed(2)}</td>
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
            {!(page - 2 > 0) && (page + 3 <= maxPage) && (
              <Pagination.Item onClick={() => this.setState({ page: page + 3 })}>{page + 3}</Pagination.Item>
            )}
            {!(page - 1 > 0) && (page + 4 <= maxPage) && (
              <Pagination.Item onClick={() => this.setState({ page: page + 4 })}>{page + 4}</Pagination.Item>
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