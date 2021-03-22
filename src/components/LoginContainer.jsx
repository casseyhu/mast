import React, { Component } from 'react';
import InputField from './InputField';
import Button from './Button';
import {sha256} from 'js-sha256';
import axios from '../constants/axios';

class LoginContainer extends Component {
    state = {
        user: "gpd",
        email:'',
        password:'',
        error: 0
    }

    setEmail = (e) => {
        this.setState({
            email: e.target.value
        })
    }

    setPassword = (e) => {
        this.setState({
            password: sha256(e.target.value)
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

    login = (e) => {
        axios.get(`/${this.state.user}/login`, {params: {
            email: this.state.email,
            password: this.state.password
        }}).then(response => {
            localStorage.setItem('jwt-token', response.data)
            console.log(response.data);
            this.props.setLoggedIn(true);
            if (this.state.user === 'gpd') {
                this.props.history.push('/browse')
            } else {
                this.props.history.push('/student')
            }
        }).catch(err => {
            console.log(err)
        })
    }

    render(){
        return(
            <div className='login-box'>
                <div className="login-box-top">
                    <p className="welcome">WELCOME</p>
                    <p className="landing-title">Stony Brook University <br/>Masters Student Tracking System</p>
                </div>
                <h2 className="login-item" style={{textAlign:'center', fontWeight:"800"}}>USER LOGIN</h2>
                <div className="flex-horizontal user-slider login-item" onClick={this.switchUser}>
                    <div className={`gpd${this.state.user==="gpd" ? '-selected' : ''}`}>
                    </div>
                    <div className={`student${this.state.user==="student" ? '-selected' : ''}`}>
                    </div>
                    <div className="users">
                        <span className="gpd"> GPD </span>
                        <span className="student"> Student </span>
                    </div>
                </div>
                <div className="login-item" >
                    <InputField type="email" placeholder="email" onChange={this.setEmail}/>
                </div>
                <div className="login-item" >
                    <InputField type="password" placeholder="password" onChange={this.setPassword}/>
                </div>
                <Button variant="round" text="login" onClick={this.login}/>
            </div>
        )
    }

}

export default LoginContainer;