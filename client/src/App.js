
import React, { Component } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import MainPage from './pages/Login/Login'
import NavigationBar from './components/Navbar'
import Browse from './pages/Browse/Browse'
import Trends from './pages/Trends'
import Import from './pages/Import/Import'
import Bulletin from './pages/Bulletin/Bulletin'
import Suggest from './pages/Suggest/Suggest'
import Student from './pages/Student/Student'
import EditCoursePlan from './pages/EditPlan/EditCoursePlan'
import EditTransfer from './pages/Transfer/EditTransfer'
import jwt_decode from 'jwt-decode'

class App extends Component {

  state = {
    loggedIn: false,
    type: '',
    user: '',
  }

  setLoggedIn = (val, type, user) => {
    console.log(user)
    this.setState({
      loggedIn: val,
      type: type,
      user: user
    })
  }

  componentDidMount = () => {
    let token = localStorage.getItem('jwt-token')
    if (!token)
      return
    var decoded = jwt_decode(token)
    this.setState({
      loggedIn: true,
      type: decoded.type,
      user: decoded.userInfo
    })
    /* Uncomment to turn out persistant logout after 20 mins */
    // console.log(Date.now() / 1000, decoded.exp)
    // if (Date.now() / 1000 >= decoded.exp) {
    //   // token = await refreshToken()
    //   localStorage.clear()
    //   // console.log('cleared', localStorage.getItem('jwt-token'))
    //   this.setLoggedIn(false)
    // }
  }


  render() {
    const { type, user } = this.state
    return (
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <NavigationBar loggedIn={this.state.loggedIn} />
        <Switch>
          {!type && <Route exact path='/' component={(props) => <MainPage {...props} setLoggedIn={this.setLoggedIn} />} />}
          {type === 'gpd' && <Route exact path='/' component={(props) => <Browse {...props} user={user} />} />}

          {type === 'student' && <Route exact path='/' component={(props) => <Student {...props} mode='View' type={type} student={user} department={user.department} />} />}
          {type === 'gpd' && <Route path='/student' component={(props) => <Student {...props} mode='View' type={type} />} />}

          {type === 'gpd' && <Route path='/trends' component={(props) => <Trends {...props} dept={user.department} />} />}
          {type === 'gpd' && <Route path='/import' component={(props) => <Import {...props} dept={user.department} />} />}
          {type && <Route path='/bulletin' component={(props) => <Bulletin {...props} type={type} user={user} />} />}
          {type && <Route path='/suggest' component={Suggest} />}
          {type && <Route path='/courseplan' component={EditCoursePlan} />}
          {type === 'gpd' && <Route path='/transfer' component={EditTransfer} />}
          <Route component={NotFound404} />
        </Switch>
      </BrowserRouter>
    )
  }
}

const NotFound404 = () => {
  return (
    <h3>
      404 Page Not Found
    </h3>
  )
}

export default App
