import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Chip,
  Snackbar,
} from "@mui/material";
import "./commentDialog.css";
import axios from "axios";

export default class CommentDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false, // Control the dialog visibility
      comment: "", // Store the user's comment
      success: false, // To show success Snackbar
      error: false, // To show error Snackbar
      users: [], // List of all users for mentions
      filteredUsers: [], // Filtered list for dropdown
      mentionStart: null, // Start position of the mention
      showDropdown: false, // Control visibility of the mention dropdown
      mentionedUsersIdArr: [], // Array of mentioned users' IDs
    };
  }

  componentDidMount() {
    // Fetch all users for @mention functionality
    axios
      .get("/user/list")
      .then((response) => {
        this.setState({ users: response.data });
      })
      .catch((error) => {
        console.error("Error fetching users for mentions:", error);
      });
  }

  // Open the comment dialog
  handleClickOpen = () => this.setState({ open: true });

  // Close the comment dialog
  handleClickClose = () => (
    this.setState({
      open: false,
      comment: "",
      showDropdown: false,
      mentionedUsersIdArr: [],
    })
  );
  
  // Reflect comment changes in the state
  handleCommentChange = (e) => {
    const { value } = e.target;
    const { users, mentionStart, mentionedUsersIdArr } = this.state;
  
    // Detect if user is typing a mention
    const lastChar = value[value.length - 1];
    if (lastChar === "@") {
      this.setState({
        mentionStart: value.length,
        showDropdown: true,
        filteredUsers: users,
      });
    } else if (mentionStart !== null) {
      // Extract the mention text
      const mentionText = value.slice(mentionStart);
      const filteredUsers = users.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`;
        return fullName.toLowerCase().includes(mentionText.toLowerCase());
      });
      this.setState({ filteredUsers, showDropdown: filteredUsers.length > 0 });
    }
  
    // Validate mentionedUsersIdArr against actual mentions in the comment
    const mentionedUsers = mentionedUsersIdArr.filter((id) => (
      users.some((user) => {
        const fullName = `${user.first_name} ${user.last_name}`;
        return value.includes(`@${fullName}`) && user._id === id;
      })
    ));    
  
    this.setState({ comment: value, mentionedUsersIdArr: mentionedUsers });
  };
  

  // Handle selection from the mention dropdown
  handleMentionSelect = (user) => {
    const { comment, mentionStart, mentionedUsersIdArr } = this.state;
    const fullName = `${user.first_name} ${user.last_name}`;

    // Replace the mention text with the selected user
    const updatedComment = `${comment.slice(0, mentionStart - 1)}@${fullName} ${comment.slice(mentionStart)}`;

    // Update mentioned users
    if (!mentionedUsersIdArr.includes(user._id)) {
      mentionedUsersIdArr.push(user._id);
    }

    this.setState({
      comment: updatedComment,
      mentionStart: null,
      showDropdown: false,
      mentionedUsersIdArr,
    });
  };

  // Handle the comment submission
  handleCommentSubmit = () => {
    const { comment, mentionedUsersIdArr } = this.state;

    if (!comment.trim()) {
      this.setState({ error: true });
      return;
    }

    this.setState({ open: false, comment: "", mentionedUsersIdArr: [] }); // Close dialog and clear comment

    // Post the comment to the server
    axios
      .post(`/commentsOfPhoto/${this.props.photo_id}`, { comment })
      .then(() => {
        // Post mentions if there are any
        if (mentionedUsersIdArr.length > 0) {
          axios
            .post("/photosOfUser/mentions", {
              photoId: this.props.photo_id,
              user_id_arr: mentionedUsersIdArr,
            })
            .then(() => console.log("Mentions successfully updated."))
            .catch((err) => console.error("Error updating mentions:", err));
        }

        this.setState({ success: true }); // Show success message
        this.props.onCommentSumbit(); // Notify parent to re-fetch data
      })
      .catch((error) => {
        console.error("Comment Submission Error:", error);
        this.setState({ error: true }); // Show error message
      });
  };

  // Handle Snackbar close
  handleSnackbarClose = () => {
    this.setState({ success: false, error: false });
  };

  render() {
    const { open, comment, success, error, filteredUsers, showDropdown } = this.state;

    return (
      <div className="comment-dialog">
        <Chip label="Reply" onClick={this.handleClickOpen} />

        <Dialog open={open} onClose={this.handleClickClose}>
          <DialogContent>
            <DialogContentText>Add a comment...</DialogContentText>
            <TextField
              value={comment}
              onChange={this.handleCommentChange}
              autoFocus
              multiline
              margin="dense"
              fullWidth
              aria-labelledby="comment-dialog-title"
              aria-describedby="comment-dialog-description"
            />

            {/* Mention Dropdown */}
            {/* Mention Dropdown */}
            {showDropdown && (
              <div className="mention-dropdown">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="mention-item"
                    role="button"
                    tabIndex="0"
                    onClick={() => this.handleMentionSelect(user)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        this.handleMentionSelect(user);
                      }
                    }}
                  >
                    {user.first_name} {user.last_name}
                  </div>
                ))}
              </div>
            )}

          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClickClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleCommentSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={success}
          autoHideDuration={3000}
          message="Comment submitted successfully!"
          onClose={this.handleSnackbarClose}
        />

        {/* Error Snackbar */}
        <Snackbar
          open={error}
          autoHideDuration={3000}
          message="Failed to submit comment. Please try again."
          onClose={this.handleSnackbarClose}
        />
      </div>
    );
  }
}
