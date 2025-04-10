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
  Card,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Icon,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add"; // Import AddIcon for the button
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import DataTable from "examples/Tables/DataTable";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { db, auth } from "./firebase"; // Ensure auth is included
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useMaterialUIController } from "context";

const departments = ["HR", "Engineering", "Marketing", "Sales", "Finance"];
const statuses = ["Active", "On Leave", "Resigned", "Terminated"];
const roles = [
  "ManageProject:read",
  "ManageProject:full access",
  "ManageAccount:read",
  "ManageAccount:full access",
  "ManageExpense:read",
  "ManageExpense:full access",
  "ManageEarning:read",
  "ManageEarning:full access",
  "ManageClient:read", // Added for client page
  "ManageClient:full access", // Added for client page
];

const generateEmployeeId = (name) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const randomNumber = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${randomNumber}`;
};

const ManageEmployee = () => {
  const [open, setOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false); // New state for permissions dialog
  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);

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

  // Determine read-only mode based on roles for ManageEmployee
  const isReadOnly =
    userRoles.includes("ManageEmployee:read") && !userRoles.includes("ManageEmployee:full access");

  // Fetch employees
  useEffect(() => {
    const fetchData = async () => {
      const employeesSnapshot = await getDocs(collection(db, "employees"));
      const employeesData = employeesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(employeesData);
    };

    fetchData();
  }, []);

  // Filter employees based on search query
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Employee Component
  const Employee = ({ name, employeeId, email }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDBox ml={0} lineHeight={1.2}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
        <MDTypography variant="caption" display="block">
          ID: {employeeId}
        </MDTypography>
        <MDTypography variant="caption" display="block">
          Mail: {email}
        </MDTypography>
      </MDBox>
    </MDBox>
  );

  Employee.propTypes = {
    name: PropTypes.string.isRequired,
    employeeId: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  };

  // DesignationDept Component
  const DesignationDept = ({ designation, department }) => (
    <MDBox lineHeight={1} textAlign="left">
      <MDTypography display="block" variant="caption" color="text" fontWeight="medium">
        {designation}
      </MDTypography>
      <MDTypography variant="caption">{department}</MDTypography>
    </MDBox>
  );

  DesignationDept.propTypes = {
    designation: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
  };

  // StatusBadge Component
  const StatusBadge = ({ status }) => {
    const colorMap = {
      Active: "success",
      "On Leave": "warning",
      Resigned: "error",
      Terminated: "dark",
    };
    return (
      <MDBox ml={-1}>
        <MDBadge
          badgeContent={status}
          color={colorMap[status] || "dark"}
          variant="gradient"
          size="sm"
        />
      </MDBox>
    );
  };

  StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setViewDetailsOpen(true);
  };

  const handleEdit = () => {
    const employee = selectedEmployee;
    setEditingEmployee(employee);
    setName(employee.name);
    setEmail(employee.email);
    setPhone(employee.phone);
    setDepartment(employee.department);
    setDesignation(employee.designation);
    setJoiningDate(employee.joiningDate);
    setExitDate(employee.exitDate);
    setSalary(employee.salary);
    setStatus(employee.status);
    setSelectedRoles(employee.roles || []);
    setViewDetailsOpen(false);
    setOpen(true);
  };

  const handleEditPermissions = (employee) => {
    setSelectedEmployee(employee);
    setSelectedRoles(employee.roles || []);
    setEditPermissionsOpen(true);
  };

  const handleSavePermissions = async () => {
    if (selectedEmployee) {
      try {
        // Update roles in the employees collection
        await updateDoc(doc(db, "employees", selectedEmployee.id), {
          roles: selectedRoles,
        });

        // Update roles in the users collection
        await setDoc(
          doc(db, "users", selectedEmployee.uid),
          {
            email: selectedEmployee.email,
            roles: selectedRoles,
          },
          { merge: true }
        );

        // Update local state
        setEmployees(
          employees.map((emp) =>
            emp.id === selectedEmployee.id ? { ...emp, roles: selectedRoles } : emp
          )
        );

        setEditPermissionsOpen(false);
      } catch (error) {
        console.error("Error updating permissions:", error);
      }
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (editingEmployee) {
      const updatedEmployee = {
        employeeId: editingEmployee.employeeId,
        name,
        email,
        phone,
        department,
        designation,
        joiningDate,
        exitDate,
        salary,
        status,
        roles: selectedRoles,
        uid: editingEmployee.uid,
      };

      await updateDoc(doc(db, "employees", editingEmployee.id), updatedEmployee);
      setEmployees(
        employees.map((emp) =>
          emp.id === editingEmployee.id ? { id: emp.id, ...updatedEmployee } : emp
        )
      );

      // Update roles in the 'users' collection
      await setDoc(
        doc(db, "users", editingEmployee.uid),
        {
          email,
          roles: selectedRoles,
        },
        { merge: true }
      );

      setConfirmUpdateOpen(false);
      handleClose();
    } else {
      const authInstance = getAuth();
      try {
        // Check if the email is already registered
        const userCredential = await createUserWithEmailAndPassword(
          authInstance,
          email,
          joiningDate.split("-").reverse().join("")
        ).catch((error) => {
          if (error.code === "auth/email-already-in-use") {
            alert("This email is already registered. Please use a different email.");
            return;
          } else {
            throw error;
          }
        });

        if (!userCredential) return;

        const user = userCredential.user;

        // Add employee to Firestore
        const newEmployee = {
          employeeId: generateEmployeeId(name),
          name,
          email,
          phone,
          department,
          designation,
          joiningDate,
          exitDate,
          salary,
          status,
          roles: selectedRoles,
          uid: user.uid,
        };

        const docRef = await addDoc(collection(db, "employees"), newEmployee);
        setEmployees([...employees, { id: docRef.id, ...newEmployee }]);

        // Store roles in Firestore under the 'users' collection
        await setDoc(doc(db, "users", user.uid), {
          email,
          roles: selectedRoles,
        });

        setConfirmUpdateOpen(false);
        handleClose();
      } catch (error) {
        console.error("Error adding employee: ", error);
      }
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setDesignation("");
    setJoiningDate("");
    setExitDate("");
    setSalary("");
    setStatus("");
    setSelectedRoles([]);
    setEditingEmployee(null);
  };

  // Define tableData with paginated employees
  const tableData = {
    columns: [
      { Header: "Employee", accessor: "employee", width: "30%", align: "left" },
      { Header: "Designation & Dept", accessor: "designation", align: "left" },
      { Header: "Status", accessor: "status", align: "center" },
      { Header: "Joined Date", accessor: "joined", align: "center" },
      { Header: "Actions", accessor: "actions", align: "center" },
    ],
    rows: paginatedEmployees.map((employee) => ({
      employee: (
        <Employee name={employee.name} employeeId={employee.employeeId} email={employee.email} />
      ),
      designation: (
        <DesignationDept designation={employee.designation} department={employee.department} />
      ),
      status: <StatusBadge status={employee.status} />,
      joined: (
        <MDTypography variant="caption" color="text" fontWeight="medium">
          {employee.joiningDate}
        </MDTypography>
      ),
      actions: (
        <MDBox display="flex" justifyContent="center">
          <Button
            variant="gradient"
            color="info"
            onClick={() => handleViewDetails(employee)}
            sx={{ mb: 2 }}
          >
            View Employee
          </Button>
          {!isReadOnly && (
            <>
              <Button
                variant="gradient"
                color="info"
                onClick={() => handleEdit(employee)}
                sx={{ mb: 2, ml: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="gradient"
                color="warning"
                onClick={() => handleEditPermissions(employee)}
                sx={{ mb: 2, ml: 1 }}
              >
                Permissions
              </Button>
            </>
          )}
        </MDBox>
      ),
    })),
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
      {/* Add DashboardNavbar */}
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
      <Box
        p={3}
        sx={{
          marginLeft: { xs: "0", md: "260px" },
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
                  Employee Management
                </MDTypography>
              </MDBox>
              <MDBox pt={2} pb={2} px={2}>
                {" "}
                {/* Reduced padding-top from 3 to 1 */}
                {!isReadOnly && (
                  <Button
                    variant="gradient"
                    color={darkMode ? "dark" : "info"}
                    onClick={handleClickOpen}
                    startIcon={<AddIcon />} // Added icon to the button
                    sx={{
                      mb: 1, // Reduced margin-bottom from 2 to 1
                      textTransform: "none", // Prevent uppercase text
                      fontWeight: "medium",
                      boxShadow: 3, // Add shadow for depth
                      "&:hover": {
                        boxShadow: 6, // Increase shadow on hover
                        backgroundColor: darkMode ? "grey.700" : "info.dark", // Darken on hover
                      },
                    }}
                  >
                    Add Employee
                  </Button>
                )}
                <DataTable
                  table={tableData}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                  canSearch
                  onSearch={(query) => setSearchQuery(query)}
                />
                {/* Custom Pagination Controls */}
                <MDBox display="flex" justifyContent="center" mt={2}>
                  <Button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    sx={{ mx: 1 }}
                  >
                    {"<"}
                  </Button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      sx={{
                        mx: 0.5,
                        backgroundColor: currentPage === page ? "info.main" : "transparent",
                        color: currentPage === page ? "white" : "text.primary",
                        borderRadius: "50%",
                        minWidth: "30px",
                        height: "30px",
                      }}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    sx={{ mx: 1 }}
                  >
                    {">"}
                  </Button>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Employee Details Dialog */}
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
        <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>Employee Details</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Employee ID
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.employeeId}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Name
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.name}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Email
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.email}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Phone
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.phone}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Department
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.department}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Designation
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.designation}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Joining Date
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.joiningDate}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Exit Date
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.exitDate || "N/A"}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Salary
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.salary}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Status
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.status}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="subtitle2" color={darkMode ? "white" : "black"}>
                  Roles
                </MDTypography>
                <MDTypography color={darkMode ? "white" : "black"}>
                  {selectedEmployee.roles ? selectedEmployee.roles.join(", ") : "N/A"}
                </MDTypography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
          {!isReadOnly && (
            <>
              <Button onClick={handleEdit} color="primary">
                Edit
              </Button>
              <Button onClick={() => handleEditPermissions(selectedEmployee)} color="warning">
                Edit Permissions
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Permissions Dialog */}
      {!isReadOnly && (
        <Dialog
          open={editPermissionsOpen}
          onClose={() => setEditPermissionsOpen(false)}
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: darkMode ? "background.default" : "background.paper",
            },
          }}
        >
          <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
            Edit Permissions for {selectedEmployee?.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="roles-label" sx={{ color: darkMode ? "white" : "black" }}>
                    Roles
                  </InputLabel>
                  <Select
                    labelId="roles-label"
                    id="roles"
                    multiple
                    value={selectedRoles}
                    onChange={(e) => setSelectedRoles(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    inputProps={{ style: { color: darkMode ? "white" : "black" } }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditPermissionsOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePermissions} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Footer */}
      <Box
        sx={{
          marginLeft: { xs: "0", md: "260px" },
          backgroundColor: darkMode ? "background.default" : "background.paper",
          zIndex: 1100,
        }}
      >
        <Footer />
      </Box>

      {/* Employee Form Dialog */}
      {!isReadOnly && (
        <Dialog
          open={open}
          onClose={handleClose}
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: darkMode ? "background.default" : "background.paper",
            },
          }}
        >
          <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
            {editingEmployee ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Joining Date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  InputLabelProps={{ shrink: true, style: { color: darkMode ? "white" : "black" } }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Exit Date"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  InputLabelProps={{ shrink: true, style: { color: darkMode ? "white" : "black" } }}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  sx={{ input: { color: darkMode ? "white" : "black" } }}
                  InputLabelProps={{ style: { color: darkMode ? "white" : "black" } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                <FormControl fullWidth>
                  <InputLabel id="roles-label" sx={{ color: darkMode ? "white" : "black" }}>
                    Roles
                  </InputLabel>
                  <Select
                    labelId="roles-label"
                    id="roles"
                    multiple
                    value={selectedRoles}
                    onChange={(e) => setSelectedRoles(e.target.value)}
                    sx={{ input: { color: darkMode ? "white" : "black" } }}
                    inputProps={{ style: { color: darkMode ? "white" : "black" } }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={() => setConfirmUpdateOpen(true)} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
            Confirm Save Changes?
          </DialogTitle>
          <DialogActions>
            <Button onClick={() => setConfirmUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ManageEmployee;
