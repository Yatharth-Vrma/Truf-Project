import React from "react";
import { Route, Routes } from "react-router-dom";
import ExpenseOverview from "layouts/dashboard";
import Customer from "layouts/billing";
import ManageEmployee from "layouts/manage-employee";
import ManageProjects from "./layouts/manage-projects";
import ManageClient from "./layouts/manage-client";
import ManageRoles from "layouts/manage-roles";
import ManageEarnings from "layouts/manage-earning";
import ManageAccount from "./layouts/manage-accounts"; // Single component for accounts
import ManageExpenses from "./layouts/manage-expense";
import Icon from "@mui/material/Icon";
import Dashboard from "layouts/dashboard";
import Basic from "layouts/authentication/sign-in";
import Logout from "layouts/authentication/Logout";
import ProtectedRoute from "./layouts/authentication/ProtectedRoute";
import Unauthorized from "./layouts/authentication/Unauthorized";

const routes = [
  {
    route: "/sign-in",
    component: <Basic />,
  },
  {
    route: "/unauthorized",
    component: <Unauthorized />,
  },
  {
    type: "collapse",
    name: "Manage",
    key: "manage",
    icon: <Icon fontSize="small">settings</Icon>,
    collapse: [
      {
        name: "Manage Employee",
        key: "manage-employee",
        icon: <Icon fontSize="small">person</Icon>,
        route: "/manage/employee",
        component: (
          <ProtectedRoute allowedRoles={["ManageEmployee:full access"]}>
            <ManageEmployee />
          </ProtectedRoute>
        ),
      },
      {
        name: "Manage Clients",
        key: "manage-clients",
        icon: <Icon fontSize="small">group</Icon>,
        route: "/manage/clients",
        component: (
          <ProtectedRoute allowedRoles={["ManageClient:full access", "ManageClient:read"]}>
            <ManageClient />
          </ProtectedRoute>
        ),
      },
      {
        name: "Manage Accounts",
        key: "manage-accounts",
        icon: <Icon fontSize="small">account_balance</Icon>,
        route: "/manage/accounts",
        component: (
          <ProtectedRoute allowedRoles={["ManageAccount:full access", "ManageAccount:read"]}>
            <ManageAccount />
          </ProtectedRoute>
        ),
      },
      {
        name: "Manage Expenses",
        key: "manage-expenses",
        icon: <Icon fontSize="small">receipt</Icon>,
        route: "/manage/expenses",
        component: (
          <ProtectedRoute allowedRoles={["ManageExpense:full access", "ManageExpense:read"]}>
            <ManageExpenses />
          </ProtectedRoute>
        ),
      },
      {
        name: "Manage Projects",
        key: "manage-projects",
        icon: <Icon fontSize="small">assignment</Icon>,
        route: "/manage/projects",
        component: (
          <ProtectedRoute allowedRoles={["ManageProject:full access", "ManageProject:read"]}>
            <ManageProjects />
          </ProtectedRoute>
        ),
      },
      {
        name: "Manage Roles",
        key: "manage-roles",
        icon: <Icon fontSize="small">assignment</Icon>,
        route: "/manage/roles",
        component: (
          <ProtectedRoute allowedRoles={["ManageRoles:full access"]}>
            <ManageRoles />
          </ProtectedRoute>
        ),
      },
      {
        name: "Manage Earnings",
        key: "manage-earnings",
        icon: <Icon fontSize="small">receipt</Icon>,
        route: "/manage/earnings",
        component: (
          <ProtectedRoute allowedRoles={["ManageEarning:full access", "ManageEarning:read"]}>
            <ManageEarnings />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    type: "collapse",
    name: "Financial Overview",
    key: "financial-overview",
    icon: <Icon fontSize="small">account_balance</Icon>,
    route: "/financial-overview",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Customer",
    key: "customer",
    icon: <Icon fontSize="small">group</Icon>,
    route: "/customer",
    component: <Customer />,
  },
  {
    type: "collapse",
    name: "Sales",
    key: "sales",
    icon: <Icon fontSize="small">shopping_cart</Icon>,
    route: "/sales",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Employee",
    key: "employee",
    icon: <Icon fontSize="small">badge</Icon>,
    route: "/employee",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Product Development",
    key: "product-development",
    icon: <Icon fontSize="small">build</Icon>,
    route: "/product-development",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "IT Infrastructure",
    key: "it-infrastructure",
    icon: <Icon fontSize="small">computer</Icon>,
    route: "/it-infrastructure",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "R&D Innovation",
    key: "rd-innovation",
    icon: <Icon fontSize="small">lightbulb</Icon>,
    route: "/rd-innovation",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Market Analysis",
    key: "market-analysis",
    icon: <Icon fontSize="small">bar_chart</Icon>,
    route: "/market-analysis",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Digital Transformation",
    key: "digital-transformation",
    icon: <Icon fontSize="small">transform</Icon>,
    route: "/digital-transformation",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Diversity and Inclusion",
    key: "diversity-inclusion",
    icon: <Icon fontSize="small">diversity_3</Icon>,
    route: "/diversity-inclusion",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Security",
    key: "security",
    icon: <Icon fontSize="small">security</Icon>,
    route: "/security",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Operational Efficiency",
    key: "operational-efficiency",
    icon: <Icon fontSize="small">speed</Icon>,
    route: "/operational-efficiency",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Logout",
    key: "logout",
    route: "/logout",
    icon: <Icon fontSize="small">logout</Icon>,
    component: <Logout />,
  },
];

export default routes;
