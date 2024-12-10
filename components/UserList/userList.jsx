import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText, Typography } from "@mui/material";
import axios from "axios";
import "./userList.css";

/**
 * UserList - A functional component to display a list of users
 */
function UserList({ loginUser }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const url = "http://localhost:3000/user/list";

  // Axios cancel token to cancel the request when the component is unmounted
  const source = axios.CancelToken.source();

  // Fetch user data from the server
  const fetchData = async () => {
    try {
      const response = await axios.get(url, { cancelToken: source.token });
      setUsers(response.data);
      console.log("** UserList: fetched User List **");
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled", err.message);
      } else {
        setError(err.message);  // Set error state
        console.log("Error fetching user data:", err.message);
      }
    }
  };

  // Load user list on component mount or when loginUser status changes
  useEffect(() => {
    if (loginUser) {
      fetchData();
    }
    return () => {
      source.cancel("Request cancelled by user");
    };
  }, [loginUser]); // Re-fetch data when loginUser changes

  // Render loading or error state
  if (!loginUser) {
    return null; // Do not render anything if user is not logged in
  }

  if (error) {
    return (
      <Typography variant="h6" color="error">
        Error fetching user list: {error}
      </Typography>
    );
  }

  // Render user list
  return (
    <List component="nav">
      {users ? (
        users.map((user) => (
          <ListItem to={`/users/${user._id}`} component={Link} key={user._id} button>
            <ListItemText
              style={{ paddingLeft: "8px" }}
              primary={<Typography variant="h5">{`${user.first_name} ${user.last_name}`}</Typography>}
            />
          </ListItem>
        ))
      ) : (
        <Typography variant="h6">Loading user list...</Typography>
      )}
    </List>
  );
}

export default UserList;
