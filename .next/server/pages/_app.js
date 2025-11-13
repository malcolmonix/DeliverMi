/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./src/lib/apollo.js":
/*!***************************!*\
  !*** ./src/lib/apollo.js ***!
  \***************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   apolloClient: () => (/* binding */ apolloClient)\n/* harmony export */ });\n/* harmony import */ var _apollo_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @apollo/client */ \"@apollo/client\");\n/* harmony import */ var _apollo_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_apollo_client__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _apollo_client_link_context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @apollo/client/link/context */ \"@apollo/client/link/context\");\n/* harmony import */ var _apollo_client_link_context__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_apollo_client_link_context__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/auth */ \"firebase/auth\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_auth__WEBPACK_IMPORTED_MODULE_2__]);\nfirebase_auth__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\nconst apiUri = process.env.NEXT_PUBLIC_GRAPHQL_URI || \"http://localhost:4000/graphql\";\nconst httpLink = (0,_apollo_client__WEBPACK_IMPORTED_MODULE_0__.createHttpLink)({\n    uri: apiUri,\n    credentials: \"same-origin\"\n});\nconst authLink = (0,_apollo_client_link_context__WEBPACK_IMPORTED_MODULE_1__.setContext)(async (_, { headers })=>{\n    try {\n        if (true) return {\n            headers: {\n                ...headers\n            }\n        };\n        const auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.getAuth)();\n        const user = auth.currentUser;\n        if (!user) return {\n            headers: {\n                ...headers\n            }\n        };\n        const token = await user.getIdToken();\n        return {\n            headers: {\n                ...headers,\n                authorization: token ? `Bearer ${token}` : \"\"\n            }\n        };\n    } catch (e) {\n        console.warn(\"Apollo authLink token retrieval failed\", e.message || e);\n        return {\n            headers: {\n                ...headers\n            }\n        };\n    }\n});\nconst apolloClient = new _apollo_client__WEBPACK_IMPORTED_MODULE_0__.ApolloClient({\n    link: authLink.concat(httpLink),\n    cache: new _apollo_client__WEBPACK_IMPORTED_MODULE_0__.InMemoryCache()\n});\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGliL2Fwb2xsby5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBNkU7QUFDcEI7QUFDakI7QUFFeEMsTUFBTUssU0FBU0MsUUFBUUMsR0FBRyxDQUFDQyx1QkFBdUIsSUFBSTtBQUV0RCxNQUFNQyxXQUFXUCw4REFBY0EsQ0FBQztJQUFFUSxLQUFLTDtJQUFRTSxhQUFhO0FBQWM7QUFFMUUsTUFBTUMsV0FBV1QsdUVBQVVBLENBQUMsT0FBT1UsR0FBRyxFQUFFQyxPQUFPLEVBQUU7SUFDL0MsSUFBSTtRQUNGLElBQUksSUFBa0IsRUFBYSxPQUFPO1lBQUVBLFNBQVM7Z0JBQUUsR0FBR0EsT0FBTztZQUFDO1FBQUU7UUFDcEUsTUFBTUMsT0FBT1gsc0RBQU9BO1FBQ3BCLE1BQU1ZLE9BQU9ELEtBQUtFLFdBQVc7UUFDN0IsSUFBSSxDQUFDRCxNQUFNLE9BQU87WUFBRUYsU0FBUztnQkFBRSxHQUFHQSxPQUFPO1lBQUM7UUFBRTtRQUM1QyxNQUFNSSxRQUFRLE1BQU1GLEtBQUtHLFVBQVU7UUFDbkMsT0FBTztZQUFFTCxTQUFTO2dCQUFFLEdBQUdBLE9BQU87Z0JBQUVNLGVBQWVGLFFBQVEsQ0FBQyxPQUFPLEVBQUVBLE1BQU0sQ0FBQyxHQUFHO1lBQUc7UUFBRTtJQUNsRixFQUFFLE9BQU9HLEdBQUc7UUFDVkMsUUFBUUMsSUFBSSxDQUFDLDBDQUEwQ0YsRUFBRUcsT0FBTyxJQUFJSDtRQUNwRSxPQUFPO1lBQUVQLFNBQVM7Z0JBQUUsR0FBR0EsT0FBTztZQUFDO1FBQUU7SUFDbkM7QUFDRjtBQUVPLE1BQU1XLGVBQWUsSUFBSXpCLHdEQUFZQSxDQUFDO0lBQzNDMEIsTUFBTWQsU0FBU2UsTUFBTSxDQUFDbEI7SUFDdEJtQixPQUFPLElBQUkzQix5REFBYUE7QUFDMUIsR0FBRyIsInNvdXJjZXMiOlsid2VicGFjazovL2RlbGl2ZXJtaS8uL3NyYy9saWIvYXBvbGxvLmpzP2ZkMmIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBvbGxvQ2xpZW50LCBJbk1lbW9yeUNhY2hlLCBjcmVhdGVIdHRwTGluayB9IGZyb20gJ0BhcG9sbG8vY2xpZW50JztcbmltcG9ydCB7IHNldENvbnRleHQgfSBmcm9tICdAYXBvbGxvL2NsaWVudC9saW5rL2NvbnRleHQnO1xuaW1wb3J0IHsgZ2V0QXV0aCB9IGZyb20gJ2ZpcmViYXNlL2F1dGgnO1xuXG5jb25zdCBhcGlVcmkgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19HUkFQSFFMX1VSSSB8fCAnaHR0cDovL2xvY2FsaG9zdDo0MDAwL2dyYXBocWwnO1xuXG5jb25zdCBodHRwTGluayA9IGNyZWF0ZUh0dHBMaW5rKHsgdXJpOiBhcGlVcmksIGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nIH0pO1xuXG5jb25zdCBhdXRoTGluayA9IHNldENvbnRleHQoYXN5bmMgKF8sIHsgaGVhZGVycyB9KSA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSByZXR1cm4geyBoZWFkZXJzOiB7IC4uLmhlYWRlcnMgfSB9O1xuICAgIGNvbnN0IGF1dGggPSBnZXRBdXRoKCk7XG4gICAgY29uc3QgdXNlciA9IGF1dGguY3VycmVudFVzZXI7XG4gICAgaWYgKCF1c2VyKSByZXR1cm4geyBoZWFkZXJzOiB7IC4uLmhlYWRlcnMgfSB9O1xuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgdXNlci5nZXRJZFRva2VuKCk7XG4gICAgcmV0dXJuIHsgaGVhZGVyczogeyAuLi5oZWFkZXJzLCBhdXRob3JpemF0aW9uOiB0b2tlbiA/IGBCZWFyZXIgJHt0b2tlbn1gIDogJycgfSB9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKCdBcG9sbG8gYXV0aExpbmsgdG9rZW4gcmV0cmlldmFsIGZhaWxlZCcsIGUubWVzc2FnZSB8fCBlKTtcbiAgICByZXR1cm4geyBoZWFkZXJzOiB7IC4uLmhlYWRlcnMgfSB9O1xuICB9XG59KTtcblxuZXhwb3J0IGNvbnN0IGFwb2xsb0NsaWVudCA9IG5ldyBBcG9sbG9DbGllbnQoe1xuICBsaW5rOiBhdXRoTGluay5jb25jYXQoaHR0cExpbmspLFxuICBjYWNoZTogbmV3IEluTWVtb3J5Q2FjaGUoKSxcbn0pO1xuIl0sIm5hbWVzIjpbIkFwb2xsb0NsaWVudCIsIkluTWVtb3J5Q2FjaGUiLCJjcmVhdGVIdHRwTGluayIsInNldENvbnRleHQiLCJnZXRBdXRoIiwiYXBpVXJpIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX0dSQVBIUUxfVVJJIiwiaHR0cExpbmsiLCJ1cmkiLCJjcmVkZW50aWFscyIsImF1dGhMaW5rIiwiXyIsImhlYWRlcnMiLCJhdXRoIiwidXNlciIsImN1cnJlbnRVc2VyIiwidG9rZW4iLCJnZXRJZFRva2VuIiwiYXV0aG9yaXphdGlvbiIsImUiLCJjb25zb2xlIiwid2FybiIsIm1lc3NhZ2UiLCJhcG9sbG9DbGllbnQiLCJsaW5rIiwiY29uY2F0IiwiY2FjaGUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/lib/apollo.js\n");

