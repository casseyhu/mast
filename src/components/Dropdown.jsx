import React, { useState } from 'react';


const Dropdown = (props) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(props.title);

    const toggle = () => {
        setOpen(!open)
    }

    const selectionHandler = (item) => {
        item.preventDefault();
        console.log(item.target.innerHTML)
        setSelected(item.target.innerHTML);
        setOpen(false);
    }

    return (
        <div className="dd-wrapper">
            <button className="round-button" onClick={toggle}>
                {selected}
                <i className={open ? "icon fa fa-caret-up" : "icon fa fa-caret-down"} aria-hidden="true" style={{float:'right'}}/>
            </button>
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