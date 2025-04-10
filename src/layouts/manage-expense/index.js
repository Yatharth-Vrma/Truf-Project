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
  Checkbox,
  FormControlLabel,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { db, auth } from "../manage-employee/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import Icon from "@mui/material/Icon";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useMaterialUIController } from "context";
import { Navigate } from "react-router-dom";

const categories = [
  "Rent",
  "Software Licenses",
  "Utilities",
  "Salaries",
  "Marketing",
  "Other",
  "Project",
];

const ManageExpenses = () => {
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [dateFilterType, setDateFilterType] = useState("all");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [softwareName, setSoftwareName] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [projectIds, setProjectIds] = useState([]);
  const [accountIds, setAccountIds] = useState([]);
  const [employeeIds, setEmployeeIds] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

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
    userRoles.includes("ManageExpense:read") && !userRoles.includes("ManageExpense:full access");
  const hasAccess =
    userRoles.includes("ManageExpense:read") || userRoles.includes("ManageExpense:full access");

  useEffect(() => {
    const fetchExpenses = async () => {
      const querySnapshot = await getDocs(collection(db, "expenses"));
      const expensesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const category = Array.isArray(data.category)
          ? data.category
          : [data.category].filter((c) => c);
        return { id: doc.id, ...data, category };
      });
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
    };

    const fetchProjectIds = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      setProjectIds(querySnapshot.docs.map((doc) => doc.data().projectId));
    };

    const fetchAccountIds = async () => {
      const querySnapshot = await getDocs(collection(db, "accounts"));
      setAccountIds(querySnapshot.docs.map((doc) => doc.data().accountId));
    };

    const fetchEmployeeIds = async () => {
      const querySnapshot = await getDocs(collection(db, "employees"));
      setEmployeeIds(querySnapshot.docs.map((doc) => doc.data().employeeId));
    };

    fetchExpenses();
    fetchProjectIds();
    fetchAccountIds();
    fetchEmployeeIds();
  }, []);

  useEffect(() => {
    let filtered = [...expenses];
    if (searchTerm) {
      filtered = filtered.filter((expense) =>
        expense.category.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    const now = new Date();
    switch (dateFilterType) {
      case "today":
        filtered = filtered.filter((expense) => {
          const expenseDate = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
          return (
            expenseDate.getDate() === now.getDate() &&
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        });
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        filtered = filtered.filter((expense) => {
          const expenseDate = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
          return expenseDate >= weekStart && expenseDate <= now;
        });
        break;
      case "month":
        filtered = filtered.filter((expense) => {
          const expenseDate = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
          return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        });
        break;
      case "3months":
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        filtered = filtered.filter((expense) => {
          const expenseDate = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
          return expenseDate >= threeMonthsAgo && expenseDate <= now;
        });
        break;
      case "year":
        filtered = filtered.filter((expense) => {
          const expenseDate = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
          return expenseDate.getFullYear() === now.getFullYear();
        });
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          filtered = filtered.filter((expense) => {
            const expenseDate = expense.date.toDate
              ? expense.date.toDate()
              : new Date(expense.date);
            return expenseDate >= customStartDate && expenseDate <= customEndDate;
          });
        }
        break;
      default:
        break;
    }
    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, dateFilterType, customStartDate, customEndDate]);

  const handleClickOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setCategory(expense.category[0] || "");
    setAmount(expense.amount);
    setDate(
      expense.date && typeof expense.date.toDate === "function"
        ? expense.date.toDate().toISOString().split("T")[0]
        : expense.date || ""
    );
    setDescription(expense.description);
    setProjectId(expense.projectId || "");
    setAccountId(expense.accountId || "");
    setRecurring(expense.recurring || false);
    setSoftwareName(expense.softwareName || "");
    setSelectedEmployeeIds(expense.employeeIds || []);
    setOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmUpdateOpen(true);
  };

  const generateExpenseId = () => Math.floor(1000 + Math.random() * 9000).toString();

  const confirmUpdate = async () => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      alert("Please enter a valid date.");
      return;
    }

    const newExpense = {
      expenseId: editingExpense ? editingExpense.expenseId : generateExpenseId(),
      category,
      amount: Number(amount),
      date: parsedDate,
      description,
      projectId: projectId || null,
      accountId: accountId || null,
      recurring,
      softwareName: category === "Software Licenses" ? softwareName : null,
      employeeIds: category === "Salaries" ? selectedEmployeeIds : null,
    };

    if (editingExpense) {
      await updateDoc(doc(db, "expenses", editingExpense.id), newExpense);
      setExpenses(
        expenses.map((exp) => (exp.id === editingExpense.id ? { ...exp, ...newExpense } : exp))
      );
    } else {
      const docRef = await addDoc(collection(db, "expenses"), newExpense);
      setExpenses([...expenses, { id: docRef.id, ...newExpense }]);
    }
    setConfirmUpdateOpen(false);
    handleClose();
  };

  const handleDelete = async () => {
    await deleteDoc(doc(db, "expenses", deleteId));
    setExpenses(expenses.filter((exp) => exp.id !== deleteId));
    setConfirmDeleteOpen(false);
  };

  const resetForm = () => {
    setCategory("");
    setAmount("");
    setDate("");
    setDescription("");
    setProjectId("");
    setAccountId("");
    setRecurring(false);
    setSoftwareName("");
    setSelectedEmployeeIds([]);
    setEditingExpense(null);
  };

  if (loadingRoles) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            left: { xs: "0", md: miniSidenav ? "80px" : "250px" },
            width: { xs: "100%", md: miniSidenav ? "calc(100% - 80px)" : "calc(100% - 250px)" },
          }}
        />
        <MDBox
          p={3}
          sx={{
            marginLeft: { xs: "0", md: miniSidenav ? "80px" : "250px" },
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
                    Expense Management
                  </MDTypography>
                </MDBox>
                <MDBox
                  pt={3}
                  pb={2}
                  px={2}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  justifyContent="space-between"
                >
                  <Box display="flex" gap={2}>
                    {!isReadOnly && (
                      <MDButton
                        variant="gradient"
                        color={darkMode ? "dark" : "info"}
                        onClick={handleClickOpen}
                      >
                        Add Expenses
                      </MDButton>
                    )}
                    <TextField
                      label="Search by Category"
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{
                        maxWidth: 300,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: darkMode ? "#424242" : "#fff",
                          color: darkMode ? "white" : "black",
                        },
                        "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                      }}
                    />
                  </Box>
                  <Box display="flex" gap={2} alignItems="center">
                    <FormControl variant="outlined" size="small">
                      <InputLabel sx={{ color: darkMode ? "white" : "black" }}>
                        Date Filter
                      </InputLabel>
                      <Select
                        value={dateFilterType}
                        onChange={(e) => setDateFilterType(e.target.value)}
                        label="Date Filter"
                        sx={{
                          color: darkMode ? "white" : "black",
                          "& .MuiSvgIcon-root": { color: darkMode ? "white" : "black" },
                        }}
                      >
                        <MenuItem value="all">All Dates</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="3months">Last 3 Months</MenuItem>
                        <MenuItem value="year">This Year</MenuItem>
                        <MenuItem value="custom">Custom Range</MenuItem>
                      </Select>
                    </FormControl>
                    {dateFilterType === "custom" && (
                      <Button
                        variant="outlined"
                        onClick={() => setDatePickerOpen(true)}
                        sx={{
                          height: 40,
                          color: darkMode ? "white" : "black",
                          borderColor: darkMode ? "white" : "black",
                        }}
                      >
                        Choose Dates
                      </Button>
                    )}
                  </Box>
                </MDBox>

                <Dialog
                  open={datePickerOpen}
                  onClose={() => setDatePickerOpen(false)}
                  sx={{
                    "& .MuiDialog-paper": {
                      backgroundColor: darkMode ? "background.default" : "background.paper",
                    },
                  }}
                >
                  <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
                    Select Date Range
                  </DialogTitle>
                  <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                    <DatePicker
                      label="Start Date"
                      value={customStartDate}
                      onChange={(newValue) => setCustomStartDate(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          sx={{
                            input: { color: darkMode ? "white" : "black" },
                            "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                          }}
                        />
                      )}
                    />
                    <DatePicker
                      label="End Date"
                      value={customEndDate}
                      onChange={(newValue) => setCustomEndDate(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          sx={{
                            input: { color: darkMode ? "white" : "black" },
                            "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                          }}
                        />
                      )}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setDatePickerOpen(false)}
                      sx={{ color: darkMode ? "white" : "black" }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setDatePickerOpen(false)} color="primary">
                      Apply
                    </Button>
                  </DialogActions>
                </Dialog>

                <Grid container spacing={3} sx={{ padding: "16px" }}>
                  {filteredExpenses.map((expense) => (
                    <Grid item xs={12} key={expense.id}>
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
                          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                            {Array.isArray(expense.category) &&
                              expense.category.map((cat, index) => (
                                <Chip key={index} label={cat} color="primary" />
                              ))}
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Expense ID:</strong> {expense.expenseId}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Amount:</strong> ${expense.amount}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Date:</strong>{" "}
                                {expense.date?.toDate
                                  ? expense.date.toDate().toLocaleDateString()
                                  : new Date(expense.date).toLocaleDateString()}
                              </MDTypography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Description:</strong> {expense.description}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Project ID:</strong> {expense.projectId || "N/A"}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Account ID:</strong> {expense.accountId || "N/A"}
                              </MDTypography>
                              <MDTypography
                                variant="body2"
                                color={darkMode ? "white" : "textSecondary"}
                              >
                                <strong>Recurring:</strong>{" "}
                                <Chip label={expense.recurring ? "Yes" : "No"} size="small" />
                              </MDTypography>
                            </Grid>
                          </Grid>
                        </CardContent>
                        {!isReadOnly && (
                          <CardActions sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <MDButton
                              variant="gradient"
                              color={darkMode ? "dark" : "info"}
                              onClick={() => handleEdit(expense)}
                            >
                              <Icon fontSize="medium">edit</Icon> Edit
                            </MDButton>
                            <MDButton
                              variant="gradient"
                              color="error"
                              onClick={() => {
                                setDeleteId(expense.id);
                                setConfirmDeleteOpen(true);
                              }}
                            >
                              <Icon fontSize="medium">delete</Icon> Delete
                            </MDButton>
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Box
          sx={{
            marginLeft: { xs: "0", md: miniSidenav ? "80px" : "250px" },
            backgroundColor: darkMode ? "background.default" : "background.paper",
            zIndex: 1100,
          }}
        >
          <Footer />
        </Box>

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
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </DialogTitle>
              <DialogContent sx={{ py: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: darkMode ? "white" : "black" }}>Category</InputLabel>
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        label="Category"
                        sx={{
                          color: darkMode ? "white" : "black",
                          "& .MuiSvgIcon-root": { color: darkMode ? "white" : "black" },
                        }}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: darkMode ? "white" : "black" }}>Account</InputLabel>
                      <Select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        label="Account"
                        sx={{
                          color: darkMode ? "white" : "black",
                          "& .MuiSvgIcon-root": { color: darkMode ? "white" : "black" },
                        }}
                        required
                      >
                        {accountIds.map((acc) => (
                          <MenuItem key={acc} value={acc}>
                            {acc}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      sx={{
                        input: { color: darkMode ? "white" : "black" },
                        "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        input: { color: darkMode ? "white" : "black" },
                        "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      sx={{
                        input: { color: darkMode ? "white" : "black" },
                        "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                      }}
                    />
                  </Grid>
                  {category === "Project" && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: darkMode ? "white" : "black" }}>
                          Project
                        </InputLabel>
                        <Select
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          label="Project"
                          sx={{
                            color: darkMode ? "white" : "black",
                            "& .MuiSvgIcon-root": { color: darkMode ? "white" : "black" },
                          }}
                        >
                          {projectIds.map((proj) => (
                            <MenuItem key={proj} value={proj}>
                              {proj}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {category === "Salaries" && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: darkMode ? "white" : "black" }}>
                          Employee
                        </InputLabel>
                        <Select
                          multiple
                          value={selectedEmployeeIds}
                          onChange={(e) => setSelectedEmployeeIds(e.target.value)}
                          label="Employee"
                          sx={{
                            color: darkMode ? "white" : "black",
                            "& .MuiSvgIcon-root": { color: darkMode ? "white" : "black" },
                          }}
                        >
                          {employeeIds.map((emp) => (
                            <MenuItem key={emp} value={emp}>
                              {emp}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {category === "Software Licenses" && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Software Name"
                        value={softwareName}
                        onChange={(e) => setSoftwareName(e.target.value)}
                        required
                        sx={{
                          input: { color: darkMode ? "white" : "black" },
                          "& .MuiInputLabel-root": { color: darkMode ? "white" : "black" },
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={recurring}
                          onChange={(e) => setRecurring(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Recurring Expense"
                      sx={{ color: darkMode ? "white" : "black" }}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} sx={{ color: darkMode ? "white" : "black" }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} color="primary">
                  Save
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
              <DialogTitle sx={{ color: darkMode ? "white" : "black" }}>
                Want to delete expense data?
              </DialogTitle>
              <DialogActions>
                <Button
                  onClick={() => setConfirmDeleteOpen(false)}
                  sx={{ color: darkMode ? "white" : "black" }}
                >
                  Cancel
                </Button>
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
                Want to save details?
              </DialogTitle>
              <DialogActions>
                <Button
                  onClick={() => setConfirmUpdateOpen(false)}
                  sx={{ color: darkMode ? "white" : "black" }}
                >
                  Cancel
                </Button>
                <Button onClick={confirmUpdate} color="primary">
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ManageExpenses;
