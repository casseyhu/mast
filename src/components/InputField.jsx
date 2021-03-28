import React from 'react';

const InputField = (props) => {
  return (
    <div className="inputContainer">
      <input
        type={props.type}
        className="input"
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
      />
      {props.icon && <img id="filtersubmit" src={`url(${props.icon})`} onClick={props.onClick} />}
    </div>
  )
}


export default InputField