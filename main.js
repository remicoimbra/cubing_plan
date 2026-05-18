// ─────────────────────────────────────────────
//  Cubing Practice Plan Generator – main.js
//  Generates a weekly schedule based on user
//  priorities and exports it as a PDF.
// ─────────────────────────────────────────────

// ── 1. DRILL LIBRARY ──────────────────────────
// Each drill has a focus area, difficulty tier,
// a short description, and estimated duration.

const DRILLS = {
  lookahead: [
    {
      name: "Slow solves",
      desc: "Solve without a single pause : try to predict your next steps. Do not time yourself and solve as slowly as needed !",
      duration: 30,
      tip: "Use a metronome app to keep a steady, deliberate pace.",
    },
    {
      name: "Blindfolded steps",
      desc: "Do each of these steps with your eyes closed : cross+1, F2L 2&3, F2L 4 + EO, OLL, PLL.",
      duration: 15,
      tip: "Take as much time as you want for each step, the goal is to success.",
    },
    {
      name: "Metronome solves",
      desc: "Turn the cube at each BPM of your metronome while keeping your solutions optimal.",
      duration: 10,
      tip: "Increase the BPM by a little bit every practice session.",
    },
    {
      name: "Big cubes",
      desc: "Solve big cubes, there are a lot of pieces to look for, so when you go back to 3x3 looking ahead feels easier.",
      duration: 20,
      tip: "You can use any big cube, from 4x4 to 7x7.",
    },
  ],

  inspection: [
    {
      name: "Cross +1",
      desc: "Predict your cross and first F2L pair, then solve them blindfolded.",
      duration: 20,
      tip: "Don't time yourself ! Take as much time as needed.",
    },
    {
      name: "Corss +2",
      desc: "Predict your cross and two F2L pairs, then solve them blindfolded.",
      duration: 20,
      tip: "Don't time yourself ! Take as much time as needed.",
    },
  ],

  turning: [
    {
      name: "PLL Time Attacks",
      desc: "Train your PLL time attack, turn as accurate as possible.",
      duration: 10,
      tip: "Keep your turning clean. Once you feel comfortable, increase your turning speed.",
    },
    {
      name: "OLL Time Attacks",
      desc: "Train your OLL time attack, turn as accurate as possible.",
      duration: 10,
      tip: "Keep your turning clean. Once you feel comfortable, increase your turning speed.",
    },
    {
      name: "Burst turning",
      desc: "Do untimed solves where you turn as fast as possible, pause between every step in your solve.",
      duration: 10,
      tip: "Keep your turning clean. Once you feel comfortable, increase your turning speed.",
    },
  ],

  algorithms: [
    {
      name: "Learn ZBLL",
      desc: "Learn 3 ZBLL algorithms.",
      duration: 25,
      tip: "Check Juliette Sébastien's Google sheet and practice on bestsiteever.net.",
    },
    {
      name: "Review ZBLL",
      desc: "Review ZBLL algorithms you learned recently.",
      duration: 20,
      tip: "Check Juliette Sébastien's Google sheet and practice on bestsiteever.net.",
    },
    {
      name: "Fix your algorithms",
      desc: "Change your bad algorithms : learn optimal ones.",
      duration: 15,
      tip: "Use the same algorithms as world class speedcubers.",
    },
  ],

  solutions: [
    {
      name: "Watch example solves.",
      desc: "Analyze solutions from world class cubers.",
      duration: 10,
      tip: "You can find example solves on YouTube.",
    },
    {
      name: "Untimed solves",
      desc: "Think of every turn you make, be as efficient as possible.",
      duration: 20,
      tip: "Don't be afraid to try new stuff !",
    },
  ],
};

// ── 2. SCHEDULE BUILDER ────────────────────────

/** Round a minute value to the nearest 5 */
const round5 = (n) => Math.round(n / 5) * 5;

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Builds a weekly schedule based on per-day budgets and priorities.
 *
 * @param {Object} priorities   – { lookahead, inspection, turning, algorithms, solutions }
 * @param {Object} dayBudgets   – { Monday: 60, Wednesday: 45, ... } (minutes, only active days)
 * @returns {Object[]}          – array of day objects with assigned drills
 */
