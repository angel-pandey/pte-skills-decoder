// PTE Skills Profile Decoder - Core Logic

// Subskill details matching example.json
const SUBSKILLS_METADATA = {
    1: { name: "Open Response Speaking and Writing (ORSW)", description: "Giving your own spoken or written response" },
    2: { name: "Reproducing Spoken and Written Language (RSWL)", description: "Repeating or copying spoken or written information" },
    3: { name: "Extended Writing (EW)", description: "Giving a long written response" },
    4: { name: "Short Writing (SW)", description: "Giving a short written response" },
    5: { name: "Extended Speaking (ES)", description: "Giving a long spoken response" },
    6: { name: "Short Speaking (SS)", description: "Giving a short spoken response" },
    7: { name: "Multiple-skills Comprehension (MSC)", description: "Using more than one skill (eg listening to a clip and then giving a spoken response)" },
    8: { name: "Single-skill Comprehension (SSC)", description: "Using only one skill (eg writing)" }
};

// Mapped subskills reference

// Question mapping based exactly on skills-to-question-type.csv
const QUESTION_MAPPINGS = [
    { name: "Read Aloud", subskills: [2, 6] },
    { name: "Repeat Sentence", subskills: [2, 6, 7] },
    { name: "Describe Image", subskills: [1, 5] },
    { name: "Re-tell Lecture", subskills: [1, 5, 7] },
    { name: "Answer Short Question", subskills: [8] },
    { name: "Summarize Group Discussion", subskills: [1, 5, 7] },
    { name: "Respond to a Situation", subskills: [1, 5, 8] },
    { name: "Summarize Written Text", subskills: [1, 3, 7] },
    { name: "Write Essay", subskills: [1, 3] },
    { name: "Reading & Writing: Fill in the Blanks", subskills: [8] },
    { name: "Multiple Choice, Multiple Answers (Reading)", subskills: [8] },
    { name: "Re-order Paragraphs", subskills: [8] },
    { name: "Reading: Fill in the Blanks", subskills: [8] },
    { name: "Multiple Choice, Single Answer (Reading)", subskills: [8] },
    { name: "Summarize Spoken Text", subskills: [1, 3, 7] },
    { name: "Multiple Choice, Multiple Answers (Listening)", subskills: [8] },
    { name: "Listening: Fill in the Blanks", subskills: [8] },
    { name: "Highlight Correct Summary", subskills: [7] },
    { name: "Multiple Choice, Single Answer (Listening)", subskills: [8] },
    { name: "Select Missing Word", subskills: [8] },
    { name: "Highlight Incorrect Words", subskills: [7] },
    { name: "Write from Dictation", subskills: [2, 4, 7] }
];

// Current State for active score parameters
let hasAnalyzed = false;
let currentScores = {
    overall: 90,
    listening: 90,
    speaking: 90,
    reading: 90,
    writing: 90,
    subskills: {
        1: 90,
        2: 90,
        3: 90,
        4: 90,
        5: 90,
        6: 90,
        7: 90,
        8: 90
    }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initTabs();
    initAccordion();
    initSliders();
    
    // Register service worker for offline PWA support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('Service worker registration failed:', err);
        });
    }
    
    // Attach parsing event
    document.getElementById("btn-analyze-json").addEventListener("click", parseJSONInput);
    document.getElementById("btn-analyze-sliders").addEventListener("click", analyzeSliders);
    document.getElementById("btn-load-sample").addEventListener("click", loadSampleData);
    document.getElementById("btn-load-sample-sliders").addEventListener("click", loadSampleData);
    
    // Render neutral mapping matrix reference table on initial load
    renderMappingMatrix();
});

// Setup Accordion for Guide
function initAccordion() {
    const header = document.querySelector(".accordion-header");
    const content = document.querySelector(".accordion-content");
    
    header.addEventListener("click", () => {
        header.classList.toggle("active");
        content.classList.toggle("show");
    });
}

// Setup Tab Switching
function initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
            
            tab.classList.add("active");
            const paneId = tab.dataset.tab;
            document.getElementById(paneId).classList.add("active");
        });
    });
}

