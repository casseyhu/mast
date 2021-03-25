import React, { useState, useEffect } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import axios from '../constants/axios';
import { Checkmark } from 'react-checkmark'
import { Ring } from 'react-spinners-css';

const ImportItem = (props) => {

  const [file, setFile] = useState("");
  const [firstfile, setFirstFile] = useState("");
  const [depts, setDepts] = useState([]);
  const [semester, setSem] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (uploading === true) {
      setTimeout(() => {
        setUploading(false);
      }, 2800)
    }
  }, [uploading])


  const uploadFile = (e) => {
    if (file === "") {
      console.log("Empty file")
      setError("Must choose a file to upload.")
      return;
    }
    var formData = new FormData();
    formData.append("file", file);
    let upload_path = '';
    if (props.header === "Course Information") {
      upload_path = 'course/upload';
      formData.append("depts", depts);
      formData.append("semester", semester);
      formData.append("year", year);
    }
    else if (props.header === "Degree Requirements") {
      console.log("Uploading Degree Requirements");
      upload_path = 'degree/upload';
    }
    else if (props.header === "Course Offerings") {
      console.log("Uploading Course Offerings");
      upload_path = 'courseoffering/upload';
    }
    else if (props.header === "Student Data") {
      console.log("Uploading student data");
      upload_path = 'student/upload';
    }
    else { // Uploading grades. 
      console.log("Uploading grades")
      upload_path = 'courseplanitem/upload';
    }
    setLoading(true)
    axios.post(upload_path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(function () {
      console.log('Successfully uploaded file');
      setLoading(false)
      setUploading(true)
      setFile("")
    })
      .catch(function (err) {
        console.log(err.response.data)
        setLoading(false)
        setFile("")
        setError(err.response.data)
      });
  }

  const selectionHandler = (e) => {
    let value = Array.from(e, option => option.value);
    setDepts(value);
  }

  return (
    <div style={{ margin: "1rem 0" }}>
      <h4>{props.header}</h4>
      {props.first
        && (<div className="flex-horizontal">
          <span style={{ width: "150px" }}>{props.first}</span>
          <div style={{ width: "20" }}>
            <Button variant="square" text="Browse My Computer" setFile={e => setFirstFile(e)} />
          </div>
          {firstfile && <small style={{ marginLeft: "1.5rem" }}>{firstfile.name}</small>}
        </div>
        )}
      {props.depts && props.sems && props.years
        && (<div className="flex-horizontal" style={{ flexWrap: 'wrap' }}>
          <span style={{ width: "150px" }}>Semesters</span>
          <Dropdown variant="single" items={props.sems} disabled={false} onChange={(e) => setSem(e.value)} />
          <div style={{ marginRight: '3rem' }}>
            <Dropdown variant="single" items={props.years} disabled={false} onChange={(e) => setYear(e.value)} />
          </div>
          <div className="flex-horizontal" style={{ width: '540px' }}>
            <span style={{ width: '150px' }}>Departments</span>
            <div style={{ width: "20" }}>
              <Dropdown variant="multi" items={props.depts} onChange={selectionHandler} disabled={false}/>
            </div>
          </div>
        </div>
        )}
      <div className="flex-horizontal parent">
        <span style={{ width: "150px" }}>{props.type}</span>
        <div style={{ width: "20" }}>
          <Button
            variant="square"
            text="Browse My Computer"
            setFile={e => setFile(e)}
            onClick={() => setError("")}
          />
        </div>
        <div style={{ width: '100px', marginLeft: '1.5rem' }}>
          <Button variant="round" text="Upload" onClick={uploadFile} />
        </div>
      </div>
      {}
      <small className={error ? "error" : ""} style={{ marginLeft: '150px' }}>
        {(!error && file) ? file.name : error}
      </small>
      {loading && <Ring size={120} color="rgb(30, 61, 107)" className="loading" />}
      {uploading && <Checkmark size='xxLarge' color="rgb(30, 61, 107)" className="checkmark" />}
    </div>
  )
}

export default ImportItem