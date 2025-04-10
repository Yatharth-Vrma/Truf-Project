import { useState, useEffect } from "react";
import {
  Grid,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PieChart from "examples/Charts/PieChart";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import DataTable from "examples/Tables/DataTable";
import {
  fetchExpensesByCategory,
  fetchEarningsByCategory,
  fetchExpenses,
  fetchEarnings,
} from "../../utils/fetchData";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SettingsIcon from "@mui/icons-material/Settings";
import PropTypes from "prop-types";
import "./styles.css"; // Import the custom styles

// Custom Checkbox Component
const CustomCheckbox = ({ checked, onChange }) => (
  <label className="custom-checkbox">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="checkmark"></span>
  </label>
);

function Dashboard() {
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [earningsByCategory, setEarningsByCategory] = useState({});
  const [selectedChartData, setSelectedChartData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filteredEarnings, setFilteredEarnings] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [activeCard, setActiveCard] = useState("expenses");
  const [dashboardLevel, setDashboardLevel] = useState("Organization Level");
  const [accountId, setAccountId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [accountAnchorEl, setAccountAnchorEl] = useState(null);
  const [runwayAnchorEl, setRunwayAnchorEl] = useState(null);
  const [dateFilterAnchorEl, setDateFilterAnchorEl] = useState(null);
  const [selectedRunwayMonths, setSelectedRunwayMonths] = useState({});
  const [runwayExpenses, setRunwayExpenses] = useState([]);
  const [runwayEarnings, setRunwayEarnings] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedDetailCategories, setSelectedDetailCategories] = useState({});
  const [showTable, setShowTable] = useState(true);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleAccountMenuOpen = (event) => setAccountAnchorEl(event.currentTarget);
  const handleAccountMenuClose = () => setAccountAnchorEl(null);
  const handleRunwaySettingsOpen = (event) => setRunwayAnchorEl(event.currentTarget);
  const handleRunwaySettingsClose = () => setRunwayAnchorEl(null);
  const handleDateFilterOpen = (event) => setDateFilterAnchorEl(event.currentTarget);
  const handleDateFilterClose = () => setDateFilterAnchorEl(null);

  const handleDashboardLevelChange = (level) => {
    setDashboardLevel(level);
    setAccountId(null);
    handleMenuClose();
  };

  const handleAccountIdChange = (id) => {
    setAccountId(id);
    handleAccountMenuClose();
  };

  const handleRunwayMonthToggle = (yearMonth) => {
    setSelectedRunwayMonths((prev) => ({
      ...prev,
      [yearMonth]: !prev[yearMonth],
    }));
  };

  const handleSelectAllMonths = () => {
    setSelectedRunwayMonths({});
  };

  const handleResetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredExpenses(expenses);
    setFilteredEarnings(earnings);
    handleDateFilterClose();
  };

  const handleApplyDateFilter = () => {
    if (startDate && endDate) {
      const filteredExp = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
      });
      const filteredEarn = earnings.filter((earning) => {
        const earningDate = new Date(earning.date);
        return earningDate >= new Date(startDate) && earningDate <= new Date(endDate);
      });
      setFilteredExpenses(filteredExp);
      setFilteredEarnings(filteredEarn);
    }
    handleDateFilterClose();
  };

  const handleDetailCategoryToggle = (category) => {
    setSelectedDetailCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      const expensesData = await fetchExpenses();
      const earningsData = await fetchEarnings();

      setExpenses(expensesData);
      setEarnings(earningsData);
      setFilteredExpenses(expensesData);
      setFilteredEarnings(earningsData);
      setRunwayExpenses(expensesData);
      setRunwayEarnings(earningsData);

      const expensesByCat = expensesData.reduce((acc, expense) => {
        const category = expense.category;
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});
      const earningsByCat = earningsData.reduce((acc, earning) => {
        const category = earning.category;
        acc[category] = (acc[category] || 0) + earning.amount;
        return acc;
      }, {});

      setExpensesByCategory(expensesByCat);
      setEarningsByCategory(earningsByCat);
      handleChartClick(expensesByCat, "expenses");
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadRunwayData = async () => {
      const allExpenses = await fetchExpenses();
      const allEarnings = await fetchEarnings();

      if (Object.keys(selectedRunwayMonths).length === 0) {
        setRunwayExpenses(allExpenses);
        setRunwayEarnings(allEarnings);
      } else {
        const selectedFilters = Object.entries(selectedRunwayMonths)
          .filter(([_, isSelected]) => isSelected)
          .map(([yearMonth]) => {
            const [year, month] = yearMonth.split("-");
            return { year: parseInt(year), month: parseInt(month) };
          });

        const filteredExpenses = allExpenses.filter((expense) => {
          const date = new Date(expense.date);
          return selectedFilters.some(
            (filter) => date.getFullYear() === filter.year && date.getMonth() === filter.month
          );
        });

        const filteredEarnings = allEarnings.filter((earning) => {
          const date = new Date(earning.date);
          return selectedFilters.some(
            (filter) => date.getFullYear() === filter.year && date.getMonth() === filter.month
          );
        });

        setRunwayExpenses(filteredExpenses);
        setRunwayEarnings(filteredEarnings);
      }
    };
    loadRunwayData();
  }, [selectedRunwayMonths]);

  useEffect(() => {
    setShowTable(activeCard === "expenses" || activeCard === "earnings");
  }, [activeCard]);

  const filterDataByAccountId = (data) => {
    if (!accountId) return data;
    return data.filter((item) => item.accountId === accountId);
  };

  const expensesPieChartData = Object.entries(
    filterDataByAccountId(filteredExpenses).reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {})
  ).map(([category, amount]) => ({ value: amount, name: category }));

  const earningsPieChartData = Object.entries(
    filterDataByAccountId(filteredEarnings).reduce((acc, earning) => {
      const category = earning.category;
      acc[category] = (acc[category] || 0) + earning.amount;
      return acc;
    }, {})
  ).map(([category, amount]) => ({ value: amount, name: category }));

  const totalExpenses = expensesPieChartData.reduce((acc, { value }) => acc + value, 0);
  const totalEarnings = earningsPieChartData.reduce((acc, { value }) => acc + value, 0);
  const profitLoss = totalEarnings - totalExpenses;

  const runwayTotalExpenses = filterDataByAccountId(runwayExpenses).reduce(
    (acc, expense) => acc + expense.amount,
    0
  );
  const runwayTotalEarnings = filterDataByAccountId(runwayEarnings).reduce(
    (acc, earning) => acc + earning.amount,
    0
  );
  const runwayProfitLoss = runwayTotalEarnings - runwayTotalExpenses;
  const runwayMonthCount = Object.values(selectedRunwayMonths).filter(Boolean).length || 12;
  const runwayAvgMonthlyExpense = runwayTotalExpenses / runwayMonthCount;
  const financialRunway = runwayProfitLoss / runwayAvgMonthlyExpense;

  const expensesEarningsBarChartData = {
    labels: ["Expenses", "Earnings"],
    xAxisData: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    yAxisName: "Amount",
    yAxisUnit: "$",
    seriesData: [
      { name: "Expenses", type: "bar", data: [totalExpenses] },
      { name: "Earnings", type: "bar", data: [totalEarnings] },
    ],
  };

  const financialRunwayBarChartData = {
    labels: ["Financial Runway"],
    xAxisData: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    yAxisName: "Months",
    yAxisUnit: "",
    seriesData: [{ name: "Financial Runway", type: "bar", data: [financialRunway] }],
    yAxis: {
      type: "value",
      name: "Months",
      min: Math.min(financialRunway, 0) - 5,
      max: Math.max(financialRunway, 0) + 5,
      axisLabel: { formatter: `{value}` },
    },
  };

  const handleChartClick = (chartData, cardId) => {
    setSelectedChartData(chartData);
    setActiveCard(cardId);
    setSelectedDetailCategories({});
    setOpenCategory(null); // Reset expanded category when switching charts
  };

  const handleCategoryClick = (category) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const tableColumns = [
    {
      Header: "Select",
      accessor: "select",
      Cell: ({ row }) => (
        <CustomCheckbox
          checked={!!selectedDetailCategories[row.original.category]}
          onChange={() => handleDetailCategoryToggle(row.original.category)}
        />
      ),
    },
    { Header: "Category", accessor: "category" },
    { Header: "Amount", accessor: "amount" },
    {
      Header: "Description",
      accessor: "description",
      Cell: ({ row }) => (
        <IconButton
          aria-label="expand row"
          size="small"
          onClick={() => handleCategoryClick(row.original.category)}
        >
          {openCategory === row.original.category ? (
            <KeyboardArrowUpIcon />
          ) : (
            <KeyboardArrowDownIcon />
          )}
        </IconButton>
      ),
    },
  ];

  tableColumns[0].Cell.propTypes = {
    row: PropTypes.shape({
      original: PropTypes.shape({
        category: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  };
  tableColumns[3].Cell.propTypes = {
    row: PropTypes.shape({
      original: PropTypes.shape({
        category: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  };

  const tableRows = selectedChartData
    ? Object.entries(selectedChartData)
        .filter(([category]) => {
          const categoryExistsInPieChart =
            expensesPieChartData.some((item) => item.name === category) ||
            earningsPieChartData.some((item) => item.name === category);
          return categoryExistsInPieChart;
        })
        .map(([category, amount]) => ({ category, amount }))
    : [];

  const getCategoryDetails = (category, type) => {
    const data = type === "expense" ? filteredExpenses : filteredEarnings;
    return filterDataByAccountId(data)
      .filter((item) => item.category === category)
      .map((item) => ({
        type: type === "expense" ? "Expense" : "Earning",
        category: item.category,
        date: item.date.toLocaleDateString(),
        amount: item.amount,
        accountId: item.accountId,
        description: item.description || "No description available",
      }));
  };

  const detailsColumns = [
    { Header: "Type", accessor: "type" },
    { Header: "Category", accessor: "category" },
    { Header: "Date", accessor: "date" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Account ID", accessor: "accountId" },
    { Header: "Description", accessor: "description" },
  ];

  const accountIds = [
    ...new Set([...expenses.map((e) => e.accountId), ...earnings.map((e) => e.accountId)]),
  ];

  const getAvailableYears = () => {
    const allDates = [...expenses, ...earnings].map((item) => new Date(item.date).getFullYear());
    return [...new Set(allDates)].sort();
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={8} mt={8}>
        <MDBox mb={4} display="flex" justifyContent="flex-start" gap={2} alignItems="center">
          <div className="radio-inputs">
            <label className="radio">
              <input
                type="radio"
                name="dashboardLevel"
                value="Organization Level"
                checked={dashboardLevel === "Organization Level"}
                onChange={() => handleDashboardLevelChange("Organization Level")}
              />
              <span className="name">Organization Level</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="dashboardLevel"
                value="Account Level"
                checked={dashboardLevel === "Account Level"}
                onChange={() => handleDashboardLevelChange("Account Level")}
              />
              <span className="name">Account Level</span>
            </label>
          </div>

          {dashboardLevel === "Account Level" && (
            <TextField
              select
              label="Select Account ID"
              value={accountId || ""}
              onChange={(e) => handleAccountIdChange(e.target.value)}
              variant="outlined"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {accountIds.map((id) => (
                <MenuItem key={id} value={id}>
                  {id}
                </MenuItem>
              ))}
            </TextField>
          )}

          <IconButton size="small" onClick={handleDateFilterOpen}>
            <SettingsIcon />
          </IconButton>
          <Menu
            id="date-filter-menu"
            anchorEl={dateFilterAnchorEl}
            open={Boolean(dateFilterAnchorEl)}
            onClose={handleDateFilterClose}
          >
            <MDBox p={2} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate || ""}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="contained" onClick={handleApplyDateFilter}>
                Apply Filter
              </Button>
              <Button variant="outlined" onClick={handleResetDateFilter}>
                Reset Filter
              </Button>
            </MDBox>
          </Menu>
        </MDBox>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <PieChart
              title="Expenses by Category"
              description={`Category-wise expenses${
                startDate && endDate
                  ? ` (${new Date(startDate).toLocaleDateString()} - ${new Date(
                      endDate
                    ).toLocaleDateString()})`
                  : ""
              }`}
              data={expensesPieChartData}
              onClick={() => handleChartClick(expensesByCategory, "expenses")}
              isActive={activeCard === "expenses"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PieChart
              title="Earnings by Category"
              description={`Category-wise earnings${
                startDate && endDate
                  ? ` (${new Date(startDate).toLocaleDateString()} - ${new Date(
                      endDate
                    ).toLocaleDateString()})`
                  : ""
              }`}
              data={earningsPieChartData}
              onClick={() => handleChartClick(earningsByCategory, "earnings")}
              isActive={activeCard === "earnings"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ReportsBarChart
              title="Expenses vs Earnings"
              description={`Comparison of expenses and earnings${
                startDate && endDate
                  ? ` (${new Date(startDate).toLocaleDateString()} - ${new Date(
                      endDate
                    ).toLocaleDateString()})`
                  : ""
              }`}
              chart={expensesEarningsBarChartData}
              onClick={() => handleChartClick("expensesEarnings", "expensesEarnings")}
              isActive={activeCard === "expensesEarnings"}
              profitLoss={profitLoss}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ReportsBarChart
              title="Financial Runway"
              description={
                <MDBox display="flex" alignItems="center" justifyContent="space-between">
                  <span>
                    Months of runway
                    {Object.keys(selectedRunwayMonths).length === 0
                      ? " (All Months)"
                      : ` (${Object.entries(selectedRunwayMonths)
                          .filter(([_, selected]) => selected)
                          .map(([key]) => key)
                          .join(", ")})`}
                  </span>
                  <IconButton size="small" onClick={handleRunwaySettingsOpen}>
                    <SettingsIcon />
                  </IconButton>
                </MDBox>
              }
              chart={financialRunwayBarChartData}
              onClick={() => handleChartClick("financialRunway", "financialRunway")}
              isActive={activeCard === "financialRunway"}
              runwayMonths={financialRunway}
            />
            <Menu
              id="runway-month-menu"
              anchorEl={runwayAnchorEl}
              open={Boolean(runwayAnchorEl)}
              onClose={handleRunwaySettingsClose}
            >
              <MenuItem onClick={handleSelectAllMonths}>All Months</MenuItem>
              {getAvailableYears().map((year) =>
                months.map((month, index) => (
                  <MenuItem key={`${year}-${index}`} disableGutters>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!selectedRunwayMonths[`${year}-${index}`]}
                          onChange={() => handleRunwayMonthToggle(`${year}-${index}`)}
                        />
                      }
                      label={`${month} ${year}`}
                      sx={{ marginLeft: 1 }}
                    />
                  </MenuItem>
                ))
              )}
            </Menu>
          </Grid>
        </Grid>
        <MDBox mt={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {showTable && selectedChartData && (
                <DataTable
                  table={{ columns: tableColumns, rows: tableRows }}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                  entriesPerPage={false}
                  sx={{
                    "& .MuiTable-root": {
                      border: "1px solid #ddd",
                    },
                    "& .MuiTableCell-root": {
                      padding: "10px",
                    },
                    "& .MuiTableRow-root:nth-of-type(odd)": {
                      backgroundColor: "#f9f9f9",
                    },
                  }}
                />
              )}
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {openCategory &&
                !Object.keys(selectedDetailCategories).some(
                  (key) => selectedDetailCategories[key]
                ) && (
                  <DataTable
                    table={{
                      columns: detailsColumns,
                      rows: getCategoryDetails(
                        openCategory,
                        activeCard === "expenses" ? "expense" : "earning"
                      ),
                    }}
                    showTotalEntries={false}
                    isSorted={false}
                    noEndBorder
                    entriesPerPage={false}
                  />
                )}
              {Object.keys(selectedDetailCategories).some(
                (key) => selectedDetailCategories[key]
              ) && (
                <DataTable
                  table={{
                    columns: detailsColumns,
                    rows: Object.entries(selectedDetailCategories)
                      .filter(([_, selected]) => selected)
                      .flatMap(([category]) =>
                        getCategoryDetails(
                          category,
                          activeCard === "expenses" ? "expense" : "earning"
                        )
                      ),
                  }}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                  entriesPerPage={false}
                />
              )}
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

const detailsColumns = [
  { Header: "Type", accessor: "type" },
  { Header: "Category", accessor: "category" },
  { Header: "Date", accessor: "date" },
  { Header: "Amount", accessor: "amount" },
  { Header: "Account ID", accessor: "accountId" },
  { Header: "Description", accessor: "description" },
];

export default Dashboard;
