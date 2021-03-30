import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import axios from '../constants/axios';

class AddEditStudent extends Component {
  state = {
    type: 'Add',
    user: this.props.user,
    requirements: []
  }

  componentDidMount = () => {
    axios.get('requirements', {params: {
      department: 'CSE',
      track: 'Advanced Project'
    }}).then(results => {
      console.log(results.data)
      this.setState({requirements: results.data})
    })
  }


  render() {
    let { type } = this.state;
    return (
      <Container fluid="lg" className="container">
        <h1>{type} Student</h1>
        <StudentInfo />
        <Requirements requirements={this.state.requirements} />
      </Container>
    );
  }
}

export default AddEditStudent;