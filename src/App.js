import React from "react";
import { fetchUtils, Admin, Resource } from "react-admin";
import simpleRestProvider from "./ra-strapi-rest";
import authProvider from "./AuthProvider/authProvider";
import Dashboard from "./Dashboard";

const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  const token = localStorage.getItem("token");
  options.headers.set("Authorization", `Bearer ${token}`);
  return fetchUtils.fetchJson(url, options);
};

const dataProvider = simpleRestProvider("http://localhost:1337", httpClient);

const App = () => (
  <Admin
    title="Welcome to Operations Center"
    authProvider={authProvider}
    dataProvider={dataProvider}
  >
    <Dashboard />
  </Admin>
);

export default App;
