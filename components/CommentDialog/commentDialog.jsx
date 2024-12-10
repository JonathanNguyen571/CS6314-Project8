import React from "react";
import { Button, Dialog, DialogContent, DialogContentText, TextField, DialogActions, Chip, Snackbar } from "@mui/material";
import "./commentDialog.css";
import axios from "axios";

/**
 * CommentDialog component for adding comments to photos in CS142 project #7.
 * Handles opening the dialog, submitting comments, and notifying the parent component to re-fetch data.
 * 
 * @param {function} this.props.onCommentSumbit - Callback to notify parent to re-fetch data.
 * @param {string} this.props.photo_id - The photo ID being commented on.
 */
export default class CommentDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      open: false,           // Control the dialog visibility
      comment: "",           // Store the user's comment
      success: false,        // To show success Snackbar
      error: false,          // To show error Snackbar
    };
  }

  // Open the comment dialog
  handleClickOpen = () => this.setState({ open: true });

  // Close the comment dialog
  handleClickClose = () => this.setState({ open: false, comment: "" });

  // Reflect comment changes in the state
  handleCommentChange = (e) => this.setState({ comment: e.target.value });

  // Handle the comment submission
  handleCommentSubmit = () => {
    const { comment } = this.state;
    this.setState({ open: false, comment: "" }); // Close dialog and clear comment

    // Post the comment to the server
    axios
      .post(`/commentsOfPhoto/${this.props.photo_id}`, { comment })
      .then(() => {
        this.setState({ success: true }); // Show success message
        this.props.onCommentSumbit();     // Notify parent to re-fetch data
      })
      .catch((error) => {
        console.error("Comment Submission Error:", error);
        this.setState({ error: true });    // Show error message
      });
  };

  // Handle Snackbar close
  handleSnackbarClose = () => {
    this.setState({ success: false, error: false });
  };

  render() {
    return (
      <div className="comment-dialog">
        <Chip label="Reply" onClick={this.handleClickOpen} />
        
        <Dialog open={this.state.open} onClose={this.handleClickClose}>
          <DialogContent>
            <DialogContentText>Add a comment...</DialogContentText>
            <TextField
              value={this.state.comment}
              onChange={this.handleCommentChange}
              autoFocus
              multiline
              margin="dense"
              fullWidth
              aria-labelledby="comment-dialog-title"
              aria-describedby="comment-dialog-description"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClickClose} color="primary">Cancel</Button>
            <Button onClick={this.handleCommentSubmit} color="primary">Submit</Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={this.state.success}
          autoHideDuration={3000}
          message="Comment submitted successfully!"
          onClose={this.handleSnackbarClose}
        />

        {/* Error Snackbar */}
        <Snackbar
          open={this.state.error}
          autoHideDuration={3000}
          message="Failed to submit comment. Please try again."
          onClose={this.handleSnackbarClose}
        />
      </div>
    );
  }
}