function buildSchedule(priorities, dayBudgets) {
  // Preserve canonical week order, only include days with time > 0
  const days = DAY_ORDER.filter((d) => (dayBudgets[d] || 0) > 0);

  if (days.length === 0) return [];

  // ── Assign ONE skill area per day ──────────────────────────────────────
  const areas = Object.keys(priorities);
  const sortedAreas = [...areas].sort((a, b) => priorities[b] - priorities[a]);

  // Group low-priority skills (priority < 3) together — they share a day
  const HIGH_THRESHOLD = 3;
  const highAreas = sortedAreas.filter((a) => priorities[a] >= HIGH_THRESHOLD);
  const lowAreas = sortedAreas.filter((a) => priorities[a] < HIGH_THRESHOLD);

  // Build the list of "slots": each high area gets its own slot; all low areas share one
  const slots = [...highAreas.map((a) => [a])];
  if (lowAreas.length > 0) slots.push(lowAreas);

  // Sort days: days with the most time first (they get the most important skills)
  const sortedDays = [...days].sort(
    (a, b) => (dayBudgets[b] || 0) - (dayBudgets[a] || 0),
  );

  // If more slots than days: merge the last N slots into the last day
  while (slots.length > sortedDays.length) {
    const last = slots.pop();
    slots[slots.length - 1].push(...last);
  }

  // Map each day (sorted by time desc) to a skill slot
  const daySkillMap = {};
  sortedDays.forEach((day, i) => {
    daySkillMap[day] = slots[i % slots.length];
  });

  // Skills with priority 5 get a short bonus drill on days where they're NOT the main focus
  const BONUS_THRESHOLD = 5;
  const BONUS_MIN = 10;
  const BONUS_DAY_MIN_BUDGET = 60;
  const bonusAreas = sortedAreas.filter(
    (a) => priorities[a] >= BONUS_THRESHOLD,
  );

  // ── ZBLL duration table (scaled by priority, shared by Review and Learn) ──
  // priority 1 → 0 min (skip), 2 → 5 min, 3 → 10 min, 4 → 15 min, 5 → 20 min
  const ZBLL_MINUTES = { 1: 0, 2: 5, 3: 10, 4: 15, 5: 20 };
  const zbllMin = ZBLL_MINUTES[priorities.algorithms] ?? 0;

  const reviewDrill = DRILLS.algorithms.find((d) => d.name === "Review ZBLL");
  const learnDrill = DRILLS.algorithms.find((d) => d.name === "Learn ZBLL");

  // ── How many "Learn ZBLL" sessions to spread across the week ──────────
  // ≤3 training days → 1 session, 4–6 → 2 sessions, 7 → 3 sessions
  const learnZbllCount = days.length === 7 ? 3 : days.length >= 4 ? 2 : 1;

  // Assign Learn ZBLL to the days with the most available time (sortedDays is already sorted desc)
  const learnZbllDays = new Set(
    sortedDays.slice(0, learnZbllCount).map((d) => d),
  );

  // ── Review ZBLL frequency based on priority ────────────────────────────
  // priority <= 3 → every other day (dayIndex % 2 === 0)
  // priority >= 4 → every day
  const reviewEveryDay = priorities.algorithms >= 4;

  // ── Build sessions per day (in canonical week order) ──────────────────
  const schedule = days.map((day, dayIndex) => {
    const budget = dayBudgets[day];
    const classicMinutes = round5(budget * 0.5);

    const hasLearnZbll = learnZbllDays.has(day) && zbllMin >= 5 && learnDrill;
    const hasReviewZbll =
      zbllMin >= 5 && reviewDrill && (reviewEveryDay || dayIndex % 2 === 0);

    // Reserve ZBLL time upfront
    const zbllReserved =
      (hasReviewZbll ? zbllMin : 0) + (hasLearnZbll ? zbllMin : 0);
    const drillBudget = budget - classicMinutes - zbllReserved;

    const areaList = daySkillMap[day];
    const sessions = [];

    // ── Inject Learn ZBLL (on selected days, before Review) ─────────────
    if (hasLearnZbll) {
      sessions.push({
        area: "algorithms",
        drill: learnDrill.name,
        desc: learnDrill.desc,
        tip: learnDrill.tip,
        minutes: zbllMin,
      });
    }

    // ── Inject Review ZBLL (every day if priority >= 4, else every other day) ──
    if (hasReviewZbll) {
      sessions.push({
        area: "algorithms",
        drill: reviewDrill.name,
        desc: reviewDrill.desc,
        tip: reviewDrill.tip,
        minutes: zbllMin,
      });
    }

    // Bonus areas = priority-5 skills not already the focus today
    const bonusAreasForDay =
      budget >= BONUS_DAY_MIN_BUDGET
        ? bonusAreas.filter((a) => !areaList.includes(a))
        : [];
    const bonusBudgetTotal = bonusAreasForDay.length * BONUS_MIN;

    // Main skill budget after reserving bonus slots
    const mainDrillBudget = drillBudget - bonusBudgetTotal;
    const perAreaBudget = round5(mainDrillBudget / areaList.length);

    areaList.forEach((area, areaIdx) => {
      let remaining = perAreaBudget;
      // Exclude all ZBLL drills from the algorithms pool (already handled above)
      let drillPool =
        area === "algorithms"
          ? DRILLS[area].filter(
              (d) => d.name !== "Learn ZBLL" && d.name !== "Review ZBLL",
            )
          : DRILLS[area];

      let drillIdx = (dayIndex + areaIdx) % (drillPool.length || 1);
      let added = 0;
      while (remaining >= 5 && added < drillPool.length) {
        const drill = drillPool[drillIdx % drillPool.length];
        const allocatedMin = round5(Math.min(drill.duration, remaining));
        if (allocatedMin >= 5) {
          sessions.push({
            area,
            drill: drill.name,
            desc: drill.desc,
            tip: drill.tip,
            minutes: allocatedMin,
          });
          remaining -= allocatedMin;
        }
        drillIdx++;
        added++;
      }
    });

    // ── Bonus drills for priority-5 skills ──────────────────────────────
    bonusAreasForDay.forEach((area, bonusIdx) => {
      // Skip bonus for algorithms — ZBLL is already handled above
      if (area === "algorithms") return;
      const drillPool = DRILLS[area];
      const drill = drillPool[(dayIndex + bonusIdx + 2) % drillPool.length];
      sessions.push({
        area,
        drill: drill.name,
        desc: drill.desc,
        tip: drill.tip,
        minutes: BONUS_MIN,
        isBonus: true,
      });
    });

    // ── Classic solves block (always last) ──────────────────────────────
    sessions.push({
      area: "classic",
      drill: "Timed solves",
      desc: "Do timed solves as you normally would in a session. Focus on applying everything you\'ve worked on today.",
      tip: "Film some of your solves and note what caused your worst times.",
      minutes: classicMinutes,
    });

    return {
      day,
      sessions,
      totalMinutes: budget,
    };
  });

  return schedule;
}