/***/ }),

/***/ "./src/lib/firebase.js":
/*!*****************************!*\
  !*** ./src/lib/firebase.js ***!
  \*****************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   db: () => (/* binding */ db),\n/* harmony export */   onMessageHandler: () => (/* binding */ onMessageHandler),\n/* harmony export */   registerMessagingSW: () => (/* binding */ registerMessagingSW),\n/* harmony export */   requestAndGetFcmToken: () => (/* binding */ requestAndGetFcmToken)\n/* harmony export */ });\n/* harmony import */ var firebase_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase/app */ \"firebase/app\");\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase/auth */ \"firebase/auth\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/firestore */ \"firebase/firestore\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_app__WEBPACK_IMPORTED_MODULE_0__, firebase_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_firestore__WEBPACK_IMPORTED_MODULE_2__]);\n([firebase_app__WEBPACK_IMPORTED_MODULE_0__, firebase_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_firestore__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\nconst firebaseConfig = {\n    apiKey: \"AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q\",\n    authDomain: \"chopchop-67750.firebaseapp.com\",\n    projectId: \"chopchop-67750\",\n    storageBucket: \"chopchop-67750.firebasestorage.app\",\n    messagingSenderId: \"835361851966\",\n    appId: \"1:835361851966:web:78810ea4389297a8679f6f\"\n};\nlet app;\nif (!(0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.getApps)().length) {\n    app = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(firebaseConfig);\n} else {\n    app = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.getApps)()[0];\n}\nconst auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(app);\nconst db = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(app);\n// Messaging helpers (dynamic imports so server-side doesn't break)\nasync function registerMessagingSW() {\n    if (true) return null;\n    if (!(\"serviceWorker\" in navigator)) return null;\n    try {\n        const reg = await navigator.serviceWorker.register(\"/firebase-messaging-sw.js\");\n        return reg;\n    } catch (e) {\n        console.warn(\"Service worker registration failed:\", e.message || e);\n        return null;\n    }\n}\nasync function requestAndGetFcmToken() {\n    if (true) return null;\n    if (false) {}\n    try {\n        const { getMessaging, getToken, onMessage } = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! firebase/messaging */ \"firebase/messaging\"));\n        const messaging = getMessaging(app);\n        // Request permission\n        if (Notification.permission !== \"granted\") {\n            await Notification.requestPermission();\n        }\n        if (Notification.permission !== \"granted\") return null;\n        const token = await getToken(messaging, {\n            vapidKey: \"Xofgzt-NYY8r00-OowCWUWdM42BZaA3S-RhpShdNE4s\"\n        });\n        return token;\n    } catch (e) {\n        console.warn(\"Failed to get FCM token:\", e.message || e);\n        return null;\n    }\n}\nasync function onMessageHandler(callback) {\n    if (true) return;\n    try {\n        const { getMessaging, onMessage } = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! firebase/messaging */ \"firebase/messaging\"));\n        const messaging = getMessaging(app);\n        onMessage(messaging, callback);\n    } catch (e) {\n        console.warn(\"onMessage handler setup failed:\", e.message || e);\n    }\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGliL2ZpcmViYXNlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQXNEO0FBQ2Q7QUFDVTtBQUVsRCxNQUFNSSxpQkFBaUI7SUFDckJDLFFBQVFDLHlDQUF3QztJQUNoREcsWUFBWUgsZ0NBQTRDO0lBQ3hESyxXQUFXTCxnQkFBMkM7SUFDdERPLGVBQWVQLG9DQUErQztJQUM5RFMsbUJBQW1CVCxjQUFvRDtJQUN2RVcsT0FBT1gsMkNBQXVDO0FBQ2hEO0FBRUEsSUFBSWE7QUFDSixJQUFJLENBQUNsQixxREFBT0EsR0FBR21CLE1BQU0sRUFBRTtJQUNyQkQsTUFBTW5CLDJEQUFhQSxDQUFDSTtBQUN0QixPQUFPO0lBQ0xlLE1BQU1sQixxREFBT0EsRUFBRSxDQUFDLEVBQUU7QUFDcEI7QUFFTyxNQUFNb0IsT0FBT25CLHNEQUFPQSxDQUFDaUIsS0FBSztBQUMxQixNQUFNRyxLQUFLbkIsZ0VBQVlBLENBQUNnQixLQUFLO0FBRXBDLG1FQUFtRTtBQUM1RCxlQUFlSTtJQUNwQixJQUFJLElBQWtCLEVBQWEsT0FBTztJQUMxQyxJQUFJLENBQUUsb0JBQW1CQyxTQUFRLEdBQUksT0FBTztJQUM1QyxJQUFJO1FBQ0YsTUFBTUMsTUFBTSxNQUFNRCxVQUFVRSxhQUFhLENBQUNDLFFBQVEsQ0FBQztRQUNuRCxPQUFPRjtJQUNULEVBQUUsT0FBT0csR0FBRztRQUNWQyxRQUFRQyxJQUFJLENBQUMsdUNBQXVDRixFQUFFRyxPQUFPLElBQUlIO1FBQ2pFLE9BQU87SUFDVDtBQUNGO0FBRU8sZUFBZUk7SUFDcEIsSUFBSSxJQUFrQixFQUFhLE9BQU87SUFDMUMsSUFBSSxLQUEyQyxFQUFFLEVBQVk7SUFDN0QsSUFBSTtRQUNGLE1BQU0sRUFBRUUsWUFBWSxFQUFFQyxRQUFRLEVBQUVDLFNBQVMsRUFBRSxHQUFHLE1BQU0sb0lBQU87UUFDM0QsTUFBTUMsWUFBWUgsYUFBYWY7UUFDL0IscUJBQXFCO1FBQ3JCLElBQUltQixhQUFhQyxVQUFVLEtBQUssV0FBVztZQUN6QyxNQUFNRCxhQUFhRSxpQkFBaUI7UUFDdEM7UUFDQSxJQUFJRixhQUFhQyxVQUFVLEtBQUssV0FBVyxPQUFPO1FBQ2xELE1BQU1FLFFBQVEsTUFBTU4sU0FBU0UsV0FBVztZQUFFSyxVQUFVcEMsNkNBQTBDO1FBQUM7UUFDL0YsT0FBT21DO0lBQ1QsRUFBRSxPQUFPYixHQUFHO1FBQ1ZDLFFBQVFDLElBQUksQ0FBQyw0QkFBNEJGLEVBQUVHLE9BQU8sSUFBSUg7UUFDdEQsT0FBTztJQUNUO0FBQ0Y7QUFFTyxlQUFlZSxpQkFBaUJDLFFBQVE7SUFDN0MsSUFBSSxJQUFrQixFQUFhO0lBQ25DLElBQUk7UUFDRixNQUFNLEVBQUVWLFlBQVksRUFBRUUsU0FBUyxFQUFFLEdBQUcsTUFBTSxvSUFBTztRQUNqRCxNQUFNQyxZQUFZSCxhQUFhZjtRQUMvQmlCLFVBQVVDLFdBQVdPO0lBQ3ZCLEVBQUUsT0FBT2hCLEdBQUc7UUFDVkMsUUFBUUMsSUFBSSxDQUFDLG1DQUFtQ0YsRUFBRUcsT0FBTyxJQUFJSDtJQUMvRDtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGVsaXZlcm1pLy4vc3JjL2xpYi9maXJlYmFzZS5qcz8xZGUwIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGluaXRpYWxpemVBcHAsIGdldEFwcHMgfSBmcm9tICdmaXJlYmFzZS9hcHAnO1xuaW1wb3J0IHsgZ2V0QXV0aCB9IGZyb20gJ2ZpcmViYXNlL2F1dGgnO1xuaW1wb3J0IHsgZ2V0RmlyZXN0b3JlIH0gZnJvbSAnZmlyZWJhc2UvZmlyZXN0b3JlJztcblxuY29uc3QgZmlyZWJhc2VDb25maWcgPSB7XG4gIGFwaUtleTogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfQVBJX0tFWSxcbiAgYXV0aERvbWFpbjogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfQVVUSF9ET01BSU4sXG4gIHByb2plY3RJZDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfUFJPSkVDVF9JRCxcbiAgc3RvcmFnZUJ1Y2tldDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfU1RPUkFHRV9CVUNLRVQsXG4gIG1lc3NhZ2luZ1NlbmRlcklkOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19GSVJFQkFTRV9NRVNTQUdJTkdfU0VOREVSX0lELFxuICBhcHBJZDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfQVBQX0lELFxufTtcblxubGV0IGFwcDtcbmlmICghZ2V0QXBwcygpLmxlbmd0aCkge1xuICBhcHAgPSBpbml0aWFsaXplQXBwKGZpcmViYXNlQ29uZmlnKTtcbn0gZWxzZSB7XG4gIGFwcCA9IGdldEFwcHMoKVswXTtcbn1cblxuZXhwb3J0IGNvbnN0IGF1dGggPSBnZXRBdXRoKGFwcCk7XG5leHBvcnQgY29uc3QgZGIgPSBnZXRGaXJlc3RvcmUoYXBwKTtcblxuLy8gTWVzc2FnaW5nIGhlbHBlcnMgKGR5bmFtaWMgaW1wb3J0cyBzbyBzZXJ2ZXItc2lkZSBkb2Vzbid0IGJyZWFrKVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyTWVzc2FnaW5nU1coKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIG51bGw7XG4gIGlmICghKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCByZWcgPSBhd2FpdCBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignL2ZpcmViYXNlLW1lc3NhZ2luZy1zdy5qcycpO1xuICAgIHJldHVybiByZWc7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLndhcm4oJ1NlcnZpY2Ugd29ya2VyIHJlZ2lzdHJhdGlvbiBmYWlsZWQ6JywgZS5tZXNzYWdlIHx8IGUpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1ZXN0QW5kR2V0RmNtVG9rZW4oKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIG51bGw7XG4gIGlmICghcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfVkFQSURfS0VZKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGdldE1lc3NhZ2luZywgZ2V0VG9rZW4sIG9uTWVzc2FnZSB9ID0gYXdhaXQgaW1wb3J0KCdmaXJlYmFzZS9tZXNzYWdpbmcnKTtcbiAgICBjb25zdCBtZXNzYWdpbmcgPSBnZXRNZXNzYWdpbmcoYXBwKTtcbiAgICAvLyBSZXF1ZXN0IHBlcm1pc3Npb25cbiAgICBpZiAoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09ICdncmFudGVkJykge1xuICAgICAgYXdhaXQgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKCk7XG4gICAgfVxuICAgIGlmIChOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gJ2dyYW50ZWQnKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKG1lc3NhZ2luZywgeyB2YXBpZEtleTogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfVkFQSURfS0VZIH0pO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCBGQ00gdG9rZW46JywgZS5tZXNzYWdlIHx8IGUpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbk1lc3NhZ2VIYW5kbGVyKGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuICB0cnkge1xuICAgIGNvbnN0IHsgZ2V0TWVzc2FnaW5nLCBvbk1lc3NhZ2UgfSA9IGF3YWl0IGltcG9ydCgnZmlyZWJhc2UvbWVzc2FnaW5nJyk7XG4gICAgY29uc3QgbWVzc2FnaW5nID0gZ2V0TWVzc2FnaW5nKGFwcCk7XG4gICAgb25NZXNzYWdlKG1lc3NhZ2luZywgY2FsbGJhY2spO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKCdvbk1lc3NhZ2UgaGFuZGxlciBzZXR1cCBmYWlsZWQ6JywgZS5tZXNzYWdlIHx8IGUpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiaW5pdGlhbGl6ZUFwcCIsImdldEFwcHMiLCJnZXRBdXRoIiwiZ2V0RmlyZXN0b3JlIiwiZmlyZWJhc2VDb25maWciLCJhcGlLZXkiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfRklSRUJBU0VfQVBJX0tFWSIsImF1dGhEb21haW4iLCJORVhUX1BVQkxJQ19GSVJFQkFTRV9BVVRIX0RPTUFJTiIsInByb2plY3RJZCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX1BST0pFQ1RfSUQiLCJzdG9yYWdlQnVja2V0IiwiTkVYVF9QVUJMSUNfRklSRUJBU0VfU1RPUkFHRV9CVUNLRVQiLCJtZXNzYWdpbmdTZW5kZXJJZCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX01FU1NBR0lOR19TRU5ERVJfSUQiLCJhcHBJZCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX0FQUF9JRCIsImFwcCIsImxlbmd0aCIsImF1dGgiLCJkYiIsInJlZ2lzdGVyTWVzc2FnaW5nU1ciLCJuYXZpZ2F0b3IiLCJyZWciLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJlIiwiY29uc29sZSIsIndhcm4iLCJtZXNzYWdlIiwicmVxdWVzdEFuZEdldEZjbVRva2VuIiwiTkVYVF9QVUJMSUNfRklSRUJBU0VfVkFQSURfS0VZIiwiZ2V0TWVzc2FnaW5nIiwiZ2V0VG9rZW4iLCJvbk1lc3NhZ2UiLCJtZXNzYWdpbmciLCJOb3RpZmljYXRpb24iLCJwZXJtaXNzaW9uIiwicmVxdWVzdFBlcm1pc3Npb24iLCJ0b2tlbiIsInZhcGlkS2V5Iiwib25NZXNzYWdlSGFuZGxlciIsImNhbGxiYWNrIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/lib/firebase.js\n");

