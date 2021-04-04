import React from 'react';

const InputField = (props) => {
  return (
    <div className={`inputContainer ${props.className}`} style={props.style}>
      <input
        type={props.type}
        className={`input ${props.inputStyle}`}
        placeholder={props.placeholder}
        value={props.value}
        disabled={props.disabled}
        required={props.required}
        onChange={props.onChange}
      />
      {props.icon && <i id="icon" className={props.icon} onClick={props.onClick} />}
    </div>
  )
}


export default InputField