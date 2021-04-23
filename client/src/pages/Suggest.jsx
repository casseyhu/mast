import React, { useState } from 'react'
import CoursePlan from '../components/CoursePlan'
import Preferences from '../components/Preferences'
import SuggestCoursePlan from '../components/SuggestCoursePlan'
import Container from 'react-bootstrap/Container'
import Button from '../components/Button'
import axios from '../constants/axios'

const Suggest = (props) => {
  const [student, setStudent] = useState(props.location.state.student)
  const [coursePlan, setCoursePlan] = useState(props.location.state.coursePlan)

  const suggest = (preferences) => {
    // console.log(preferences)
    preferences.student = student
    axios.get('/suggest/', {
      params: preferences
    }).then(res => {
      console.log('Done Suggest')
      // Set the results of the suggest return into the state.
      // Then, since the state of `suggestedPlans` got changed, 
      // it'll rerender and the SuggestedCoursePlan component will
      // show the suggested course plans. 
      // TODO: make the SuggestCoursePlan component to show the results of algo. 
    })
  }

  const smartSuggest = () => {
    console.log('Smart suggest mode')
    // axios.get('/smartSuggest/')
    //  .then(res => { console.log('Done smart suggest') })
  }
  
  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Suggest Course Plan</h1>
        <h5>Student: {student.sbuId}</h5>
        <h5>Degree: {student.department} - {student.track}</h5>
      </div>
      <h5 className='underline'>Preferences</h5>
      <Preferences department={student.department} suggest={suggest} smartSuggest={smartSuggest}/>
      <SuggestCoursePlan/>
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
