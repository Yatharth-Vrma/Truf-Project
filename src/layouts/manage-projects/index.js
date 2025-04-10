import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Typography,
  MenuItem,
  Card,
  Box,
  Autocomplete,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDProgress from "components/MDProgress";
import DataTable from "examples/Tables/DataTable";
import { db, auth } from "../manage-employee/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useMaterialUIController } from "context";
import { Navigate } from "react-router-dom";

const statuses = ["Ongoing", "Completed", "On Hold"];

const CustomButton = styled("button")(({ theme }) => ({
  padding: "10px 25px",
  border: "unset",
  borderRadius: "15px",
  color: theme.palette.mode === "dark" ? "#e8e8e8" : "#212121",
  zIndex: 1,
  background: theme.palette.mode === "dark" ? "#424242" : "#e8e8e8",
  position: "relative",
  fontWeight: 1000,
  fontSize: "17px",
  boxShadow: "4px 8px 19px -3px rgba(0,0,0,0.27)",
  transition: "all 250ms",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: 0,
    borderRadius: "15px",
    backgroundColor: theme.palette.mode === "dark" ? "#212121" : "#212121",
    zIndex: -1,
    boxShadow: "4px 8px 19px -3px rgba(0,0,0,0.27)",
    transition: "all 250ms",
  },
  "&:hover": {
    color: theme.palette.mode === "dark" ? "#e8e8e8" : "#e8e8e8",
  },
  "&:hover::before": {
    width: "100%",
  },
}));

