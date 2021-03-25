import React, { Component } from 'react';
import InputField from './InputField';
import Button from './Button';
import axios from '../constants/axios';

class LoginContainer extends Component {
  state = {
    user: "gpd",
    email: '',
    password: '',
    error: ''
  }

  setEmail = (e) => {
    this.setState({
      email: e.target.value
    })
  }

  setPassword = (e) => {
    this.setState({
      password: e.target.value
    })
  }

  switchUser = (e) => {
    if (this.state.user === "gpd") {
      this.setState({
        user: "student"
      })
    } else {
      this.setState({
        user: "gpd"
      })
    }
  }

  handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      this.login();
    }
  }

  login = (e) => {
    axios.get(`/${this.state.user}/login`, {
      params: {
        email: this.state.email,
        password: this.state.password
      }
    }).then(response => {
      localStorage.setItem('jwt-token', response.data)
      console.log(response.data);
      this.props.setLoggedIn(true);
      if (this.state.user === 'gpd') {
        this.props.history.push('/browse')
      } else {
        this.props.history.push('/student')
      }
    }).catch(err => {
      this.setState({ error: err.response.data });
    })
  }


  render() {
    document.onkeyup = this.handleKeyUp;
    return (
      <div className='login-box'>
        <div className="login-box-top">
          <p className="welcome">WELCOME</p>
          <p className="landing-title">
            Stony Brook University <br />Masters Student Tracking System
          </p>
        </div>
        <h2 className="login-item">USER LOGIN</h2>
        <div className="flex-horizontal user-slider login-item" onClick={this.switchUser}>
          <div className={`gpd${this.state.user === "gpd" ? '-selected' : ''}`} />
          <div className={`student${this.state.user === "student" ? '-selected' : ''}`} />
          <div className="users">
            <span className="gpd"> GPD </span>
            <span className="student"> Student </span>
          </div>
        </div>
        <div className="login-item">
          <InputField type="email" placeholder="email" onChange={this.setEmail} />
        </div>
        <div className="login-item">
          <InputField type="password" placeholder="password" onChange={this.setPassword} />
        </div>
        <Button variant="round" text="login" onClick={this.login} />
        <span className="error">{this.state.error}</span>
      </div>
    )
  }

}

export default LoginContainer;