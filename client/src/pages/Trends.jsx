import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import InputField from '../components/InputField'
class Trends extends Component {
  render() {
    return (
      <Container fluid="lg" className="container">
        <div style={{ margin: '0.2rem 0 0.5rem 0' }}>
          <div className="flex-horizontal justify-content-between">
            <h1>Enrollment Trends</h1>
          </div>
          <div className="flex-horizontal wrap justify-content-between" style={{ width: '100%' }}>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span-reg">Courses</span>
              <InputField
                type="text"
                placeholder="Courses"
                icon="fa fa-search"
                style={{ flexGrow: '1', marginRight: '1rem' }}
              />
            </div>
          </div>
        </div>
      </Container >
    );
  }
}

export default Trends;