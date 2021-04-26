import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import Preferences from './Preferences'
import SuggestedPlans from './Suggested'


const Suggest = (props) => {
  const [suggestions, setsuggestions] = useState([])

  const { student, coursePlan } = props.location.state

  const suggest = (preferences) => {
    preferences.student = student
    axios.get('/suggest/', {
      params: preferences
    }).then(res => {
      console.log('Done Suggest')
      console.log(res.data)
      setsuggestions(res.data)
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
    }).catch(err => {
      console.log("Error smart suggest")
    })
  }

  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Suggest Course Plan</h1>
        <h5>Student: {student.sbuId}</h5>
        <h5>Degree: {student.department} - {student.track}</h5>
      </div>
      <h4 className='underline'>Preferences</h4>
      <Preferences department={student.department} suggest={suggest} smartSuggest={smartSuggest} />
      <SuggestedPlans suggestions={suggestions} />
      {coursePlan &&
        <CoursePlan
          heading='Current Course Plan'
          coursePlan={coursePlan}
        />
      }
    </Container>
  )
}

export default Suggest