// ── 3. AREA FORMATTING HELPERS ────────────────

const AREA_LABELS = {
  classic: "Classic Solves",
  lookahead: "Look Ahead",
  inspection: "Inspection",
  turning: "Turning Speed",
  algorithms: "Algorithms",
  solutions: "Solutions",
};

const AREA_COLORS = {
  classic: "#FFA552",
  lookahead: "#FF99C8",
  inspection: "#FCF6BD",
  turning: "#D0F4DE",
  algorithms: "#A9DEF9",
  solutions: "#E4C1F9",
};

function areaLabel(key) {
  return AREA_LABELS[key] || key;
}

// ── 4. HTML PREVIEW RENDERER ──────────────────

function renderPreview(schedule, priorities, totalMinutes) {
  const container = document.getElementById("resultat-planning");
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Sort areas by priority for the summary
  const sortedAreas = Object.entries(priorities)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, value: v }));

  let html = `
    <div class="plan-preview">
      <div class="plan-header">
        <h2>Your Weekly Cubing Plan</h2>
        <p class="plan-meta">${schedule.length} training day${schedule.length > 1 ? "s" : ""} &bull; ${totalHours}h / week</p>
        <button id="toggle-details-btn" class="toggle-details-btn">Hide details</button>
      </div>

      <div class="priority-summary">
        <h3>Focus Areas</h3>
        <div class="priority-bars">
          ${sortedAreas
            .map(
              ({ key, value }) => `
            <div class="priority-row">
              <span class="priority-label">${areaLabel(key)}</span>
              <div class="priority-bar-track">
                <div class="priority-bar-fill" style="width:${(value / 5) * 100}%; background:${AREA_COLORS[key]}"></div>
              </div>
              <span class="priority-value">${value}/5</span>
            </div>`,
            )
            .join("")}
        </div>
      </div>

      <div class="week-grid">
        ${schedule
          .map(
            ({ day, sessions, totalMinutes: dayMin }) => `
          <div class="day-card">
            <div class="day-header">
              <span class="day-name">${day}</span>
              <span class="day-time">${dayMin} min</span>
            </div>
            <div class="session-list">
              ${sessions
                .map(
                  (s) => `
                <div class="session-item">
                  <div class="session-top">
                    <span class="session-tag" style="background:var(--bg); border: 1px solid ${AREA_COLORS[s.area]}; color:${AREA_COLORS[s.area]}">${areaLabel(s.area)}</span>
                    <span class="session-duration">${s.minutes} min</span>
                  </div>
                  <div class="session-name">${s.drill}</div>
                  <div class="session-details">
                    <div class="session-desc">${s.desc}</div>
                    <div class="session-tip">-> Tip : ${s.tip}</div>
                  </div>
                </div>`,
                )
                .join("")}
            </div>
          </div>`,
          )
          .join("")}
      </div>

      <button id="download-pdf-btn" class="download-btn" title="Download your planning as a PDF">
        ⬇ Download as PDF
      </button>
    </div>
  `;

  container.innerHTML = html;
  container.scrollIntoView({ behavior: "smooth" });

  // ── Toggle show/hide details ──
  const toggleBtn = document.getElementById("toggle-details-btn");
  let detailsVisible = true;
  toggleBtn.addEventListener("click", () => {
    detailsVisible = !detailsVisible;
    document.querySelectorAll(".session-details").forEach((el) => {
      el.style.display = detailsVisible ? "" : "none";
    });
    toggleBtn.textContent = detailsVisible ? "Hide details" : "Show details";
    toggleBtn.classList.toggle("collapsed", !detailsVisible);
  });

  document
    .getElementById("download-pdf-btn")
    .addEventListener("click", () =>
      generatePDF(schedule, priorities, totalMinutes),
    );
}

