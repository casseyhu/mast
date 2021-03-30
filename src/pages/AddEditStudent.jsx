import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';

class AddEditStudent extends Component {
  state = {
    type: 'Add',
    user: this.props.user
  }

  componentDidMount = () => {

  }
  

  render() {
    let { type } = this.state;
    return (
      <Container fluid="lg" className="container">
        <h1>{type} Student</h1>
        <StudentInfo/>
        <Requirements />
      </Container>
    );
  }
}

export default AddEditStudent;