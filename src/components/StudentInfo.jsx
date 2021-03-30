import React, { Component } from 'react'
import InputField from './InputField';
import Dropdown from './Dropdown';
import { BOOLEAN, DEPARTMENTS, SEMESTERS, YEARS, TRACKS } from '../constants';

class StudentInfo extends Component {
  state = {
    dept: "",
    track: ""
  }

  setDepartment = (e) => {
    this.setState({
      dept: e.value
    })
  }

  render() {
    return (
      <div className="flex-horizontal wrap">
        <div className="flex-vertical wrap" style={{ width: 'fit-content' }}>

          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <span className="filter-span">Name:</span>
            <InputField className="lr-padding" style={{ width: "300px" }} type="text" placeholder="First Name" />
            <InputField className="lr-padding" style={{ width: "300px" }} type="text" placeholder="Last Name" />
          </div>

          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <span className="filter-span">SBU ID:</span>
            <InputField className="lr-padding" style={{ width: "300px" }} type="text" placeholder="SBU ID" />
            <span className="filter-span" style={{ marginLeft: "0.6rem" }}>GPA:</span>
            <InputField className="lr-padding" style={{ width: "200px" }} type="text" placeholder="GPA" />
          </div>

          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <span className="filter-span">Email:</span>
            <InputField className="lr-padding" style={{ width: "300px" }} type="text" placeholder="Email" />
            <span className="filter-span" style={{ marginLeft: "0.6rem" }}>Graduated:</span>
            <Dropdown
              className="lr-padding"
              style={{ width: "200px" }}
              items={BOOLEAN}
              placeholder="Select..." />
          </div>

          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <span className="filter-span">Entry Date:</span>
            <Dropdown
              className="all-padding"
              items={SEMESTERS}
              placeholder="Semester" />
            <Dropdown
              className="all-padding"
              items={YEARS}
              placeholder="Year" />
          </div>

          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <span className="filter-span">Grad Date:</span>
            <Dropdown
              className="all-padding"
              items={SEMESTERS}
              placeholder="Semester" />
            <Dropdown
              className="all-padding"
              items={YEARS}
              placeholder="Year" />
          </div>

          <div className="flex-horizontal" style={{ width: 'fit-content' }}>
            <span className="filter-span">Degree:</span>
            <Dropdown
              className="all-padding"
              items={DEPARTMENTS}
              placeholder="Dept"
              onChange={ (e) => { this.setDepartment(e.value) }} />
            <Dropdown
              className="all-padding"
              items={TRACKS[this.state.dept]}
              placeholder="Track" />
            <Dropdown
              className="all-padding"
              items={SEMESTERS}
              placeholder="Semester" />
            <Dropdown
              className="all-padding"
              items={YEARS}
              placeholder="Year" />
          </div>
        </div>

        <div className="flex-vertical wrap" style={{ width: 'fit-content', marginLeft:'0.7rem' }}>
          <textarea className="textarea resize-ta" style={{ minWidth: "400px" }} placeholder="GPD Comments"/>
          <textarea className="textarea resize-ta" style={{ minWidth: "400px" }} placeholder="Student Comments"/>
        </div>
      </div>
    );
  }
}

export default StudentInfo;