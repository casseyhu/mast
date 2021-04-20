import React from 'react'
import LoginContainer from '../components/LoginContainer'
import '../css/login.css'
import { LANDING_WAVE_ANIMATION } from '../constants/svgs'

const MainPage = (props) => {

  return (
    <div className="flex-vertical " style={{ height: '100vh' }}>
      <div className="flex-horizontal justify-content-center align-items-end" style={{ height: '100vh' }}>
        <LoginContainer history={props.history} setLoggedIn={props.setLoggedIn} />
      </div>
      {LANDING_WAVE_ANIMATION}
      <footer>
        <small>Copyright © 2021 Cassey Hu, Sooyeon Kim, Eddie Xu, Andrew Kong</small>
      </footer>
    </div>
  )
}

export default MainPage