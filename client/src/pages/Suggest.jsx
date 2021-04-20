import React, { useState, useEffect, useCallback } from 'react'
import Container from "react-bootstrap/Container"
import Button from '../components/Button'
import CenteredModal from '../components/Modal'
import StudentInfo from '../components/StudentInfo'
import Requirements from '../components/Requirements'
import CoursePlan from '../components/CoursePlan'
import axios from '../constants/axios'
import jwt_decode from 'jwt-decode'
import { useHistory } from "react-router-dom"

const Suggest = (props) => {

  useEffect(() => {
    let token = localStorage.getItem('jwt-token')
    let decoded = jwt_decode(token)
    if (!decoded)
      return
  }, [props])

  useEffect(() => {
    // console.log(props.location.state.student)
  }, [])
  
  return (
    <Container fluid="lg" className="container">
      <div className="flex-horizontal justify-content-between">
        <h1>Suggest Course Plan</h1>
        <Button variant="round" text="Save Changes" />
      </div>
      <h4>Student: </h4>
    </Container>
  )
}

export default Suggest