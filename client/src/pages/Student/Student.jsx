import React, { Component } from 'react'
import Container from 'react-bootstrap/Container'
import CenteredModal from '../../components/Modal'
import StudentInfo from './StudentInfo'
import Requirements from './Requirements'
import CoursePlan from './CoursePlan'
import axios from '../../constants/axios'

class Student extends Component {
  state = {
    showUpdateError: false,
    showConfirmation: false,
    showEmailBox: false,
    showEmailConf: false,
    errorMsg: '',
    visible: 'hidden',
    mode: this.props.location.state ? this.props.location.state.mode : this.props.mode,
    studentInfoParams: {},
    department: this.props.location.state ? this.props.location.state.department : this.props.department,
    student: this.props.student ? this.props.student : (this.props.location.state ? this.props.location.state.student : 'Invalid')
  }

  setStudentInfo = async () => {
    const { student, department } = this.state
    if (department === '')
      return
    let studentRes = await axios.get('/student/' + student.sbuId, {
      params: { sbuId: student.sbuId }
    })
    let coursePlanItems = await axios.get('/courseplanitem/findItems/', {
      params: {
        sbuId: student.sbuId
      }
    })
    let requirements = await axios.get('/requirements/', {
      params: {
        department: department,
        track: studentRes.data.track,
        degreeId: studentRes.data.degreeId
      }
    })
    let requirementStates = await axios.get('/student/requirementStates/', {
      params: { sbuId: student.sbuId }
    })
    let reqStateMap = {}
    for (let req of requirementStates.data)
      reqStateMap[req.requirementId] = [req.state, req.metaData]

    this.setState({
      student: studentRes.data,
      studentInfoParams: {
        coursePlan: coursePlanItems.data,
        requirements: requirements.data,
        requirementStates: reqStateMap
      }
    })
  }

  componentDidMount = () => {
    if (this.state.student === 'Invalid')
      this.props.history.push('/')
    if (this.state.mode === 'Add')
      return
    this.setStudentInfo()
  }

  createStudent = (studentInfo, commentAdded) => {
    /* Add new student into the db */
    axios.post('/student/create/', {
      params: studentInfo
    }).then(response => {
      let field = commentAdded ? 'showEmailBox' : 'showConfirmation'
      this.setState({
        student: response.data,
        errorMsg: '',
        [field]: true
      }, () => this.setStudentInfo())
    }).catch((err) => {
      this.setState({ errorMsg: err.response.data })
      console.log(err.response.data)
    })
  }

  modeHandler = async (studentInfo) => {
    this.setState({ errorMsg: '' })
    const { mode, student } = this.state
    if (mode === 'Add') {
      // GPD added a comment
      if (studentInfo.gpdComments.length)
        this.createStudent(studentInfo, true)
      else
        this.createStudent(studentInfo, false)
    }
    else if (mode === 'View')
      this.setState({ mode: 'Edit' })
    else {
      // Gets the student's inforation that we have in the database. 
      let dbStudentInfo = await axios.get('/student/' + student.sbuId, {
        params: student.sbuId
      })
      let isSame = true
      Object.keys(dbStudentInfo.data).map(info =>
        (info === 'updatedAt') ? '' :
          dbStudentInfo.data[info] !== student[info] ? isSame = false : '')
      // show update error modal if data has been edited by another user
      if (!isSame) {
        this.setState({ showUpdateError: true }, this.setStudentInfo)
        return
      }
      let commentBefore = student.gpdComments
      let commentAfter = studentInfo.gpdComments
      /* Saving student info, UPDATE student in the db*/
      axios.post('/student/update/', {
        params: studentInfo
      }).then(response => {
        //GPD comment has changed
        if (commentBefore !== commentAfter)
          this.setState({ showEmailBox: true })
        else
          this.setState({ showConfirmation: true })
      }).catch((err) => {
        this.setState({ errorMsg: err.response.data })
      })
    }
  }

  changeMode = () => {
    this.setState({
      showConfirmation: false,
      mode: 'View'
    }, this.setStudentInfo)
  }

  notify = () => {
    this.setState({
      visible: 'visible'
    }, () => {
      axios.post('/email/send/', {
        params: {
          email: 'sooyeon.kim.2@stonybrook.edu',
          subject: 'GPD updated comments',
          text: 'Check GPD\'s comments'
        }
      }).then((response) => {
        this.setState({
          visible: 'hidden',
          showEmailBox: false,
          showEmailConf: true
        })
      }).catch((err) => {
        console.log(err)
      })
    })
  }

  showDegree = (degree) => {
    let requirementState = {}
    if (degree[0])
      requirementState['GR' + degree[0].requirementId] = ['unsatisfied', []]
    requirementState['G' + degree[1].requirementId] = ['unsatisfied', []]
    requirementState['CR' + degree[2].requirementId] = ['unsatisfied', []]
    for (let course of degree[3]) {
      if (course.type !== 0)
        requirementState['C' + course.requirementId] = ['unsatisfied', []]
    }
    // console.log(requirementState)
    this.setState({
      studentInfoParams: {
        coursePlan: [],
        requirements: degree,
        requirementStates: requirementState
      }
    })
  }

  editCoursePlan = () => {
    this.props.history.push({
      pathname: '/courseplan',
      state: {
        student: this.state.student,
        coursePlan: this.state.studentInfoParams.coursePlan
      }
    })
  }


  suggestCoursePlan = () => {
    console.log('Suggesting course plan for student: ', this.state.student)
    this.props.history.push({
      pathname: '/suggest',
      state: {
        student: this.state.student,
        studentInfoParams: this.state.studentInfoParams
      }
    })
  }

  render() {
    const { mode, department, studentInfoParams, errorMsg, visible, showConfirmation, showEmailConf, showUpdateError, showEmailBox } = this.state
    return (
      <Container fluid='lg' className='container' >
        <StudentInfo
          mode={mode}
          errorMessage={errorMsg}
          userType={this.props.type}
          student={this.state.student}
          department={department}
          onSubmit={(e) => this.modeHandler(e)}
          setDegreeReq={this.showDegree}
        />
        <hr />
        <Requirements
          studentInfo={studentInfoParams}
          track={this.state.student.track}
        />
        <hr />
        <CoursePlan
          coursePlan={studentInfoParams.coursePlan}
          editCoursePlan={this.editCoursePlan}
          suggestCoursePlan={this.suggestCoursePlan}
        />
        <CenteredModal
          show={showConfirmation}
          onHide={() => {
            this.setState({ showConfirmation: false })
          }}
          onConfirm={this.changeMode}
          body='Student successfully saved'
        />
        <CenteredModal
          show={showUpdateError}
          onHide={() => {
            this.changeMode()
            this.setState({ showUpdateError: false })
          }}
          onConfirm={() => {
            this.changeMode()
            this.setState({ showUpdateError: false })
          }}
          body='Try again later.'
          title='Error'
        />
        <CenteredModal
          show={showEmailBox}
          onHide={() => this.setState({ showEmailBox: false, showConfirmation: true })}
          onConfirm={this.notify}
          variant='multi'
          body={
            <div>
              <div>[Comments Changed] Send notification that comments have been changed to student?</div>
            </div>
          }
          footer='Sending emails to students...'
          visibility={visible}
        />
        <CenteredModal
          show={showEmailConf}
          onHide={() => this.setState({ showEmailConf: false })}
          onConfirm={() => { this.setState({ showEmailConf: false, showConfirmation: true }) }}
          body='Sent email successfully '
        />
      </Container>
    )
  }
}


export default Student