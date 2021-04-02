
import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import MainPage from './pages/index';
import NavigationBar from './components/Navbar';
import Browse from './pages/Browse';
import Trends from './pages/Trends';
import Import from './pages/Import';
import Bulletin from './pages/Bulletin';
import Suggest from './pages/Suggest';
import Student from './pages/Student';
import EditPlan from './pages/EditPlan';
import ViewPlan from './pages/ViewPlan';
import NotFound404 from './pages/NotFound404';
import jwt_decode from 'jwt-decode';


class App extends Component {

  state = {
    loggedIn: false,
    user: ''
  }

  setLoggedIn = (val, user) => {
    this.setState({
      loggedIn: val,
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
      user: decoded.type
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
    const { user } = this.state;
    return (
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <NavigationBar loggedIn={this.state.loggedIn} />
        <Switch>
          <Route exact path="/" component={(props) => <MainPage {...props} setLoggedIn={this.setLoggedIn} />} />
          {user === 'gpd' && <Route path="/browse" component={Browse} />}
          {user === 'gpd' && <Route path="/trends" component={Trends} />}
          {user === 'gpd' && <Route path="/import" component={Import} />}
          {user && <Route path="/bulletin" component={(props) => <Bulletin {...props} user={this.state.user} />} />}
          {user && <Route path="/suggest" component={Suggest} />}
          {user && <Route path="/student" component={(props) => <Student {...props} user={this.state.user} />} />}
          {user && <Route exact path="/courseplan" component={ViewPlan} />}
          {user && <Route path="/courseplan/edit" component={EditPlan} />}
          <Route component={NotFound404} />
        </Switch>
      </BrowserRouter>
    )
  }
}

export default App;