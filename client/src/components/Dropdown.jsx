import React from 'react';
import Select from 'react-select';

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    color: state.isFocused ? 'white' : 'black',
    backgroundColor: state.isFocused ? 'rgb(30, 61, 107)' : 'white',
    overflowX: 'hidden',
  }),
  multiValue: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    color: 'white',
    padding: '0 .2rem',
    backgroundColor: 'rgba(30, 61, 107, 0.75)'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'white',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    "&:hover": {
      backgroundColor: "rgba(30, 61, 107, 0.75)",
      borderRadius: '0.5rem',
      color: "white"
    }
  }),
  control: (provided) => ({
    ...provided,
    border: '2px solid rgb(30, 61, 107)',
    borderRadius: '0.5rem',
    "&:hover": {
      border: '2px solid rgb(30, 61, 107)',
    }
  })
}

const Dropdown = (props) => {
  return (
    <div className={`dd-wrapper-${props.variant} ${props.className}`} style={props.style}>
      <Select
        isMulti={props.variant === 'multi'}
        isSearchable
        onChange={props.onChange}
        options={props.items}
        placeholder={props.placeholder}
        styles={customStyles}
        isDisabled={props.disabled}
      />
    </div>
  )
}

export default Dropdown