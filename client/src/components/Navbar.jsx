import React, { useState, useEffect } from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Popover from 'react-bootstrap/Popover'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import jwt_decode from 'jwt-decode'
import { Link } from 'react-router-dom'

const NavigationBar = (props) => {
  const [userType, setUserType] = useState('')
  const [userId, setUserId] = useState('')
  const [userInfo, setUserInfo] = useState({})

  useEffect(() => {
    let token = localStorage.getItem('jwt-token')
    if (!token)
      return
    var decoded = jwt_decode(token)
    setUserType(decoded.type)
    setUserId(decoded.id)
    setUserInfo(decoded.userInfo)
  }, [props.loggedIn])

  const logout = () => {
    localStorage.clear()
  }

  if (userType === '')
    return <> </>
  return (
    <Navbar className='' expand='lg' variant='dark'>
      <Navbar.Brand as={Link} to={{ pathname: process.env.PUBLIC_URL + '/' }}>
        MAST.
      </Navbar.Brand>
      <Navbar.Toggle
        aria-controls='basic-navbar-nav'
        className='toggler'
      />
      <Navbar.Collapse id='basic-navbar-nav'>
        <Nav className='mr-auto'>
          {(userType === 'gpd')
            && (
              <Nav.Link className='nav-link' as={Link} to={{ pathname: process.env.PUBLIC_URL + '/' }}>
                browse
              </Nav.Link>
            )
          }
          {(userType === 'gpd')
            && (
              <Nav.Link className='nav-link' as={Link} to={{ pathname: process.env.PUBLIC_URL + '/trends' }}>
                trends
              </Nav.Link>
            )
          }
          {(userType === 'gpd')
            && (
              <Nav.Link className='nav-link' as={Link} to={{ pathname: process.env.PUBLIC_URL + '/import' }}>
                import
              </Nav.Link>
            )
          }

          {(userType === 'student')
            && (
              <Nav.Link className='nav-link' as={Link} to={{ pathname: process.env.PUBLIC_URL + '/' }}>
                profile
              </Nav.Link>
            )
          }
          <Nav.Link className='nav-link' as={Link} to={{ pathname: process.env.PUBLIC_URL + '/bulletin' }}>
            bulletin
          </Nav.Link>

        </Nav>
      </Navbar.Collapse>
      <Navbar.Collapse id='basic-navbar-nav'>
        <Nav className='ml-auto'>
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement='bottom'
            overlay={
              <Popover style={{ maxWidth: '100%' }}>
                <Popover.Title as='h3' className='center'>
                  <b>{userType === 'gpd' ? 'Graduate Program Director' : 'Student'}</b>
                  <br />{userInfo.firstName} {userInfo.lastName}
                </Popover.Title>
                <Popover.Content>
                  Department: {userInfo.department}
                  <br />Email: {userInfo.email}
                  <br />ID: {userType === 'gpd' ? userInfo.facultyId : userInfo.sbuId}
                </Popover.Content>
              </Popover>
            }>
            <Nav.Link className='nav-link' href='#'>
              {userType === 'gpd' ? 'facultyid' : 'sbuid'}: {userId}
            </Nav.Link>
          </OverlayTrigger>
          {(userType !== '')
            && (
              <Nav.Link className='nav-link' onClick={logout} href={process.env.PUBLIC_URL + '/'}>
                logout
              </Nav.Link>
            )
          }
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}
export default NavigationBar