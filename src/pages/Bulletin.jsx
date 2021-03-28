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
      console.log(foundCourses[0])
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
        {this.state.courses.map(course => {
          return <div className="course-info-item">
            <br /><b>{" " + course.department + " " + course.courseNum}: {course.name}</b>
            <br />{" " + course.description}<br />
            <br /><b> Semesters:</b>{" " + course.semestersOffered.join(", ")}<br />
            {" " + course.credits} credits
            </div>
        })}
      </Container>
    );
  }
}

export default Bulletin;