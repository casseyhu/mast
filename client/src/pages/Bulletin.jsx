import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import Dropdown from '../components/Dropdown';
import { SEMESTERS, YEARS, CURRENT_SEMESTER, CURRENT_YEAR } from '../constants';
import axios from '../constants/axios';

class Bulletin extends Component {

  state = {
    type: this.props.type,
    dept: this.props.user.department,
    text: '',
    courses: [],
    semester: CURRENT_SEMESTER,
    year: CURRENT_YEAR
  }

  setSemester = (e) => {
    this.setState({
      semester: e.value
    }, () => {
      if (this.state.year)
        this.showCourses();
    })
  }

  setYear = (e) => {
    this.setState({
      year: e.value
    }, () => {
      if (this.state.semester)
        this.showCourses();
    })
  }

  showCourses = () => {
    axios.get('/course', {
      params: {
        dept: this.state.dept,
        semester: this.state.semester,
        year: Number(this.state.year)
      }
    }).then(response => {
      const foundCourses = response.data;
      this.setState({
        courses: foundCourses
      })
    }).catch(err => {
      console.log(err)
    });
  }

  componentDidMount() {
    this.showCourses()
  }

  render() {
    return (
      <Container fluid="lg" className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Bulletin</h1>
          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <Dropdown
              variant="single"
              items={SEMESTERS}
              placeholder="Semester"
              value={{ label: this.state.semester, value: this.state.semester }}
              onChange={this.setSemester}
              style={{ margin: '1rem 1rem 0 0' }}
            />
            <Dropdown
              variant="single"
              items={YEARS}
              placeholder="Year"
              value={{ label: this.state.year, value: this.state.year }}
              onChange={this.setYear}
              style={{ margin: '1rem 0 0 0' }}
            />
          </div>
        </div>
        <div className="">
          {this.state.courses.map(course => {
            return <div>
              <b style={{ borderBottom: '2px solid var(--grey)' }}>
                {course.department + " " + course.courseNum}: {course.name}
              </b>
              <br />{course.description}<br />
              <br /><b>Semesters:</b>{" " + course.semestersOffered.join(", ")}<br />
              <b>Prerequisites:</b>{course.prereqs[0] !== "" ? " " + course.prereqs.toString().replace(",", ", ") : " None"} <br />
              {course.credits} {(course.credits !== 1) ? "credits" : "credit"}
              <br /> <br />
            </div>
          })}
        </div>
      </Container>
    );
  }
}

export default Bulletin;