const Progress = ({ value, status }) => {
  const getColor = () => {
    switch (status) {
      case "Completed":
        return "success";
      case "On Hold":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <MDBox display="flex" alignItems="center">
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {value}%
      </MDTypography>
      <MDBox ml={0.5} width="9rem">
        <MDProgress variant="gradient" color={getColor()} value={value} />
      </MDBox>
    </MDBox>
  );
};

Progress.propTypes = {
  value: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
};

const ProjectInfo = ({ name, projectId }) => (
  <MDBox display="flex" alignItems="center" lineHeight={1}>
    <MDBox ml={0} lineHeight={1.2}>
      <MDTypography variant="button" fontWeight="medium" display="block">
        {name}
      </MDTypography>
      <MDTypography variant="caption" color="textSecondary" display="block">
        ID: {projectId}
      </MDTypography>
    </MDBox>
  </MDBox>
);

ProjectInfo.propTypes = {
  name: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
};

const ManageProject = () => {
  const [open, setOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [invalidClientId, setInvalidClientId] = useState(false);
  const [invalidAccountId, setInvalidAccountId] = useState(false);
  const [projectExpenses, setProjectExpenses] = useState(0);
  const [projectRevenue, setProjectRevenue] = useState(0);
  const [userRoles, setUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [budget, setBudget] = useState("");
  const [roi, setRoi] = useState("");
  const [burnRate, setBurnRate] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [revenueGenerated, setRevenueGenerated] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [completion, setCompletion] = useState("");

  const [controller] = useMaterialUIController();
  const { miniSidenav, darkMode } = controller;

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

  // Determine access levels based on roles
  const isReadOnly =
    userRoles.includes("ManageProject:read") && !userRoles.includes("ManageProject:full access");
  const hasAccess =
    userRoles.includes("ManageProject:read") || userRoles.includes("ManageProject:full access");

  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      setProjects(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, "employees"));
      setEmployees(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, "clients"));
      setClients(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    const fetchAccounts = async () => {
      const querySnapshot = await getDocs(collection(db, "accounts"));
      setAccounts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchProjects();
    fetchEmployees();
    fetchClients();
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchProjectExpenses = async () => {
      if (selectedProject && (selectedProject.projectId || selectedProject.id)) {
        const pid = selectedProject.projectId || selectedProject.id;
        const q = query(collection(db, "expenses"), where("projectId", "==", pid));
        const querySnapshot = await getDocs(q);
        let total = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          total += Number(data.amount) || 0;
        });
        setProjectExpenses(total);
      } else {
        setProjectExpenses(0);
      }
    };
    fetchProjectExpenses();
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && (selectedProject.projectId || selectedProject.id)) {
      const pid = selectedProject.projectId || selectedProject.id;
      const earningsQuery = query(
        collection(db, "earnings"),
        where("category", "==", "Project Revenue"),
        where("referenceId", "==", pid)
      );
      const unsubscribe = onSnapshot(earningsQuery, (snapshot) => {
        let totalRevenue = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          totalRevenue += Number(data.amount) || 0;
        });
        setProjectRevenue(totalRevenue);
      });
      return () => unsubscribe();
    } else {
      setProjectRevenue(0);
    }
  }, [selectedProject]);

  useEffect(() => {
    const budgetValue = parseFloat(budget) || 0;
    const calculatedRevenueGenerated = budgetValue - projectExpenses;
    const calculatedProfitMargin =
      budgetValue > 0 ? (calculatedRevenueGenerated / budgetValue) * 100 : 0;
    setRevenueGenerated(calculatedRevenueGenerated.toFixed(2));
    setProfitMargin(calculatedProfitMargin.toFixed(2));
  }, [budget, projectExpenses]);

  const handleClickOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleViewDetails = async (project) => {
    const projectRef = doc(db, "projects", project.id);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      setSelectedProject({ id: projectSnap.id, ...projectSnap.data() });
    } else {
      setSelectedProject(project);
    }
    setViewDetailsOpen(true);
  };

  const handleEditFromDetails = () => {
    const project = selectedProject;
    setEditingProject(project);
    setName(project.name);
    setTeam(project.team);
    setBudget(project.financialMetrics?.budget || "");
    setRoi(project.financialMetrics?.roi || "");
    setBurnRate(project.financialMetrics?.burnRate || "");
    setProfitMargin(project.financialMetrics?.profitMargin || "");
    setRevenueGenerated(project.financialMetrics?.revenueGenerated || "");
    setExpectedRevenue(project.financialMetrics?.expectedRevenue || "");
    setStartDate(project.startDate);
    setEndDate(project.endDate);
    setStatus(project.status);
    setDescription(project.description);
    setCompletion(project.completion || "");
    setSelectedEmployees(project.teamMembers || []);
    setSelectedClient(project.clientId);
    setSelectedAccount(project.accountId);
    setViewDetailsOpen(false);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const clientId = selectedClient?.clientId;
    const accountId = selectedAccount?.accountId;

    const clientExists = clientId ? await checkIfClientExists(clientId) : false;
    const accountExists = accountId ? await checkIfAccountExists(accountId) : false;

    if (!clientExists || !accountExists) {
      setInvalidClientId(!clientExists);
      setInvalidAccountId(!accountExists);
      return;
    }

    setConfirmUpdateOpen(true);
  };

  const checkIfClientExists = async (clientId) => {
    const querySnapshot = await getDocs(collection(db, "clients"));
    return querySnapshot.docs.some((doc) => doc.data().clientId === clientId);
  };

  const checkIfAccountExists = async (accountId) => {
    const querySnapshot = await getDocs(collection(db, "accounts"));
    return querySnapshot.docs.some((doc) => doc.data().accountId === accountId);
  };

  const confirmUpdate = async () => {
    let projectId = editingProject ? editingProject.projectId : generateUniqueProjectId(name);

    const newProject = {
      projectId,
      name,
      accountId: selectedAccount,
      clientId: selectedClient,
      team,
      teamMembers: selectedEmployees,
      financialMetrics: {
        budget,
        roi,
        burnRate,
        profitMargin,
        revenueGenerated,
        expectedRevenue,
      },
      startDate,
      endDate,
      status,
      description,
      completion,
    };

    if (editingProject) {
      await updateDoc(doc(db, "projects", editingProject.id), newProject);
      setProjects(
        projects.map((proj) => (proj.id === editingProject.id ? { ...proj, ...newProject } : proj))
      );
    } else {
      const docRef = await addDoc(collection(db, "projects"), newProject);
      setProjects([...projects, { id: docRef.id, ...newProject }]);
    }

    setConfirmUpdateOpen(false);
    handleClose();
  };

  const generateUniqueProjectId = (name) => {
    let projectId;
    let isUnique = false;

    while (!isUnique) {
      const prefix = name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
      const randomNumber = Math.floor(Math.random() * 1000);
      projectId = `${prefix}-${randomNumber}`;
      isUnique = !projects.some((project) => project.projectId === projectId);
    }

    return projectId;
  };

  const handleDelete = async () => {
    await deleteDoc(doc(db, "projects", deleteId));
    setProjects(projects.filter((proj) => proj.id !== deleteId));
    setConfirmDeleteOpen(false);
    setViewDetailsOpen(false);
  };

  const resetForm = () => {
    setName("");
    setTeam("");
    setBudget("");
    setRoi("");
    setBurnRate("");
    setProfitMargin("");
    setRevenueGenerated("");
    setExpectedRevenue("");
    setStartDate("");
    setEndDate("");
    setStatus("");
    setDescription("");
    setCompletion("");
    setSelectedEmployees([]);
    setEditingProject(null);
    setSelectedClient(null);
    setSelectedAccount(null);
    setInvalidClientId(false);
    setInvalidAccountId(false);
  };

  const tableData = {
    columns: [
      { Header: "project", accessor: "project", width: "30%", align: "left" },
      { Header: "budget", accessor: "budget", align: "left" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "completion", accessor: "completion", align: "center" },
      { Header: "action", accessor: "action", align: "center" },
    ],
    rows: projects.map((project) => ({
      project: <ProjectInfo name={project.name} projectId={project.projectId} />,
      budget: (
        <MDTypography variant="button" color="text" fontWeight="medium">
          ${project.financialMetrics?.budget || 0}
        </MDTypography>
      ),
      status: (
        <Chip
          label={project.status}
          color={
            project.status === "Completed"
              ? "success"
              : project.status === "On Hold"
              ? "warning"
              : "info"
          }
          size="small"
        />
      ),
      completion: <Progress value={project.completion || 0} status={project.status} />,
      action: (
        <MDBox display="flex" justifyContent="center">
          <Button
            variant="gradient"
            color={darkMode ? "dark" : "info"}
            onClick={() => handleViewDetails(project)}
            sx={{ mb: 2 }}
          >
            View Project
          </Button>
        </MDBox>
      ),
    })),
  };

  if (loadingRoles) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" />;
  }

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
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color={darkMode ? "white" : "white"}>
                  Projects
                </MDTypography>
              </MDBox>
              <MDBox pt={3} pb={2} px={2}>
                {!isReadOnly && (
                  <Button
                    variant="gradient"
                    color={darkMode ? "dark" : "info"}
                    onClick={handleClickOpen}
                    sx={{ mb: 2 }}
                  >
                    Add Projects
                  </Button>
                )}
                <DataTable
                  table={tableData}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
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

      <Dialog
        open={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: darkMode ? "background.default" : "background.paper",
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>Project Details</DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Project ID
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.projectId || selectedProject.id || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Name
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.name || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Account ID
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.accountId?.accountId || selectedProject.accountId || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Client ID
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.clientId?.clientId || selectedProject.clientId || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Team
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {Array.isArray(selectedProject.team)
                    ? selectedProject.team.join(", ")
                    : typeof selectedProject.team === "object"
                    ? JSON.stringify(selectedProject.team)
                    : selectedProject.team || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Budget
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  ${selectedProject.financialMetrics?.budget || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Expenses
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  ${projectExpenses}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  ROI (%)
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.financialMetrics?.roi || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Burn Rate
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.financialMetrics?.burnRate || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Profit Margin (%)
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.financialMetrics?.profitMargin || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Revenue Generated
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  ${selectedProject.financialMetrics?.revenueGenerated || projectRevenue}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Expected Revenue
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.financialMetrics?.expectedRevenue || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Start Date
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.startDate
                    ? new Date(selectedProject.startDate).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  End Date
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.endDate
                    ? new Date(selectedProject.endDate).toLocaleDateString()
                    : "Ongoing"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Status
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.status || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Completion (%)
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.completion !== undefined
                    ? `${selectedProject.completion}%`
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? "white" : "black" }}>
                  Description
                </Typography>
                <Typography sx={{ color: darkMode ? "white" : "textSecondary" }}>
                  {selectedProject.description || "No description available"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
          {!isReadOnly && (
            <>
              <Button onClick={handleEditFromDetails} color="primary">
                Edit
              </Button>
              <Button
                onClick={() => {
                  setDeleteId(selectedProject.id);
                  setConfirmDeleteOpen(true);
                }}
                color="error"
              >
                Delete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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
              {editingProject ? "Edit Project" : "Add Project"}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={clients}
                    getOptionLabel={(option) => option.clientId}
                    value={selectedClient}
                    onChange={(event, newValue) => setSelectedClient(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Client ID"
                        fullWidth
                        sx={{
                          input: { color: darkMode ? "white" : "black" },
                          "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={accounts}
                    getOptionLabel={(option) => option.accountId}
                    value={selectedAccount}
                    onChange={(event, newValue) => setSelectedAccount(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Account ID"
                        fullWidth
                        sx={{
                          input: { color: darkMode ? "white" : "black" },
                          "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={employees}
                    getOptionLabel={(option) => option.name}
                    value={selectedEmployees}
                    onChange={(event, newValue) => setSelectedEmployees(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Employees"
                        fullWidth
                        sx={{
                          input: { color: darkMode ? "white" : "black" },
                          "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Completion (%)"
                    type="number"
                    value={completion}
                    onChange={(e) => setCompletion(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} color="primary">
                {editingProject ? "Update" : "Add"}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            sx={{
              "& .MuiDialog-paper": {
                backgroundColor: darkMode ? "background.default" : "background.paper",
              },
            }}
          >
            <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>Confirm Deletion</DialogTitle>
            <DialogContent sx={{ color: darkMode ? "white" : "black" }}>
              Are you sure you want to delete this project?
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
              <Button onClick={handleDelete} color="error">
                Delete
              </Button>
            </DialogActions>
          </Dialog>

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
              Confirm Submission
            </DialogTitle>
            <DialogContent sx={{ color: darkMode ? "white" : "black" }}>
              Are you sure you want to save this project?
            </DialogContent>
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

export default ManageProject;
