// ============================================================
// Config
// ============================================================
const API_URL = "http://127.0.0.1:3000/predict";

// Fields that must be sent as numbers (int or float) rather than strings.
// Matches the StudentData Pydantic model exactly.
const NUMERIC_FIELDS = new Set([
  "age",
  "avg_daily_usage_hours",
  "daily_unlocks",
  "study_hours",
  "physical_activity_hours",
  "sleep_hours_per_night",
]);

const form = document.getElementById("assessment-form");
const submitBtn = document.getElementById("submit-btn");
const submitStatus = document.getElementById("submit-status");
const resultCard = document.getElementById("result-card");
const resultScore = document.getElementById("result-score");
const errorCard = document.getElementById("error-card");
const errorTitle = document.getElementById("error-title");
const errorCopy = document.getElementById("error-copy");
const resetBtn = document.getElementById("reset-btn");

// ============================================================
// Helpers
// ============================================================

/** Clear all inline field errors and invalid styling. */
function clearFieldErrors() {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

/** Show an inline error under a specific field. */
function setFieldError(fieldName, message) {
  const input = form.elements[fieldName];
  const errorEl = document.getElementById(`${fieldName}-error`);
  if (input) input.classList.add("invalid");
  if (errorEl) errorEl.textContent = message;
}

/** Hide both the result and error panels. */
function hidePanels() {
  resultCard.hidden = true;
  errorCard.hidden = true;
}

/** Show the friendly error panel with a given title/message. */
function showError(title, message) {
  errorTitle.textContent = title;
  errorCopy.textContent = message;
  errorCard.hidden = false;
  errorCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Toggle the submit button's loading appearance. */
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("loading", isLoading);
  submitStatus.textContent = isLoading ? "Please keep this tab open. Waking up the AI… This may take a few seconds." : "";
}

/**
 * Runs simple client-side validation matching the backend's constraints,
 * so obviously invalid input never reaches the API.
 */
function validateForm(values) {
  const errors = {};

  if (!(values.age >= 10 && values.age <= 100)) {
    errors.age = "Enter an age between 10 and 100.";
  }
  if (!values.gender) errors.gender = "Please select a gender.";
  if (!values.country.trim()) errors.country = "Please enter a country.";
  if (!values.academic_level) errors.academic_level = "Please select an academic level.";
  if (!values.most_used_platform) errors.most_used_platform = "Please select a platform.";
  if (!values.purpose_of_use) errors.purpose_of_use = "Please select a purpose.";

  if (!(values.avg_daily_usage_hours >= 0 && values.avg_daily_usage_hours <= 24)) {
    errors.avg_daily_usage_hours = "Enter a value between 0 and 24 hours.";
  }
  if (!(values.daily_unlocks >= 0)) {
    errors.daily_unlocks = "Enter a value of 0 or more.";
  }
  if (!(values.study_hours >= 0 && values.study_hours <= 24)) {
    errors.study_hours = "Enter a value between 0 and 24 hours.";
  }
  if (!(values.physical_activity_hours >= 0 && values.physical_activity_hours <= 24)) {
    errors.physical_activity_hours = "Enter a value between 0 and 24 hours.";
  }
  if (!(values.sleep_hours_per_night >= 0 && values.sleep_hours_per_night <= 24)) {
    errors.sleep_hours_per_night = "Enter a value between 0 and 24 hours.";
  }
  if (!values.stress_level) errors.stress_level = "Please select a stress level.";

  return errors;
}

/** Reads the form into a plain object with correctly typed values. */
function readFormValues() {
  const formData = new FormData(form);
  const values = {};
  for (const [key, rawValue] of formData.entries()) {
    values[key] = NUMERIC_FIELDS.has(key) ? Number(rawValue) : rawValue;
  }
  // Ensure every expected key exists even if left blank, so validation
  // catches missing fields instead of throwing on undefined.
  for (const field of form.elements) {
    if (!field.name || field.name in values) continue;
    values[field.name] = NUMERIC_FIELDS.has(field.name) ? NaN : "";
  }
  return values;
}

/** Turns a FastAPI/Pydantic 422 error body into field-level messages. */
function applyBackendValidationErrors(detail) {
  if (!Array.isArray(detail)) return false;
  let applied = false;
  detail.forEach((issue) => {
    const fieldName = Array.isArray(issue.loc) ? issue.loc[issue.loc.length - 1] : null;
    if (fieldName && document.getElementById(`${fieldName}-error`)) {
      setFieldError(fieldName, issue.msg || "This value isn't valid.");
      applied = true;
    }
  });
  return applied;
}

// ============================================================
// Submit handler
// ============================================================
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFieldErrors();
  hidePanels();

  const values = readFormValues();
  const clientErrors = validateForm(values);

  if (Object.keys(clientErrors).length > 0) {
    Object.entries(clientErrors).forEach(([field, message]) => setFieldError(field, message));
    const firstField = Object.keys(clientErrors)[0];
    document.getElementById(firstField)?.focus();
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      // Response wasn't valid JSON; body stays null and is handled below.
    }

    if (response.status === 422 && body?.detail) {
      const applied = applyBackendValidationErrors(body.detail);
      if (applied) {
        showError(
          "Please check the highlighted fields",
          "The prediction server rejected some of your answers. See the notes below each field."
        );
      } else {
        showError(
          "We couldn't validate your answers",
          "The prediction server rejected the request. Please review your entries and try again."
        );
      }
      return;
    }

    if (response.status >= 400 && response.status < 500) {
      showError(
        "We couldn't process that request",
        "The prediction server didn't accept these answers. Please review the form and try again."
      );
      return;
    }

    if (response.status >= 500) {
      showError(
        "The prediction server had a problem",
        "Something went wrong on the server while calculating your score. Please try again in a moment."
      );
      return;
    }

    if (!response.ok || !body || typeof body.predicted_mental_health_score !== "number") {
      showError(
        "Unexpected response",
        "The prediction server responded in a way we didn't expect. Please try again."
      );
      return;
    }

    resultScore.textContent = body.predicted_mental_health_score.toFixed(2);
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
    form.hidden = true;
  } catch (networkError) {
    showError(
      "Unable to connect to the prediction server",
      "Please make sure the FastAPI backend is running at 127.0.0.1:2200, then try again."
    );
  } finally {
    setLoading(false);
  }
});

// ============================================================
// Reset
// ============================================================
resetBtn.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  clearFieldErrors();
  hidePanels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});
