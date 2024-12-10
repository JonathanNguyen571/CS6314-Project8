import React, { useEffect, useState, useRef } from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './topBar.css';

function TopBar({ loginUser, onLoginUserChange, onPhotoUpload, userName }) {
  const [version, setVersion] = useState(null);
  const uploadInputRef = useRef(null);

  const { userId } = useParams();
  const location = useLocation();

  useEffect(() => {
    if (loginUser) {
      axios.get('http://localhost:3000/test/info')
        .then((response) => setVersion(response.data.__v))
        .catch((error) => console.log("Error fetching version:", error.message));
    }
  }, [loginUser]);

  const handleLogOut = () => {
    axios.post('/admin/logout')
      .then((response) => {
        if (response.status === 200) {
          onLoginUserChange(null);
          console.log("Logged out successfully");
        }
      })
      .catch((error) => console.log("Error logging out:", error.message));
  };

  const handlePhotoSubmit = (event) => {
    event.preventDefault();
    if (uploadInputRef.current?.files.length > 0) {
      const formData = new FormData();
      formData.append('uploadedphoto', uploadInputRef.current.files[0]);

      axios.post('/photos/new', formData)
        .then((response) => {
          if (response.status === 200) {
            console.log("Photo uploaded successfully", response.data);
            onPhotoUpload();
          }
        })
        .catch((error) => console.log("Error uploading photo:", error.message));
    } else {
      console.log("No file selected for upload.");
    }
  };

  const isPhotosRoute = location.pathname.includes('/photos/');
  const isUsersRoute = location.pathname.includes('/users/');

  return (
    <AppBar className="cs6314-topbar-appBar" position="fixed">
      <Toolbar>
        <Typography variant="h5" style={{ flexGrow: 1 }}>
          Fakebook {loginUser && `ver: ${version}`}
        </Typography>

        <Typography variant="h5" style={{ flexGrow: 1 }}>
          {loginUser ? `Hello, ${loginUser.first_name}` : "Please Login"}
        </Typography>

        {loginUser && (
          <Typography variant="h5" style={{ flexGrow: 1 }}>
            {isPhotosRoute && "Photos of "}
            {isUsersRoute && "Info of "}
            {userId && `${userName}`}
          </Typography>
        )}

        {loginUser && (
          <form onSubmit={handlePhotoSubmit} style={{ flexGrow: 1 }}>
            <Button component="label" style={{ color: 'white', marginRight: '10px' }}>
              Choose File
              <input hidden type="file" accept="image/*" ref={uploadInputRef} />
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Upload
            </Button>
          </form>
        )}

        {loginUser && (
          <Button onClick={handleLogOut} variant="contained" color="secondary">
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
