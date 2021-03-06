import React, { useState, useEffect } from 'react'

const Requirements = (props) => {
  const [gpas, setGpas] = useState({})
  const [display, setDisplay] = useState(false)
  const [totalCredits, setTotalCredits] = useState(null)

  const grades = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }

  let { requirements, coursePlan, requirementStates } = props.studentInfo

  const getLetter = (points) => {
    return Object.keys(grades).find(key => grades[key] === points)
  }

  const getReqColor = (type, courseRequirement) => {
    let reqState = requirementStates[type + courseRequirement.requirementId][0]
    if (reqState === 'satisfied')
      return 'green'
    else if (reqState === 'unsatisfied')
      return 'red'
    else
      return 'yellow'
  }

  const getText = (req) => {
    let text = ''
    let hasCreditBounds = false
    if (req.type === 1)
      text = '[Required] '
    else if (req.type === 2)
      text = '[Track Required] '
    else if (req.type === 0)
      return '[Non Required] '
    if (req.creditUpper || req.creditLower) {
      if (req.creditUpper && req.creditLower) {
        if (req.creditUpper === req.creditLower)
          text += req.creditLower + ' credit(s)'
        else
          text += req.creditLower + '-' + req.creditUpper + ' credit(s)'
      }
      else if (req.creditUpper)
        text += ' up to ' + req.creditUpper + ' credit(s)'
      else
        text += ' at least ' + req.creditLower + ' credit(s)'
      hasCreditBounds = true
    }
    if (req.courseUpper || req.courseLower) {
      if (req.courseUpper === -1) {
        text += ' Take every full-time semester: '
        return text;
      }
      else {
        if (hasCreditBounds)
          text += ' and '
        if (req.courseUpper && req.courseLower) {
          if (req.courseUpper === req.courseLower)
            text += req.courseLower + ' course(s)'
          else
            text += req.courseLower + ' to ' + req.courseUpper + ' course(s)'
        }
        else if (req.courseUpper)
          text += ' up to ' + req.courseUpper + ' course(s)'
        else
          text += ' at least ' + req.courseLower + ' course(s)'
      }
    }
    return text + ' in: '
  }

  const isTaken = (courseRequirement, course) => {
    let coursesUsed = requirementStates['C' + courseRequirement.requirementId][1]
    return coursesUsed.includes(course)
  }

  useEffect(() => {
    const getCreds = async () => {
      let gpas = requirementStates['G' + requirements[1].requirementId][1]
      setGpas({
        'cumulative': gpas[0],
        'department': gpas[2],
        'core': gpas[1]
      })
      let credits = requirementStates['CR' + requirements[2].requirementId][1]
      setTotalCredits(credits)
      setDisplay(true)
    }
    if (requirements && coursePlan)
      getCreds()
  }, [requirements, coursePlan, requirementStates])


  return (
    <div className='flex-vertical w-100'>
      <div className='flex-horizontal wrap justify-content-between mb-2'>
        <div className='flex-vertical fit'>
          <h4>Degree Requirements</h4>
          {props.track && <span>Track: {props.track}</span>}
        </div>
        <div className='flex-horizontal' style={{ display: 'table', maxWidth: '500px' }}>
          <div className='green color-box' />
          <p className='req-state'>Satisfied</p>
          <div className='yellow color-box' />
          <p className='req-state'>Pending</p>
          <div className='red color-box' />
          <p className='req-state'>Unsatisfied</p>
        </div>
      </div>

      {display && <div className='flex-vertical' style={{ width: '100%' }}>
        {requirements[1] && (
          <div className={getReqColor('G', requirements[1])}>
            <span>Minimum Cumulative GPA: {' ' + requirements[1].cumulative}
              <span className='ml-2'><b>{gpas['cumulative'] ? gpas['cumulative'] : 'N/A'}</b></span>
            </span>
            {requirements[1].core && (
              <span className='ml-5'>Minimum Core GPA: {' ' + requirements[1].core}
                <span className='ml-2'><b>&emsp;{gpas['core'] ? gpas['core'] : 'N/A'}</b></span>
              </span>
            )}
            {requirements[1].department && (
              <span className='ml-5'>Minimum Department GPA: {' ' + requirements[1].department}
                <span className='ml-2'><b>&emsp;{gpas['department'] ? gpas['department'] : 'N/A'}</b></span>
              </span>
            )}
          </div>
        )
        }
        {requirements[2] &&
          <div className={getReqColor('CR', requirements[2])}>
            Minimum Credits: {requirements[2].minCredit}
            <b>&emsp;{totalCredits}</b>
          </div>
        }
        {requirements[0] && requirements[0].atLeastCredits && requirements[0].minGrade &&
          <div className={getReqColor('GR', requirements[0])}>
            At least {requirements[0].atLeastCredits} credits must be
            {' ' + getLetter(requirements[0].minGrade)} or above
          </div>
        }
        {requirements[3] && requirements[3].map((req, key) => {
          // non required non electives (e.g. 'cannot take cse538 twice')
          if (req.type === 0)
            return <div key={key}></div>
          else return (
            <div className={getReqColor('C', req)} key={key}>
              {getText(req)}
              {req.courses.map((course, ckey) => isTaken(req, course)
                ? <span key={ckey}><b>{course} </b></span>
                : <span key={ckey}>{course + ' '}</span>)}
            </div>
          )
        })}
      </div>
      }
    </div>
  )
}

export default Requirements