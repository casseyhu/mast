import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import Dropdown from '../components/Dropdown';
import { DEPARTMENTS } from '../constants';
import axios from '../constants/axios';

class Bulletin extends Component {
  state = {
    user: this.props.user,
    text: "",
    courses: [],
  }

  setDept = (e) => {
    this.setState({
      dept: e.value
    })

    axios.get('/course', {
      params: {
        dept: e.value
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

  render() {
    let { user } = this.state;
    return (
      <Container fluid="lg" className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Bulletin</h1>
          {user === "gpd" && (
            <Dropdown
              variant="single"
              items={DEPARTMENTS}
              onChange={this.setDept}
              style={{ marginTop: '1.5rem' }}
            />
          )}
        </div>
        <div className="information_box">
          {this.state.courses.map(course => {
            return <div>
              <b style={{ borderBottom: '2px solid var(--grey)' }}>
                {course.department + " " + course.courseNum}: {course.name}
              </b>
              <br />{course.description}<br />
              <br /><b>Semesters:</b>{" " + course.semestersOffered.join(", ")}<br />
              <b>Prerequisites:</b>{course.prereqs[0] !== "" ? " " + course.prereqs.toString().replace(",", ", ") : " None"} <br />
              {course.credits} {(course.credits !== 1) ? "credits" : "credit"}
              <br/> <br/>
            </div>
          })}
        </div>
      </Container>
    );
  }
}

export default Bulletin;