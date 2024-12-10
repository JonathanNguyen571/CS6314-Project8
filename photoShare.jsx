import React, { useState } from "react";
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Grid, Paper } from '@mui/material';
import './styles/main.css';

// Import necessary components
import TopBar from './components/topBar/topBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/LoginRegister/loginRegister';

const root = createRoot(document.getElementById('photoshareapp'));

function PhotoShare() {
  const [photoIsUploaded, setPhotoIsUploaded] = useState(false);
  const [userName, setUserName] = useState(null); // The user the logged-in user is currently viewing
  const [loginUser, setLoginUser] = useState(); // Used to check if a user is logged in

  /**
   * Update the viewing user name for TopBar to display.
   * @param name - The name of the user being viewed.
   */
  const handleUserNameChange = (name) => {
    console.log("Setting Viewing User to: ", name);
    setUserName(name);
  };

  /**
   * Update the logged-in user info for TopBar to display.
   * @param user - The logged-in user's ID and name.
   */
  const handleLoginUserChange = (user) => {
    console.log("Setting login user to: ", user);
    setLoginUser(user);
  };

  /**
   * Notify child components that the photo list is updated.
   */
  const handlePhotoUpload = () => {
    setPhotoIsUploaded(true); // Notify photo list re-render
    setPhotoIsUploaded(false); // Reset the variable
  };

  return (
    <HashRouter>
      <div>
        <Grid container spacing={1}>

          {/* TopBar View */}
          <Grid item xs={12}>
            <TopBar
              onLoginUserChange={handleLoginUserChange}
              onPhotoUpload={handlePhotoUpload}
              userName={userName}
              loginUser={loginUser}
            />
          </Grid>
          <div className="cs142-main-topbar-buffer" />

          {/* Sidebar View */}
          <Grid item sm={3}>
            <Paper
              className="side-bar"
              elevation={3}
              style={{
                backgroundColor: "#abd1c6",
                margin: '3%',
                border: "4px solid black",
              }}
            >
              <UserList loginUser={loginUser} />
            </Paper>
          </Grid>

          {/* Main View */}
          <Grid item sm={9}>
            <Paper
              className="cs142-main-grid-item"
              elevation={3}
              style={{
                backgroundColor: "#abd1c6",
                height: '100%',
                marginTop: '1%',
                marginRight: '2%',
                border: "4px solid black",
              }}
            >
              {/* All unauthorized visits redirect to the login page */}
              <Routes>
                {/* User Detail View */}
                <Route
                  path="/users/:userId"
                  element={
                    <UserDetail
                      onUserNameChange={handleUserNameChange}
                      onLoginUserChange={handleLoginUserChange}
                      loginUser={loginUser}
                    />
                  }
                />

                {/* User Photos View */}
                <Route
                  path="/photos/:userId"
                  element={
                    <UserPhotos
                      onUserNameChange={handleUserNameChange}
                      onLoginUserChange={handleLoginUserChange}
                      loginUser={loginUser}
                      photoIsUploaded={photoIsUploaded}
                    />
                  }
                />

                {/* Login/Register View */}
                <Route
                  path="/login-register"
                  element={
                    <LoginRegister
                      onLoginUserChange={handleLoginUserChange}
                      loginUser={loginUser}
                    />
                  }
                />

                {/* Default route for unmatched paths */}
                <Route path="*" element={<Navigate to="/login-register" replace />} />
              </Routes>
            </Paper>
          </Grid>

        </Grid>
      </div>
    </HashRouter>
  );
}

// Create React App
root.render(<PhotoShare />);