// Sync slider handles with digital numbers and run analysis
function initSliders() {
    const sliders = document.querySelectorAll(".range-input");
    sliders.forEach(slider => {
        const id = slider.dataset.id;
        const valSpan = document.getElementById(`val-sub-${id}`);
        
        slider.addEventListener("input", (e) => {
            const val = parseInt(e.target.value);
            valSpan.textContent = val;
            
            // Apply color classes
            valSpan.className = "slider-value";
            if (val < 88) {
                valSpan.classList.add("low-score");
            } else {
                valSpan.classList.add("high-score");
            }
            
            // Live update the dashboard dynamically in real-time if they have already analyzed once
            if (hasAnalyzed) {
                analyzeSliders(false);
            }
        });
    });
    
    // Live update when overall or communicative numeric inputs change
    const numInputs = document.querySelectorAll(".input-group input");
    numInputs.forEach(input => {
        // Trigger live analysis while typing without resetting the user's cursor/text
        input.addEventListener("input", () => {
            if (hasAnalyzed) {
                analyzeSliders(false);
            }
        });
        
        // Clamp and format the input field when editing is finished (lost focus)
        input.addEventListener("blur", () => {
            const clamp = (val) => Math.max(10, Math.min(90, parseInt(val) || 10));
            input.value = clamp(input.value);
            if (hasAnalyzed) {
                analyzeSliders(false);
            }
        });
    });
}

// Parse Pearson API JSON input
function parseJSONInput() {
    const errorBanner = document.getElementById("json-error-banner");
    const rawText = document.getElementById("json-input").value.trim();
    
    if (!rawText) {
        if (errorBanner) errorBanner.style.display = "block";
        return;
    }
    
    try {
        const data = JSON.parse(rawText);
        
        // Hide error banner on success
        if (errorBanner) errorBanner.style.display = "none";
        
        // Helper to clamp values between 10 and 90
        const clamp = (val) => Math.max(10, Math.min(90, parseInt(val) || 10));
        
        // Extract Communicative & Overall
        currentScores.overall = clamp(data.gseScore);
        currentScores.listening = clamp(data.listening);
        currentScores.speaking = clamp(data.speaking);
        currentScores.reading = clamp(data.reading);
        currentScores.writing = clamp(data.writing);
        
        // Extract Subskills
        if (data.subskills && Array.isArray(data.subskills)) {
            data.subskills.forEach(sub => {
                const subId = sub.subskill;
                if (SUBSKILLS_METADATA[subId]) {
                    currentScores.subskills[subId] = clamp(sub.score);
                }
            });
        }
        
        // Populate inputs so user can see what was loaded
        document.getElementById("score-overall").value = currentScores.overall;
        document.getElementById("score-listening").value = currentScores.listening;
        document.getElementById("score-reading").value = currentScores.reading;
        document.getElementById("score-speaking").value = currentScores.speaking;
        document.getElementById("score-writing").value = currentScores.writing;
        
        // Sync sliders with JSON scores
        for (let i = 1; i <= 8; i++) {
            const slider = document.getElementById(`slider-${i}`);
            const valSpan = document.getElementById(`val-sub-${i}`);
            const score = currentScores.subskills[i];
            
            slider.value = score;
            valSpan.textContent = score;
            valSpan.className = "slider-value";
            if (score < 88) valSpan.classList.add("low-score");
            else valSpan.classList.add("high-score");
        }
        
        renderDashboard();
        
    } catch (e) {
        if (errorBanner) errorBanner.style.display = "block";
        console.error(e);
    }
}

// Read inputs from sliders/boxes manually
// Read inputs from sliders/boxes manually
function analyzeSliders(shouldScroll = true) {
    const clamp = (val) => Math.max(10, Math.min(90, parseInt(val) || 10));
    
    currentScores.overall = clamp(document.getElementById("score-overall").value);
    currentScores.listening = clamp(document.getElementById("score-listening").value);
    currentScores.reading = clamp(document.getElementById("score-reading").value);
    currentScores.speaking = clamp(document.getElementById("score-speaking").value);
    currentScores.writing = clamp(document.getElementById("score-writing").value);
    
    for (let i = 1; i <= 8; i++) {
        const slider = document.getElementById(`slider-${i}`);
        currentScores.subskills[i] = clamp(slider.value);
    }
    
    renderDashboard(shouldScroll);
}

