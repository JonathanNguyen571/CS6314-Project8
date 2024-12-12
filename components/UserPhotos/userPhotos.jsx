import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { List, Divider, Typography, Grid, Avatar, Card, CardHeader, CardMedia, CardContent, Button } from "@mui/material";
import "./userPhotos.css";
import axios from "axios";
import CommentDialog from "../CommentDialog/commentDialog";

function UserPhotos({ loginUser, photoIsUploaded, onUserNameChange }) {
  const { userId } = useParams(); // Use the useParams hook to get userId
  const [photos, setPhotos] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotosAndUser = async () => {
    try {
      const photoResponse = await axios.get(`/photosOfUser/${userId}`);
      setPhotos(photoResponse.data);

      const userResponse = await axios.get(`/user/${userId}`);
      setUser(userResponse.data);

      onUserNameChange(`${userResponse.data.first_name} ${userResponse.data.last_name}`);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };


  const handleDeletePhoto = async (photoId) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      await axios.delete(`/photos/${photoId}`);
      fetchPhotosAndUser();
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      await axios.delete(`/comments/${commentId}`);
      fetchPhotosAndUser();
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPhotosAndUser();
    }
  }, [userId, photoIsUploaded]);

  if (!loginUser) {
    return <Navigate to="/login-register" />;
  }

  if (loading || !user) {
    return <p>Loading...</p>;
  }

  return (
    <Grid container spacing={3} justifyContent="flex-start">
      {photos.map((photo) => (
        <Grid item xs={6} key={photo._id}>
          <Card variant="outlined">
            <CardHeader
              avatar={
                <Avatar style={{ backgroundColor: "#FF7F50" }}>
                  {user.first_name[0]}
                </Avatar>
              }
              title={<Link to={`/users/${user._id}`}>{`${user.first_name} ${user.last_name}`}</Link>}
              subheader={photo.date_time}
            />
            <CardMedia component="img" image={`./images/${photo.file_name}`} alt="Photo" />
            <CardContent>
              {photo.comments && (
                <Typography variant="subtitle1">
                  Comments:
                  <Divider />
                </Typography>
              )}
              {
                loginUser._id === user._id && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{
                      mt: 1,
                      mb: 2,
                      '&:hover': {
                        backgroundColor: '#d32f2f'
                      }
                    }}
                    onClick={() => handleDeletePhoto(photo._id)}
                  >
                    Delete Photo
                  </Button>
                )
              }
              {photo.comments?.map((c) => (
                <List key={c._id}>
                  <Typography variant="subtitle2">
                    <Link to={`/users/${c.user._id}`}>{`${c.user.first_name} ${c.user.last_name}`}</Link>
                  </Typography>
                  <Typography variant="caption" color="textSecondary" gutterBottom>
                    {c.date_time}
                  </Typography>
                  <Typography variant="body1">{`"${c.comment}"`}</Typography>
                  {loginUser._id === c.user._id && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      sx={{
                        mt: 1,
                        '&:hover': {
                          backgroundColor: '#d32f2f'
                        }
                      }}
                      onClick={() => handleDeleteComment(c._id)}
                    >
                      Delete Comment
                    </Button>
                  )}
                </List>
              ))}
              <CommentDialog onCommentSumbit={() => fetchPhotosAndUser()} photo_id={photo._id} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>)
}

export default UserPhotos;