import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import Requirements from '../Student/Requirements'
import Preferences from './Preferences'
import SuggestedPlans from './Suggested'


const Suggest = (props) => {
  const [suggestions, setSuggestions] = useState([])
  const [degreeexpanded, setDegreeExpanded] = useState(false)
  const [planexpanded, setPlanExpanded] = useState(true)
  const { coursePlan } = props.location.state.studentInfoParams
  const student = props.location.state.student

  const suggest = (preferences) => {
    preferences.student = student
    axios.get('/suggest/', {
      params: preferences
    }).then(res => {
      console.log('Done Suggest')
      console.log(res.data)
      setSuggestions(res.data)
      // Set the results of the suggest return into the state.
      // Then, since the state of `suggestedPlans` got changed, 
      // it'll rerender and the SuggestedCoursePlan component will
      // show the suggested course plans. 
      // TODO: make the SuggestCoursePlan component to show the results of algo. 
    })
  }

  const smartSuggest = (preferences) => {
    console.log('Smart suggest mode')
    preferences.student = student
    axios.get('/smartSuggest/', {
      params: preferences
    }).then(res => {
      console.log('Done smart suggest')
      setSuggestions(res.data)
    }).catch(err => {
      console.log('Error smart suggest')
    })
  }

  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Suggest Course Plan</h1>
        <h5>Student: {student.sbuId}</h5>
        <h5>Degree: {student.department} {student.track}</h5>
      </div>
      <Preferences department={student.department} suggest={suggest} smartSuggest={smartSuggest} />
      {suggestions.length > 0 && <SuggestedPlans suggestions={suggestions} />}

      <Accordion className='mb-1 mt-3'>
        <Card>
          <Accordion.Toggle
            className='pt-1 pb-0'
            as={Card.Header}
            eventKey='0'
            onClick={e => setDegreeExpanded(!degreeexpanded)}
            style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
            <div className='flex-horizontal justify-content-between' >
              <h4 >{`${degreeexpanded ? 'Hide' : 'View'}`} Student Degree Requirements</h4>
              <i className="fa fa-chevron-down" aria-hidden="true"></i>
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey='0'>
            <Card.Body>
              {props.location.state.studentInfoParams &&
                <div className='mt-1 mb-4'>
                  <Requirements
                    studentInfo={props.location.state.studentInfoParams}
                    track={student.track}
                  />
                </div>
              }
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>

      <Accordion defaultActiveKey="0" className='mb-1 mt-3'>
        <Card>
          <Accordion.Toggle
            className='pt-1 pb-0'
            as={Card.Header}
            eventKey='0'
            onClick={e => setPlanExpanded(!planexpanded)}
            style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
            <div className='flex-horizontal justify-content-between' >
              <h4 >{`${planexpanded ? 'Hide' : 'View'}`} Student Course Plan</h4>
              <i className="fa fa-chevron-down" aria-hidden="true"></i>
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

    </Container>
  )
}

export default Suggest
