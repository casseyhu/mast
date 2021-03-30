import React, { Component } from 'react'
import InputField from './InputField';
import Dropdown from './Dropdown';
import { BOOLEAN, DEPARTMENTS, SEMESTERS, YEARS } from '../constants';

class StudentInfo extends Component {
  state = {}
  render() {
    return (
      <div div className="flex-horizontal wrap">



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
              placeholder="Dept" />
            <Dropdown
              className="all-padding"

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



        <div className="flex-vertical wrap" style={{ width: 'fit-content' }}>
          {/* <span className="filter-span-reg">Comments:</span> */}
          <InputField className="lr-padding" style={{ width: "420px" }} type="text" placeholder="Comments" />
        </div>
      </div>
    );
  }
}

export default StudentInfo;