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
      //   desc: "Do each of these steps with your eyes closed : cross; F2L 1, F2L 2, F2L 3, F2L 4, OLL, PLL.",
      duration: 15,
      tip: "Take as much time as you want for each step, the goal is to success.",
    },
    {
      name: "Metronome solves",
      desc: "Turn the cube at each BPM of your metronome while keeping your solutions orptimal.",
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
      name: "Untimed inspection",
      desc: "Predict your cross and your first F2L pair, then solve them blindfolded.",
      //   desc: "Predict your cross, then solve it blindfolded.",
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
      desc: "Do untimed solves where you turn as fast as possible, psause between every steps in your solve.",
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
      tip: "JSP",
    },
  ],
};

// ── 2. SCHEDULE BUILDER ────────────────────────

/**
 * Distributes available hours across selected days,
 * weighted by the user's focus priorities.
 *
 * @param {Object} priorities  – { lookahead, inspection, turning, algorithms, solutions }
 * @param {string[]} days      – selected weekday names
 * @param {number} totalHours  – total weekly practice time in hours
 * @returns {Object[]}         – array of day objects with assigned drills
 */
function buildSchedule(priorities, days, totalHours) {
  const totalMinutes = totalHours * 60;

  const WEEKEND = ["Saturday", "Sunday"];
  const weekendDays = days.filter((d) => WEEKEND.includes(d));
  const weekDays = days.filter((d) => !WEEKEND.includes(d));

  // Weekend days get 2× the time of weekdays
  // totalMinutes = weekDays.length * unit + weekendDays.length * 2 * unit
  const unit =
    totalMinutes / (weekDays.length + weekendDays.length * 2) ||
    totalMinutes / days.length;

  const dayBudgets = {};
  days.forEach((d) => {
    dayBudgets[d] = Math.round(WEEKEND.includes(d) ? unit * 2 : unit);
  });

  // Half the day budget is classic solves, half is skill work
  // ── Assign ONE skill area per day ──────────────────────────────────────
  // Sort areas by priority descending (highest first → gets weekend)
  const areas = Object.keys(priorities);
  const sortedAreas = [...areas].sort((a, b) => priorities[b] - priorities[a]);

  // Group low-priority skills (priority <= 2) together — they share a day
  const HIGH_THRESHOLD = 3;
  const highAreas = sortedAreas.filter((a) => priorities[a] >= HIGH_THRESHOLD);
  const lowAreas = sortedAreas.filter((a) => priorities[a] < HIGH_THRESHOLD);

  // Build the list of "slots": each high area gets its own slot; all low areas share one slot
  // If there are more slots than days, merge the lowest-priority high areas too
  const slots = [...highAreas.map((a) => [a])];
  if (lowAreas.length > 0) slots.push(lowAreas);

  // Sort days: weekend first (they get the most important skills), then weekdays
  const sortedDays = [
    ...days.filter((d) => WEEKEND.includes(d)),
    ...days.filter((d) => !WEEKEND.includes(d)),
  ];

  // If more slots than days: merge the last N slots into the last day
  while (slots.length > sortedDays.length) {
    const last = slots.pop();
    slots[slots.length - 1].push(...last);
  }
  // If fewer slots than days: repeat skills on extra days (cycle)
  const daySkillMap = {}; // day → [area, ...]
  sortedDays.forEach((day, i) => {
    daySkillMap[day] = slots[i % slots.length];
  });

  // Skills with priority 5 get a short bonus drill on days where they're NOT the main focus
  // Only if the day has enough budget (>= 60 min total)
  const BONUS_THRESHOLD = 5;
  const BONUS_MIN = 10;
  const BONUS_DAY_MIN_BUDGET = 60;
  const bonusAreas = sortedAreas.filter(
    (a) => priorities[a] >= BONUS_THRESHOLD,
  );

  // ── Build sessions per day ──────────────────────────────────────────────
  const schedule = days.map((day, dayIndex) => {
    const budget = dayBudgets[day];
    const classicMinutes = Math.round(budget * 0.5);
    let drillBudget = budget - classicMinutes;

    const areaList = daySkillMap[day];
    const sessions = [];

    // Bonus areas = priority-5 skills not already the focus today
    const bonusAreasForDay =
      budget >= BONUS_DAY_MIN_BUDGET
        ? bonusAreas.filter((a) => !areaList.includes(a))
        : [];
    const bonusBudgetTotal = bonusAreasForDay.length * BONUS_MIN;

    // Main skill budget after reserving bonus slots
    const mainDrillBudget = drillBudget - bonusBudgetTotal;
    const perAreaBudget = Math.floor(mainDrillBudget / areaList.length);

    // Determine if this is the last day of the schedule (for ZBLL review)
    const isLastDay = dayIndex === days.length - 1;

    areaList.forEach((area, areaIdx) => {
      let remaining = perAreaBudget;
      let drillPool = DRILLS[area];

      // ZBLL logic: if algorithms is a key focus (priority >= HIGH_THRESHOLD),
      // force "Learn ZBLL" on all days except the last, and "Review ZBLL" on the last day.
      if (area === "algorithms" && priorities.algorithms >= HIGH_THRESHOLD) {
        const learnDrill = DRILLS.algorithms.find(
          (d) => d.name === "Learn ZBLL",
        );
        const reviewDrill = DRILLS.algorithms.find(
          (d) => d.name === "Review ZBLL",
        );
        const zbllDrill = isLastDay ? reviewDrill : learnDrill;

        if (zbllDrill) {
          const allocatedMin = Math.min(zbllDrill.duration, remaining);
          if (allocatedMin >= 5) {
            sessions.push({
              area,
              drill: zbllDrill.name,
              desc: zbllDrill.desc,
              tip: zbllDrill.tip,
              minutes: allocatedMin,
            });
            remaining -= allocatedMin;
          }
          // Fill remaining budget with other algorithms drills (excluding ZBLL ones)
          drillPool = DRILLS.algorithms.filter(
            (d) => d.name !== "Learn ZBLL" && d.name !== "Review ZBLL",
          );
        }
      }

      let drillIdx = (dayIndex + areaIdx) % (drillPool.length || 1);
      let added = 0;
      while (remaining >= 5 && added < drillPool.length) {
        const drill = drillPool[drillIdx % drillPool.length];
        const allocatedMin = Math.min(drill.duration, remaining);
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

    // ── Bonus drills for priority-5 skills (short, different drill than dedicated day) ──
    bonusAreasForDay.forEach((area, bonusIdx) => {
      let drillPool = DRILLS[area];

      // ZBLL logic: bonus algorithms drills obey the same rule
      if (area === "algorithms" && priorities.algorithms >= HIGH_THRESHOLD) {
        drillPool = isLastDay
          ? DRILLS.algorithms.filter((d) => d.name === "Review ZBLL")
          : DRILLS.algorithms.filter((d) => d.name === "Learn ZBLL");
      }

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

    // ── Classic solves block (always last) ──
    sessions.push({
      area: "classic",
      drill: "Timed solves",
      desc: "Do timed solves as you normally would in a session. Focus on applying everything you've worked on today.",
      tip: "Film some of your solves and note what caused your worst times.",
      minutes: classicMinutes,
    });

    return { day, sessions, totalMinutes: budget };
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

function renderPreview(schedule, priorities, totalHours) {
  const container = document.getElementById("resultat-planning");

  // Sort areas by priority for the summary
  const sortedAreas = Object.entries(priorities)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, value: v }));

  let html = `
    <div class="plan-preview">
      <div class="plan-header">
        <h2>Your Weekly Cubing Plan</h2>
        <p class="plan-meta">${schedule.length} training days &bull; ${totalHours} hours/week</p>
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
            ({ day, sessions, totalMinutes }) => `
          <div class="day-card">
            <div class="day-header">
              <span class="day-name">${day}</span>
              <span class="day-time">${totalMinutes} min</span>
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
      generatePDF(schedule, priorities, totalHours),
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

async function generatePDF(schedule, priorities, totalHours) {
  const btn = document.getElementById("download-pdf-btn");
  btn.textContent = "⏳ Generating PDF…";
  btn.disabled = true;

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

    // ── Palette ──
    const COL_BG = [10, 10, 20];
    const COL_CARD = [24, 24, 40];
    const COL_ACCENT = [99, 179, 237];
    const COL_TEXT = [230, 230, 240];
    const COL_MUTED = [140, 140, 170];
    const COL_WHITE = [255, 255, 255];

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
    doc.setTextColor(...COL_MUTED);
    doc.text(
      `${schedule.length} days/week  ·  ${totalHours} hour${totalHours > 1 ? "s" : ""}/week`,
      PAGE_W / 2,
      y,
      { align: "center" },
    );

    // Priority bars on cover
    y += 22;
    doc.setFontSize(11);
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

      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COL_TEXT);
      doc.text(areaLabel(key), MARGIN, y + BAR_H / 2 + 1);

      // Track
      doc.setFillColor(40, 40, 60);
      doc.roundedRect(MARGIN + LABEL_W, y, BAR_W, BAR_H, 2, 2, "F");

      // Fill
      doc.setFillColor(r, g, b);
      if (fillW > 0)
        doc.roundedRect(MARGIN + LABEL_W, y, fillW, BAR_H, 2, 2, "F");

      // Score
      doc.setTextColor(...COL_MUTED);
      doc.text(`${value}/5`, MARGIN + LABEL_W + BAR_W + 3, y + BAR_H / 2 + 1);

      y += BAR_H + 5;
    }

    // Decorative bottom bar
    doc.setFillColor(...COL_ACCENT);
    doc.rect(0, PAGE_H - 3, PAGE_W, 3, "F");

    // ── Day pages ────────────────────────────────
    for (const { day, sessions, totalMinutes } of schedule) {
      newPage();

      // Day header strip
      doc.setFillColor(30, 30, 50);
      doc.rect(0, 0, PAGE_W, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...COL_WHITE);
      doc.text(day.toUpperCase(), MARGIN, 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COL_MUTED);
      doc.text(`${totalMinutes} min total`, PAGE_W - MARGIN, 14, {
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
        doc.setFillColor(24, 24, 40);
        doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 3, 3, "F");

        // Left accent strip
        doc.setFillColor(r, g, b);
        doc.roundedRect(MARGIN, y, 3, cardH, 1.5, 1.5, "F");

        // Area tag pill
        const tagX = MARGIN + 7;
        const tagW = doc.getTextWidth(areaLabel(session.area)) + 6;
        doc.setFillColor(r, g, b, 0.2);
        doc.setFillColor(r * 0.3, g * 0.3, b * 0.3);
        doc.roundedRect(tagX, y + 3, tagW, 5, 1.5, 1.5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(r, g, b);
        doc.text(areaLabel(session.area), tagX + 3, y + 7);

        // Duration
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COL_MUTED);
        doc.text(`${session.minutes} min`, PAGE_W - MARGIN - 2, y + 7, {
          align: "right",
        });

        // Drill name
        y += 11;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COL_WHITE);
        doc.text(session.drill, MARGIN + 7, y);

        // Description
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...COL_TEXT);
        doc.text(descLines, MARGIN + 7, y);
        y += descLines.length * 4.5;

        // Tip
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...COL_MUTED);
        doc.text(tipLines, MARGIN + 7, y + 1);
        y += tipLines.length * 4 + 5;

        y += 4; // gap between cards
      }
    }

    // ── Footer on all pages ──────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COL_MUTED);
      doc.text(
        `Generated by Cubing Practice Plans  ·  Page ${i} of ${pageCount}`,
        PAGE_W / 2,
        PAGE_H - 5,
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
    // Create a live value badge next to each slider
    const badge = document.createElement("span");
    badge.className = "slider-badge";
    badge.textContent = slider.value;
    slider.parentNode.appendChild(badge);

    slider.addEventListener("input", () => {
      badge.textContent = slider.value;
    });
  });
}

// ── 8. FORM SUBMISSION ────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initSliderLabels();

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

    // Read selected days (preserve week order)
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const checkedDays = Array.from(
      document.querySelectorAll(".day:checked"),
    ).map((cb) => cb.value);
    const days = dayOrder.filter((d) => checkedDays.includes(d));

    if (days.length === 0) {
      alert("Please select at least one training day.");
      return;
    }

    // Read total hours
    const totalHours = parseFloat(
      document.getElementById("practicetime").value,
    );
    if (isNaN(totalHours) || totalHours <= 0) {
      alert("Please enter a valid number of practice hours.");
      return;
    }

    // Build and display
    const schedule = buildSchedule(priorities, days, totalHours);
    renderPreview(schedule, priorities, totalHours);
  });
});