/***/ }),

/***/ "./src/pages/_app.js":
/*!***************************!*\
  !*** ./src/pages/_app.js ***!
  \***************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _apollo_client_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @apollo/client/react */ \"@apollo/client/react\");\n/* harmony import */ var _apollo_client_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_apollo_client_react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_apollo__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/apollo */ \"./src/lib/apollo.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _lib_firebase__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../lib/firebase */ \"./src/lib/firebase.js\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! firebase/firestore */ \"firebase/firestore\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_apollo__WEBPACK_IMPORTED_MODULE_3__, _lib_firebase__WEBPACK_IMPORTED_MODULE_5__, firebase_firestore__WEBPACK_IMPORTED_MODULE_6__]);\n([_lib_apollo__WEBPACK_IMPORTED_MODULE_3__, _lib_firebase__WEBPACK_IMPORTED_MODULE_5__, firebase_firestore__WEBPACK_IMPORTED_MODULE_6__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n\n\n\nfunction App({ Component, pageProps }) {\n    (0,react__WEBPACK_IMPORTED_MODULE_4__.useEffect)(()=>{\n        // Register service worker and request permission for notifications\n        (async ()=>{\n            try {\n                await (0,_lib_firebase__WEBPACK_IMPORTED_MODULE_5__.registerMessagingSW)();\n                const token = await (0,_lib_firebase__WEBPACK_IMPORTED_MODULE_5__.requestAndGetFcmToken)();\n                if (token) {\n                    const user = _lib_firebase__WEBPACK_IMPORTED_MODULE_5__.auth.currentUser;\n                    if (user) {\n                        const riderRef = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_6__.doc)(_lib_firebase__WEBPACK_IMPORTED_MODULE_5__.db, \"riders\", user.uid);\n                        await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_6__.setDoc)(riderRef, {\n                            fcmToken: token\n                        }, {\n                            merge: true\n                        });\n                    }\n                }\n            } catch (e) {\n                console.warn(\"FCM setup in app failed:\", e.message || e);\n            }\n        })();\n    }, []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_apollo_client_react__WEBPACK_IMPORTED_MODULE_2__.ApolloProvider, {\n        client: _lib_apollo__WEBPACK_IMPORTED_MODULE_3__.apolloClient,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/workspaces/food-delivery-multivendor/DeliverMi/src/pages/_app.js\",\n            lineNumber: 31,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/workspaces/food-delivery-multivendor/DeliverMi/src/pages/_app.js\",\n        lineNumber: 30,\n        columnNumber: 5\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQStCO0FBQ3VCO0FBQ1Q7QUFDWDtBQUMyQztBQUNsQztBQUNNO0FBRWxDLFNBQVNTLElBQUksRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQUU7SUFDbERULGdEQUFTQSxDQUFDO1FBQ1IsbUVBQW1FO1FBQ2xFO1lBQ0MsSUFBSTtnQkFDRixNQUFNQyxrRUFBbUJBO2dCQUN6QixNQUFNUyxRQUFRLE1BQU1SLG9FQUFxQkE7Z0JBQ3pDLElBQUlRLE9BQU87b0JBQ1QsTUFBTUMsT0FBT1IsK0NBQUlBLENBQUNTLFdBQVc7b0JBQzdCLElBQUlELE1BQU07d0JBQ1IsTUFBTUUsV0FBV1IsdURBQUdBLENBQUNELDZDQUFFQSxFQUFFLFVBQVVPLEtBQUtHLEdBQUc7d0JBQzNDLE1BQU1SLDBEQUFNQSxDQUFDTyxVQUFVOzRCQUFFRSxVQUFVTDt3QkFBTSxHQUFHOzRCQUFFTSxPQUFPO3dCQUFLO29CQUM1RDtnQkFDRjtZQUNGLEVBQUUsT0FBT0MsR0FBRztnQkFDVkMsUUFBUUMsSUFBSSxDQUFDLDRCQUE0QkYsRUFBRUcsT0FBTyxJQUFJSDtZQUN4RDtRQUNGO0lBQ0YsR0FBRyxFQUFFO0lBRUwscUJBQ0UsOERBQUNuQixnRUFBY0E7UUFBQ3VCLFFBQVF0QixxREFBWUE7a0JBQ2xDLDRFQUFDUztZQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7O0FBRzlCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGVsaXZlcm1pLy4vc3JjL3BhZ2VzL19hcHAuanM/OGZkYSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJy4uL3N0eWxlcy9nbG9iYWxzLmNzcyc7XG5pbXBvcnQgeyBBcG9sbG9Qcm92aWRlciB9IGZyb20gJ0BhcG9sbG8vY2xpZW50L3JlYWN0JztcbmltcG9ydCB7IGFwb2xsb0NsaWVudCB9IGZyb20gJy4uL2xpYi9hcG9sbG8nO1xuaW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVnaXN0ZXJNZXNzYWdpbmdTVywgcmVxdWVzdEFuZEdldEZjbVRva2VuIH0gZnJvbSAnLi4vbGliL2ZpcmViYXNlJztcbmltcG9ydCB7IGF1dGgsIGRiIH0gZnJvbSAnLi4vbGliL2ZpcmViYXNlJztcbmltcG9ydCB7IGRvYywgc2V0RG9jIH0gZnJvbSAnZmlyZWJhc2UvZmlyZXN0b3JlJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfSkge1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIFJlZ2lzdGVyIHNlcnZpY2Ugd29ya2VyIGFuZCByZXF1ZXN0IHBlcm1pc3Npb24gZm9yIG5vdGlmaWNhdGlvbnNcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcmVnaXN0ZXJNZXNzYWdpbmdTVygpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGF3YWl0IHJlcXVlc3RBbmRHZXRGY21Ub2tlbigpO1xuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICBjb25zdCB1c2VyID0gYXV0aC5jdXJyZW50VXNlcjtcbiAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgY29uc3QgcmlkZXJSZWYgPSBkb2MoZGIsICdyaWRlcnMnLCB1c2VyLnVpZCk7XG4gICAgICAgICAgICBhd2FpdCBzZXREb2MocmlkZXJSZWYsIHsgZmNtVG9rZW46IHRva2VuIH0sIHsgbWVyZ2U6IHRydWUgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRkNNIHNldHVwIGluIGFwcCBmYWlsZWQ6JywgZS5tZXNzYWdlIHx8IGUpO1xuICAgICAgfVxuICAgIH0pKCk7XG4gIH0sIFtdKTtcblxuICByZXR1cm4gKFxuICAgIDxBcG9sbG9Qcm92aWRlciBjbGllbnQ9e2Fwb2xsb0NsaWVudH0+XG4gICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XG4gICAgPC9BcG9sbG9Qcm92aWRlcj5cbiAgKTtcbn1cbiJdLCJuYW1lcyI6WyJBcG9sbG9Qcm92aWRlciIsImFwb2xsb0NsaWVudCIsInVzZUVmZmVjdCIsInJlZ2lzdGVyTWVzc2FnaW5nU1ciLCJyZXF1ZXN0QW5kR2V0RmNtVG9rZW4iLCJhdXRoIiwiZGIiLCJkb2MiLCJzZXREb2MiLCJBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJ0b2tlbiIsInVzZXIiLCJjdXJyZW50VXNlciIsInJpZGVyUmVmIiwidWlkIiwiZmNtVG9rZW4iLCJtZXJnZSIsImUiLCJjb25zb2xlIiwid2FybiIsIm1lc3NhZ2UiLCJjbGllbnQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/pages/_app.js\n");

/***/ }),

/***/ "./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "@apollo/client":
/*!*********************************!*\
  !*** external "@apollo/client" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@apollo/client");

/***/ }),

/***/ "@apollo/client/link/context":
/*!**********************************************!*\
  !*** external "@apollo/client/link/context" ***!
  \**********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@apollo/client/link/context");

/***/ }),

/***/ "@apollo/client/react":
/*!***************************************!*\
  !*** external "@apollo/client/react" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@apollo/client/react");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "firebase/app":
/*!*******************************!*\
  !*** external "firebase/app" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/app");;

/***/ }),

/***/ "firebase/auth":
/*!********************************!*\
  !*** external "firebase/auth" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/auth");;

/***/ }),

/***/ "firebase/firestore":
/*!*************************************!*\
  !*** external "firebase/firestore" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/firestore");;

/***/ }),

/***/ "firebase/messaging":
/*!*************************************!*\
  !*** external "firebase/messaging" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/messaging");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./src/pages/_app.js"));
module.exports = __webpack_exports__;

})();