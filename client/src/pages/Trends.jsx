import React, { Component } from 'react'
import ReactApexChart from 'react-apexcharts'
import Container from 'react-bootstrap/Container'
import Dropdown from '../components/Dropdown'
import Button from '../components/Button'
import axios from '../constants/axios'
import { SEMESTERS, YEARS, SEMESTER_MONTH } from '../constants'


class Trends extends Component {
  state = {
    courses: [],
    items: [],
    fromSem: '',
    fromYear: '',
    toSem: '',
    toYear: '',
    errorMsg: '',
    series: [],
    options: {
      title: {
        text: 'Enrollment Trends',
        align: 'center',
        style: {
          fontFamily: 'Montserrat',
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Semester',
          style: {
            fontFamily: 'Montserrat',
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
          text: 'Enrollment Count',
          style: {
            fontFamily: 'Montserrat',
          },
        }
      },
    },
  }

  selectionHandler = (e) => {
    let value = Array.from(e, option => option.value)
    this.setState({
      courses: value
    })
  }

  createGraph = async (e) => {
    const COURSE_LENGTH = 6
    let startYear = Number(this.state.fromYear)
    let endYear = Number(this.state.toYear)
    if (this.state.courses === [] || this.state.fromSem === '' || this.state.fromYear === '' || this.state.toSem === '' || this.state.toYear === '') {
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
    this.setState({
      errorMsg: ''
    })
    /* Find the range of semesters from start to end */
    let sems = ['Winter', 'Spring', 'Summer', 'Fall']
    let rangeSems = []
    let dashedArray = []
    let width = []
    let currentYear = Number(this.state.fromYear)
    let index = sems.indexOf(this.state.fromSem)
    let goal = this.state.toSem + ' ' + this.state.toYear
    while (sems[index] + ' ' + currentYear !== goal) {
      rangeSems.push(sems[index] + ' ' + currentYear)
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
      - Invalid courses shouldn't be added to graph
        - Make sure courses are of length 6 formatted (done)
        - Make sure the course number is actually a number (done)
        - Check to make sure same department as GPD
        - Must be graduate courses entered (done)
        - Must be valid courses (done)
      - For lower cases in legend, make them upper case (done)
      - Display default title and axis names (done)
    */
    let courses = this.state.courses
    for (let i = 0; i < courses.length; i++) {
      let data = []
      if (courses[i].length !== COURSE_LENGTH || isNaN(parseInt(courses[i].substring(3)))) {
        this.setState({
          errorMsg: 'At least 1 of the courses entered are invalid courses.'
        })
        return
      }
      if (Number(courses[i].substring(3)) < 500) {
        this.setState({
          errorMsg: 'At least 1 of the courses entered are not graduate courses.'
        })
        return
      }
      for (let j = 0; j < rangeSems.length; j++) {
        courses[i] = courses[i].substring(0, 3).toUpperCase() + courses[i].substring(3, 6)
        let semYear = rangeSems[j].split(' ')
        let students = await axios.get('/courseplanitem/count/', {
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
          fontFamily: 'Montserrat',
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
          text: 'Semester',
          style: {
            fontFamily: 'Montserrat',
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
          text: 'Enrollment Count',
          style: {
            fontFamily: 'Montserrat',
          },
        }
      },
      grid: {
        borderColor: '#f1f1f1',
      }
    }

    this.setState({ series, options })
  }

  componentDidMount = async () => {
    if (this.props.dept) {
      let courses = await axios.get('course/deptCourses', {
        params: {
          dept: this.props.dept
        }
      })
      let items = []
      Object.keys(courses.data).map(course => items.push({ label: course, value: course }))
      this.setState({ items })
    }
  }

  render() {
    return (
      <Container fluid='lg' className='container'>
        <div className='flex-horizontal'>
          <h1>Enrollment Trends</h1>
        </div>
        <div className='flex-horizontal wrap justify-content-between' style={{ width: '100%' }}>
          <div className='flex-horizontal fit' style={{ flexGrow: '1' }}>
            <span style={{ width: '65px' }}>Courses</span>
            <Dropdown
              variant='multi'
              className='lr-padding'
              items={this.state.items}
              placeholder='Courses'
              onChange={this.selectionHandler}
              style={{ width: '400px', flexGrow: '1' }}
            />
          </div>
          <div className='flex-horizontal wrap fit' style={{ flexGrow: '1' }}>
            <div className='flex-horizontal fit' style={{ flexGrow: '1' }}>
              <span className='pr-1'>From:</span>
              <Dropdown
                className='lr-padding'
                variant='single'
                items={SEMESTERS}
                placeholder='Semester'
                onChange={e => this.setState({ fromSem: e.value })}
                style={{ width: '140px', flexGrow: '1' }}
              />
              <Dropdown
                className='lr-padding rm-r-small'
                variant='single'
                items={YEARS}
                placeholder='Year'
                onChange={e => this.setState({ fromYear: e.value })}
                style={{ width: '120px', flexGrow: '1' }}
              />
            </div>
            <div className='flex-horizontal fit' style={{ flexGrow: '1' }}>
              <span className='pr-1'>To:</span>
              <Dropdown
                className='lr-padding'
                variant='single'
                items={SEMESTERS}
                placeholder='Semester'
                onChange={e => this.setState({ toSem: e.value })}
                style={{ width: '140px', flexGrow: '1' }}
              />
              <Dropdown
                className='lr-padding'
                variant='single'
                items={YEARS}
                placeholder='Year'
                onChange={e => this.setState({ toYear: e.value })}
                style={{ width: '120px', flexGrow: '1' }}
              />
              <Button
                divclassName='lr-padding'
                variant='round'
                text='go'
                onClick={(e) => this.createGraph(e)}
                style={{ width: '70px', flexGrow: '1', paddingLeft: '0.5rem' }}
              />
            </div>
          </div>
        </div>
        <small className={this.state.errorMsg ? 'error' : ''}>{this.state.errorMsg}</small>
        <br />
        <ReactApexChart options={this.state.options} series={this.state.series} type='line' /*height={550}*/ />

      </Container >
    )
  }
}

export default Trends