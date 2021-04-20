import React, { Component } from 'react'
import InputField from './InputField'
import Button from './Button'
import axios from '../constants/axios'

class LoginContainer extends Component {
  state = {
    user: 'gpd',
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
    if (this.state.user === 'gpd') {
      this.setState({
        user: 'student'
      })
    } else {
      this.setState({
        user: 'gpd'
      })
    }
  }

  handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      this.login()
    }
  }

  login = (e) => {
    let { user } = this.state
    axios.get(`${user}/login/`, {
      params: {
        email: this.state.email,
        password: this.state.password
      }
    }).then(response => {
      localStorage.setItem('jwt-token', response.data[0])
      console.log('login response', response.data[1])
      this.props.setLoggedIn(true, user, response.data[1])
      document.onkeyup = null
    }).catch(err => {
      console.log(err)
      this.setState({ error: err.response.data })
    })
    return
  }

  render() {
    document.onkeyup = this.handleKeyUp
    return (
      <div className='login-box'>
        <div className='login-box-top'>
          <h2 className='login-heading'>
            Welcome.
            <small>Stony Brook University <br />
            Masters Student Tracking System</small>
          </h2>
        </div>
        <hr className='login-title' />
        <div className='login-item'>
          <input
            id='toggle-gpd'
            className='toggle toggle-left'
            name='toggle'
            value='gpd'
            type='radio'
            onChange={this.switchUser}
            checked={this.state.user === 'gpd'}
          />
          <label htmlFor='toggle-gpd' className='users gpd'>GPD</label>
          <input
            id='toggle-student'
            className='toggle toggle-right'
            name='toggle'
            value='student'
            type='radio'
            onChange={this.switchUser}
            checked={this.state.user === 'student'}
          />
          <label htmlFor='toggle-student' className='users student'>Student</label>
        </div>
        <InputField
          className='login-item'
          type='email'
          placeholder='email'
          required
          value={this.state.email}
          onChange={this.setEmail}
        />
        <InputField
          className='login-item'
          type='password'
          placeholder='password'
          required
          onChange={this.setPassword}
          value={this.state.password} />
        <Button divclassName='login-item' variant='round' text='login' onClick={this.login} />
        <span className='error center-span'>{this.state.error}</span>
      </div>
    )
  }

}

export default LoginContainer