
import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import MainPage from './pages/index';
import NavigationBar from './components/Navbar';
import Browse from './pages/Browse';
import Trends from './pages/Trends';
import Import from './pages/Import';
import Bulletin from './pages/Bulletin';
import Suggest from './pages/Suggest';
import AddEditStudent from './pages/AddEditStudent';
import TentativePlan from './pages/TentativePlan';
import ViewPlan from './pages/ViewPlan';
import ViewStudent from './pages/ViewStudent';

class App extends Component {

  state = {
    loggedIn: false
  }

  setLoggedIn = (val) => {
    this.setState({
      loggedIn: val
    })
  }

  render() {
    return (
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <NavigationBar loggedIn={this.state.loggedIn} />
        <Switch>
          <Route exact path="/" component={(props) => <MainPage {...props} setLoggedIn={this.setLoggedIn} />} />
          <Route exact path="/browse" component={Browse} />
          <Route exact path="/trends" component={Trends} />
          <Route exact path="/import" component={Import} />
          <Route exact path="/bulletin" component={Bulletin} />
          <Route exact path="/suggest" component={Suggest} />
          <Route exact path="/student" component={ViewStudent} />
          <Route exact path="/student/edit" component={AddEditStudent} />
          <Route exact path="/tentative" component={TentativePlan} />
          <Route exact path="/courseplan" component={ViewPlan} />
          <Route exact path="/:any" component={(props) => <MainPage {...props} setLoggedIn={this.setLoggedIn} />}/>
        </Switch>
      </BrowserRouter>
    )
  }
}

export default App;
