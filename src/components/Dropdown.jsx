import React from 'react';
import Select from 'react-select';

const customStyles = {
    option: (provided, state) => ({
        ...provided,
        color: state.isFocused ? 'white' : 'black',
        backgroundColor: state.isFocused ? 'rgb(30, 61, 107)' : 'white',
    }),
    multiValue: (provided) => ({
        ...provided,
        borderRadius: '2rem',
        color: 'white',
        padding: '0 .2rem',
        backgroundColor: 'rgba(30, 61, 107, 0.75)' 
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: 'white',
    }),
    multiValueRemove: (provided, state) => ({
        ...provided,
        "&:hover": {
            backgroundColor: "rgba(30, 61, 107, 0.75)",
            borderRadius: '2rem',
            color: "white"
        }
    }),
    control: (provided) => ({
        ...provided,
        border: '2px solid rgb(30, 61, 107)',
        padding: '.1rem',
        borderRadius: '2rem',
        "&:hover": {
            border: '2px solid rgb(30, 61, 107)',
        }
    })
}

const Dropdown = (props) => {
    return (
        <div className="dd-wrapper">
            <Select 
            isMulti={true}
            isSearchable={true}
            onChange={props.onChange}
            options={props.items}
            styles={customStyles}/>
        </div>
    )
}

export default Dropdown