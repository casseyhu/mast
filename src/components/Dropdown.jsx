import React, { useState } from 'react';
import InputField from './InputField';

const Dropdown = (props) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(props.title);

    const toggle = () => {
        setOpen(!open)
    }

    const selectionHandler = (item) => {
        item.preventDefault();
        setSelected(item.target.innerHTML);
        setOpen(false);
    }

    return (
        <div className="dd-wrapper">
            <InputField type="text" 
            onClick={toggle} 
            placeholder={selected} 
            value={selected} 
            onChange={e => setSelected(e.target.value)}
            icon={open ? "icon fa fa-caret-up" : "icon fa fa-caret-down"}/>
            {/* <button className="round-button" onClick={toggle}>
                {selected}
                <i className={open ? "icon fa fa-caret-up" : "icon fa fa-caret-down"} aria-hidden="true" style={{float:'right'}}/>
            </button> */}
            <ul className={"dd-list" + (open ? "-active" : "")}>
                {props.items.map((item, i) => (
                    <li className="dd-list-item" key={i}>
                        <a href="#" className="dd-item" onClick={selectionHandler}>{item}</a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Dropdown