import React from 'react';
import { fetchUtils, Admin, Resource } from 'react-admin';
import { Route } from 'react-router-dom';
import simpleRestProvider from './ra-strapi-rest';
import authProvider from './AuthProvider/authProvider';
// import { Authenticated } from 'react-admin';
// import CustomRoutes from './customRoutes'

// //custom route
// const CustomRoutes = [
   
// ];
const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    
    const token = localStorage.getItem('token');
    options.headers.set('Authorization', `Bearer ${token}`);
    return fetchUtils.fetchJson(url, options);
}



const dataProvider = simpleRestProvider('http://localhost:1337', httpClient);

const App = () => (
  <> <Admin authProvider={authProvider} dataProvider={dataProvider}>
       <div>
         Homepage For Authenticated Users.
       </div>
    </Admin>
    {/* <Admin customRoutes={customRoutes}>
    ...
</Admin> */}

</>
);

export default App;