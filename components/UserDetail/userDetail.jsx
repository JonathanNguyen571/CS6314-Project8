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
  const [mentionedPhotos, setMentionedPhotos] = useState([]); // State for mentioned photos
  const { userId } = useParams(); // Get the userId from the URL parameters
  const photoLink = `/photo-share.html#/photos/${userId}`;

  // Fetch user data using axios
  const fetchData = (url, setter) => {
    const token = loginUser?.token;
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setter(response.data);
      })
      .catch((error) => {
        console.log("** Error fetching data: **", error.message);
        setter([])
      });
  };

  async function handleDeleteUser() {
    if (confirm("Are you sure you want to delete this user?")) {
      axios.delete(`/user/me`).then(() => {
        window.location = `/photo-share.html#/login-register`
      });
    }
  }


  // Fetch user details
  useEffect(() => {
    if (userId) {
      const userUrl = `/user/${userId}`;
      fetchData(userUrl, (data) => {
        setUser(data);
        onUserNameChange(`${data.first_name} ${data.last_name}`);
      });

      const detailsUrl = `/user/details/${userId}`;
      fetchData(detailsUrl, (data) => {
        setRecentPhoto(data.recentPhoto);
        setMostCommentedPhoto(data.mostCommentedPhoto);
      });

      const mentionsUrl = `/userMentions/${userId}`;
      fetchData(mentionsUrl, (data) => {
        setMentionedPhotos(data);
      });

    }
  }, [userId]);

  // Redirect to login page if not logged in
  if (!loginUser) {
    return <Navigate to={`/login-register`} />;
  }

  // Render mentioned photos
  const renderMentionedPhotos = () => {
    if (mentionedPhotos.length === 0) {
      return <Typography color="textSecondary">No mentions available.</Typography>;
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Photos where the user is mentioned:
          </Typography>
        </Grid>
        {mentionedPhotos.map((photo, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <img
              src={`/images/${photo.file_name}`}
              alt="Mentioned Photo"
              className="thumbnail"
            />
            <Typography color="textSecondary">
              Owner:{" "}
              <Link to={`/users/${photo.owner_id}`}>
                {photo.owner_name}
              </Link>
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

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
              onClick={() => (window.location.href = photoLink)}
            />
            <Typography color="textSecondary">
              Uploaded: {new Date(recentPhoto.date_time).toLocaleString()}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={async () => {
                await axios.post(`/photos/${recentPhoto._id}/like`);
                fetchData(`/user/details/${userId}`, (data) => {
                  setRecentPhoto(data.recentPhoto);
                  setMostCommentedPhoto(data.mostCommentedPhoto);
                });
              }}
              sx={{ mt: 1 }}
            >
              {recentPhoto.likes?.some(like => like.user_id === loginUser._id) ? 'Unlike' : 'Like'} ({recentPhoto.likes?.length || 0})
            </Button>
          </Grid>
        )}

        {mostCommentedPhoto && (
          <Grid item xs={12}>
            <Typography variant="h6">Most Commented Photo</Typography>
            <img
              src={`/images/${mostCommentedPhoto.file_name}`}
              alt="Most Commented Photo"
              className="thumbnail"
              onClick={() => (window.location.href = photoLink)}
            />
            <Typography color="textSecondary">
              Comments: {mostCommentedPhoto.commentCount}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={async () => {
                await axios.post(`/photos/${mostCommentedPhoto._id}/like`);
                fetchData(`/user/details/${userId}`, (data) => {
                  setRecentPhoto(data.recentPhoto);
                  setMostCommentedPhoto(data.mostCommentedPhoto);
                });
              }}
              sx={{ mt: 1 }}
            >
              {mostCommentedPhoto.likes?.some(like => like.user_id === loginUser._id) ? 'Unlike' : 'Like'} ({mostCommentedPhoto.likes?.length || 0})
            </Button>
          </Grid>
        )}

        <Grid item xs={12}>
          {renderMentionedPhotos()}
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

        {loginUser._id === user._id && (
          <Grid item xs={12} sx={{mt: 4, display: 'flex', justifyContent: 'center'}}>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={() => handleDeleteUser()}
            >
              Delete Account
            </Button>
          </Grid>
        )}
      </Grid>
    )
  );
}

export default UserDetail;
