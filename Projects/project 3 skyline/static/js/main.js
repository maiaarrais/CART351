// static/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------
  // Questionnaire state
  // ---------------------------
  const state = {
    category: null,
    goal: "",
    change_needed: "",
    confidence: null,
  };

  // Steps
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const step3 = document.getElementById("step-3");
  const step4 = document.getElementById("step-4");

  const toStep2Btn = document.getElementById("to-step-2");
  const toStep3Btn = document.getElementById("to-step-3");
  const toStep4Btn = document.getElementById("to-step-4");
  const submitEntryBtn = document.getElementById("submit-entry");

  const categoryButtons = document.querySelectorAll("#category-choices button");
  const confidenceButtons = document.querySelectorAll("#confidence-choices button");

  const goalInput = document.getElementById("goal-input");
  const changeInput = document.getElementById("change-input");

  const questionnaireSection = document.getElementById("questionnaire-section");
  const confirmationSection = document.getElementById("confirmation-section");
  const citySection = document.getElementById("city-section");
  const viewCityBtn = document.getElementById("view-city-btn");

  // ---------------------------
  // Step 1: Category selection
  // ---------------------------
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.category = btn.getAttribute("data-category");
      toStep2Btn.disabled = false;
    });
  });

  toStep2Btn.addEventListener("click", () => {
    showStep(2);
  });

  // ---------------------------
  // Step 2: Goal
  // ---------------------------
  toStep3Btn.addEventListener("click", () => {
    state.goal = goalInput.value.trim();
    showStep(3);
  });

  // ---------------------------
  // Step 3: Change needed
  // ---------------------------
  toStep4Btn.addEventListener("click", () => {
    state.change_needed = changeInput.value.trim();
    showStep(4);
  });

  // ---------------------------
  // Step 4: Confidence
  // ---------------------------
  confidenceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      confidenceButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.confidence = parseInt(btn.getAttribute("data-conf"), 10);
      submitEntryBtn.disabled = false;
    });
  });

  submitEntryBtn.addEventListener("click", async () => {
    if (!state.category || !state.confidence) return;

    const payload = {
      category: state.category,
      goal: state.goal,
      change_needed: state.change_needed,
      confidence: state.confidence,
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Submit failed");
        return;
      }

      // After success, show confirmation
      questionnaireSection.classList.add("hidden");
      confirmationSection.classList.remove("hidden");
    } catch (err) {
      console.error("Error submitting entry:", err);
    }
  });

  // ---------------------------
  // Back buttons
  // ---------------------------
  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const backStep = parseInt(btn.getAttribute("data-back"), 10);
      showStep(backStep);
    });
  });

  function showStep(stepNumber) {
    [step1, step2, step3, step4].forEach((step) => step.classList.add("hidden"));
    if (stepNumber === 1) step1.classList.remove("hidden");
    if (stepNumber === 2) step2.classList.remove("hidden");
    if (stepNumber === 3) step3.classList.remove("hidden");
    if (stepNumber === 4) step4.classList.remove("hidden");
  }

  // ---------------------------
  // City view
  // ---------------------------
  viewCityBtn.addEventListener("click", () => {
    confirmationSection.classList.add("hidden");
    citySection.classList.remove("hidden");
    loadCityData();
  });

  async function loadCityData() {
    try {
      const res = await fetch("/api/stats");
      const stats = await res.json();
      renderSkyline(stats);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }

  function renderSkyline(stats) {
    const buildings = document.querySelectorAll(".building");
    const tooltip = document.getElementById("tooltip");

    buildings.forEach((building) => {
      const category = building.getAttribute("data-category");
      const data = stats[category];

      const grid = building.querySelector(".windows-grid");
      grid.innerHTML = ""; // clear old content

      const recentEntries = data.recent_entries || [];
      const tooltipEntries = data.tooltip_entries || [];
      const avgConf = data.avg_confidence_recent || 0;

      // we know we want a 6x6 grid => 36 windows
      const totalWindows = 36;
      const numLit = Math.min(recentEntries.length, totalWindows);

      for (let i = 0; i < totalWindows; i++) {
        const win = document.createElement("div");
        win.classList.add("window-cell");

        if (i < numLit) {
          const entry = recentEntries[i];
          const conf = entry.confidence || 0;
          win.classList.add("lit");
          win.setAttribute("data-confidence", conf.toString());
        }
        grid.appendChild(win);
      }

      // Hover for tooltip (building-level, not per window)
      building.addEventListener("mouseenter", () => {
        const html = buildTooltipHTML(building, tooltipEntries, avgConf);
        tooltip.innerHTML = html;
        tooltip.classList.remove("hidden");

        const rect = building.getBoundingClientRect();
        tooltip.style.left = rect.left + window.scrollX + "px";
        tooltip.style.top = rect.top + window.scrollY - 10 + "px";
      });

      building.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });
    });
  }

  function buildTooltipHTML(buildingEl, entries, avgConf) {
    const name = buildingEl.querySelector(".building-name").textContent || "";
    const goals = entries.map((e) => e.goal).filter((g) => g);
    const changes = entries.map((e) => e.change_needed).filter((c) => c);

    let html = `<strong>${name}</strong><br>`;
    if (avgConf) {
      html += `Avg. confidence: ${avgConf.toFixed(1)} / 5<br><br>`;
    }

    if (goals.length) {
      html += `<em>Goals this week:</em><br>`;
      goals.forEach((g) => {
        html += `• ${g}<br>`;
      });
      html += `<br>`;
    }

    if (changes.length) {
      html += `<em>Changes people want to make:</em><br>`;
      changes.forEach((c) => {
        html += `• ${c}<br>`;
      });
    }

    return html;
  }
});
