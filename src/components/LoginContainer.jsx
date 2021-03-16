import React, { Component } from 'react';
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import InputField from './InputField';


class LoginContainer extends Component{
    state = {
        email:'',
        password:'',
        error:0
    }

    render(){
        return(
            <div className='loginBox'>
                <Tabs className='login-tabs' defaultActiveKey='gdp'>
                    <Tab tabClassName='login-tab lead' title='GPD'>
                        <InputField/>
                    </Tab>
                    <Tab tabClassName='login-tab lead' title='Student'>
                        <InputField/>
                    </Tab>
                </Tabs>
            </div>
        )
    }

}

export default LoginContainer;