// ── 5. PDF GENERATOR ──────────────────────────

async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(script);
  });
}

async function generatePDF(schedule, priorities, totalMinutes) {
  const btn = document.getElementById("download-pdf-btn");
  btn.textContent = "⏳ Generating PDF…";
  btn.disabled = true;

  const totalHours = (totalMinutes / 60).toFixed(1);

  try {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN = 14;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    let y = MARGIN;

    // ── Palette — mirrors styles.css tokens ──
    const COL_BG = [10, 10, 20]; // --bg:      #0a0a14
    const COL_CARD = [28, 28, 46]; // --surface2:#1c1c2e
    const COL_ACCENT = [237, 177, 99]; // --accent:  #edb163
    const COL_TEXT = [226, 232, 240]; // --text:    #e2e8f0
    const COL_WHITE = [226, 232, 240]; // same as --text for body copy

    // ── Helper: new page with dark background ──
    function newPage() {
      doc.addPage();
      doc.setFillColor(...COL_BG);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");
      y = MARGIN;
    }

    function checkPageBreak(needed = 10) {
      if (y + needed > PAGE_H - MARGIN) newPage();
    }

    // ── Cover page ──────────────────────────────
    doc.setFillColor(...COL_BG);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");

    // Decorative top bar
    doc.setFillColor(...COL_ACCENT);
    doc.rect(0, 0, PAGE_W, 3, "F");

    // Title
    y = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...COL_WHITE);
    doc.text("CUBING PRACTICE PLAN", PAGE_W / 2, y, { align: "center" });

    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(...COL_TEXT);
    doc.text(
      `${schedule.length} day${schedule.length > 1 ? "s" : ""}/week  ·  ${totalHours}h/week`,
      PAGE_W / 2,
      y,
      { align: "center" },
    );

    // Priority bars on cover
    y += 22;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COL_ACCENT);
    doc.text("FOCUS AREAS", MARGIN, y);

    y += 7;
    const sortedAreas = Object.entries(priorities).sort((a, b) => b[1] - a[1]);
    const BAR_H = 6;
    const LABEL_W = 38;
    const BAR_W = CONTENT_W - LABEL_W - 16;

    for (const [key, value] of sortedAreas) {
      const [r, g, b] = hexToRgb(AREA_COLORS[key]);
      const fillW = (value / 5) * BAR_W;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...COL_TEXT);
      doc.text(areaLabel(key), MARGIN, y + BAR_H / 2 + 1);

      // Track
      doc.setFillColor(42, 42, 66);
      doc.roundedRect(MARGIN + LABEL_W, y, BAR_W, BAR_H, 2, 2, "F");

      // Fill
      doc.setFillColor(r, g, b);
      if (fillW > 0)
        doc.roundedRect(MARGIN + LABEL_W, y, fillW, BAR_H, 2, 2, "F");

      // Score
      doc.setTextColor(...COL_TEXT);
      doc.text(`${value}/5`, MARGIN + LABEL_W + BAR_W + 3, y + BAR_H / 2 + 1);

      y += BAR_H + 5;
    }

    // Decorative bottom bar
    doc.setFillColor(...COL_ACCENT);
    doc.rect(0, PAGE_H - 3, PAGE_W, 3, "F");

    // ── Day pages ────────────────────────────────
    for (const { day, sessions, totalMinutes: dayMin } of schedule) {
      newPage();

      // Day header strip
      doc.setFillColor(19, 19, 31);
      doc.rect(0, 0, PAGE_W, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...COL_WHITE);
      doc.text(day.toUpperCase(), MARGIN, 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COL_TEXT);
      doc.text(`${dayMin} min total`, PAGE_W - MARGIN, 14, {
        align: "right",
      });

      // Accent line
      doc.setFillColor(...COL_ACCENT);
      doc.rect(MARGIN, 20, CONTENT_W, 0.8, "F");

      y = 28;

      for (const session of sessions) {
        const [r, g, b] = hexToRgb(AREA_COLORS[session.area]);

        // Estimate card height
        const descLines = doc.splitTextToSize(session.desc, CONTENT_W - 10);
        const tipLines = doc.splitTextToSize(
          "Tip: " + session.tip,
          CONTENT_W - 10,
        );
        const cardH = 8 + 5 + descLines.length * 4.5 + tipLines.length * 4 + 6;

        checkPageBreak(cardH + 6);

        // Card background
        doc.setFillColor(...COL_CARD);
        doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 3, 3, "F");

        // Left accent strip
        doc.setFillColor(r, g, b);
        doc.roundedRect(MARGIN, y, 3, cardH, 1.5, 1.5, "F");

        // Area tag pill
        const tagX = MARGIN + 7;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(r, g, b);
        doc.text(areaLabel(session.area), tagX, y + 7);

        // Duration
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COL_TEXT);
        doc.text(`${session.minutes} min`, PAGE_W - MARGIN - 5, y + 7, {
          align: "right",
        });

        // Drill name
        y += 11;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COL_WHITE);
        doc.text(session.drill, MARGIN + 7, y + 1);

        // Description
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...COL_TEXT);
        doc.text(descLines, MARGIN + 7, y + 1);
        y += descLines.length * 4.5;

        // Tip
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COL_TEXT);
        doc.text("-> " + tipLines, MARGIN + 7, y + 1);
        y += tipLines.length * 4 + 5;

        y += 4; // gap between cards
      }
    }

    // ── Footer on all pages ──────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COL_TEXT);
      doc.text(
        `Generated by Cubing Practice Plans  ·  Page ${i} of ${pageCount}`,
        PAGE_W / 2,
        PAGE_H - 10,
        { align: "center" },
      );
    }

    doc.save("cubing-practice-plan.pdf");
  } catch (err) {
    console.error(err);
    alert("Error generating PDF. Please try again.");
  } finally {
    btn.textContent = "⬇ Download as PDF";
    btn.disabled = false;
  }
}

