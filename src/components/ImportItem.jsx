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
    if (props.header === "Student Data" && (firstfile === "" || file === "")) {
      setError("Must have both student profile and course plan files to upload.")
      return;
    }
    else if (file === "") {
      setError("Must choose a file to upload.")
      return;
    }

    var firstFormData = new FormData();
    firstFormData.append("file", firstfile);
    var formData = new FormData();
    formData.append("file", file);

    let upload_path = '';
    if (props.header === "Course Information") {
      upload_path = 'course/upload';
      formData.append("depts", depts);
      formData.append("semester", semester);
      formData.append("year", year);
    }
    else if (props.header === "Degree Requirements")
      upload_path = 'degree/upload';
    else if (props.header === "Course Offerings")
      upload_path = 'courseoffering/upload';
    else if (props.header === "Student Data") {
      upload_path = 'student/upload';
      let storeFile = file;
      axiosPost(upload_path, firstFormData);
      setFirstFile("")
      setFile(storeFile)
      upload_path = 'courseplan/upload';
      //also need to handle course plan upload
    }
    else // Uploading grades. 
      upload_path = 'courseplanitem/upload';

    setLoading(true)
    axiosPost(upload_path, formData);
  }

  function axiosPost(path, formData) {
    axios.post(path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(function () {
      console.log('Successfully uploaded file');
      setLoading(false)
      setUploading(true)
      setFile("")
    }).catch(function (err) {
      console.log(err.response.data)
      setLoading(false)
      setFile("")
      setError(err.response.data)
    });
    return
  }


  const selectionHandler = (e) => {
    let value = Array.from(e, option => option.value);
    setDepts(value);
  }

  return (
    <div style={{ margin: "1rem 0" }}>
      <h4>{props.header}</h4>
      {props.first
        && (
          <div className="flex-horizontal">
            <span style={{ width: "150px" }}>{props.first}</span>
            <Button
              variant="square"
              text="Browse My Computer"
              setFile={e => setFirstFile(e)}
              style={{ width: "20" }}
            />
            {firstfile && <small style={{ marginLeft: "1.5rem" }}>{firstfile.name}</small>}
          </div>
        )}
      {props.depts && props.sems && props.years
        && (
          <div className="flex-horizontal wrap justify-content-start">
            <span style={{ width: "150px" }}>Semesters</span>
            <Dropdown
              variant="single"
              items={props.sems}
              disabled={false}
              onChange={(e) => setSem(e.value)}
              style={{ margin: '0 1rem 0.5rem 0' }}
            />
            <Dropdown
              variant="single"
              items={props.years}
              disabled={false}
              onChange={(e) => setYear(e.value)}
              style={{ margin: '0 4rem 0.5rem 0' }}
            />
            <div className="flex-horizontal" style={{ width: '540px' }}>
              <span style={{ width: '150px' }}>Departments</span>
              <Dropdown
                variant="multi"
                items={props.depts}
                onChange={selectionHandler}
                disabled={false}
                style={{ margin: '0 1rem 0.5rem 0' }}
              />
            </div>
          </div>
        )}
      <div className="flex-horizontal parent">
        <span style={{ width: "150px" }}>{props.type}</span>
        <Button
          variant="square"
          text="Browse My Computer"
          setFile={e => setFile(e)}
          onClick={() => setError("")}
          style={{ width: "20" }}
        />
        <Button
          variant="round"
          text="Upload"
          onClick={uploadFile}
          style={{ width: '100px', marginLeft: '1.5rem' }}
        />
      </div>
      <small className={error ? "error" : ""} style={{ marginLeft: '150px' }}>
        {(!error && file) ? file.name : error}
      </small>
      {/* {props.first && (
        <Button
          variant="round"
          text="Delete Student Data"
          onClick={() => dropStudents()}
          style={{ width: '200px'}}
        />
      )} */}
      {loading && <Ring size={120} color="rgb(30, 61, 107)" className="loading" />}
      {uploading && <Checkmark size='xxLarge' color="rgb(30, 61, 107)" className="checkmark" />}
    </div>
  )
}

export default ImportItem