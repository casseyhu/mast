import React, { Component } from 'react';
import InputField from './InputField';
import Button from './Button';

class LoginContainer extends Component{
    state = {
        user: "GPD",
        email:'',
        password:'',
        error:0
    }

    setUser = (e) => {
        this.setState({
            user: e.target.id
        })
    }

    switchUser = (e) => {
        if (this.state.user === "GPD") {
            this.setState({
                user: "Student"
            })
        } else {
            this.setState({
                user: "GPD"
            })
        }
    }

    render(){
        return(
            <div className='login-box'>
                <h1 className="login-item" style={{textAlign:'center', fontWeight:"800"}}>Login</h1>
                <div className="flex-horizontal user-slider login-item" onClick={this.switchUser}>
                    <div id="GPD" 
                    className={`gpd${this.state.user==="GPD" ? '-selected' : ''}`}
                    onClick={this.setUser}>
                    </div>
                    <div id="Student" 
                    className={`student${this.state.user==="Student" ? '-selected' : ''}`}
                    onClick={this.setUser}>
                    </div>
                    <div className="users">
                        <span id="GPD" 
                        className="gpd"
                        onClick={this.setUser}>
                            GPD
                        </span>
                        <span id="Student"
                        className="student"
                        onClick={this.setUser}>
                            Student
                        </span>
                    </div>
                </div>
                <div className="login-item" >
                    <InputField type="email" placeholder="email"/>
                </div>
                <div className="login-item" >
                    <InputField type="password" placeholder="password"/>
                </div>
                <Button variant="round" text="login"/>
            </div>
        )
    }

}

export default LoginContainer;