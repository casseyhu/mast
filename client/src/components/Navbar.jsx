import React, { useState, useEffect } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from "react-bootstrap/Nav";
import jwt_decode from 'jwt-decode';
import { Link } from 'react-router-dom';

const NavigationBar = (props) => {
  const [userType, setUserType] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    let token = localStorage.getItem('jwt-token')
    if (!token)
      return
    var decoded = jwt_decode(token)
    console.log(decoded)
    setUserType(decoded.type)
    setUserId(decoded.id)
  }, [props.loggedIn])

  const logout = () => {
    localStorage.clear();
  }

  if (userType === '')
    return <> </>
  return (
    <Navbar className="" expand="lg" variant="dark">
      {(userType === 'gpd') && (
        <Navbar.Brand as={Link} to={{ pathname: process.env.PUBLIC_URL + "/" }}>
          MAST.
        </Navbar.Brand>
      )}
      {(userType === 'student') && (
        <Navbar.Brand as={Link} to={{ pathname: process.env.PUBLIC_URL + "/" }}>
          MAST.
        </Navbar.Brand>
      )}
      <Navbar.Toggle
        aria-controls="basic-navbar-nav"
        className="toggler"
      />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          {(userType === 'gpd')
            && (
              <Nav.Link className="nav-link" as={Link} to={{ pathname: process.env.PUBLIC_URL + "/" }}>
                browse
              </Nav.Link>
            )
          }
          {(userType === 'gpd')
            && (
              <Nav.Link className="nav-link" as={Link} to={{ pathname: process.env.PUBLIC_URL + "/trends" }}>
                trends
              </Nav.Link>
            )
          }
          {(userType === 'gpd')
            && (
              <Nav.Link className="nav-link" as={Link} to={{ pathname: process.env.PUBLIC_URL + "/import" }}>
                import
              </Nav.Link>
            )
          }

          {(userType === 'student')
            && (
              <Nav.Link className="nav-link" as={Link} to={{ pathname: process.env.PUBLIC_URL + "/" }}>
                profile
              </Nav.Link>
            )
          }
          {(userType === 'student')
            && (
              <Nav.Link className="nav-link" as={Link} to={{ pathname: process.env.PUBLIC_URL + "/courseplan" }}>
                my course plan
              </Nav.Link>
            )
          }
          <Nav.Link className="nav-link" as={Link} to={{ pathname: process.env.PUBLIC_URL + "/bulletin" }}>
            bulletin
          </Nav.Link>

        </Nav>
      </Navbar.Collapse>
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ml-auto">
          <Nav.Link className="nav-link" href="#">
            {userType === 'gpd' ? 'facultyid' : 'sbuid'}: {userId}
          </Nav.Link>
          {(userType !== '')
            && (
              <Nav.Link className="nav-link" onClick={logout} href={process.env.PUBLIC_URL + "/"}>
                logout
              </Nav.Link>
            )
          }
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}
export default NavigationBar;