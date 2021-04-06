import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import InputField from '../components/InputField'
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import { SEMESTERS, YEARS, SEMESTER_MONTH, MONTH_SEMESTER } from '../constants'
class Trends extends Component {
  state = {
    courses: '',
    fromSem: '',
    fromYear: '',
    toSem: '',
    toYear: '',
    errorMsg: ''
  }

  createGraph = (e) => {
    let startYear = Number(this.state.fromYear)
    let endYear = Number(this.state.toYear)
    if (this.state.courses === '' || this.state.fromSem === '' || this.state.fromYear === '' || this.state.toSem === '' || this.state.toYear === '') {
      this.setState({
        errorMsg: ''
      })
      return
    }
    else if (startYear > endYear || (startYear === endYear && Number(SEMESTER_MONTH[this.state.fromSem]) > Number(SEMESTER_MONTH[this.state.toSem]))) {
      this.setState({
        errorMsg: 'Start semester and year must happen before end semester and year'
      })
      return
    }
    /* Find the range of semesters from start to end */
    let sems = ['Winter', 'Spring', 'Summer', 'Fall']
    let rangeSems = []
    let currentYear = Number(this.state.fromYear)
    let index = sems.indexOf(this.state.fromSem)
    let goal = this.state.toSem + " " + this.state.toYear
    while (sems[index] + " " + currentYear !== goal) {
      rangeSems.push(sems[index] + " " + currentYear)
      if (index >= sems.length - 1) {
        index = 0
        currentYear += 1
      }
      else
        index += 1
    }
    rangeSems.push(goal)
    console.log(rangeSems)

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
                onChange={e => this.setState({ courses: e.target.value })}
                style={{ flexGrow: '0.8', marginRight: '1rem' }}
              />
              <span className="trends-span-reg">From</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={e => this.setState({ fromSem: e.value })}
                style={{ marginRight: '0.1rem', width: '10%' }}
              />
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={e => this.setState({ fromYear: e.value })}
                style={{ marginRight: '0.7rem', width: '10%' }}
              />
              <span className="trends-span-reg">To</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={e => this.setState({ toSem: e.value })}
                style={{ marginRight: '0.1rem', width: '10%' }}
              />
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={e => this.setState({ toYear: e.value })}
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