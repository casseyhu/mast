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
        <div className="flex-horizontal">
          <h1>Enrollment Trends</h1>
        </div>
        <div className="flex-horizontal wrap justify-content-between" style={{ width: '100%' }}>
          <div className="flex-horizontal" style={{ width: 'fit-content', flexGrow: '1' }}>
            <span style={{ width: '65px' }}>Courses</span>
            <InputField
              className="lr-padding rm-r-small"
              type="text"
              placeholder="Courses"
              onChange={e => this.setState({ courses: e.target.value })}
              style={{ flexGrow: '1' }}
            />
          </div>
          <div className="flex-horizontal wrap" style={{ width: 'fit-content', flexGrow: '1' }}>
            <div className="flex-horizontal" style={{ width: 'fit-content', flexGrow: '1' }}>
              <span className="trends-span">From:</span>
              <Dropdown
                className="lr-padding"
                variant="single"
                items={SEMESTERS}
                placeholder="Semester"
                onChange={e => this.setState({ fromSem: e.value })}
                style={{ width: '140px', flexGrow: '1' }}
              />
              <Dropdown
                className="lr-padding rm-r-small"
                variant="single"
                items={YEARS}
                placeholder="Year"
                onChange={e => this.setState({ fromYear: e.value })}
                style={{ width: '120px', flexGrow: '1' }}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content', flexGrow: '1' }}>
              <span className="trends-span">To:</span>
              <Dropdown
                className="lr-padding"
                variant="single"
                items={SEMESTERS}
                placeholder="Semester"
                onChange={e => this.setState({ toSem: e.value })}
                style={{ width: '140px', flexGrow: '1' }}
              />
              <Dropdown
                className="lr-padding"
                variant="single"
                items={YEARS}
                placeholder="Year"
                onChange={e => this.setState({ toYear: e.value })}
                style={{ width: '120px', flexGrow: '1' }}
              />
              <Button
                divclassName="lr-padding"
                variant="round"
                text="go"
                onClick={(e) => this.createGraph(e)}
                style={{ width: '70px', flexGrow: '1', paddingLeft: '0.5rem' }}
              />
            </div>
          </div>
        </div>
      </Container >
    );
  }
}

export default Trends;