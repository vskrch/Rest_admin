// authProvider.js

import { AUTH_LOGIN, AUTH_LOGOUT, AUTH_ERROR, AUTH_CHECK, AUTH_GET_PERMISSIONS } from 'react-admin';
import Cookies from '../helpers/Cookies';
// // in src/authProvider.js
// const authProvider = {
//     login: ({ username, password }) =>  {
//         const request = new Request('https://mydomain.com/authenticate', {
//             method: 'POST',
//             body: JSON.stringify({ username, password }),
//             headers: new Headers({ 'Content-Type': 'application/json' }),
//         });
//         return fetch(request)
//             .then(response => {
//                 if (response.status < 200 || response.status >= 300) {
//                     throw new Error(response.statusText);
//                 }
//                 return response.json();
//             })
//             .then(({ token }) => {
//                 localStorage.setItem('token', token);
//             });
//     },
//     // ...
// };

// export default authProvider;

export default (type, params) => {
  
    if (type === AUTH_LOGIN) {
    
        const { identifier, password } = params;
        const request = new Request('http://localhost:1337/auth/local', {
            method: 'POST',
            body: JSON.stringify(
                {
                 identifier,
                 password 
                }),
            headers: new Headers({ 'Content-Type': 'application/json'})
        });
        console.log("request",request);
        
        return fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(response => {
                Cookies.setCookie('token', response.jwt, 1);
                Cookies.setCookie('role', response.user.role.name, 1);
                console.log("response",response);
            });
            
            
    }
  
    if (type === AUTH_LOGOUT) {
        Cookies.deleteCookie('token');
        Cookies.deleteCookie('role');
        return Promise.resolve();
    }
   
    if (type === AUTH_ERROR) {
        const status  = params.status;
        if (status === 401 || status === 403) {
            Cookies.deleteCookie('token');
            Cookies.deleteCookie('role');
            return Promise.reject();
        }
        return Promise.resolve();
    }

    if (type === AUTH_CHECK) {
        return Cookies.getCookie('token') ? Promise.resolve() : Promise.reject();
    }

    if (type === AUTH_GET_PERMISSIONS) {
        const role = Cookies.getCookie('role');
        return role ? Promise.resolve(role) : Promise.reject();
    }
    return Promise.resolve();
}

