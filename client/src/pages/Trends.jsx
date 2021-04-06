import React, { Component } from 'react';
import { Chart } from 'react-charts'
import Container from "react-bootstrap/Container";
import InputField from '../components/InputField'
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import { SEMESTERS, YEARS } from '../constants'
class Trends extends Component {
  state = {
    courses: '',
    fromSem: '',
    fromYear: '',
    toSem: '',
    toYear: '',
  }

  createGraph = (e) => {

  }
  handleSelection = (e) => {

  }

  MyChart() {
    const data = React.memo(
      () => [
        {
          label: 'Series 1',
          data: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }]
        },
        {
          label: 'Series 2',
          data: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }]
        },
        {
          label: 'Series 3',
          data: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }]
        }
      ],
      []
    )
   
    const axes = React.memo(
      () => [
        { primary: true, type: 'linear', position: 'bottom' },
        { type: 'linear', position: 'left' }
      ],
      []
    )
  }
  render() {
    return (
      <Container fluid="lg" className="container">
        <div style={{ margin: '0.2rem 0 0.5rem 0' }}>
          <div className="flex-horizontal justify-content-between">
            <h1>Enrollment Trends</h1>
          </div>
          <div className="flex-horizontal wrap justify-content-between" style={{ width: '100%' }}>
            <div className="flex-horizontal" style={{ width: 'fit-content', flexGrow: '1.5' }}>
              <span className="filter-span-reg">Courses</span>
              <InputField
                type="text"
                placeholder="Courses"
                style={{ flexGrow: '0.8', marginRight: '1rem' }}
              />
              <span className="trends-span-reg">From</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={e => this.handleSelection(e)}
                style={{ marginRight: '0.1rem', width: '10%' }}
              />
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={e => this.handleSelection(e)}
                style={{ marginRight: '0.7rem', width: '10%' }}
              />
              <span className="trends-span-reg">To</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={e => this.handleSelection(e)}
                style={{ marginRight: '0.1rem', width: '10%' }}
              />
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={e => this.handleSelection(e)}
                style={{ marginRight: '1rem', width: '10%' }}
              />
              <Button
                variant="round"
                text="go"
                onClick={(e) => this.createGraph(e)}
                style={{ width: '70px' }}
              />
            </div>
          </div>
        </div>
      </Container >
    );
  }
}

export default Trends;