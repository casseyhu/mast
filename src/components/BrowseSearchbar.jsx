import React, { useState, useEffect } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import axios from '../constants/axios';
import InputField from './InputField'
import { SORT_FIELDS, BOOLEAN } from '../constants';
import { SEARCH_ICON } from '../constants/svgs'
import {
  Container,
  Row,
  Col,
} from "react-bootstrap";

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
    console.log("Query DB with all filters (all states).")

    // axios.get('/???',{
    //  ...
    // });

    props.parentCallback(/*results*/)
  }


  const expandFilters = (e) => {
    console.log("Clicked advanced options. Set state to: ", !expanded)
    setExpanded(!expanded)
  }

  return (
    <Container style={{ padding: "0" }}>
      {/* Main search bar fields */}
      <div className="flex-horizontal wrap justify-content-between">
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span style={{ marginRight: '1rem' }}>Search</span>
          <InputField
            type="search"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon="fa fa-search"
            style={{ minWidth: '300px', maxWidth: '400px', marginRight: '1rem' }}
          />
          <button className="advancedButton" onClick={expandFilters}>Advanced Options</button>
        </div>
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span style={{ marginRight: '1rem' }}>Sort By</span>
          <Dropdown items={SORT_FIELDS} onChange={setSort} disabled={false} style={{ width: '220px', marginRight: '1rem' }} />
          <Button variant="round" text="go" onClick={applyFilters} style={{ width: '70px' }} />
        </div>
      </div>
      {/* Advanced dropdown filters */}
      {expanded && (
        <div className="advancedFilters">
          <div className="flex-horizontal wrap " >
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
              <InputField
                className="filter-component"
                type="search"
                placeholder="CSE, AMS, ..."
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
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
              <InputField
                className="filter-component"
                type="search"
                placeholder="Fall, Spring, .."
                value={entrySem}
                onChange={(e) => setEntrySem(e.target.value)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Grad Sem:</span>
              <InputField
                className="filter-component"
                type="search"
                placeholder="Fall, Spring, .."
                value={gradSem}
                onChange={(e) => setGradSem(e.target.value)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Graduated:</span>
              <Dropdown
                variant="single"
                items={BOOLEAN}
                onChange={(e) => { setGraduated(e.value) }}
                disabled={false}
              />
            </div>

            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Entry Year:</span>
              <InputField
                className="filter-component"
                type="search"
                placeholder="2021, ..."
                value={entryYear}
                onChange={(e) => setEntryYear(e.target.value)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Grad Year:</span>
              <InputField
                className="filter-component"
                type="search"
                placeholder="2021, ..."
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </Container>
  )


}

export default BrowseSearchbar