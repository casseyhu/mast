import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import Container from "react-bootstrap/Container";
import Dropdown from '../components/Dropdown';
import { DEPARTMENTS } from '../constants';
import { Redirect } from 'react-router-dom';
import axios from '../constants/axios';

class Bulletin extends Component {
  state = {
    text: "",
    courses: [],
  }

  setDept = (e) =>{
    this.setState({
      dept: e.value
    })

    axios.get('/course',{
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
    let token = localStorage.getItem('jwt-token')
    var decoded = jwt_decode(token)
    if (!token)
        return <Redirect to="/"/>
    return (
      <Container fluid="lg" className="container">
        <div className="flex-horizontal">
          <h1 style={{position: 'relative',width: '85%'}}>Bulletin</h1>
          <div style={{position: 'relative', marginTop: '1.5rem'}}>
            <Dropdown variant="single" items={DEPARTMENTS} onChange={this.setDept} disabled={decoded.type==="student"}></Dropdown>
          </div>
      </div>
      <div className="information_box">
        {this.state.courses && this.state.courses.map(function (course){
          return <div>
            <br/><b>{" " + course.courseId.substring(0, 3) + " " + course.courseId.substring(3, 6)}: {course.name}</b>
            <br/>{" " + course.description}<br/>
            <br/><b> Semesters:</b>{" " + course.semestersOffered.toString().replace(",", ", ")}<br/>
            {" " + course.credits} credits</div>
        })}
      </div>
      </Container>
    );
  }
}

export default Bulletin;