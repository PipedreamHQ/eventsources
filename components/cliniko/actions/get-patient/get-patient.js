const cliniko = require("../../cliniko.app.js");

module.exports = {
  name: "Get Patient",
  key: "cliniko-get-patient",
  description: "Get the details of a patient by patient ID.",
  version: "0.0.1",
  type: "action",
  props: {
    cliniko,
    patientId: {
      propDefinition: [
        cliniko,
        "patientId",
      ],
    },
  },
  async run() {
    return await this.cliniko.getPatient(this.patientId);
  },
};
