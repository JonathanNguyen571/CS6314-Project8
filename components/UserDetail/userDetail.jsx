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
  const [recentPhoto, setRecentPhoto] = useState(null);
  const [mostCommentedPhoto, setMostCommentedPhoto] = useState(null);
  const { userId } = useParams(); // Get the userId from the URL parameters
  const photoLink = "http://localhost:3000/photo-share.html#/photos/" + userId;


  // Fetch user data using axios
  const fetchData = (url, setter) => {
    const token = loginUser?.token; // Assuming loginUser contains the auth token
    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setter(response.data);
      })
      .catch((error) => {
        console.log("** Error fetching data: **", error.message);
      });
  };

  // Fetch user details
  useEffect(() => {
    if (userId) {
      const userUrl = `http://localhost:3000/user/${userId}`;
      fetchData(userUrl, (data) => {
        setUser(data);
        onUserNameChange(`${data.first_name} ${data.last_name}`);
      });

      // Fetch recent and most-commented photos
      const detailsUrl = `http://localhost:3000/user/details/${userId}`;
      fetchData(detailsUrl, (data) => {
        setRecentPhoto(data.recentPhoto);
        setMostCommentedPhoto(data.mostCommentedPhoto);
      });
    }
  }, [userId]); // Dependency array ensures re-fetching when userId changes

  // Redirect to login page if not logged in
  if (!loginUser) {
    return <Navigate to={`/login-register`} />;
  }

  // Render user details if data is available
  return (
    user && (
      <Grid container spacing={2}>
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

        {recentPhoto && (
          <Grid item xs={12}>
            <Typography variant="h6">Most Recent Photo</Typography>
            <img
              src={`/images/${recentPhoto.file_name}`}
              alt="Recent Photo"
              className="thumbnail"
              onClick={() => window.location.href = photoLink}
              />
            <Typography color="textSecondary">
              Uploaded: {new Date(recentPhoto.date_time).toLocaleString()}
            </Typography>
          </Grid>
        )}

        {mostCommentedPhoto && (
          <Grid item xs={12}>
            <Typography variant="h6">Most Commented Photo</Typography>
            <img
              src={`/images/${mostCommentedPhoto.file_name}`}
              alt="Most Commented Photo"
              className="thumbnail"
              onClick={() => window.location.href = photoLink}
              />
            <Typography color="textSecondary">
              Comments: {mostCommentedPhoto.commentCount}
            </Typography>
          </Grid>
        )}

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