// ── 6. UTILITY ────────────────────────────────

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [128, 128, 128];
}

// ── 7. LIVE SLIDER VALUE DISPLAY ──────────────

function initSliderLabels() {
  const sliders = document.querySelectorAll("input[type='range']");
  sliders.forEach((slider) => {
    const badge = document.createElement("span");
    badge.className = "slider-badge";
    badge.textContent = slider.value;
    slider.parentNode.appendChild(badge);

    slider.addEventListener("input", () => {
      badge.textContent = slider.value;
    });
  });
}

// ── 8. DAILY INPUT REST-DAY DIMMING ───────────

function initDailyInputs() {
  const inputs = document.querySelectorAll(".day-minutes");
  inputs.forEach((input) => {
    const row = input.closest(".daily-row");
    const update = () => {
      const val = parseInt(input.value) || 0;
      row.classList.toggle("rest-day", val === 0);
    };
    update();
    input.addEventListener("input", update);
  });
}

// ── 9. FORM SUBMISSION ────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initSliderLabels();
  initDailyInputs();

  const form = document.getElementById("planning-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Read priorities
    const priorities = {
      lookahead: parseInt(document.getElementById("lookahead").value),
      inspection: parseInt(document.getElementById("inspection").value),
      turning: parseInt(document.getElementById("turning").value),
      algorithms: parseInt(document.getElementById("algorithms").value),
      solutions: parseInt(document.getElementById("solutions").value),
    };

    // Read per-day minutes (only days with time > 0)
    const dayBudgets = {};
    let totalMinutes = 0;

    document.querySelectorAll(".day-minutes").forEach((input) => {
      const mins = parseInt(input.value) || 0;
      if (mins > 0) {
        dayBudgets[input.dataset.day] = mins;
        totalMinutes += mins;
      }
    });

    if (Object.keys(dayBudgets).length === 0) {
      alert("Please enter at least one training day with time > 0.");
      return;
    }

    // Build and display
    const schedule = buildSchedule(priorities, dayBudgets);
    renderPreview(schedule, priorities, totalMinutes);
  });
});
