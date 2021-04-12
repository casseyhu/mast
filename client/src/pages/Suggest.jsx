import React, { Component } from 'react';
import CoursePlan from '../components/CoursePlan';
import Container from "react-bootstrap/Container";
import Button from '../components/Button';

class Suggest extends Component {
  render() {
    return (
      <Container fluid="lg" className="container">
        <div className="flex-horizontal justify-content-between">
          <h1>Suggest Course Plan</h1>
          <Button variant="round" text="Save Changes" />
        </div>
      </Container>
    );
  }
}

export default Suggest;