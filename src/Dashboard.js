// in src/Dashboard.js
import React from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { UrlField } from "react-admin";

import Button from "@material-ui/core/Button";
export default () => (
  <Card>
    <CardContent>
      <Button variant="contained" color="primary" href="../PCS/index.html">
        Goto Pcs page
      </Button>
      <UrlField source="site_url" />
    </CardContent>
  </Card>
);
