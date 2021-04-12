import React, { Component } from 'react';
import ReactApexChart from 'react-apexcharts'
import Container from "react-bootstrap/Container";
import InputField from '../components/InputField'
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import axios from '../constants/axios';
import { SEMESTERS, YEARS, SEMESTER_MONTH } from '../constants'


class Trends extends Component {
  state = {
    courses: '',
    fromSem: '',
    fromYear: '',
    toSem: '',
    toYear: '',
    errorMsg: '',
    series: [],
    options: {}
  }

  createGraph = async (e) => {
    let startYear = Number(this.state.fromYear)
    let endYear = Number(this.state.toYear)
    if (this.state.courses === '' || this.state.fromSem === '' || this.state.fromYear === '' || this.state.toSem === '' || this.state.toYear === '') {
      this.setState({
        errorMsg: 'Must enter all required fields.'
      })
      return
    }
    else if (startYear > endYear || (startYear === endYear && SEMESTER_MONTH[this.state.fromSem] > SEMESTER_MONTH[this.state.toSem])) {
      this.setState({
        errorMsg: 'Start semester and year must happen before end semester and year.'
      })
      return
    }
    /* Find the range of semesters from start to end */
    let sems = ['Spring', 'Fall']
    let rangeSems = []
    let dashedArray = []
    let width = []
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
    let series = []
    /*
      Error Checking for courses
      - Invalid courses shouldn't be added
        - Make sure courses are of length 6
        - Make sure the course number is actually a number
      - For lower cases in legend, make them upper case
    */
    let courses = [...new Set(this.state.courses.replace(/\s+/g, ' ').trim().split(' '))]
    console.log(courses)
    for (let i = 0; i < courses.length; i++) {
      let data = []
      for (let j = 0; j < rangeSems.length; j++) {
        courses[i] = courses[i].substring(0, 3).toUpperCase() + courses[i].substring(3, 6)
        let semYear = rangeSems[j].split(' ')
        console.log(courses[i], semYear[0], semYear[1])
        let students = await axios.get('/courseplanitem/count', {
          params: {
            courseId: courses[i],
            semester: semYear[0],
            year: Number(semYear[1])
          }
        })
        data.push(students.data.length)
      }
      series.push({ name: courses[i], data: data })
      dashedArray.push(1) // dashed lines for graph
      width.push(5) //stroke size of lines
    }

    //Setting the options
    let options = {
      chart: {
        height: 500,
        type: 'line',
        zoom: {
          enabled: true
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: width,
        curve: 'straight',
        dashArray: dashedArray
      },
      title: {
        text: 'Enrollment Trends',
        align: 'center',
        style: {
          fontFamily: "Montserrat",
        },
      },
      legend: {
        tooltipHoverFormatter: function (val, opts) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + ''
        }
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        categories: rangeSems,
        title: {
          text: "Semester",
          style: {
            fontFamily: "Montserrat",
          },
        }
      },
      yaxis: {
        show: true,
        labels: {
          show: true,
          align: 'right',
          minWidth: 0,
          maxWidth: 160,
        },
        title: {
          text: "Enrollment Count",
          style: {
            fontFamily: "Montserrat",
          },
        }
      },
      grid: {
        borderColor: '#f1f1f1',
      }
    }

    this.setState({ series, options })
    console.log(series)
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
              value={this.state.courses}
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
        <br />
        <ReactApexChart options={this.state.options} series={this.state.series} type="line" /*height={550}*/ />

      </Container >
    );
  }
}

export default Trends;