import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import emailjs from "emailjs-com";

const ContactModal = () => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "name":
        if (!value.match(/^[a-zA-Z\s]+$/)) {
          return "Name should only contain letters and spaces.";
        }
        break;
      case "company":
        if (!value.trim()) {
          return "Company is required.";
        }
        break;
      case "email":
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return "Please enter a valid email.";
        }
        break;
      default:
        return "";
    }
    return "";
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errorMessage = validateField(name, value);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      const newError = validateField(name, value);
      setErrors((prevErrors) => ({ ...prevErrors, [name]: newError }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    ["name", "company", "email"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    emailjs
      .send(
        "service_ta5yo2d",
        "template_ppfvh48",
        {
          to_name: "William",
          from_name: formData.name,
          company: formData.company,
          email: formData.email,
          message: formData.message,
        },
        "H9FJtuvnDmqMMf6BJ"
      )
      .then(
        (result) => {
          alert("Message sent successfully!");
          setFormData({ name: "", company: "", email: "", message: "" });
          setModalOpen(false); // Close modal on successful send
        },
        (error) => {
          console.error("EmailJS error:", error.text);
          alert("Oops, something went wrong... please try again.");
        }
      );
  };

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <Box>
      {/* Trigger Button */}
      <Button
        variant="contained"
        onClick={handleOpenModal}
        sx={{ margin: "1rem" }}
      >
        Open Contact Form
      </Button>

      {/* Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="contact-dialog-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="contact-dialog-title">
          Ready to Talk to Human William?
          <Button
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ marginBottom: "1rem" }}>
            Fill out the form below to get in touch, or keep chatting with AI
            William.
          </Typography>
          <form onSubmit={handleSubmit}>
            {["name", "company", "email", "message"].map((field, idx) => (
              <TextField
                key={idx}
                fullWidth
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                onBlur={handleBlur}
                margin="normal"
                multiline={field === "message"}
                minRows={field === "message" ? 3 : undefined}
                error={Boolean(errors[field])}
                helperText={errors[field]}
              />
            ))}
            <Button
              type="submit"
              variant="contained"
              sx={{ marginTop: "1rem" }}
            >
              Send Message
            </Button>
          </form>
          <Divider sx={{ margin: "2rem 0" }} />
          <Link
            href="#"
            onClick={handleCloseModal}
            sx={{ textDecoration: "none", color: "primary.main" }}
          >
            No, I like AI William
          </Link>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ContactModal;