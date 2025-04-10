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
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
} from "@mui/material";
import { db, auth } from "../manage-employee/firebase"; // Ensure this path matches your Firebase config
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import Icon from "@mui/material/Icon";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useMaterialUIController } from "context";

const statuses = ["Active", "Closed"];
const industries = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing"];

const ManageAccount = () => {
  const [open, setOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch projects and clients from Firebase
  const [projectList, setProjectList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [accountExpenses, setAccountExpenses] = useState({});
  const [projectExpenses, setProjectExpenses] = useState({});

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
            const roles = userDoc.roles || []; // Assumes roles are stored in a "roles" field as an array
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

  // Determine read-only mode based on roles
  const isReadOnly =
    userRoles.includes("ManageAccount:read") && !userRoles.includes("ManageAccount:full access");

  // Fetch accounts, projects, and clients
  useEffect(() => {
    const fetchAccounts = async () => {
      const querySnapshot = await getDocs(collection(db, "accounts"));
      setAccounts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchAccounts();

    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      setProjectList(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchProjects();

    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, "clients"));
      setClientList(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchClients();
  }, []);

  // Fetch expenses for accounts and projects
  useEffect(() => {
    const fetchAllAccountExpenses = async () => {
      const expensesMap = {};
      const projectExpensesMap = {};

      for (const account of accounts) {
        if (account.accountId) {
          const q = query(collection(db, "expenses"), where("accountId", "==", account.accountId));
          const qs = await getDocs(q);
          let totalAccountExpenses = 0;
          qs.forEach((doc) => {
            const data = doc.data();
            totalAccountExpenses += Number(data.amount) || 0;
            if (data.projectId) {
              if (!projectExpensesMap[data.projectId]) {
                projectExpensesMap[data.projectId] = 0;
              }
              projectExpensesMap[data.projectId] += Number(data.amount) || 0;
            }
          });
          expensesMap[account.accountId] = totalAccountExpenses;
        }
      }

      setAccountExpenses(expensesMap);
      setProjectExpenses(projectExpensesMap);
    };

    if (accounts.length > 0) {
      fetchAllAccountExpenses();
    }
  }, [accounts]);

  const handleClickOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setName(account.name || "");
    setIndustry(account.industry || "");
    setProjects(account.projects || []);
    setClients(account.clients || []);
    setStatus(account.status || "");
    setNotes(account.notes || "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmUpdateOpen(true);
  };

  const confirmUpdate = async () => {
    const accountId = editingAccount
      ? editingAccount.accountId
      : `ACC-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentExpenses = editingAccount ? accountExpenses[editingAccount.accountId] || 0 : 0;
    const totalBudget = projectList
      .filter((project) => projects.includes(project.id))
      .reduce((sum, project) => sum + (Number(project.financialMetrics?.budget) || 0), 0);
    const revenue = totalBudget - currentExpenses;
    const profitMargin = totalBudget > 0 ? (revenue / totalBudget) * 100 : 0;

    const newAccount = {
      accountId,
      name,
      industry,
      revenue: revenue.toFixed(2),
      expenses: currentExpenses,
      profitMargin: profitMargin.toFixed(2),
      projects,
      clients,
      status,
      notes,
    };

    if (editingAccount) {
      await updateDoc(doc(db, "accounts", editingAccount.id), newAccount);
      setAccounts(
        accounts.map((acc) => (acc.id === editingAccount.id ? { ...acc, ...newAccount } : acc))
      );
    } else {
      const docRef = await addDoc(collection(db, "accounts"), newAccount);
      setAccounts([...accounts, { id: docRef.id, ...newAccount }]);
    }

    setConfirmUpdateOpen(false);
    handleClose();
  };

  const resetForm = () => {
    setName("");
    setIndustry("");
    setProjects([]);
    setClients([]);
    setStatus("");
    setNotes("");
    setEditingAccount(null);
  };

  const renderAccountCard = (account) => {
    const displayedRevenue = account.revenue || 0;

    return (
      <Grid item xs={12} key={account.id}>
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
              sx={{ fontWeight: "bold", color: darkMode ? "#fff" : "#333", mb: 2 }}
            >
              {account.name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>ID:</strong> {account.accountId}
                </MDTypography>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Industry:</strong> {account.industry}
                </MDTypography>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Revenue:</strong> ${displayedRevenue}
                </MDTypography>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Expenses:</strong> ${accountExpenses[account.accountId] || 0}
                </MDTypography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Profit Margin:</strong> {account.profitMargin || 0}%
                </MDTypography>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Projects:</strong>{" "}
                  {Array.isArray(account.projects) && account.projects.length > 0
                    ? account.projects
                        .map((projectId) => {
                          const project = projectList.find((p) => p.id === projectId);
                          const projectExpense = projectExpenses[projectId] || 0;
                          return project ? `${project.name} ($${projectExpense})` : projectId;
                        })
                        .join(", ")
                    : "No projects assigned"}
                </MDTypography>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Clients:</strong>{" "}
                  {Array.isArray(account.clients) && account.clients.length > 0
                    ? account.clients
                        .map((clientId) => {
                          const client = clientList.find((c) => c.id === clientId);
                          return client ? client.name : clientId;
                        })
                        .join(", ")
                    : "No clients assigned"}
                </MDTypography>
                <MDTypography variant="body2" color={darkMode ? "white" : "textSecondary"}>
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={account.status}
                    sx={{
                      backgroundColor: account.status === "Active" ? "#4CAF50" : "#F44336",
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
          {!isReadOnly && (
            <CardActions sx={{ display: "flex", justifyContent: "flex-end" }}>
              <MDButton
                variant="gradient"
                color={darkMode ? "dark" : "info"}
                onClick={() => handleEdit(account)}
                sx={{ fontWeight: "bold" }}
              >
                <Icon fontSize="medium">edit</Icon> Edit
              </MDButton>
            </CardActions>
          )}
        </Card>
      </Grid>
    );
  };

  if (loadingRoles) {
    return <div>Loading...</div>;
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
                  Account Management
                </MDTypography>
              </MDBox>
              {!isReadOnly && (
                <MDBox pt={2} pb={2} px={2}>
                  <Button
                    variant="gradient"
                    color={darkMode ? "dark" : "info"}
                    onClick={handleClickOpen}
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
                    Add Accounts
                  </Button>
                </MDBox>
              )}

              {/* Account Cards Grid */}
              <Grid container spacing={3} sx={{ padding: "16px" }}>
                {accounts.map((account) => renderAccountCard(account))}
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

      {/* Account Form Dialog (only for full access) */}
      {!isReadOnly && (
        <>
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
              {editingAccount ? "Edit Account" : "Add Account"}
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
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: darkMode ? "white" : "black" }}>Projects</InputLabel>
                    <Select
                      multiple
                      value={projects}
                      onChange={(e) => setProjects(e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((value) => {
                            const project = projectList.find((p) => p.id === value);
                            return <Chip key={value} label={project ? project.name : value} />;
                          })}
                        </Box>
                      )}
                      sx={{ "& .MuiSelect-select": { color: darkMode ? "white" : "black" } }}
                    >
                      {projectList.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: darkMode ? "white" : "black" }}>Clients</InputLabel>
                    <Select
                      multiple
                      value={clients}
                      onChange={(e) => setClients(e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((value) => {
                            const client = clientList.find((c) => c.id === value);
                            return <Chip key={value} label={client ? client.name : value} />;
                          })}
                        </Box>
                      )}
                      sx={{ "& .MuiSelect-select": { color: darkMode ? "white" : "black" } }}
                    >
                      {clientList.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ManageAccount;
