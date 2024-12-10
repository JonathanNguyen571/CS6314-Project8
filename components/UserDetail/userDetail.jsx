import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button, Grid, Typography } from "@mui/material";
import axios from "axios";
import "./userDetail.css";

/**
 * UserDetail - A React component to display user details
 */
function UserDetail({ loginUser, onUserNameChange }) {
  const [user, setUser] = useState(null);
  const { userId } = useParams(); // Get the userId from the URL parameters

  // Fetch user data using axios
  const fetchData = (url) => {
    const token = loginUser?.token; // Assuming loginUser contains the auth token
    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setUser(response.data);
        onUserNameChange(`${response.data.first_name} ${response.data.last_name}`);
        console.log("** UserDetail: fetched user detail **");
      })
      .catch((error) => {
        console.log("** Error fetching user data: **", error.message);
      });
  };

  // Fetch user data when component mounts or when userId changes
  useEffect(() => {
    if (userId) {
      const url = `http://localhost:3000/user/${userId}`;
      fetchData(url);
    }
  }, [userId]); // Dependency array ensures re-fetching when userId changes

  // Redirect to login page if not logged in
  if (!loginUser) {
    return <Navigate to={`/login-register`} />;
  }

  // Render user details if data is available
  return (
    user && (
      <Grid container>
        <Grid item xs={12}>
          <Typography color="textSecondary">Name:</Typography>
          <Typography variant="h6" gutterBottom>
            {`${user.first_name} ${user.last_name}`}
          </Typography>
          <Typography color="textSecondary">Description:</Typography>
          <Typography variant="h6" gutterBottom>
            {user.description || "No description available"}
          </Typography>
          <Typography color="textSecondary">Location:</Typography>
          <Typography variant="h6" gutterBottom>
            {user.location || "No location provided"}
          </Typography>
          <Typography color="textSecondary">Occupation:</Typography>
          <Typography variant="h6" gutterBottom>
            {user.occupation || "No occupation specified"}
          </Typography>
        </Grid>
        <Grid item xs={4} />
        <Grid item xs={4}>
          <Button
            size="large"
            to={`/photos/${user._id}`}
            component={Link}
            variant="contained"
            color="primary"
          >
            See Photos
          </Button>
        </Grid>
        <Grid item xs={4} />
      </Grid>
    )
  );
}

export default UserDetail;
