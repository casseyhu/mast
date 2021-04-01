import React, { useState, useEffect } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import axios from '../constants/axios';
import InputField from './InputField'
import { SORT_FIELDS, BOOLEAN, DEPARTMENTS, SEMESTERS, YEARS } from '../constants';

const BrowseSearchbar = (props) => {

  const [name, setName] = useState("");
  const [sortBy, setSort] = useState("");
  const [sbuId, setSbuId] = useState("");
  const [entrySem, setEntrySem] = useState("");
  const [entryYear, setEntryYear] = useState("");
  const [degree, setDegree] = useState("");
  const [gradSem, setGradSem] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [track, setTrack] = useState("");
  const [graduated, setGraduated] = useState("");
  const [expanded, setExpanded] = useState(false);
  // const [advancedFields] = useState(["SBU ID", "Degree", "Track", "Entry Sem", 
  //   "Grad Sem", "Graduated", "Entry Year", "Grad Year"])

  const applyFilters = (e) => {
    // Query goes here. 
    // After querying, send the results to the parent (Browse.jsx)
    // to set the table of students to view. 
    
    let fullName = name.split(' ')
    let firstName = fullName[0]
    let lastName = fullName.length === 1 ? '' : fullName[1]
    let hasGraduated = graduated;
    if(hasGraduated !== "")
      hasGraduated === "true" ? hasGraduated = 1 : hasGraduated = 0;

    let filteredConditions = {
      firstName: firstName + "%",
      lastName: lastName + "%",
      sbuId: sbuId + "%",
      entrySem: entrySem + "%",
      entryYear: entryYear + "%",
      degree: degree + "%",
      gradSem: gradSem + "%",
      gradYear: gradYear + "%",
      track: track + "%",
      graduated: hasGraduated + "%"
    }

    props.filter(filteredConditions)
    props.sortField(sortBy.value)
    console.log("Query DB with all filters (all states).")
  }


  const expandFilters = (e) => {
    console.log("Clicked advanced options. Set state to: ", !expanded)
    setExpanded(!expanded)
  }

  return (
    <div style={{ margin: '0.2rem 0 0.5rem 0' }}>
      {/* Main search bar fields */}
      <div className="flex-horizontal wrap justify-content-between">
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span-reg">Search</span>
          <InputField
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon="fa fa-search"
            style={{ minWidth: '300px', maxWidth: '400px', marginRight: '1rem' }}
          />
          <button className="advancedButton" onClick={expandFilters}>Advanced Options</button>
        </div>
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span-reg">Sort By</span>
          <Dropdown items={SORT_FIELDS} onChange={setSort} disabled={false} style={{ width: '220px', marginRight: '1rem' }} />
          <Button variant="round" text="find" onClick={applyFilters} style={{ width: '70px' }} />
        </div>
      </div>
      {/* Advanced dropdown filters */}
      {expanded && (
        <div className="advancedFilters">
          <div className="flex-horizontal wrap" >
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">SBU ID:</span>
              <InputField
                className="filter-component"
                type="search"
                placeholder="SBU ID"
                value={sbuId}
                onChange={(e) => setSbuId(e.target.value)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Degree:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={DEPARTMENTS}
                onChange={(e) => { setDegree(e.value) }}
                disabled={false}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Track:</span>
              <InputField
                className="filter-component"
                type="search"
                placeholder="Track"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Entry Sem:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={(e) => { setEntrySem(e.value) }}
                disabled={false}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Grad Sem:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={(e) => { setGradSem(e.value) }}
                disabled={false}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Graduated:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={BOOLEAN}
                onChange={(e) => { setGraduated(e.value) }}
                disabled={false}
              />
            </div>

            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Entry Year:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={(e) => { setEntryYear(e.value) }}
                disabled={false}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Grad Year:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={(e) => { setGradYear(e.value) }}
                disabled={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )


}

export default BrowseSearchbar