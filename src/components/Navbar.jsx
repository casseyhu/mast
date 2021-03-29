import React, { useState, useEffect } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from "react-bootstrap/Nav";
import jwt_decode from 'jwt-decode';


const NavigationBar = (props) => {
  const [userType, setUserType] = useState("")
  const [user, setUser] = useState("")

  useEffect(() => {
    let token = localStorage.getItem('jwt-token')
    if (!token)
      return
    var decoded = jwt_decode(token)
    setUserType(decoded.type)
    setUser(decoded.id)
  }, [props.loggedIn])

  const logout = () => {
    localStorage.clear();
  }


  if (userType === '')
    return <> </>
  return (
    <Navbar className="" expand="lg" variant="dark">
      <Navbar.Brand href={(userType === 'student') ? "/student" : "/browse"}>MAST.</Navbar.Brand>
      <Navbar.Toggle
        aria-controls="basic-navbar-nav"
        className="toggler"
      />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          {(userType === 'gpd')
            && (
              <Nav.Link href={process.env.PUBLIC_URL + "/browse"}>
                browse
              </Nav.Link>
            )
          }
          {(userType === 'gpd')
            && (
              <Nav.Link className="nav-link" href={process.env.PUBLIC_URL + "/trends"}>
                trends
              </Nav.Link>
            )
          }
          {(userType === 'gpd')
            && (
              <Nav.Link className="nav-link" href={process.env.PUBLIC_URL + "/import"}>
                import
              </Nav.Link>
            )
          }

          {(userType === 'student')
            && (
              <Nav.Link className="nav-link" href={process.env.PUBLIC_URL + "/student"}>
                profile
              </Nav.Link>
            )
          }
          {(userType === 'student')
            && (
              <Nav.Link className="nav-link" href={process.env.PUBLIC_URL + "/courseplan"}>
                my course plan
              </Nav.Link>
            )
          }
          <Nav.Link className="nav-link" href={process.env.PUBLIC_URL + "/bulletin"}>
            bulletin
          </Nav.Link>

        </Nav>
      </Navbar.Collapse>
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ml-auto">
          {(userType === 'student')
            && <Nav.Link className="nav-link" href="#">sbuid: {user}</Nav.Link>
          }
          {(userType === 'gpd')
            && <Nav.Link className="nav-link" href="#">facultyid: {user}</Nav.Link>
          }
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