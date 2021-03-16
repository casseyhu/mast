import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from "react-bootstrap/Nav";

function NavigationBar() {
    return (
        <Navbar expand="md" variant="dark">
            <Navbar.Brand href="/">MAST.</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="toggler"/>
            <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
                <Nav.Link 
                className="nav-link"
                href={process.env.PUBLIC_URL + "/browse"}>
                    browse
                </Nav.Link>

                <Nav.Link 
                className="nav-link"
                href={process.env.PUBLIC_URL + "/trends"}>
                    trends
                </Nav.Link>

                <Nav.Link 
                className="nav-link"
                href={process.env.PUBLIC_URL + "/import"}>
                    import
                </Nav.Link>

                <Nav.Link 
                className="nav-link"
                href={process.env.PUBLIC_URL + "/bulletin"}>
                    bulletin
                </Nav.Link>

            </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}
export default NavigationBar;