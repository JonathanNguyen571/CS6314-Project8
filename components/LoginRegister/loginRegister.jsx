import React from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Typography, Grid, FormControl, InputLabel, Input, Button } from "@mui/material";

export default class LoginRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginName: "",
      password: "",
      loginMessage: "",
      newLoginName: "",
      firstName: "",
      lastName: "",
      description: "",
      location: "",
      occupation: "",
      newPassword: "",
      newPassword2: "",
      registeredMessage: "",
    };
  }

  handleInputChange = ({ target }) => this.setState({ [target.name]: target.value });

  handleLoginSubmit = (e) => {
    e.preventDefault();
    const { loginName, password } = this.state;

    axios
      .post("/admin/login", { login_name: loginName, password })
      .then((response) => {
        this.setState({ loginMessage: response.data.message });
        this.props.onLoginUserChange(response.data);
      })
      .catch((error) => {
        this.setState({ loginMessage: error.response.data.message });
        this.props.onLoginUserChange(null);
      });
  };

  getNewUser() {
    const { newLoginName, newPassword, firstName, lastName, location, description, occupation } = this.state;
    const newUser = {
      login_name: newLoginName,
      password: newPassword,
      first_name: firstName,
      last_name: lastName,
      location,
      description,
      occupation,
    };
    this.setState({
      newLoginName: "",
      newPassword: "",
      newPassword2: "",
      firstName: "",
      lastName: "",
      location: "",
      description: "",
      occupation: "",
    });
    return newUser;
  }

  handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (this.state.newPassword !== this.state.newPassword2) {
      this.setState({ registeredMessage: "Passwords do not match" });
      return;
    }
    const newUser = this.getNewUser();
    axios
      .post("/user", newUser)
      .then((response) => {
        this.setState({ registeredMessage: response.data.message });
      })
      .catch((error) => {
        this.setState({ registeredMessage: error.response.data.message });
      });
  };

  customForm(inputLabel, id, type, value, required, autoFocus = false) {
    return (
      <FormControl fullWidth>
        <InputLabel htmlFor={id}>{inputLabel}</InputLabel>
        <Input
          name={id}
          id={id}
          type={type}
          value={value}
          onChange={this.handleInputChange}
          required={required}
          autoFocus={autoFocus}
        />
      </FormControl>
    );
  }

  render() {
    const loginUser = this.props.loginUser;
    if (loginUser) {
      return <Navigate from="/login-register" to={`/users/${loginUser._id}`} />;
    }

    return (
      <Grid container>
        {/* Login Form */}
        <Grid container item direction="column" alignItems="center" xs={6}>
          <Typography variant="h5">Log In</Typography>
          <Grid item xs={8}>
            <form onSubmit={this.handleLoginSubmit}>
              {this.customForm("Login Name", "loginName", "text", this.state.loginName, true, true)}
              {this.customForm("Password", "password", "password", this.state.password, true)}
              <Button type="submit" disabled={!this.state.loginName} fullWidth variant="contained" color="primary">
                Login
              </Button>
              {this.state.loginMessage && (
                <Typography style={{ color: "red" }}>{this.state.loginMessage}</Typography>
              )}
            </form>
          </Grid>
        </Grid>

        {/* Register Form */}
        <Grid container item direction="column" alignItems="center" xs={6}>
          <Typography variant="h5">Create New Account</Typography>
          <Grid item xs={8}>
            <form onSubmit={this.handleRegisterSubmit}>
              {this.customForm("New Login Name*", "newLoginName", "text", this.state.newLoginName, true)}
              {this.customForm("First Name*", "firstName", "text", this.state.firstName, true)}
              {this.customForm("Last Name*", "lastName", "text", this.state.lastName, true)}
              {this.customForm("Description", "description", "text", this.state.description)}
              {this.customForm("Location", "location", "text", this.state.location)}
              {this.customForm("Occupation", "occupation", "text", this.state.occupation)}
              {this.customForm("New Password*", "newPassword", "password", this.state.newPassword, true)}
              {this.customForm("Re-enter Password*", "newPassword2", "password", this.state.newPassword2, true)}
              <Button type="submit" disabled={!this.state.newLoginName} fullWidth variant="contained" color="primary">
                Register Me
              </Button>
              {this.state.registeredMessage && (
                <Typography style={{ color: this.state.registeredMessage.includes("successfully") ? "green" : "red" }}>
                  {this.state.registeredMessage}
                </Typography>
              )}
            </form>
          </Grid>
        </Grid>
      </Grid>
    );
  }
}