// // Load test sample data (example.json contents)
// Load sample test data (from example scorecard profile)
function loadSampleData() {
    const sample = {
        gseScore: 90,
        listening: 90,
        speaking: 81,
        reading: 90,
        writing: 89,
        subskills: [
            { subskill: 1, name: "Open Response Speaking and Writing", score: 84 },
            { subskill: 2, name: "Reproducing Spoken and Written Language", score: 90 },
            { subskill: 3, name: "Extended Writing", score: 90 },
            { subskill: 4, name: "Short Writing", score: 90 },
            { subskill: 5, name: "Extended Speaking", score: 74 },
            { subskill: 6, name: "Short Speaking", score: 90 },
            { subskill: 7, name: "Multiple-skills Comprehension ", score: 90 },
            { subskill: 8, name: "Single-skill Comprehension", score: 90 }
        ]
    };
    
    document.getElementById("json-input").value = JSON.stringify(sample, null, 4);
    parseJSONInput();
}

// Compute dynamic logic and update dashboard contents
function renderDashboard(shouldScroll = true) {
    // Mark as analyzed to enable colored matrix highlights
    hasAnalyzed = true;
    
    // 1. Reveal Dashboard Panel
    const dashboard = document.getElementById("dashboard-panel");
    dashboard.style.display = "grid";
    
    // Smooth scroll to results
    if (shouldScroll) {
        dashboard.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 2. Render Circular Gauges
    // Overall Gauge calculations (Dasharray max 440)
    const overallCircle = document.getElementById("overall-circle");
    const overallOffset = 440 - (440 * currentScores.overall) / 90;
    overallCircle.style.strokeDashoffset = overallOffset;
    document.getElementById("lbl-overall-score").textContent = currentScores.overall;
    
    // Mini Gauges (Dasharray max 188.4)
    const comms = ["listening", "reading", "speaking", "writing"];
    comms.forEach(comm => {
        const circle = document.getElementById(`circle-${comm}`);
        const offset = 188.4 - (188.4 * currentScores[comm]) / 90;
        circle.style.strokeDashoffset = offset;
        document.getElementById(`lbl-${comm}-score`).textContent = currentScores[comm];
    });
    
    // 3. Render Subskills
    const subskillsContainer = document.getElementById("subskills-container");
    subskillsContainer.innerHTML = "";
    
    for (let i = 1; i <= 8; i++) {
        const score = currentScores.subskills[i];
        const isLow = score < 88;
        const metadata = SUBSKILLS_METADATA[i];
        
        const row = document.createElement("div");
        row.className = "subskill-row";
        row.innerHTML = `
            <div class="subskill-meta">
                <div class="subskill-title-desc">
                    <span class="subskill-title-name">${metadata.name}</span>
                    <span class="subskill-title-desc-text">${metadata.description}</span>
                </div>
                <span class="subskill-numeric-score">
                    ${score}
                    <span class="subskill-badge ${isLow ? 'badge-low' : 'badge-high'}">${isLow ? 'Low' : 'High'}</span>
                </span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill ${isLow ? 'fill-low' : 'fill-high'}" style="width: ${((score - 10) / 80) * 100}%"></div>
            </div>
        `;
        subskillsContainer.appendChild(row);
    }
    
    // 4. Run Deduction Engine
    // Determine status: Score < 88 is LOW, >= 88 is HIGH
    const getStatus = (subskillId) => currentScores.subskills[subskillId] < 88 ? "LOW" : "HIGH";
    
    const statusMap = {
        open_response_speaking_and_writing: getStatus(1),
        reproducing_spoken_and_written_language: getStatus(2),
        extended_writing: getStatus(3),
        short_writing: getStatus(4),
        extended_speaking: getStatus(5),
        short_speaking: getStatus(6),
        multiple_skills_comprehension: getStatus(7),
        single_skill_comprehension: getStatus(8)
    };
    
    const insightsContainer = document.getElementById("deductions-container");
    const insightsPanel = document.getElementById("insights-panel");
    insightsContainer.innerHTML = "";
    
    let triggeredRules = [];
    
    // --- Specific Isolation Rules ---
    let rsIsolating = false;
    let wfdIsolating = false;
    let esIsolating = false;
    let ewIsolating = false;
    
    // Deduction Rule 1: ISOLATE_READ_ALOUD_REPEAT_SENTENCE
    if (statusMap.short_writing === "HIGH" && statusMap.reproducing_spoken_and_written_language === "LOW") {
        triggeredRules.push({
            name: "Isolate Read Aloud & Repeat Sentence",
            deduction: "Since Short Writing is strong (>= 88) but Reproducing Spoken and Written Language is low (< 88), the performance deficiency is mathematically isolated to speaking reproduction tasks.",
            targets: ["Read Aloud", "Repeat Sentence"]
        });
        rsIsolating = true;
    }
    
    // Deduction Rule 2: ISOLATE_WRITE_FROM_DICTATION
    if (statusMap.short_speaking === "HIGH" && statusMap.reproducing_spoken_and_written_language === "LOW") {
        triggeredRules.push({
            name: "Isolate Write from Dictation",
            deduction: "Since Short Speaking is strong (>= 88) but Reproducing Spoken and Written Language is low (< 88), the performance deficiency is mathematically isolated to written transcription tasks.",
            targets: ["Write from Dictation"]
        });
        wfdIsolating = true;
    }
    
    // Deduction Rule 3: ISOLATE_DESCRIBE_IMAGE_RESPOND_SITUATION
    if (statusMap.multiple_skills_comprehension === "HIGH" && statusMap.extended_speaking === "LOW") {
        triggeredRules.push({
            name: "Isolate Describe Image & Respond to a Situation",
            deduction: "Since Multiple-skills Comprehension is strong (>= 88) but Extended Speaking is low (< 88), the deficiency is mapped to single-skill spoken production tasks.",
            targets: ["Describe Image", "Respond to a Situation"]
        });
        esIsolating = true;
    }
    
    // Deduction Rule 4: ISOLATE_EXTENDED_WRITING_STRUCTURES
    if (statusMap.short_writing === "HIGH" && statusMap.extended_writing === "LOW") {
        triggeredRules.push({
            name: "Isolate Extended Writing Structures",
            deduction: "Short Writing is strong (>= 88) but Extended Writing is low (< 88), showing that the issue lies in long-form formatting, argument structure, or length limits rather than short transcription.",
            targets: ["Summarize Written Text", "Write Essay", "Summarize Spoken Text"]
        });
        ewIsolating = true;
    }
    
    // --- General Fallback Rules if Isolation does not trigger ---
    // General Rule A: General Reproducing Weakness
    if (statusMap.reproducing_spoken_and_written_language === "LOW" && !rsIsolating && !wfdIsolating) {
        triggeredRules.push({
            name: "Reproducing Spoken & Written Language Weakness",
            deduction: "Your Reproducing Spoken and Written Language score is low (< 88), indicating performance drops across both spoken repeat and written copy tasks.",
            targets: ["Read Aloud", "Repeat Sentence", "Write from Dictation"]
        });
    }
    
    // General Rule B: General Extended Speaking Weakness
    if (statusMap.extended_speaking === "LOW" && !esIsolating) {
        triggeredRules.push({
            name: "Extended Speaking Weakness",
            deduction: "Your Extended Speaking score is low (< 88), indicating deficiency in long spoken output formats.",
            targets: ["Describe Image", "Re-tell Lecture", "Summarize Group Discussion", "Respond to a Situation"]
        });
    }
    
    // General Rule C: General Extended Writing Weakness
    if (statusMap.extended_writing === "LOW" && !ewIsolating) {
        triggeredRules.push({
            name: "Extended Writing Weakness",
            deduction: "Your Extended Writing score is low (< 88), indicating deficiency in essay writing and summarizing long-form texts.",
            targets: ["Summarize Written Text", "Write Essay", "Summarize Spoken Text"]
        });
    }
    
    // General Rule D: Open Response Weakness
    if (statusMap.open_response_speaking_and_writing === "LOW") {
        triggeredRules.push({
            name: "Open Response Speaking & Writing Weakness",
            deduction: "Your Open Response Speaking and Writing score is low (< 88), indicating performance drop in tasks requiring original text or voice content creation.",
            targets: ["Describe Image", "Re-tell Lecture", "Summarize Group Discussion", "Respond to a Situation", "Summarize Written Text", "Write Essay", "Summarize Spoken Text"]
        });
    }
    
    // General Rule E: Multiple-skills Comprehension Weakness
    if (statusMap.multiple_skills_comprehension === "LOW") {
        triggeredRules.push({
            name: "Multiple-skills Comprehension Weakness",
            deduction: "Your Multiple-skills Comprehension score is low (< 88), indicating a performance drop in tasks requiring simultaneous intake and output across different communication modes.",
            targets: ["Repeat Sentence", "Re-tell Lecture", "Summarize Group Discussion", "Summarize Written Text", "Summarize Spoken Text", "Highlight Correct Summary", "Highlight Incorrect Words", "Write from Dictation"]
        });
    }
    
    // Deduction Rule 5: TARGET_READING_CORE (Always runs if Single-skill is low)
    if (statusMap.single_skill_comprehension === "LOW") {
        triggeredRules.push({
            name: "Target Reading & Single-Skill Core",
            deduction: "Your Single-skill Comprehension score is low (< 88), which is directly tied to reading comprehension and vocabulary-focused tasks.",
            targets: ["Answer Short Question", "Respond to a Situation", "Reading & Writing: Fill in the Blanks", "Re-order Paragraphs", "Reading: Fill in the Blanks", "Listening: Fill in the Blanks", "Select Missing Word"]
        });
    }
    
    // Render Insights
    if (triggeredRules.length > 0) {
        insightsPanel.style.display = "block";
        triggeredRules.forEach(rule => {
            const card = document.createElement("div");
            card.className = "insight-card";
            card.innerHTML = `
                <div class="insight-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    ${rule.name}
                </div>
                <div class="insight-deduction">${rule.deduction}</div>
                <div class="insight-targets">
                    <span>Target:</span>
                    ${rule.targets.map(t => `<span class="insight-badge">${t}</span>`).join(" ")}
                </div>
            `;
            insightsContainer.appendChild(card);
        });
    } else {
        insightsPanel.style.display = "none";
    }
    
    // 5. Gather Questions and Categorize into Three Sets
    let strongFocusQuestions = [];
    let mixedAttentionQuestions = [];
    let strongQuestions = [];
    
    let allTriggeredTargets = new Set();
    triggeredRules.forEach(r => r.targets.forEach(t => allTriggeredTargets.add(t)));
    
    QUESTION_MAPPINGS.forEach(q => {
        let scores = [];
        let subskillsImpacted = [];
        let lowCount = 0;
        let highCount = 0;
        
        q.subskills.forEach(subId => {
            const subScore = currentScores.subskills[subId];
            scores.push(subScore);
            const isLow = subScore < 88;
            subskillsImpacted.push({
                name: SUBSKILLS_METADATA[subId].name,
                score: subScore,
                isLow: isLow
            });
            if (isLow) {
                lowCount++;
            } else {
                highCount++;
            }
        });
        
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const qObj = {
            name: q.name,
            score: Math.round(avgScore),
            subskills: subskillsImpacted,
            isDeductionTarget: allTriggeredTargets.has(q.name)
        };
        
        if (lowCount > 0 && highCount === 0) {
            strongFocusQuestions.push(qObj);
        } else if (lowCount > 0 && highCount > 0) {
            mixedAttentionQuestions.push(qObj);
        } else {
            strongQuestions.push(qObj);
        }
    });
    
    // Sort Helper by Score Ascending (lowest score first)
    const sortByScore = (arr) => {
        arr.sort((a, b) => {
            if (a.isDeductionTarget && !b.isDeductionTarget) return -1;
            if (!a.isDeductionTarget && b.isDeductionTarget) return 1;
            return a.score - b.score;
        });
    };
    
    sortByScore(strongFocusQuestions);
    sortByScore(mixedAttentionQuestions);
    sortByScore(strongQuestions);
    
    // Render the three sets of question cards
    renderQuestionList(strongFocusQuestions, "strong-focus-container", "critical");
    renderQuestionList(mixedAttentionQuestions, "mixed-attention-container", "warn");
    renderQuestionList(strongQuestions, "strong-performance-container", "success");
    
    // 6. Render Mapping Matrix Reference Table
    renderMappingMatrix();
}

// Helper to render question lists inside their respective grid panels
function renderQuestionList(questions, containerId, statusClass) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    
    grid.innerHTML = "";
    
    if (questions.length > 0) {
        questions.forEach(q => {
            const card = document.createElement("div");
            card.className = `question-card ${statusClass}`;
            
            const subskillsText = q.subskills
                .map(sub => `<li>${sub.name}: <strong class="${sub.isLow ? 'low-score' : 'high-score'}">${sub.score}</strong></li>`)
                .join("");
                
            card.innerHTML = `
                <div class="question-top">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <span class="question-name">${q.name}</span>
                        ${q.isDeductionTarget ? '<span class="insight-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Weakness Target</span>' : ''}
                    </div>
                </div>
                <div class="question-detail">
                    <p style="margin-bottom: 0.25rem; font-weight: 600;">Related Subskills:</p>
                    <ul style="padding-left: 1.1rem; list-style-type: square;">
                        ${subskillsText}
                    </ul>
                </div>
            `;
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.9rem;">
                No questions in this category.
            </div>
        `;
    }
}

// Render dynamic reference mapping matrix (Neutral on load, Highlighted in red/yellow/green on analyze)
function renderMappingMatrix() {
    const table = document.getElementById("mapping-matrix-table");
    if (!table) return;
    
    const subskillAbbreviations = ["ORSW", "RSWL", "EW", "SW", "ES", "SS", "MSC", "SSC"];
    
    // Classify which columns are LOW (< 88)
    const isColumnLow = {};
    for (let i = 1; i <= 8; i++) {
        isColumnLow[i] = currentScores.subskills[i] < 88;
    }
    
    // Table Header
    let headerHTML = `<thead><tr><th>Question Type</th>`;
    subskillAbbreviations.forEach((abbr, index) => {
        const subId = index + 1;
        const isLow = hasAnalyzed && isColumnLow[subId];
        headerHTML += `<th class="${isLow ? 'col-low' : ''}" title="${SUBSKILLS_METADATA[subId].name}">${abbr}</th>`;
    });
    headerHTML += `</tr></thead>`;
    
    // Table Body
    let bodyHTML = "<tbody>";
    QUESTION_MAPPINGS.forEach(q => {
        // Calculate status of the row
        let lowCount = 0;
        let highCount = 0;
        q.subskills.forEach(subId => {
            if (isColumnLow[subId]) {
                lowCount++;
            } else {
                highCount++;
            }
        });
        
        let rowClass = "";
        if (hasAnalyzed) {
            if (lowCount > 0 && highCount === 0) {
                rowClass = "row-critical";
            } else if (lowCount > 0 && highCount > 0) {
                rowClass = "row-warn";
            } else {
                rowClass = "row-success";
            }
        }
        
        bodyHTML += `<tr class="${rowClass}">`;
        bodyHTML += `<td><strong>${q.name}</strong></td>`;
        
        for (let subId = 1; subId <= 8; subId++) {
            const hasMapping = q.subskills.includes(subId);
            const isLow = isColumnLow[subId];
            
            let cellContent = "";
            let cellClass = "";
            
            if (hasAnalyzed) {
                if (isLow) {
                    cellClass = "col-low";
                    if (hasMapping) {
                        cellClass += " col-low-active";
                    }
                } else {
                    cellClass = "col-high";
                    if (hasMapping) {
                        cellClass += " col-high-active";
                    }
                }
            }
            
            if (hasMapping) {
                let bulletClass = "";
                if (hasAnalyzed) {
                    bulletClass = isLow ? "bullet-low" : "bullet-high";
                }
                cellContent = `<span class="matrix-bullet ${bulletClass}">●</span>`;
            }
            
            bodyHTML += `<td class="${cellClass}" style="text-align: center;">${cellContent}</td>`;
        }
        
        bodyHTML += `</tr>`;
    });
    bodyHTML += "</tbody>";
    
    table.innerHTML = headerHTML + bodyHTML;
}

// Setup and manage color themes (Dark/Light) defaulting to user system settings
function initTheme() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) return;
    
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    
    if (savedTheme === "light" || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.remove("light-theme");
    }
    
    toggleBtn.addEventListener("click", () => {
        const isCurrentlyLight = document.body.classList.toggle("light-theme");
        localStorage.setItem("theme", isCurrentlyLight ? "light" : "dark");
    });
}
