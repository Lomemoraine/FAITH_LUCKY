import fs from "node:fs";
import path from "node:path";

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  });
}

import { sendSMS, sendCrisisEscalationAlert, sendVoucherSMS, sendAppointmentReminder } from "../src/lib/httpsms";

const TARGET_PHONE = process.env.DUTY_COUNSELOR_PHONE || "+254700000000";

async function sendLiveTest() {
  console.log("\n========================================================");
  console.log(`📱 DISPATCHING LIVE TEST SMS TO: ${TARGET_PHONE}`);
  console.log(`📡 Using Gateway: ${process.env.HTTPSMS_FROM_NUMBER} via ${process.env.HTTPSMS_API_URL}`);
  console.log("========================================================\n");

  // 1. Send Care Pass Voucher SMS
  console.log("1️⃣ Sending Care Pass Voucher Delivery SMS...");
  const voucherRes = await sendVoucherSMS({
    customerPhone: TARGET_PHONE,
    voucherCode: "CARE-HOPE-789",
    productTitle: "TFL Signature Hope Hoodie",
  });
  console.log("  ↳ Response:", JSON.stringify(voucherRes, null, 2));

  // 2. Send Counseling Session Reminder SMS
  console.log("\n2️⃣ Sending Confidential Counseling Session Reminder SMS...");
  const appointmentRes = await sendAppointmentReminder({
    userPhone: TARGET_PHONE,
    counselorName: "Dr. Faith Mwangi (Clinical Psychologist)",
    sessionTime: "Today at 3:30 PM EAT",
  });
  console.log("  ↳ Response:", JSON.stringify(appointmentRes, null, 2));

  // 3. Send Urgent Crisis Escalation Alert SMS
  console.log("\n3️⃣ Sending Urgent Duty Counselor Crisis Alert SMS...");
  const alertRes = await sendCrisisEscalationAlert({
    counselorPhone: TARGET_PHONE,
    postId: "post-live-9921",
    roomName: "grief-healing",
    severity: "critical",
  });
  console.log("  ↳ Response:", JSON.stringify(alertRes, null, 2));

  console.log("\n========================================================");
  console.log("✅ ALL 3 LIVE SMS MESSAGES QUEUED FOR DISPATCH!");
  console.log("========================================================\n");
}

sendLiveTest().catch((err) => {
  console.error("Live test error:", err);
  process.exit(1);
});
