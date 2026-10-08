"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/intake");
const { validatePayload, emailMarkup, isAllowedOrigin, isConfigured } = handler;

function responseRecorder() {
  return { statusCode: 0, headers: {}, body: "", setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(value) { this.body = value || ""; } };
}

test("accepts a complete short traffic inquiry", () => {
  const result = validatePayload({ name: "Jane Driver", phone: "804-555-0100", email: "JANE@example.com", charge: "Reckless driving", court: "Richmond General District Court", courtDate: "10/30/2026", consent: true, page: "/contact.html" });
  assert.deepEqual(result.errors, []);
  assert.equal(result.payload.email, "jane@example.com");
});

test("requires identity, contact path, charge, court and consent", () => {
  assert.equal(validatePayload({}).errors.length, 5);
});

test("escapes visitor-controlled values before building HTML", () => {
  const { payload } = validatePayload({ name: "<script>alert(1)</script>", phone: "804-555-0100", charge: "Reckless driving", court: "Richmond", consent: true });
  const html = emailMarkup(payload);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("requires complete configuration and an exact allowed origin", () => {
  const previous = { key: process.env.RESEND_API_KEY, from: process.env.INTAKE_FROM, recipients: process.env.INTAKE_RECIPIENTS, origins: process.env.INTAKE_ALLOWED_ORIGINS };
  process.env.RESEND_API_KEY = "test-key";
  process.env.INTAKE_FROM = "Avodah Traffic <intake@example.com>";
  process.env.INTAKE_RECIPIENTS = "one@example.com";
  process.env.INTAKE_ALLOWED_ORIGINS = "https://traffic.example.com";
  assert.equal(isConfigured(), true);
  assert.equal(isAllowedOrigin("https://traffic.example.com"), true);
  assert.equal(isAllowedOrigin("https://other.example.com"), false);
  for (const [key, value] of Object.entries({ RESEND_API_KEY: previous.key, INTAKE_FROM: previous.from, INTAKE_RECIPIENTS: previous.recipients, INTAKE_ALLOWED_ORIGINS: previous.origins })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test("sends a valid inquiry only to configured recipients", async () => {
  const previousEnv = { key: process.env.RESEND_API_KEY, from: process.env.INTAKE_FROM, recipients: process.env.INTAKE_RECIPIENTS, origins: process.env.INTAKE_ALLOWED_ORIGINS };
  const previousFetch = global.fetch;
  process.env.RESEND_API_KEY = "test-key";
  process.env.INTAKE_FROM = "Avodah Traffic <intake@example.com>";
  process.env.INTAKE_RECIPIENTS = "website@avodahlegal.com";
  process.env.INTAKE_ALLOWED_ORIGINS = "https://traffic.example.com";
  let sendRequest;
  global.fetch = async (url, options) => { sendRequest = { url, options }; return { ok: true }; };
  const request = { method: "POST", headers: { origin: "https://traffic.example.com", "content-type": "application/json", "x-forwarded-for": "203.0.113.10" }, body: { name: "Jane Driver", phone: "804-555-0100", email: "jane@example.com", charge: "Reckless driving", court: "Richmond", consent: true, page: "/contact.html" } };
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
  assert.equal(sendRequest.url, "https://api.resend.com/emails");
  const email = JSON.parse(sendRequest.options.body);
  assert.deepEqual(email.to, ["website@avodahlegal.com"]);
  assert.match(email.subject, /^\[Avodah Traffic website\]/);
  assert.match(email.html, /Avodah Traffic — avodahtraffic\.com/);
  assert.equal(email.reply_to, "jane@example.com");
  global.fetch = previousFetch;
  for (const [key, value] of Object.entries({ RESEND_API_KEY: previousEnv.key, INTAKE_FROM: previousEnv.from, INTAKE_RECIPIENTS: previousEnv.recipients, INTAKE_ALLOWED_ORIGINS: previousEnv.origins })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
