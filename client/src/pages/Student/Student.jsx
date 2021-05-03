import React, { Component } from 'react'
import Container from 'react-bootstrap/Container'
import CenteredModal from '../../components/Modal'
import StudentInfo from './StudentInfo'
import Requirements from './Requirements'
import CoursePlan from './CoursePlan'
import TransferCredits from './TransferCredits'
import axios from '../../constants/axios'
import CenteredToast from '../../components/Toast'

class Student extends Component {
  state = {
    showUpdateError: false,
    showConfirmation: false,
    showEmailBox: false,
    showEmailConf: false,
    errorMsg: '',
    visible: 'hidden',
    suggestErr: '',
    showSuggestErr: false,
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
        transferItems: coursePlanItems.data.filter(item => item.status === 2),
        coursePlan: coursePlanItems.data.filter(item => item.status !== 2),
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

  createStudent = (studentInfo) => {
    /* Add new student into the db */
    axios.post('/student/create/', {
      params: studentInfo
    }).then(response => {
      this.setState({
        student: response.data,
        errorMsg: '',
        showConfirmation: true
      }, this.setStudentInfo)
    }).catch((err) => {
      this.setState({ errorMsg: err.response.data })
      console.log(err.response.data)
    })
  }

  modeHandler = async (studentInfo) => {
    this.setState({ errorMsg: '' })
    const { mode, student } = this.state
    if (mode === 'Add')
      this.createStudent(studentInfo)
    else if (mode === 'View')
      this.setState({ mode: 'Edit' })
    else {
      // Gets the student's information that we have in the database. 
      let dbStudentInfo = await axios.get('/student/' + student.sbuId, {
        params: student.sbuId
      })
      let isSame = true
      Object.keys(dbStudentInfo.data).map(info => (info === 'updatedAt') ? '' :
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
      // showConfirmation: false,
      mode: 'View'
    }, this.setStudentInfo)
  }

  notify = () => {
    this.setState({
      visible: 'visible'
    }, () => {
      axios.post('/email/send/', {
        params: {
          email: 'eddie.xu@stonybrook.edu',
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
        transferItems: [],
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
        coursePlan: this.state.studentInfoParams.coursePlan,
        userType: this.props.type,
        from: 'student'
      }
    })
  }


  editTransfer = () => {
    this.props.history.push({
      pathname: '/transfer',
      state: {
        student: this.state.student,
        transferItems: this.state.studentInfoParams.transferItems,
        from: 'student'
      }
    })
  }


  suggestCoursePlan = () => {
    /* Prevent redirecting to suggest page for those who have satisfied all requirments */
    let reqStates = this.state.studentInfoParams.requirementStates
    let satisfiedCount = Object.values(reqStates).filter((req) => req[0] === 'satisfied').length
    if (satisfiedCount === Object.keys(reqStates).length) {
      this.setState({ showSuggestErr: true })
      this.setState({ suggestErr: 'Cannot suggest course plans for a student who has satisfied all requirements' })
      return
    }
    /* Prevent redirecting to suggest page for those who have invalid course plans */
    let coursePlan = this.state.studentInfoParams.coursePlan;
    let validCount = coursePlan.filter(item => item.validity).length
    if (coursePlan && validCount !== coursePlan.length) {
      this.setState({ showSuggestErr: true })
      this.setState({ suggestErr: 'Cannot suggest course plans for a student with an invalid course plan. Please fix the course plan first.' })
      return
    }

    console.log('Suggesting course plan for student: ', this.state.student)
    this.props.history.push({
      pathname: '/suggest',
      state: {
        student: this.state.student,
        studentInfoParams: this.state.studentInfoParams,
        userType: this.props.type
      }
    })
  }

  render() {
    const { mode, department, studentInfoParams, errorMsg, visible, suggestErr, showSuggestErr, showConfirmation, showEmailConf, showUpdateError, showEmailBox } = this.state
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
        <hr />
        <TransferCredits
          enable={this.state.mode !== 'Add'}
          transferItems={studentInfoParams.transferItems}
          editTransfer={this.editTransfer}
        />
        <CenteredToast
          message='Student successfully saved'
          show={showConfirmation}
          onEntry={this.changeMode}
          onHide={() => {
            this.setState({ showConfirmation: false })
          }}
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
          body='Student information is being edited by another user. Please try again later.'
          title={<small style={{ color: 'red' }}>Error!</small>}
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
        <CenteredModal
          show={showSuggestErr}
          onHide={() => this.setState({ showSuggestErr: false })}
          onConfirm={() => { this.setState({ showSuggestErr: false }) }}
          title={<small style={{ color: 'red' }}>Error!</small>}
          body={suggestErr}
        />
      </Container>
    )
  }
}


export default Student