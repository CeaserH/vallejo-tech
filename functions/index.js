const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { manageAppointment } = require("./management");
initializeApp();
exports.manageAppointment = onCall(
  { region: "us-west2", maxInstances: 3, invoker: "public" },
  ({ data }) => manageAppointment(data, getFirestore(), FieldValue)
);
