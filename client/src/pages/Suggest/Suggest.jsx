import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import axios from '../../constants/axios'
import CenteredToast from '../../components/Toast'
import CoursePlan from '../Student/CoursePlan'
import Requirements from '../Student/Requirements'
import Preferences from './Preferences'
import SuggestedPlans from './Suggested'


const Suggest = (props) => {
  const [suggestions, setSuggestions] = useState([])
  const [degreeExpanded, setDegreeExpanded] = useState(false)
  const [planExpanded, setPlanExpanded] = useState(true)
  const [confirmation, showConfirmation] = useState(false)
  const [loading, setLoading] = useState()
  const [disable, setDisable] = useState(false)

  const { coursePlan } = props.location.state.studentInfoParams
  const student = props.location.state.student

  const suggest = (mode, preferences) => {
    setSuggestions([])
    setDisable(true)
    setLoading(mode)
    preferences.student = student
    const route = mode === 'smart' ? '/smartSuggest/' : '/suggest/'
    axios.get(route, {
      params: preferences
    }).then(res => {
      setSuggestions(res.data)
      showConfirmation(true)
      setDisable(false)
      setLoading()
    }).catch(err => {
      console.log('Error: ' + err)
    })
  }

  const addSuggestedPlan = async (plan) => {
    let result = await axios.post('/courseplanitem/addsuggestion/', {
      params: {
        student: student,
        courses: plan
      }
    })
    props.history.push({
      pathname: '/courseplan',
      state: {
        student: student,
        coursePlan: result.data,
        from: 'suggest'
      }
    })
  }

  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Suggest Course Plan</h1>
        <h5>Student: {student.sbuId}</h5>
        <h5>Degree: {student.department} {student.track}</h5>
      </div>
      <Preferences department={student.department} suggest={suggest} disable={disable} loading={loading} />
      {suggestions.length > 0 && <SuggestedPlans suggestions={suggestions} addSuggestedPlan={addSuggestedPlan} />}

      <Accordion className='mb-1 mt-3'>
        <Card>
          <Accordion.Toggle
            className='pt-1 pb-0'
            as={Card.Header}
            eventKey='0'
            onClick={e => setDegreeExpanded(!degreeExpanded)}
            style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
            <div className='flex-horizontal justify-content-between' >
              <h4 >{`${degreeExpanded ? 'Hide' : 'View'}`} Student Degree Requirements</h4>
              <i className='fa fa-chevron-down' aria-hidden='true'></i>
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey='0'>
            <Card.Body>
              {props.location.state.studentInfoParams &&
                <div className='mt-1 mb-4'>
                  <Requirements
                    studentInfo={props.location.state.studentInfoParams}
                    track={student.track + ' (' + student.requirementVersion + ')'}
                  />
                </div>
              }
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>

      <Accordion defaultActiveKey='0' className='mb-1 mt-3'>
        <Card>
          <Accordion.Toggle
            className='pt-1 pb-0'
            as={Card.Header}
            eventKey='0'
            onClick={e => setPlanExpanded(!planExpanded)}
            style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
            <div className='flex-horizontal justify-content-between' >
              <h4 >{`${planExpanded ? 'Hide' : 'View'}`} Student Course Plan</h4>
              <i className='fa fa-chevron-down' aria-hidden='true'></i>
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey='0'>
            <Card.Body>
              {coursePlan &&
                <CoursePlan
                  heading='Current Course Plan'
                  coursePlan={coursePlan}
                />
              }
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      <CenteredToast
        message={`Generated ${suggestions.length} course plans`}
        show={confirmation}
        onHide={() => showConfirmation(false)}
      />
    </Container>
  )
}

export default Suggest
