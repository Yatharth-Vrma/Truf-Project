import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { db } from "../manage-employee/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import MDBox from "components/MDBox";
import InputAdornment from "@mui/material/InputAdornment";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Icon from "@mui/material/Icon";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useMaterialUIController } from "context";

const statuses = ["Active", "Archived"];
const experienceLevels = ["Entry-level", "Mid-level", "Senior-level"];
const departments = ["Development", "HR", "Marketing", "Finance", "Operations"];

const generateRoleId = () => {
  const randomNumber = Math.floor(Math.random() * 900) + 100;
  return `Role-${randomNumber}`;
};

const ManageRoles = () => {
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form states
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [salaryRange, setSalaryRange] = useState({ min: "", max: "" });
  const [isManagerial, setIsManagerial] = useState(false);
  const [status, setStatus] = useState("");

  const [controller] = useMaterialUIController();
  const { miniSidenav, darkMode } = controller;

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      const querySnapshot = await getDocs(collection(db, "roles"));
      setRoles(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchRoles();
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setRoleName(role.roleName);
    setDescription(role.description);
    setDepartment(role.department);
    setResponsibilities(role.responsibilities?.join(", ") || "");
    setRequiredSkills(role.requiredSkills?.join(", ") || "");
    setExperienceLevel(role.experienceLevel);
    setSalaryRange(role.salaryRange || { min: "", max: "" });
    setIsManagerial(role.isManagerial || false);
    setStatus(role.status);
    setOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmUpdateOpen(true);
  };

  const confirmUpdate = async () => {
    const roleId = editingRole ? editingRole.roleId : generateRoleId();
    const newRole = {
      roleId,
      roleName,
      description,
      department,
      responsibilities: responsibilities.split(",").map((s) => s.trim()),
      requiredSkills: requiredSkills.split(",").map((s) => s.trim()),
      experienceLevel,
      salaryRange: {
        min: Number(salaryRange.min),
        max: Number(salaryRange.max),
      },
      isManagerial,
      status,
      createdAt: editingRole ? editingRole.createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (editingRole) {
      await updateDoc(doc(db, "roles", editingRole.id), newRole);
      setRoles(roles.map((role) => (role.id === editingRole.id ? { ...role, ...newRole } : role)));
    } else {
      const docRef = await addDoc(collection(db, "roles"), newRole);
      setRoles([...roles, { id: docRef.id, ...newRole }]);
    }

    setConfirmUpdateOpen(false);
    handleClose();
  };

  const handleDelete = async () => {
    await deleteDoc(doc(db, "roles", deleteId));
    setRoles(roles.filter((role) => role.id !== deleteId));
    setConfirmDeleteOpen(false);
  };

  const resetForm = () => {
    setRoleName("");
    setDescription("");
    setDepartment("");
    setResponsibilities("");
    setRequiredSkills("");
    setExperienceLevel("");
    setSalaryRange({ min: "", max: "" });
    setIsManagerial(false);
    setStatus("");
    setEditingRole(null);
  };

  return (
    <Box
      sx={{
        backgroundColor: darkMode ? "background.default" : "background.paper",
        minHeight: "100vh",
      }}
    >
      <DashboardNavbar
        absolute
        light={!darkMode}
        isMini={false}
        sx={{
          backgroundColor: darkMode ? "rgba(33, 33, 33, 0.9)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          zIndex: 1100,
          padding: "0 16px",
          minHeight: "60px",
          top: "8px",
          left: { xs: "0", md: miniSidenav ? "80px" : "260px" },
          width: { xs: "100%", md: miniSidenav ? "calc(100% - 80px)" : "calc(100% - 260px)" },
        }}
      />
      <MDBox
        p={3}
        sx={{
          marginLeft: { xs: "0", md: miniSidenav ? "80px" : "260px" },
          marginTop: { xs: "140px", md: "100px" },
          backgroundColor: darkMode ? "background.default" : "background.paper",
          minHeight: "calc(100vh - 80px)",
          paddingTop: { xs: "32px", md: "24px" },
          zIndex: 1000,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor={darkMode ? "dark" : "info"}
                borderRadius="lg"
                coloredShadow={darkMode ? "dark" : "info"}
              >
                <MDTypography variant="h6" color={darkMode ? "white" : "white"}>
                  Role Management
                </MDTypography>
              </MDBox>
              <MDBox pt={3} pb={2} px={2}>
                <Button
                  variant="gradient"
                  color={darkMode ? "dark" : "info"}
                  onClick={handleClickOpen}
                  sx={{ mb: 2 }}
                >
                  Add Role
                </Button>
                <Grid container spacing={3} sx={{ padding: "16px" }}>
                  {roles.map((role) => (
                    <Grid item xs={12} key={role.id}>
                      <Card
                        sx={{
                          background: darkMode
                            ? "linear-gradient(135deg, #424242 0%, #212121 100%)"
                            : "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                          padding: "20px",
                          transition: "0.3s ease-in-out",
                          "&:hover": {
                            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                            transform: "scale(1.02)",
                          },
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h4"
                            sx={{ fontWeight: "bold", color: darkMode ? "white" : "#333", mb: 2 }}
                          >
                            {role.roleId}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Role Name:</strong> {role.roleName}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Description:</strong> {role.description}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Department:</strong> {role.department}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Experience Level:</strong> {role.experienceLevel}
                              </MDTypography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Salary Range:</strong> ${role.salaryRange?.max}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Managerial:</strong> {role.isManagerial ? "Yes" : "No"}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Status:</strong>{" "}
                                <Chip
                                  label={role.status}
                                  sx={{
                                    backgroundColor:
                                      role.status === "Active" ? "#2196F3" : "#9E9E9E",
                                    color: "#fff",
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                  }}
                                />
                              </MDTypography>
                            </Grid>
                          </Grid>
                        </CardContent>
                        <CardActions sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <MDButton
                            variant="gradient"
                            color={darkMode ? "dark" : "info"}
                            onClick={() => handleEdit(role)}
                            sx={{ padding: "12px 24px" }}
                          >
                            <Icon fontSize="medium">edit</Icon>&nbsp;Edit
                          </MDButton>
                          <MDButton
                            variant="gradient"
                            color="error"
                            onClick={() => {
                              setDeleteId(role.id);
                              setConfirmDeleteOpen(true);
                            }}
                            sx={{ ml: 1, padding: "12px 24px" }}
                          >
                            <Icon>delete</Icon>&nbsp;Delete
                          </MDButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Box
        sx={{
          marginLeft: { xs: "0", md: miniSidenav ? "80px" : "260px" },
          backgroundColor: darkMode ? "background.default" : "background.paper",
          zIndex: 1100,
        }}
      >
        <Footer />
      </Box>

      {/* Role Form Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: darkMode ? "background.default" : "background.paper",
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
          {editingRole ? "Edit Role" : "Add Role"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Role Name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                fullWidth
                margin="dense"
                required
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                margin="dense"
                required
                multiline
                rows={3}
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                fullWidth
                margin="dense"
                required
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Experience Level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                fullWidth
                margin="dense"
                required
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              >
                {experienceLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Responsibilities"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                fullWidth
                margin="dense"
                required
                placeholder="Separate with commas"
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Required Skills"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                fullWidth
                margin="dense"
                required
                placeholder="Separate with commas"
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Salary Range (Max)"
                value={salaryRange.max}
                onChange={(e) => setSalaryRange({ ...salaryRange, max: e.target.value })}
                fullWidth
                margin="dense"
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isManagerial}
                    onChange={(e) => setIsManagerial(e.target.checked)}
                    color="primary"
                  />
                }
                label="Managerial Role"
                sx={{ color: darkMode ? "white" : "black" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                fullWidth
                margin="dense"
                required
                sx={{
                  input: { color: darkMode ? "white" : "black" },
                  "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                }}
              >
                {statuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: darkMode ? "background.default" : "background.paper",
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
          Want to delete role data?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Update Dialog */}
      <Dialog
        open={confirmUpdateOpen}
        onClose={() => setConfirmUpdateOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: darkMode ? "background.default" : "background.paper",
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
          Want to save details?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmUpdateOpen(false)}>Cancel</Button>
          <Button onClick={confirmUpdate} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageRoles;
