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
  Chip,
  MenuItem,
  CardContent,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import { db, auth } from "../manage-employee/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import { useMaterialUIController } from "context";

const statuses = ["Active", "Inactive"];
const industries = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing"];

const formatTimestamp = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString();
  }
  return timestamp;
};

const generateRandomNumber = () => Math.floor(1000 + Math.random() * 9000);
const generateClientId = () => `CL-${generateRandomNumber()}`;

const ManageClient = () => {
  const [open, setOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editingClient, setEditingClient] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [contractId, setContractId] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [cac, setCac] = useState("");
  const [cltv, setCltv] = useState("");
  const [revenueGenerated, setRevenueGenerated] = useState("");
  const [oneTimeRevenue, setOneTimeRevenue] = useState("");
  const [recurringRevenue, setRecurringRevenue] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [notes, setNotes] = useState("");

  // Dark mode state
  const [controller] = useMaterialUIController();
  const { miniSidenav, darkMode } = controller;

  // User roles state
  const [userRoles, setUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Fetch user roles from Firestore "users" collection
  useEffect(() => {
    const fetchUserRoles = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data();
            const roles = userDoc.roles || [];
            setUserRoles(roles);
          } else {
            console.error("User not found in Firestore");
            setUserRoles([]);
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setUserRoles([]);
        }
      } else {
        setUserRoles([]);
      }
      setLoadingRoles(false);
    };

    fetchUserRoles();
  }, []);

  // Determine read-only mode and access based on roles for ManageClient
  const isReadOnly =
    userRoles.includes("ManageClient:read") && !userRoles.includes("ManageClient:full access");
  const hasAccess =
    userRoles.includes("ManageClient:read") || userRoles.includes("ManageClient:full access");

  useEffect(() => {
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, "clients"));
      setClients(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      setProjects(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchProjects();
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setName(client.name || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setIndustry(client.industry || "");
    setContractId(client.clientId || "");
    setContractStartDate(
      client.contractStartDate && typeof client.contractStartDate.toDate === "function"
        ? client.contractStartDate.toDate().toISOString().substring(0, 10)
        : client.contractStartDate || ""
    );
    setContractEndDate(
      client.contractEndDate && typeof client.contractEndDate.toDate === "function"
        ? client.contractEndDate.toDate().toISOString().substring(0, 10)
        : client.contractEndDate || ""
    );
    setContractAmount(client.contractAmount || "");
    setCac(client.Metrics?.cac || "");
    setCltv(client.Metrics?.cltv || "");
    setRevenueGenerated(client.Metrics?.revenueGenerated || "");
    setOneTimeRevenue(client.Metrics?.revenueBreakdown?.oneTimeRevenue || "");
    setRecurringRevenue(client.Metrics?.revenueBreakdown?.recurringRevenue || "");
    setStatus(client.status || "");
    setSelectedProjects(client.projects || []);
    setNotes(client.notes || "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmUpdateOpen(true);
  };

  const confirmUpdate = async () => {
    const newClient = {
      clientId: editingClient ? editingClient.clientId : generateClientId(),
      name,
      email,
      phone,
      address,
      industry,
      contractId,
      contractStartDate,
      contractEndDate,
      contractAmount,
      Metrics: {
        cac,
        cltv,
        revenueGenerated,
        revenueBreakdown: {
          oneTimeRevenue,
          recurringRevenue,
        },
      },
      status,
      projects: selectedProjects,
      notes,
      createdAt: editingClient ? editingClient.createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (editingClient) {
      await updateDoc(doc(db, "clients", editingClient.id), newClient);
      setClients(
        clients.map((client) =>
          client.id === editingClient.id ? { ...client, ...newClient } : client
        )
      );
    } else {
      const docRef = await addDoc(collection(db, "clients"), newClient);
      setClients([...clients, { id: docRef.id, ...newClient }]);
    }

    setConfirmUpdateOpen(false);
    handleClose();
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setIndustry("");
    setContractId("");
    setContractStartDate("");
    setContractEndDate("");
    setContractAmount("");
    setCac("");
    setCltv("");
    setRevenueGenerated("");
    setOneTimeRevenue("");
    setRecurringRevenue("");
    setStatus("");
    setSelectedProjects([]);
    setNotes("");
    setEditingClient(null);
  };

  if (loadingRoles) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <Box
      sx={{
        backgroundColor: darkMode ? "background.default" : "background.paper",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
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

      {/* Main Content */}
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
                <MDTypography variant="h6" color={darkMode ? "white" : "black"}>
                  Client Management
                </MDTypography>
              </MDBox>
              <MDBox pt={2} pb={2} px={2}>
                {!isReadOnly && (
                  <Button
                    variant="gradient"
                    color={darkMode ? "dark" : "info"}
                    onClick={handleClickOpen}
                    startIcon={<AddIcon />}
                    sx={{
                      mb: 1,
                      textTransform: "none",
                      fontWeight: "medium",
                      boxShadow: 3,
                      "&:hover": {
                        boxShadow: 6,
                        backgroundColor: darkMode ? "grey.700" : "info.dark",
                      },
                    }}
                  >
                    Add Client
                  </Button>
                )}
              </MDBox>

              {/* Client Cards Grid */}
              <Grid container spacing={2} sx={{ padding: "12px" }}>
                {clients.map((client) => (
                  <Grid item xs={12} key={client.id}>
                    <Card
                      sx={{
                        background: darkMode
                          ? "linear-gradient(135deg, #424242 0%, #212121 100%)"
                          : "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        padding: "16px",
                        transition: "0.3s ease-in-out",
                        "&:hover": {
                          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                          transform: "scale(1.02)",
                        },
                      }}
                    >
                      <CardContent sx={{ padding: 0, "&:last-child": { paddingBottom: 0 } }}>
                        <MDBox>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: "bold",
                              color: darkMode ? "#fff" : "#333",
                              mb: 2,
                            }}
                          >
                            {client.name}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>ID:</strong> {client.clientId}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                display="block"
                              >
                                <strong>Email:</strong> {client.email}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                display="block"
                              >
                                <strong>Phone:</strong> {client.phone}
                              </MDTypography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Contract:</strong> {client.contractId}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                display="block"
                              >
                                <strong>Start:</strong> {formatTimestamp(client.contractStartDate)}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                display="block"
                              >
                                <strong>End:</strong>{" "}
                                {client.contractEndDate
                                  ? formatTimestamp(client.contractEndDate)
                                  : "Ongoing"}
                              </MDTypography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Amount:</strong> ${client.contractAmount || "N/A"}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                display="block"
                              >
                                <strong>Status:</strong>{" "}
                                <Chip
                                  label={client.status}
                                  size="small"
                                  sx={{
                                    backgroundColor:
                                      client.status === "Active" ? "#4CAF50" : "#F44336",
                                    color: "#fff",
                                    fontSize: "12px",
                                    height: "24px",
                                  }}
                                />
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                display="block"
                              >
                                <strong>Industry:</strong> {client.industry}
                              </MDTypography>
                            </Grid>
                            <Grid item xs={12}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                                mt={1}
                              >
                                <strong>Metrics:</strong> CAC: ${client.Metrics?.cac || "N/A"} |
                                CLTV: ${client.Metrics?.cltv || "N/A"} | Revenue: $
                                {client.Metrics?.revenueGenerated || "N/A"}
                              </MDTypography>
                            </Grid>
                          </Grid>
                          {!isReadOnly && (
                            <MDBox mt={2} display="flex" justifyContent="flex-end">
                              <MDButton
                                variant="gradient"
                                color={darkMode ? "dark" : "info"}
                                onClick={() => handleEdit(client)}
                                size="small"
                              >
                                Edit
                              </MDButton>
                            </MDBox>
                          )}
                        </MDBox>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Footer */}
      <Box
        sx={{
          marginLeft: { xs: "0", md: miniSidenav ? "80px" : "260px" },
          backgroundColor: darkMode ? "background.default" : "background.paper",
          zIndex: 1100,
        }}
      >
        <Footer />
      </Box>

      {/* Client Form Dialog */}
      {!isReadOnly && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: darkMode ? "background.default" : "background.paper",
            },
          }}
        >
          <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
            {editingClient ? "Edit Client" : "Add Client"}
          </DialogTitle>
          <DialogContent sx={{ py: 2, padding: "30px" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                >
                  {industries.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contract ID"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Contract Start Date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true, style: { color: darkMode ? "white" : "black" } }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Contract End Date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true, style: { color: darkMode ? "white" : "black" } }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Contract Amount"
                  value={contractAmount}
                  onChange={(e) => setContractAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="CAC"
                  value={cac}
                  onChange={(e) => setCac(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="CLTV"
                  value={cltv}
                  onChange={(e) => setCltv(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Revenue Generated"
                  value={revenueGenerated}
                  onChange={(e) => setRevenueGenerated(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="One-Time Revenue"
                  value={oneTimeRevenue}
                  onChange={(e) => setOneTimeRevenue(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Recurring Revenue"
                  value={recurringRevenue}
                  onChange={(e) => setRecurringRevenue(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                >
                  {statuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={projects}
                  getOptionLabel={(option) => option.projectId || ""}
                  value={selectedProjects}
                  onChange={(event, newValue) => setSelectedProjects(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Project ID"
                      placeholder="Select Project ID"
                      sx={{ input: { color: darkMode ? "white" : "black" } }}
                      InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option.projectId} {...getTagProps({ index })} />
                    ))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
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
      )}

      {/* Confirm Update Dialog */}
      {!isReadOnly && (
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
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ManageClient;
