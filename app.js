// App logic for ISO 14971 Risk Management Tutor
document.addEventListener("DOMContentLoaded", () => {
  // Global State
  const state = {
    currentView: "dashboard", // dashboard, partA, partB, quizzes, certificate
    partASlide: 0,
    partBSlide: 0,
    userName: localStorage.getItem("rm_tutor_username") || "",
    quizState: {
      quizA: Array(5).fill(null),
      quizB: Array(6).fill(null),
      quizAScore: null,
      quizBScore: null,
      completedA: false,
      completedB: false,
    },
    // Tracking completion of slides for progress
    slidesViewed: {
      partA: Array(70).fill(false),
      partB: Array(29).fill(false)
    }
  };

  // Mark first slides as viewed initially
  state.slidesViewed.partA[0] = true;

  // Constants
  const PASS_THRESHOLD = 4; // 80% (4/5)

  // Load progress if available
  const savedState = localStorage.getItem("rm_tutor_progress");
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      state.quizState = parsed.quizState || state.quizState;
      if (parsed.slidesViewed) {
        if (Array.isArray(parsed.slidesViewed.partA) && parsed.slidesViewed.partA.length === 70) {
          state.slidesViewed.partA = parsed.slidesViewed.partA;
        }
        if (Array.isArray(parsed.slidesViewed.partB) && parsed.slidesViewed.partB.length === 29) {
          state.slidesViewed.partB = parsed.slidesViewed.partB;
        }
      }
    } catch (e) {
      console.error("Error loading progress", e);
    }
  }

  // Save progress helper
  function saveProgress() {
    localStorage.setItem("rm_tutor_progress", JSON.stringify({
      quizState: state.quizState,
      slidesViewed: state.slidesViewed
    }));
  }

  // Quiz Data
  const quizAData = [
    {
      q: "A reusable surgical instrument is inadequately sterilized between procedures, leaving residual biological contamination on the device surface. In ISO 14971 terminology, which of the following correctly identifies the hazardous situation in this scenario?",
      options: [
        "A) Microbiological hazard",
        "B) Surgical site infection",
        "C) Inadequate reprocessing procedure",
        "D) Patient’s surgical wound exposed to contaminated instrument surfaces",
        "E) Non-compliance with reprocessing instructions"
      ],
      correct: 3, // D
      rationale: "A hazardous situation requires a person to be exposed to a hazard. Option A describes the hazard itself, B describes the harm, C and E describe contributing factors or root causes. Only D identifies the circumstance where a patient is exposed to a hazard."
    },
    {
      q: "The manufacturer shall identify risk control measures using the following priority order:",
      options: [
        "A) 1. Protective measures > 2. Inherent safety by design > 3. Information for safety",
        "B) 1. Information for safety > 2. Protective measures > 3. Inherent safety by design",
        "C) 1. Inherent safety by design > 2. Protective measures > 3. Information for safety",
        "D) 1. Inherent safety by design > 2. Information for safety > 3. Protective measures",
        "E) 1. Protective measures > 2. Information for safety > 3. Inherent safety by design"
      ],
      correct: 2, // C
      rationale: "ISO 14971 Clause 7.1 specifies the priority order: (1) inherent safety by design, (2) protective measures in the medical device itself or in the manufacturing process, and (3) information for safety. This reflects the principle that eliminating a hazard is preferable to protecting against it, which is preferable to warning about it."
    },
    {
      q: "After implementing all practical risk control measures for an identified risk, the residual risk is judged not acceptable. According to ISO 14971, what is the next required step?",
      options: [
        "A) Remove the feature causing the hazard from the device",
        "B) Accept the risk and document the justification",
        "C) Conduct a benefit-risk analysis to determine if the benefits outweigh the residual risk",
        "D) Add a warning to the Instructions for Use and accept the risk",
        "E) Escalate the decision to the notified body for approval"
      ],
      correct: 2, // C
      rationale: "ISO 14971 Clause 7.4 requires that when residual risk exceeds acceptability criteria after all practical risk controls have been applied, the manufacturer must conduct a benefit-risk analysis. Only if the benefits outweigh the residual risk can the risk be accepted. Simply documenting a justification (B) or adding a warning (D) without this analysis is insufficient."
    },
    {
      q: "ISO 14971 requires risk management activities to be conducted throughout which of the following?",
      options: [
        "A) Only during the design and development phase",
        "B) From initial concept through to post-market surveillance, covering the entire device lifecycle",
        "C) Only until the device receives regulatory approval or CE marking",
        "D) During design, manufacturing, and the first year of post-market experience",
        "E) Only when triggered by a complaint, incident, or audit finding"
      ],
      correct: 1, // B
      rationale: "ISO 14971 Clause 4.1 establishes that the risk management process applies across the entire lifecycle of the medical device - from initial concept, through design, manufacturing, and post-market phases. Risk management is a continuous, proactive process, not a phase-limited or reactive activity."
    },
    {
      q: "A manufacturer identifies a new hazard through analysis of post-market surveillance data. According to ISO 14971, what must the manufacturer do?",
      options: [
        "A) Document the hazard in the next periodic safety update report only",
        "B) Add the new hazard to the risk management file and re-evaluate risks, updating risk controls if necessary",
        "C) Notify the competent authority immediately before taking any other action",
        "D) Defer the analysis until the next scheduled risk management review",
        "E) Conduct a new clinical evaluation before updating the risk management file"
      ],
      correct: 1, // B
      rationale: "ISO 14971 Clause 10.3-10.4 requires that when new hazards or hazardous situations are identified from production and post-production information, the manufacturer must update the risk management file, assess the new risks, and implement additional risk controls as needed. This is an ongoing obligation, not something deferred to periodic reviews."
    }
  ];

  const quizBData = [
    {
      q: "A team is performing a risk assessment for a new surgical laser. They have completed a detailed Design FMEA (dFMEA) that analyzes all component failure modes. The quality manager claims the risk analysis is now complete. Why is this claim incorrect according to ISO 14971?",
      options: [
        "A) FMEA only analyzes process errors during manufacturing, not design defects.",
        "B) FMEA focuses exclusively on single-fault component failures and does not address hazards that can occur under normal (non-fault) operating conditions.",
        "C) FMEA requires quantitative probability data, which is not permitted for new medical devices.",
        "D) FMEA does not allow the use of risk control measures to reduce estimated risks.",
        "E) FMEA is only used for post-market surveillance, not during design."
      ],
      correct: 1, // B
      rationale: "As highlighted in Part B, FMEA is a systematic reliability technique that examines component or process step failures (fault conditions). However, a device can work perfectly without any component failures and still pose hazards during normal use (e.g., usability issues or inherent device characteristics). ISO 14971 requires assessing hazards in both normal and fault conditions."
    },
    {
      q: "You are at the very beginning of developing a novel implantable glucose monitor. Detailed design schematics do not yet exist. According to ISO/TR 24971, which risk analysis technique is most appropriate to establish a baseline of known hazards, and when should it be conducted?",
      options: [
        "A) FMEA, conducted after design verification is complete.",
        "B) HAZOP, conducted during post-market surveillance.",
        "C) PHA (Preliminary Hazard Analysis), conducted at the start of development before detailed design to guide design inputs.",
        "D) FTA (Fault Tree Analysis), conducted during production to find manufacturing errors.",
        "E) HACCP, conducted during clinical investigations to monitor patient compliance."
      ],
      correct: 2, // C
      rationale: "PHA is best suited for the early design phase when detailed information is limited. It is performed prior to establishing Design Input requirements (Risk Controls) to identify hazards, hazardous situations, and harms, helping guide engineering design and establish baseline safety requirements."
    },
    {
      q: "A manufacturer uses a Fault Tree Analysis (FTA) to investigate the top event 'Patient receives drug overdose' for a syringe pump. The analysis shows a branch where a flow sensor failure AND a occlusion alarm failure are connected to the top event via an AND gate. What does this logic gate indicate about risk estimation?",
      options: [
        "A) The occurrence of either failure alone is sufficient to cause the overdose.",
        "B) The software will automatically override the hardware failure.",
        "C) Both the flow sensor and the occlusion alarm must fail simultaneously for the overdose to occur, and the combined probability is the product of their individual probabilities.",
        "D) The occlusion alarm is a primary design defect and the sensor is a protective measure.",
        "E) The probability of the top event is the sum of the probabilities of the sensor and alarm failures."
      ],
      correct: 2, // C
      rationale: "An AND gate in FTA represents logical intersection, meaning all input events must occur for the output event to happen. If the inputs are independent, the combined probability is the product of their probabilities, which dramatically reduces the risk compared to either failure alone."
    },
    {
      q: "During a HAZOP study on a sterile filling process, the team analyzes the node 'Transfer sterile solution to vials' and applies the guide word 'Less' to the parameter 'Volume'. Which of the following is the correct definition of the resulting deviation and its clinical consequence?",
      options: [
        "A) Deviation: Solution temperature drops below 18°C; Consequence: Reduced product viscosity.",
        "B) Deviation: Vials are completely empty; Consequence: No treatment is delivered.",
        "C) Deviation: Fill volume is less than 4.9 mL; Consequence: Sub-therapeutic dose is delivered to the patient.",
        "D) Deviation: Fill volume is greater than 5.1 mL; Consequence: Product wastage.",
        "E) Deviation: Filling speed is too slow; Consequence: Increased bioburden."
      ],
      correct: 2, // C
      rationale: "Applying the guide word 'Less' to the parameter 'Volume' yields a fill volume below the specification (e.g., < 4.9 mL). This underfill means the patient may receive a sub-therapeutic dose of the medication, which is a clinical consequence. (Completely empty is 'No' volume, and overfill is 'More' volume)."
    },
    {
      q: "In a sterile manufacturing line for an injectable implant, the manufacturer establishes the 0.22 µm sterile filtration step as a Critical Control Point (CCP-1). Which of the following defines a valid Critical Limit and its associated monitoring procedure for this CCP?",
      options: [
        "A) Limit: Filter pore size is 0.22 µm; Monitoring: Annual supplier audit of the filter manufacturer.",
        "B) Limit: Filter integrity test pressure ≥ 3,450 mbar; Monitoring: Pre- and post-use filter integrity test.",
        "C) Limit: Temperature is 20°C; Monitoring: Continuous chart recorder.",
        "D) Limit: Operator wears sterile gowning; Monitoring: Visual inspection before entering the cleanroom.",
        "E) Limit: S5 severity is not acceptable; Monitoring: Post-market complaint review."
      ],
      correct: 1, // B
      rationale: "Under HACCP principles, a Critical Limit must be a measurable, verifiable value that separates acceptability from unacceptability (e.g., bubble point or pressure-hold test result, such as filter integrity test pressure ≥ 3,450 mbar). The monitoring procedure must check the CCP in real time or per batch (e.g., pre- and post-use integrity testing). Supplier audits (A) and gowning checks (D) are support programs, not CCP monitoring."
    },
    {
      q: "During a risk assessment for a novel drug-eluting coronary stent, clinical data reveals a low-frequency but high-severity risk of late stent thrombosis. After implementing all feasible design and protective risk controls, the residual risk remains above the manufacturer's predefined acceptability limit. According to ISO 14971 Clause 7.4, under what condition may this device still be placed on the market or remain in use?",
      options: [
        "A) Clinical benefits of the device (e.g., prevention of target lesion revascularization) outweigh the residual risk.",
        "B) The manufacturer includes a prominent warning on the outer packaging and instructions for use.",
        "C) The competent regulatory authority has not issued a formal safety recall or warning letter.",
        "D) The device has already achieved CE marking or FDA pre-market approval.",
        "E) A competitor's device exhibits a similar or higher rate of late stent thrombosis."
      ],
      correct: 0, // A
      rationale: "ISO 14971 Clause 7.4 states that if a residual risk is not acceptable after implementing all practical risk control measures, the manufacturer must conduct a benefit-risk analysis. The device can only remain on the market or be released if the clinical benefits outweigh the residual risk. Warnings (B), regulatory inaction (C), prior approval (D), or competitor parity (E) do not satisfy this requirement."
    }
  ];

  // DOM Elements
  const navItems = document.querySelectorAll("nav a[data-view]");
  const contentCanvas = document.getElementById("main-content-canvas");
  const overallProgressBar = document.getElementById("overall-progress-bar");
  const certUserText = document.getElementById("cert-user-level");

  // Navigation click handling
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const view = item.getAttribute("data-view");
      navigateTo(view);
      
      // Close mobile menu if open
      document.getElementById("mobile-menu")?.classList.add("hidden");
    });
  });

  // Mobile Menu Toggle
  const menuBtn = document.getElementById("mobile-menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const mobileNav = document.getElementById("mobile-menu");
      if (mobileNav) {
        mobileNav.classList.toggle("hidden");
      }
    });
  }

  // Navigation Logic
  function navigateTo(view) {
    state.currentView = view;
    
    // Update active state in nav
    navItems.forEach(link => {
      if (link.getAttribute("data-view") === view) {
        link.classList.remove("text-on-surface-variant");
        link.classList.add("text-primary", "bg-surface-container-high", "border-r-2", "border-primary", "translate-x-1");
      } else {
        link.classList.add("text-on-surface-variant");
        link.classList.remove("text-primary", "bg-surface-container-high", "border-r-2", "border-primary", "translate-x-1");
      }
    });

    renderView();
    updateProgress();
  }

  // Calculate & Update Progress Indicator
  function updateProgress() {
    const totalA = state.slidesViewed.partA.length;
    const totalB = state.slidesViewed.partB.length;
    const totalQuizzes = 2; // Quiz A and Quiz B

    const viewedA = state.slidesViewed.partA.filter(Boolean).length;
    const viewedB = state.slidesViewed.partB.filter(Boolean).length;
    const quizzesDone = (state.quizState.completedA ? 1 : 0) + (state.quizState.completedB ? 1 : 0);

    const totalSteps = totalA + totalB + totalQuizzes;
    const completedSteps = viewedA + viewedB + quizzesDone;

    const percentage = Math.round((completedSteps / totalSteps) * 100);
    overallProgressBar.style.width = `${percentage}%`;

    // Update SideBar Certificate level label
    if (quizzesDone === 2 && state.quizState.quizAScore >= PASS_THRESHOLD && state.quizState.quizBScore >= PASS_THRESHOLD) {
      certUserText.textContent = "Certified ISO 14971 Practitioner";
      certUserText.parentElement.querySelector("h2").textContent = "Risk Expert";
    } else {
      certUserText.textContent = "Trainee";
      certUserText.parentElement.querySelector("h2").textContent = "Risk Engineer";
    }
  }

  // Main Render View Router
  function renderView() {
    contentCanvas.innerHTML = "";
    const container = document.createElement("div");
    container.className = "view-transition w-full";
    contentCanvas.appendChild(container);

    switch (state.currentView) {
      case "dashboard":
        renderDashboard(container);
        break;
      case "partA":
        renderPartA(container);
        break;
      case "partB":
        renderPartB(container);
        break;
      case "quizzes":
        renderQuizzes(container);
        break;
      case "certificate":
        renderCertificate(container);
        break;
    }
  }

  // Markdown parser helper: converts **text** → <strong>text</strong>, *text* → <em>text</em>
  function parseMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*((?!\*)[^*]+)\*/g, '<em>$1</em>');
  }

  // Dashboard Rendering
  function renderDashboard(container) {
    const passedA = state.quizState.quizAScore >= PASS_THRESHOLD;
    const passedB = state.quizState.quizBScore >= PASS_THRESHOLD;
    const completedA = state.slidesViewed.partA.every(Boolean);
    const completedB = state.slidesViewed.partB.every(Boolean);

    const completeBadge = (done) => done
      ? `<span class="module-complete-badge"><span class="material-symbols-outlined text-[12px]">check_circle</span>Completed</span>`
      : '';

    container.innerHTML = `
      <header class="max-w-[800px] mx-auto mb-12">
        <div class="flex items-center gap-3 mb-6">
          <span class="font-label-sm text-label-sm text-primary tracking-widest uppercase">Portal Home</span>
          <span class="w-8 h-[1px] bg-outline-variant"></span>
          <span class="font-label-sm text-label-sm text-on-surface-variant">Orderly People</span>
        </div>
        <h1 class="font-serif text-headline-xl text-on-surface mb-6">Risk Management Training Portal</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant text-balance">
          Welcome to the interactive compliance tutor for medical device Risk Management under <strong>ISO 14971:2019</strong>. Build your expertise in standard requirements and risk analysis techniques, then verify your competence with the modules below.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px] mx-auto">
        <!-- Module A Box -->
        <div class="bg-surface-container p-8 rounded ghost-border flex flex-col justify-between min-h-[300px] transition-all hover:border-primary/30 ${completedA ? 'border-l-2 border-l-[#7ab89a]' : ''}">
          <div>
            <div class="flex justify-between items-start mb-5">
              <span class="material-symbols-outlined text-primary text-[36px]">menu_book</span>
              <div class="flex flex-col items-end gap-2">
                <span class="text-xs bg-surface-container-highest px-2 py-1 rounded text-on-surface-variant uppercase tracking-wider font-sans text-[10px] font-semibold">Module A</span>
                ${completeBadge(completedA)}
              </div>
            </div>
            <h2 class="font-serif text-xl font-bold mb-3">Standard Overview</h2>
            <p class="text-on-surface-variant text-sm line-clamp-3 leading-relaxed">
              Core definitions, EU MDR/US FDA alignments, risk management planning, lifecycle workflow, and key compliance requirements.
            </p>
          </div>
          <div class="flex justify-between items-center mt-6">
            <span class="text-xs text-on-surface-variant font-sans">${state.slidesViewed.partA.filter(Boolean).length} / ${state.slidesViewed.partA.length} pages</span>
            <button class="px-5 py-2 bg-surface-container-high border border-outline-variant hover:bg-primary hover:text-background text-primary font-sans text-xs uppercase font-semibold transition-all duration-300 rounded" onclick="window.startModuleA()">${completedA ? 'Review Course' : 'Launch Course'}</button>
          </div>
        </div>

        <!-- Module B Box -->
        <div class="bg-surface-container p-8 rounded ghost-border flex flex-col justify-between min-h-[300px] transition-all hover:border-primary/30 ${completedB ? 'border-l-2 border-l-[#7ab89a]' : ''}">
          <div>
            <div class="flex justify-between items-start mb-5">
              <span class="material-symbols-outlined text-primary text-[36px]">biotech</span>
              <div class="flex flex-col items-end gap-2">
                <span class="text-xs bg-surface-container-highest px-2 py-1 rounded text-on-surface-variant uppercase tracking-wider font-sans text-[10px] font-semibold">Module B</span>
                ${completeBadge(completedB)}
              </div>
            </div>
            <h2 class="font-serif text-xl font-bold mb-3">Analysis Workshop</h2>
            <p class="text-on-surface-variant text-sm line-clamp-3 leading-relaxed">
              Hands-on techniques: PHA, FMEA, HAZOP, HACCP, FTA, and ETA analysis with interactive clinical device case studies.
            </p>
          </div>
          <div class="flex justify-between items-center mt-6">
            <span class="text-xs text-on-surface-variant font-sans">${state.slidesViewed.partB.filter(Boolean).length} / ${state.slidesViewed.partB.length} pages</span>
            <button class="px-5 py-2 bg-surface-container-high border border-outline-variant hover:bg-primary hover:text-background text-primary font-sans text-xs uppercase font-semibold transition-all duration-300 rounded" onclick="window.startModuleB()">${completedB ? 'Review Workshop' : 'Launch Workshop'}</button>
          </div>
        </div>

        <!-- Quizzes Box -->
        <div class="bg-surface-container p-8 rounded ghost-border flex flex-col justify-between min-h-[300px] transition-all hover:border-primary/30">
          <div>
            <div class="flex justify-between items-start mb-5">
              <span class="material-symbols-outlined text-primary text-[36px]">assignment_turned_in</span>
              <span class="text-xs bg-surface-container-highest px-2 py-1 rounded text-on-surface-variant uppercase tracking-wider font-sans text-[10px] font-semibold">Competence</span>
            </div>
            <h2 class="font-serif text-xl font-bold mb-3">Competence Exams</h2>
            <p class="text-on-surface-variant text-sm line-clamp-3 leading-relaxed">
              Verify your comprehension with two timed exams. Score at least 80% on both to unlock your official certificate.
            </p>
          </div>
          <div class="flex justify-between items-center mt-6">
            <div class="flex gap-4 text-xs text-on-surface-variant font-sans">
              <span>Exam A: <strong class="${passedA ? 'text-[#7ab89a]' : 'text-on-surface'}">${state.quizState.quizAScore !== null ? state.quizState.quizAScore + '/5 ' + (passedA ? '✓' : '') : 'Not started'}</strong></span>
              <span>Exam B: <strong class="${passedB ? 'text-[#7ab89a]' : 'text-on-surface'}">${state.quizState.quizBScore !== null ? state.quizState.quizBScore + '/6 ' + (passedB ? '✓' : '') : 'Not started'}</strong></span>
            </div>
            <button class="px-5 py-2 bg-surface-container-high border border-outline-variant hover:bg-primary hover:text-background text-primary font-sans text-xs uppercase font-semibold transition-all duration-300 rounded" onclick="window.startQuizzes()">Open Exams</button>
          </div>
        </div>

        <!-- Certificate Box -->
        <div class="bg-surface-container p-8 rounded ghost-border flex flex-col justify-between min-h-[300px] transition-all hover:border-primary/30 ${passedA && passedB ? 'border-primary/40 border' : 'opacity-60'}">
          <div>
            <div class="flex justify-between items-start mb-5">
              <span class="material-symbols-outlined text-primary text-[36px]">workspace_premium</span>
              <div class="flex flex-col items-end gap-2">
                <span class="text-xs bg-surface-container-highest px-2 py-1 rounded text-on-surface-variant uppercase tracking-wider font-sans text-[10px] font-semibold">Certification</span>
                ${passedA && passedB ? completeBadge(true) : ''}
              </div>
            </div>
            <h2 class="font-serif text-xl font-bold mb-3">Training Certificate</h2>
            <p class="text-on-surface-variant text-sm line-clamp-3 leading-relaxed">
              Once you have passed both exams (≥80%), generate your official Orderly People Certificate of Competency in ISO 14971:2019.
            </p>
          </div>
          <div class="flex justify-between items-center mt-6">
            <span class="text-xs font-sans ${passedA && passedB ? 'text-[#7ab89a] font-semibold' : 'text-on-surface-variant'}">${passedA && passedB ? '🔓 Unlocked' : 'Pass both exams first'}</span>
            <button class="px-5 py-2 bg-surface-container-high border border-outline-variant hover:bg-primary hover:text-background text-primary font-sans text-xs uppercase font-semibold transition-all duration-300 rounded" ${passedA && passedB ? '' : 'disabled style="opacity:0.4;cursor:not-allowed"'} onclick="window.startCertificate()">Get Certificate</button>
          </div>
        </div>
      </div>
    `;

    // Global navigation bindings for card buttons
    window.startModuleA = () => navigateTo("partA");
    window.startModuleB = () => navigateTo("partB");
    window.startQuizzes = () => navigateTo("quizzes");
    window.startCertificate = () => navigateTo("certificate");
  }

  // Module A: Standard Overview Rendering
  function renderPartA(container) {
    const slides = [
      {
        title: `ISO 14971:2019 +A11:2021`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Application of Risk Management</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">to Medical Devices</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">ISO 14971:2019 +A11:2021</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              ISO 14971:2019 +A11:2021 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Agenda`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">01 Introduction & Scope What ISO 14971 is and what it covers</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">02 Key Terms & Definitions Building a shared vocabulary</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">03 General Requirements Process and planning, top management, competence, RMF</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">04 Risk Analysis Hazard identification and risk estimation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">05 Risk Evaluation & Control Acceptability, controls, verification</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">06 Overall Residual Risk & Review Big-picture assessment</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">07 Post-production & PMS Feedback loops, trend analysis</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Agenda</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Agenda is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `How many are new to ISO 14971?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Give a "thumbs up"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">reaction over MS Teams</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">How many are new to ISO 14971?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              How many are new to ISO 14971? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Why Risk Management for Medical Devices?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Patient Safety</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk management ensures potential</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">harms are identified and controlled</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">before they reach patients.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Regulatory Requirement</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Required by</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">EU MDR, US FDA and ISO 13485</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">It is not optional - it is a</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">legal requirement for market access</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Lifecycle Approach</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Post-market data, complaints, and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">trend analysis must feed back into risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">management continuously.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Why Risk Management for Medical Devices?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Why Risk Management for Medical Devices? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `What is ISO 14971?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The internationally recognized standard for applying risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">management to medical devices.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Current edition, as of March 2026: ISO 14971:2019 + A11:2021</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Companion guidance: ISO/TR 24971:2020</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Applies to all medical devices.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key Principle</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk management shall be an integral part of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the overall lifecycle of a medical device</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>from initial conception,</li>
          <li>through design,</li>
          <li>production, and</li>
          <li>throughout its lifetime.</li>
          </ul>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">What is ISO 14971?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              What is ISO 14971? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Scope ISO 14971`,
        content: ``,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Scope ISO 14971</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Scope ISO 14971 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Where Does ISO 14971 Fit?`,
        content: `<h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">ISO 14971:2019</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Management Process</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">EU MDR 2017/745</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Annex I GSPRs, Art. 10</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">ISO 13485:2016</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">QMS / §7 Product realization</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">IEC 62366-1</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Usability Engineering</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">US FDA QMSR</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO14971 Recognized consensus standard</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">ISO/TR 24971:2020</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Guidance & examples</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO 10993 series</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Biological evaluation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">… and more!</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Where Does ISO 14971 Fit?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Where Does ISO 14971 Fit? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `EU MDR & Risk Management`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">MDR Article 10 + GSPR</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Article 10(2) requires manufacturers to establish, document,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">implement, and maintain a risk management system.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Annex I GSPRs 1-9 define the core risk management</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">requirements for design and manufacture.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Compliance with ISO 14971 is the primary pathway to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">demonstrate conformity with these obligations.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Examples of key GSPRs</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>GSPR 1 "any risks which may be associated with [device]</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">use constitute acceptable risks when weighed against the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">benefits"</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>GSPR 2 mandates "reduction of risks as far as possible</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">without adversely affecting the benefit-risk ratio"</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>GSPR 3 mandates a risk management system (implicitly</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">aligning with ISO14971 structure)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>GSPR 4 requires inherent safe design first, then protective</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">measures, then information for safety</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>PMS/Vigilance obligations under MDR Article 83-89</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">directly feed into ISO 14971 §10</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">gavel</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">EU MDR & Risk Management</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              EU MDR & Risk Management is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `US FDA QMSR & Risk Management`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">QMSR - What Changed?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">In February 2026, the FDA's Quality Management System Regulation (QMSR) replaced the old 21 CFR 820</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Quality System Regulation (QSR). The QMSR incorporates ISO 13485:2016 by reference, aligning the US</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">more closely with international standards.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Aspect US FDA QMSR</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk management</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">approach</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Aligned with ISO 13485:2016 §7.1  →  ISO 14971 as the expected method</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Design controls Risk-based approach integrated throughout design and development</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Post-market Feedback loop requirement (per ISO 14971 §10)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">International alignment Harmonized with ISO 13485, reducing gap for multi-market manufacturers</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">gavel</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">US FDA QMSR & Risk Management</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              US FDA QMSR & Risk Management is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `CLAUSE 3`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key Terms & Definitions</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Building a shared vocabulary</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSE 3</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSE 3 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Key Terms & Definitions`,
        content: `
          <p class="mb-6">Understanding the terminology is critical for auditing and compliance. ISO 14971 establishes precise boundaries between hazards, sequences of events, situations, and harm.</p>
          <div class="grid grid-cols-2 gap-4" id="definitions-selector">
            <button class="p-3 bg-surface-container-high rounded text-left border border-outline-variant hover:border-primary text-sm font-mono active" data-def="risk">RISK</button>
            <button class="p-3 bg-surface-container-high rounded text-left border border-outline-variant hover:border-primary text-sm font-mono" data-def="hazard">HAZARD</button>
            <button class="p-3 bg-surface-container-high rounded text-left border border-outline-variant hover:border-primary text-sm font-mono" data-def="sequence">SEQUENCE OF EVENTS</button>
            <button class="p-3 bg-surface-container-high rounded text-left border border-outline-variant hover:border-primary text-sm font-mono" data-def="situation">HAZARDOUS SITUATION</button>
            <button class="p-3 bg-surface-container-high rounded text-left border border-outline-variant hover:border-primary text-sm font-mono" data-def="harm">HARM</button>
            <button class="p-3 bg-surface-container-high rounded text-left border border-outline-variant hover:border-primary text-sm font-mono" data-def="misuse">FORESEEABLE MISUSE</button>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant" id="definition-details">
            <h3 class="font-serif text-headline-lg text-primary mb-3" id="def-title">Risk</h3>
            <p class="text-on-surface-variant text-sm mb-4" id="def-body">Combination of the probability of occurrence of harm and the severity of that harm (S × P).</p>
            <div class="p-3 bg-surface-container rounded border border-outline-variant">
              <span class="text-xs text-primary font-mono uppercase block mb-1">Clinical Example</span>
              <p class="text-xs text-on-surface-variant" id="def-example">A syringe injection carrying a specific combination of occlusion probability and tissue trauma severity.</p>
            </div>
          </div>
        `
      },
      {
        title: `Key Terms & Definitions`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Harm Injury or damage to the health of people, or damage to property or the environment.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard Potential source of harm.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazardous situation Circumstance in which people, property or the environment are exposed to one or more</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazards.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual risk Risk remaining after risk control measures have been implemented.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Limits the scope of ISO14971 Risk management</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">dictionary</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Key Terms & Definitions</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Key Terms & Definitions is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Key Terms & Definitions`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk analysis Systematic use of available information to identify hazards and to estimate the risk.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk evaluation Process of comparing the estimated risk against given risk criteria to determine the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">acceptability of the risk.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk control Process in which decisions are made and measures are implemented by which risks are</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">reduced to, or maintained within, specified levels.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Reasonably foreseeable misuse Use of a product or system in a way not intended by the manufacturer, but which can</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">result from readily predictable human behavior</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">In PMS, "if you saw it once, it might happen again"  →  Reasonably foreseeable</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">dictionary</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Key Terms & Definitions</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Key Terms & Definitions is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `CLAUSE 4`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">General Requirements</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Process and planning, top management, competence, RMF</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSE 4</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSE 4 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `The Risk Management Process - Overview`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Analysis</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">§5</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Evaluation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">§6</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">§7</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Overall</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">§8</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">RM</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Review</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">§9</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Management Plan (§4.4)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Defines scope, criteria, verification activities, and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">responsibilities. Established before you begin.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Production & Post-production (§10)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Continuous collection of post-market data feeding back</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">into risk management.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">↻  Continuous feedback loop throughout product lifecycle</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">The Risk Management Process - Overview</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              The Risk Management Process - Overview is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `The Risk Management File (§4.5)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The RMF is the central repository for all risk management records. It provides traceability and evidence of compliance.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Management Plan</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Defines scope, criteria, and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">approach</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Analysis Records</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard identification, hazardous</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">situations, risk estimation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Evaluation Records</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Acceptability decisions with</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">rationale</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Control Records</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Measures, verification of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">implementation & effectiveness</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Overall Residual Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Final overall benefit-risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">evaluation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Management Review</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Completeness check before</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">commercial release</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">The Risk Management File (§4.5)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              The Risk Management File (§4.5) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Management responsibilities & Competence (§4.2-4.3)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Management responsibilities  (4.2)</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Shall ensure:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Adequate resources allocated for risk</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">management</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Qualified personnel assigned</li>
          <li>Documentation of a policy for establishing criteria</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">for risk acceptability ("risk policy")</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Regular review of the suitability of the risk</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">management process</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Competence of personnel (4.3)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Personnel performing risk management shall be competent</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">based on:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Education</li>
          <li>Training</li>
          <li>Skills</li>
          <li>Experience</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Records of competence and training shall be maintained</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">and traceable.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Management responsibilities & Competence (§4.2-4.3)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Management responsibilities & Competence (§4.2-4.3) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk policy , Policy for establishing criteria for risk acceptability`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Management responsibilities  §4.2</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"Top management shall define and document a policy for establishing criteria for risk acceptability .</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The policy shall provide a framework that ensures that criteria are</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>based upon applicable national or regional regulations and</li>
          <li>relevant international standards, and</li>
          <li>take into account available information such as the generally acknowledged state of the art and</li>
          <li>known stakeholder concerns . "</li>
          </ul>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk policy , Policy for establishing criteria for risk acceptability</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk policy , Policy for establishing criteria for risk acceptability is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk policy , Policy for establishing criteria for risk acceptability`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971 Annex C guidance</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The risk policy concerns both acceptability of individual risks, and overall residual risk</li>
          <li>Must be documented, e.g., as part of the QMS (not necessarily as part of RMF)</li>
          <li>The risk policy typically address</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a) Purpose</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">b) Scope</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">c) Factors and considerations for determining acceptable risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">d) Approaches to risk control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">e) Requirements for approval and review</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The policy should be tailored to fit the specific needs of the manufacturer 's organization.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk policy , Policy for establishing criteria for risk acceptability</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk policy , Policy for establishing criteria for risk acceptability is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk policy , Policy for establishing criteria for risk acceptability`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk policy example</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The purpose of the risk policy is to provide guidance for establishing the criteria for risk acceptability. These criteria are used</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ensure that the medical devices have a high level of safety consistent with stakeholder expectations.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The policy applies to all persons involved in establishing, reviewing, updating, and approving the criteria for risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">commercial distribution.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The following factors should be considered when establishing the criteria for risk acceptability:</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Applicable regulatory requirements in the regions where the medical device is to be marketed,</li>
          <li>Relevant internal standards for the particular medical device being developed or manufactured,</li>
          <li>The generally acknowledged state of the art, which can be determined from a review of international standards, best</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">practices in technology, results of accepted scientific research, publications from authorities, and other information for</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">similar medical devices.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Validated concerns from stakeholders, e.g., information from users, clinicians, patients or regulatory bodies.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risks shall be reduced as far as possible without adversely affecting the benefit-risk ratio. Consideration is given to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">whether technically practicable risk control measures would reduce the risk without impacting the benefit of the device.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The policy for establishing the criteria for risk acceptability is approved by the Head of Quality, and is reviewed annually by</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Top Management as part of reviewing the suitability of the risk management process (addressed in Management Review).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Purpose          →</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Scope          →</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Factors and considerations          →</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Approach to risk control          →</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Req for approval and review          →</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk policy , Policy for establishing criteria for risk acceptability</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk policy , Policy for establishing criteria for risk acceptability is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `The Risk Management Plan (§4.4)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The Risk Management Plan defines the roadmap for all risk management activities.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Plan Contents</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The Risk Management Plan shall include at least the following:</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Scope of the planned risk management activities</li>
          <li>Assignment of responsibilities and authorities</li>
          <li>Requirements for review of risk management activities</li>
          <li>Criteria for risk acceptability (appropriate for the particular device)  →  Essential for ultimate effectiveness of RM process</li>
          <li>Method to evaluate Overall residual risk   + Criteria for its acceptability (based on the risk policy)</li>
          <li>Verification activities for Risk control measures</li>
          <li>Activities related to collection and review of production and post -production information</li>
          </ul>
          <div class="p-4 bg-surface-container-high rounded border border-outline-variant mt-4" id="matrix-info-panel">
            <span class="text-xs text-primary font-mono uppercase block mb-1">Matrix Status</span>
            <p class="text-sm text-on-surface-variant" id="matrix-status-text">Hover or click a matrix cell on the right to examine its risk classification.</p>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-4">
            <h4 class="font-mono text-primary text-xs uppercase mb-2">Figure 1.0: Acceptability Schematic</h4>
            <div class="relative w-full aspect-[4/3] border border-outline-variant bg-surface-container flex flex-col p-4 rounded" style="max-width:320px;">
              <!-- Y Axis -->
              <div class="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] text-on-surface-variant tracking-wider font-mono">Severity →</div>
              <!-- X Axis -->
              <div class="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-on-surface-variant tracking-wider font-mono">Probability →</div>
              
              <div class="w-full h-full ml-4 mb-4 grid grid-cols-5 grid-rows-5 gap-1 bg-surface-container-high border border-outline-variant p-1 rounded">
                <!-- R5 -->
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="5" data-c="1" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="5" data-c="2" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-tertiary-container/80 border border-outline-variant rounded-sm flex items-center justify-center text-[8px] text-on-tertiary-container font-mono" data-r="5" data-c="3" data-zone="Unacceptable">HIGH</div>
                <div class="matrix-cell bg-tertiary-container/80 border border-outline-variant rounded-sm flex items-center justify-center text-[8px] text-on-tertiary-container font-mono" data-r="5" data-c="4" data-zone="Unacceptable">HIGH</div>
                <div class="matrix-cell bg-tertiary-container/80 border border-outline-variant rounded-sm flex items-center justify-center text-[8px] text-on-tertiary-container font-mono" data-r="5" data-c="5" data-zone="Unacceptable">HIGH</div>
                <!-- R4 -->
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="4" data-c="1" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="4" data-c="2" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="4" data-c="3" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-tertiary-container/80 border border-outline-variant rounded-sm flex items-center justify-center text-[8px] text-on-tertiary-container font-mono" data-r="4" data-c="4" data-zone="Unacceptable">HIGH</div>
                <div class="matrix-cell bg-tertiary-container/80 border border-outline-variant rounded-sm flex items-center justify-center text-[8px] text-on-tertiary-container font-mono" data-r="4" data-c="5" data-zone="Unacceptable">HIGH</div>
                <!-- R3 -->
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="3" data-c="1" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="3" data-c="2" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="3" data-c="3" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="3" data-c="4" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-tertiary-container/80 border border-outline-variant rounded-sm flex items-center justify-center text-[8px] text-on-tertiary-container font-mono" data-r="3" data-c="5" data-zone="Unacceptable">HIGH</div>
                <!-- R2 -->
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="2" data-c="1" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="2" data-c="2" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="2" data-c="3" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="2" data-c="4" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="2" data-c="5" data-zone="Acceptable"></div>
                <!-- R1 -->
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="1" data-c="1" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="1" data-c="2" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="1" data-c="3" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="1" data-c="4" data-zone="Acceptable"></div>
                <div class="matrix-cell bg-surface-container-highest border border-outline-variant rounded-sm" data-r="1" data-c="5" data-zone="Acceptable"></div>
              </div>
            </div>
            <div class="mt-4 flex gap-4 justify-center text-[10px]">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-surface-container-highest border border-outline-variant rounded-sm"></span> Acceptable</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-tertiary-container rounded-sm"></span> Unacceptable</span>
            </div>
          </div>
        `
      },
      {
        title: `CLAUSE 5`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Analysis</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard identification and Risk estimation</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSE 5</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSE 5 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Intended Use & Reasonably Foreseeable Misuse (§5.2)`,
        content: `<ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Intended Use</li>
          </ul>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">The manufacturer shall document:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Medical indication / intended purpose</li>
          <li>Patient population (age, health, anatomy)</li>
          <li>Body part / tissue interaction</li>
          <li>User profile (clinician, self-use)</li>
          <li>Use environment</li>
          <li>Operating principle</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Reasonably Foreseeable Misuse</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">The manufacturer must also consider, and document:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Incorrect preparation or handling</li>
          <li>Use by untrained personnel</li>
          <li>Use errors that are readily predictable based on human behavior</li>
          <li>Not limited to the IFU</li>
          <li>Off-label use that is clinically common (ISO/TR 24971)</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key Insight: "Abnormal use" vs. "Reasonably foreseeable misuse"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Abnormal use (IEC 62366: conscious, deliberate misuse) is not defined in ISO14971 - if a misuse is reasonably foreseeable,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">even if it contradicts the IFU, it is in scope of Risk Management.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">E.g., for injectable devices, if clinical literature shows off-label injection areas is common, this is in scope of your risk analysis.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Intended Use & Reasonably Foreseeable Misuse (§5.2)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Intended Use & Reasonably Foreseeable Misuse (§5.2) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Identification of Characteristics related to safety (§5.3)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The manufacturer shall identify and document device characteristics  that could affect safety.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Supportive approaches</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a) Annex A of ISO/TR 24971  →  Questions to guide in identifying safety characteristics  +  Factors to consider for each question</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">b) Similar devices  →  Review available information, literature and adverse events reports</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">c) Regulations and standards  →  Guidance on device-specific safety characteristics</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">d) Derived from 'Essential performance'</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Characteristics related to loss or degradation of clinical performance that can result in unacceptable risk</li>
          <li>Identify the device functions or performance that are necessary to achieve its intended use (or that could affect safety)</li>
          <li>Consider whether any hazardous situations could occur, if any of these functions did not perform properly.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→   Understanding device safety characteristics supports hazard identification</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">NOTE     'Essential performance' (IEC 60601-1), means performance of a clinical function [ …] where loss or degradation beyond the limits specified by the manufacturer</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">results in an unacceptable risk.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Identification of Characteristics related to safety (§5.3)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Identification of Characteristics related to safety (§5.3) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Identification of Hazards & hazardous situations (§5.4)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The manufacturer shall identify and document known and foreseeable hazards associated with the medical device based on the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a) intended use,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">b) reasonably foreseeable misuse, and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">c) characteristics related to safety</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Sources of information for Hazard identification</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Clinical data and literature reviews</li>
          <li>Similar device history (predicate, equivalent)</li>
          <li>Standards and guidance documents</li>
          <li>Usability studies and formative evaluations</li>
          <li>Manufacturing process records and NCs</li>
          <li>Expert opinion and brainstorming sessions</li>
          <li>Post-market surveillance data (complaints, incidents)</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO14971 Annex C - Hazard examples</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Energy (electrical, mechanical, radiation)</li>
          <li>Biological</li>
          <li>Chemical</li>
          <li>Immunological</li>
          <li>Environmental</li>
          <li>Data</li>
          <li>Functional</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">in both normal and fault conditions.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Identification of Hazards & hazardous situations (§5.4)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Identification of Hazards & hazardous situations (§5.4) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Hazardous Situations & Risk Estimation (§5.4-5.5)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard → Sequence of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Events → Hazardous</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Situation → Harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Estimation ( §5.5)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">For each identified hazardous situation, the manufacturer shall estimate the risk using:</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Severity of Harm (S)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How serious is the potential harm?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→  Supported by clinical expert judgement</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">×</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Probability of occurrence of harm (P)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How likely is the harm to occur?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→  Supported by e.g., similar device data, tests</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">and simulations, production and PMS data,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">standards, expert judgement, etc.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Hazardous Situations & Risk Estimation (§5.4-5.5)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Hazardous Situations & Risk Estimation (§5.4-5.5) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Probability = P1 x P2`,
        content: ``,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">grid_on</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Probability = P1 x P2</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Probability = P1 x P2 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `ISO/TR 24971 Example`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Three risks with various Harms, P and S  →  Distinguish by 3 Risk IDs</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">ISO/TR 24971 Example</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              ISO/TR 24971 Example is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Hazard to Harm (ISO14971 example)`,
        content: ``,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Hazard to Harm (ISO14971 example)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Hazard to Harm (ISO14971 example) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Probability levels (ISO/TR 24971 examples)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">… Probability of what?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Don't forget to state how probability is defined, e.g., probability of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">occurrence of harm per use, per device, or other suitable reference.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO14971 supports quantitative and qualitative probability levels.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When sufficient data are available to estimate P with adequate</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">confidence, a quantitative method should be used. Otherwise, a</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">qualitative method based on expert judgement may be preferred</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(e.g., for an entirely new MD, lacking suitable quantitative data).</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>) Defined as the probability of occurrence of harm associated with one</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">use of the device.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">grid_on</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Probability levels (ISO/TR 24971 examples)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Probability levels (ISO/TR 24971 examples) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Severity levels (ISO/TR 24971 examples)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Integrate identified harms in Severity table</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">To facilitate consistency in Severity-ranking of identified harms,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the Severity-table can be populated with all harms identified for</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the specific device, at appropriate Severity-level.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When defining harms, utilizing established IMDRF / MedDRA AE</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">terminology can be beneficial, facilitating future trend reporting.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Aligning terms and descriptions with terminology used in regulations can be useful in</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">describing the levels of severity. E.g., aligning Severity-level "Serious" with the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">threshold of EU MDR "Serious incident".</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Examples of harms</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Stroke, …</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Loss of vision, …</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Bone fracture, …</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Brusing, …</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Itching, …</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">grid_on</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Severity levels (ISO/TR 24971 examples)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Severity levels (ISO/TR 24971 examples) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `How to estimate Probability?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Supporting your estimates</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">There is no requirement mandating how to estimate Probability, this is up to the manufacturer. When possible,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">leverage objective evidence to support your estimates, utilizing e.g.,</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Clinical literature and scientific articles (e.g., your CER might reference a review of multiple clinical trials of PLLA fillers,</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">reporting nodule formation incidence of 5% of treated patients, directly informing probability estimate)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Industry standards *</li>
          <li>Statistical references (e.g., national health authority data, epidemiological database information, etc.)</li>
          <li>PMS data, or similar device information (e.g., adverse events reported to FDA MAUDE)</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Tests and investigations (e.g., usability studies, mechanical stress testing, simulations, process validation, etc.)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Expert judgement ("qualified guessing", can be supported by e.g., the Delphi method)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Often required for brand new products, without similar devices on the market</li>
          <li>Critical risks with severe consequences of vague Probability-estimates, should be supported more robustly than</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">only by "expert judgement". E.g., investing time and money in testing</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>) E.g., IEC 60601-1 specifies maximum leakage current limits; if your device is designed with appropriate margin to the limit, the stand ard's</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">underlying failure assumptions can support a "remote" or "improbable" probability rating for electrical shock scenarios</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">grid_on</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">How to estimate Probability?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              How to estimate Probability? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Expert judgement - When experts disagree?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Delphi method (1/3)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What it is - A structured way of turning individual expert opinions into a reliable group consensus, without the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">problems that come with open group discussions (where dominant personalities, groupthink, or seniority bias tend to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">skew the outcome).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why use it - In risk management you sometimes face hazardous situations where no published data, test results, or</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">field statistics exist to estimate probability. Rather than relying on one person's gut feeling, the Delphi method gives</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">you a defensible, documented rationale by systematically harvesting and refining independent expert judgment.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Expert judgement - When experts disagree?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Expert judgement - When experts disagree? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Expert judgement - When experts disagree?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Delphi method (2/3)</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">How it works - The process is iterative and anonymous:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Define the specific question clearly (e.g., "What is the probability of X occurring during intended use?").</li>
          <li>Select a panel of relevant experts (5-10 persons), each with relevant perspectives based on the question raised</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(clinical, design, manufacturing, etc.).</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Each expert independently provides their estimate and a brief rationale, without knowing what others have</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">answered.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>A facilitator collects and summarizes the responses, sharing the anonymized distribution (e.g., range, median) and</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the key arguments back to the panel.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Each expert reviews the group summary and revises their estimate if they wish, again independently.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Repeat for 2-3 rounds until the estimates converge sufficiently.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">7. The final consensus (often the median or interquartile range) becomes your documented probability estimate.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Expert judgement - When experts disagree?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Expert judgement - When experts disagree? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Expert judgement - When experts disagree?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Delphi method (3/3) - Illustrative example</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Problem:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">You are trying to estimate the probability that a clinician injects your PLLA filler into a non-indicated facial area, but</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">there is insufficient published incidence data to adequately support a reliable estimation.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Solution:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>You assemble a panel of five experts: tree experienced aesthetic injectors, and two clinical trainers. In round one,</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">estimates range widely from "uncommon" to "occasional." The facilitator shares this spread along with each</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">expert's anonymized reasoning.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>In round two, informed by each other's reasoning, the panel converges toward "uncommon" with a documented</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">rationale tied to anatomical variability and injection technique.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>That consensus, together with the recorded reasoning from each round, goes into your risk management file as</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the justification for your probability estimation.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Expert judgement - When experts disagree?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Expert judgement - When experts disagree? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `CLAUSE 6`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Evaluation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Determining risk acceptability</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSE 6</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSE 6 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk Evaluation (§6)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">For each identified hazardous situation, the estimated risk shall be compared to the criteria for risk acceptability.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Criteria for risk acceptability (example)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">P                     S 1: Negligible 2: Minor 3: Serious 4: Critical 5: Catastrophic</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5: Frequent</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">4: Probable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3: Occasional</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2: Remote</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1: Improbable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Acceptable "Tolerable" (optional) Unacceptable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key Points</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Acceptability criteria are device-specific</li>
          <li>Defined in the Risk Management Plan</li>
          <li>Based on the manufacturer's risk policy</li>
          <li>ISO 14971 does not prescribe specific</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">acceptance levels (up to manufacturer)</p>
          <p class="mb-4 font-semibold text-primary">Simulation: Dermal Filler Off-label Injection Risk Estimation</p>
          <div class="p-3 bg-surface-container-high rounded border border-outline-variant flex flex-col gap-3" id="delphi-box">
            <p class="text-xs text-on-surface-variant">Step through a real Delphi process with 5 anonymous experts.</p>
            <div class="flex justify-between items-center">
              <span class="text-xs font-mono text-primary" id="delphi-step-label">Current: Round 1</span>
              <button class="px-4 py-1.5 bg-primary text-background font-mono text-xs uppercase font-semibold rounded hover:bg-primary-container transition-colors" id="delphi-next-btn">Start Delphi</button>
            </div>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-between p-4 bg-surface-container-high rounded border border-outline-variant" id="delphi-graphic-panel">
            <h4 class="font-mono text-xs text-primary uppercase border-b border-outline-variant pb-2">Consensus Distribution</h4>
            <div class="flex-1 flex flex-col justify-center gap-3 py-4" id="delphi-votes-container">
              <p class="text-sm text-center text-on-surface-variant">Click 'Start Delphi' to view the initial expert votes and rationales.</p>
            </div>
            <div class="p-2 bg-surface-container rounded text-[11px] text-on-surface-variant italic" id="delphi-insight-box">
              Waiting for iteration...
            </div>
          </div>
        `
      },
      {
        title: `Let's imagine you were a stringent auditor at a Notified Body`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">You're reviewing the  Risk Management File of a non -medical purpose dermal filler (single -use),</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">would you remark on any of the below?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Question to the group</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">warning</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Let's imagine you were a stringent auditor at a Notified Body</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Let's imagine you were a stringent auditor at a Notified Body is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `For non-medical purposes devices, the EU Common Specifications (Regulation 2022/2346), raises the bar on risk management,`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">as the benefit-side of the equation is weaker (no life -saving or therapeutic benefit).</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Regulation 2022/2346, Annex I §3.3:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Question to the group</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">For non-medical purposes devices, the EU Common Specifications (Regulation 2022/2346), raises the bar on risk management,</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              For non-medical purposes devices, the EU Common Specifications (Regulation 2022/2346), raises the bar on risk management, is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Question to the group`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What if Severity 5 is never acceptable? (death)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"How can we then include any</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Severity 5 risks in our risk analysis?"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Anyone could die of a rapidly escalating infection</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(worst case: septic shock)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Question to the group</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Question to the group is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Question to the group`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">An impossible situation?</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Question to the group</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Question to the group is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `CLAUSE 7`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Selecting, implementing, and verifying risk control measures</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSE 7</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSE 7 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk Control Option Analysis (§7.1)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">15</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The manufacturer shall identify risk control measures using the following priority order:</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Inherently safe design and manufacture</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Eliminate the hazard or reduce the risk by design choices. This is the most effective approach.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example: Choosing proven biocompatible materials, to prevent hazards related to biocompatibility.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Protective Measures</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Add safeguards in the medical device itself or in the manufacturing process.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example: Tamper-evident packaging and sterile barrier system to prevent contamination.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Information for Safety</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Warnings, instructions, contraindications in the IFU, trainings.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example: Clear reconstitution instructions specifying water volume, mixing technique, and 72-hour use-by window.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">eliminate</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazard</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">prevent</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazard</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">inform about</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazard</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk Control Option Analysis (§7.1)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk Control Option Analysis (§7.1) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `ISO/TR 24971, Risk Control examples`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Control Measures, ideally defined as specific measurable requirements (with Req ID)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">ISO/TR 24971, Risk Control examples</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              ISO/TR 24971, Risk Control examples is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk Control Verification: VOI & VOE`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Two distinct verification requirements per ISO 14971:2019 §7.2</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Implementation (VOI)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"Has the risk control been implemented in the design?"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO 14971 §7.2: The manufacturer shall verify that the risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">control measures have been implemented in the design.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">What VOI confirms:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The control is physically present in the design</li>
          <li>It was implemented as specified</li>
          <li>It is traceable to design outputs</li>
          <li>It exists in production units</li>
          </ul>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Typical methods:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Design specifications / review / inspection</li>
          <li>BOM / drawing verification</li>
          <li>Code review / static analysis</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Effectiveness (VOE)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"Does the risk control actually reduce the risk as intended?"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO 14971 §7.2: The manufacturer shall verify the effectiveness,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">confirming that the risk is actually reduced to the intended level.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">What VOE confirms:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The control actually reduces the risk</li>
          <li>Risk is reduced to the intended level</li>
          <li>No new hazards are introduced (§7.3)</li>
          <li>No adverse effect on other controls</li>
          </ul>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Typical methods:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Functional / performance testing</li>
          <li>Fault injection / worst-case testing</li>
          <li>Simulated use / usability testing</li>
          <li>Stress testing</li>
          <li>Manufacturing process validation</li>
          </ul>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk Control Verification: VOI & VOE</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk Control Verification: VOI & VOE is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk Control Verification: VOI & VOE`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Two distinct verification requirements per ISO 14971:2019 §7.2</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Implementation (VOI)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"Has the risk control been implemented in the design?"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Effectiveness (VOE)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"Does the risk control actually reduce the risk as intended?"</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Example questions:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Is the tamper-evident seal on the vial packaging per</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">specification?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Does the IFU include the required reconstitution</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">warnings?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Is the needle gauge specified in the IFU correctly</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">printed?</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Example questions:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Does the tamper-evident seal reliably indicate if the vial</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">has been opened?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Do practitioners actually follow the reconstitution</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">instructions correctly?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Does the specified needle gauge achieve the intended</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">injection depth?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→ Did you DO it? → Does it WORK?</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk Control Verification: VOI & VOE</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk Control Verification: VOI & VOE is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Residual Risk & Benefit-Risk Analysis (§7.3-7.4)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">17</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual Risk Evaluation (7.3)</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">After each risk control is implemented, re -evaluate:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Is the residual risk now acceptable?</li>
          <li>Has the control introduced any risks?</li>
          <li>If new risks are introduced, they must go through the full</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">risk management process.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>If the residual risk remains unacceptable, find additional</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">risk control measures or perform a Benefit-Risk Analysis</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Benefit-Risk Analysis (7.4)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">All practicable risk control measures have been applied - and yet - the risk remains unacceptable ?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Critical: Risk Controls Can Introduce New Risks</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Every risk control measure must be assessed for newly</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">introduced hazards.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">For example, specifying a smaller needle gauge (26G) to reduce</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">tissue trauma may increase the risk of clogging during injection or</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">inconsistent delivery of the PLLA suspension.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">New risks must go through the complete risk management</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">process from §5 onwards.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Residual Risk & Benefit-Risk Analysis (§7.3-7.4)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Residual Risk & Benefit-Risk Analysis (§7.3-7.4) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `'benefit'`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO14971 §3.2 defines</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">benefit</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"positive impact or desirable outcome of the use of a medical device on the health</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">of an individual, or a positive impact on patient management or public health</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Note 1 to entry: Benefits can include positive impact on clinical outcome, the patient's quality of life,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">outcomes related to diagnosis, positive impact from diagnostic devices on clinical outcomes, or positive</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">impact on public health."</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>) EU MDR Art 2 (53) defines 'clinical benefit' similarly: "the positive impact of a device on the health of an individual,</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">expressed in terms of a meaningful, measurable, patient -relevant clinical outcome(s), including outcome(s) related to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">diagnosis, or a positive impact on patient management or public health"</p>
          <p class="text-xs text-primary font-mono uppercase mb-2">Interactive Match Game</p>
          <p class="text-xs text-on-surface-variant mb-4">Click a verification record on the right, then select the matching container (VOI or VOE) on the left.</p>
          <div class="grid grid-cols-2 gap-4">
            <div class="drop-zone border border-dashed border-outline-variant p-4 rounded text-center min-h-[90px] flex flex-col justify-center" id="voi-drop">
              <span class="text-xs font-mono text-primary uppercase block mb-1">VOI Container</span>
              <div class="text-[10px] text-on-surface-variant space-y-1" id="voi-list"></div>
            </div>
            <div class="drop-zone border border-dashed border-outline-variant p-4 rounded text-center min-h-[90px] flex flex-col justify-center" id="voe-drop">
              <span class="text-xs font-mono text-primary uppercase block mb-1">VOE Container</span>
              <div class="text-[10px] text-on-surface-variant space-y-1" id="voe-list"></div>
            </div>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-between p-4 bg-surface-container-high rounded border border-outline-variant">
            <h4 class="font-mono text-xs text-primary uppercase border-b border-outline-variant pb-2">Verification Records</h4>
            <div class="flex-1 flex flex-col gap-2 justify-center py-4" id="match-cards-container">
              <!-- Cards injected by JS -->
            </div>
            <div class="text-xs text-center text-on-surface-variant" id="game-feedback">
              Sort all 4 cards to complete this check.
            </div>
          </div>
        `
      },
      {
        title: `Benefit-Risk Analysis (§7.4)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When individual residual risk exceeds acceptability criteria</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When Is It Required?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">After all practicable risk control measures have been applied, if</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a residual risk still exceeds the manufacturer's established</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">acceptability criteria, the manufacturer shall gather and review</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">data/literature to determine whether the benefits outweigh</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the residual risk.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Key distinction:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">This is NOT the same as the overall residual risk evaluation in §8.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Benefit-risk under §7.4 is performed on each individual residual</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">risk that exceeds acceptability.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">If benefits do NOT outweigh:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk remains unacceptable. Redesign or restrict intended use.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Decision Flow</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1 Apply all practicable risk controls to a given risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2 Evaluate the residual risk against the established</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">acceptability criteria</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3 If residual risk NOT ACC → Perform benefit-risk analysis</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">4 If benefits outweigh residual risk → Acceptable →</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Document rationale & clinical evidence</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5 If benefits do NOT outweigh risk → Not acceptable →</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Redesign device or restrict intended use</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Benefit-Risk Analysis (§7.4)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Benefit-Risk Analysis (§7.4) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Performing Benefit-Risk Analysis Effectively`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Structured approach per ISO 14971 §7.4</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Define the Benefit</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Identify the specific benefit related to the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">intended use</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Benefit must be clinically meaningful - not</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">commercial or convenience</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971: Positive impact on patient</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">health (e.g., early detection, improved</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">diagnosis, quality of life, etc.)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Gather Evidence</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Collect clinical data & literature:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Published clinical studies</li>
          <li>State-of-the-art literature review</li>
          <li>Clinical experience / registry data</li>
          <li>PMCF / PMS data (if available)</li>
          <li>Comparable (predicate) device data</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971: Evidence quality must be</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">proportionate to the severity of the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">residual risk being justified</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Weigh & Document</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Structured comparison:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Clearly state the residual risk</li>
          <li>Clearly state the clinical benefit</li>
          <li>Present supporting evidence</li>
          <li>Rationale: why benefit outweighs risk</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The results of the benefit-risk analysis shall</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">be recorded in the Risk management file.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Important: Benefit-risk analysis is a justification of last resort — it does not replace the obligation to reduce the risk through risk controls.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">All practicable risk controls must be applied first (ISO 14971 §7.1).</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Performing Benefit-Risk Analysis Effectively</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Performing Benefit-Risk Analysis Effectively is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `EU MDR GSPR 8`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"All known and foreseeable risks, and any undesirable side-effects, shall be minimised and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">be acceptable when weighed against the evaluated benefits to the patient and/or user</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">arising from the achieved performance of the device during normal conditions of use."</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Individually and cumulatively</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">gavel</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">EU MDR GSPR 8</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              EU MDR GSPR 8 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Remember the "impossible situation" ?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(S=5, Death by septic shock, NOT-ACC)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Remember the "impossible situation" ?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Remember the "impossible situation" ? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `NOT-ACC`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">does not mean "you can't have this risk in your risk analysis",</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">it means "this risk requires Benefit-risk analysis"</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">NOT-ACC</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              NOT-ACC is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `The ISO14971 workflow offers the solution:`,
        content: `<ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Identify the risk - death from septic shock. You can't omit a foreseeable harm.</li>
          <li>Reduce the risk AFAP* - apply every technically feasible risk control measure (mandatory under EU MDR).</li>
          <li>Assess residual risk against the matrix - after AFAP reduction, still P1/S5, your acceptability matrix says NOT-ACC</li>
          <li>Perform benefit-risk analysis (ISO 14971 §7.4) - this mechanism exists precisely for this situation.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Conclude - Residual risk accepted on the basis of benefit-risk analysis (backed by justification and evidence).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→  The risk acceptability matrix is not the final word.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">§7.4 Benefit-risk analysis gives you a legitimate way to accept a risk that your matrix flags as NOT-ACC, provided you can make</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the benefit-risk case. For a generic risk inherent to any percutaneous procedure (all aesthetic dermal fillers), the case is</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">supported by similar devices already being CE-marked.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">An impossible situation? No.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>) Without adversely affecting the benefit -risk ratio (EU MDR GSPR 2)</li>
          </ul>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">The ISO14971 workflow offers the solution:</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              The ISO14971 workflow offers the solution: is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Harm: Death from septic shock`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Severity: S5 (Catastrophic)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual Probability: P1 (Improbable) <1 in 1,000,000 device uses</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Acceptability: NOT-ACC</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Risk control measures applied (AFAP reduction):</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Product manufactured under validated aseptic processing and terminal sterilization</li>
          <li>Bioburden limits specified and verified per release testing</li>
          <li>Container closure integrity validated to maintain sterility through shelf-life</li>
          <li>Instructions for Use specify aseptic injection technique, including skin disinfection protocol</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. IFU includes contraindication for use in patients with active skin infections</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. IFU includes post-injection care instructions and guidance to seek immediate medical attention at signs of infection</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">7. Practitioner training requirements specified in IFU</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">No further risk reduction measures have been identified that are technically feasible without fundamentally compromising the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">device's intended purpose as an injectable dermal filler.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk reduced AFAP has been demonstrated.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Step 1 - Reduce the risk as far as possible (AFAP)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Harm: Death from septic shock</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Harm: Death from septic shock is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `The residual risk of death from septic shock remains NOT-ACC per the risk acceptability criteria (Ref 1). A benefit-risk analysis is`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">therefore performed in accordance with ISO14971 §7.4 to determine whether the benefits outweigh this residual risk.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The residual probability of this harm occurring is "Improbable" (<1 in 1,000,000 device uses), reflecting the cumulative effect of all</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">implemented risk control measures. The sequence of events leading to this harm requires multiple sequential failures:</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a) breach of product sterility or aseptic technique during injection,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">b) establishment of a clinically significant local infection,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">c) failure of the patient to seek timely medical attention, and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">d) failure of standard antibiotic therapy to resolve the infection before systemic progression.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Each step in this chain is independently mitigated by the risk controls provided (Ref 2). The risk have been reduced as far as possible.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The risk of infection progressing to sepsis and death is not specific to this device. It is a well-recognized, inherent residual risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">associated with any percutaneous procedure, including injection of dermal fillers, and is acknowledged in clinical literature and in the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">generally acknowledged state of the art for injectable products (Ref 3). The incidence of fatal sepsis from dermal filler injection is</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">extremely rare and is not disproportionate to the risk associated with similar medical devices already on the market (Ref 4).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The intended purpose of the device is to provide long-lasting dermal volume restoration for aesthetic improvement. The benefits to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the user include improved appearance and associated psychological well-being, with documented patient satisfaction rates in clinical</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">literature for dermal fillers (Ref 3). These benefits are achievable only through an injectable route of administration; no alternative</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">delivery mechanism can achieve the intended purpose.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Considering the extremely low residual probability, the comprehensive risk control measures applied, the alignment with the state of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the art for injectable procedures, and the fact that the benefit of the device can only be realized through injection, the benefit of the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">device is judged to outweigh this specific residual risk.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Conclusion: The residual risk is accepted based on the benefit-risk analysis provided.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Step 2 - Document your Benefit-Risk Analysis (justification example below)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">The residual risk of death from septic shock remains NOT-ACC per the risk acceptability criteria (Ref 1). A benefit-risk analysis is</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              The residual risk of death from septic shock remains NOT-ACC per the risk acceptability criteria (Ref 1). A benefit-risk analysis is is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `The residual risk of death from septic shock remains NOT-ACC per the risk acceptability criteria (Ref 1). A benefit-risk analysis is`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">therefore performed in accordance with ISO14971 §7.4 to determine whether the benefits outweigh this residual risk.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The residual probability of this harm occurring is "Improbable" (<1 in 1,000,000 device uses), reflecting the cumulative effect of all</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">implemented risk control measures. The sequence of events leading to this harm requires multiple sequential failures:</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a) breach of product sterility or aseptic technique during injection,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">b) establishment of a clinically significant local infection,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">c) failure of the patient to seek timely medical attention, and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">d) failure of standard antibiotic therapy to resolve the infection before systemic progression.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Each step in this chain is independently mitigated by the risk controls provided (Ref 2). The risk have been reduced as far as possible.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The risk of infection progressing to sepsis and death is not specific to this device. It is a well-recognized, inherent residual risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">associated with any percutaneous procedure, including injection of dermal fillers, and is acknowledged in clinical literature and in the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">generally acknowledged state of the art for injectable products (Ref 3). The incidence of fatal sepsis from dermal filler injection is</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">extremely rare and is not disproportionate to the risk associated with similar medical devices already on the market (Ref 4).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The intended purpose of the device is to provide long-lasting dermal volume restoration for aesthetic improvement. The benefits to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the user include improved appearance and associated psychological well-being, with documented patient satisfaction rates in clinical</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">literature for dermal fillers (Ref 3). These benefits are achievable only through an injectable route of administration; no alternative</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">delivery mechanism can achieve the intended purpose.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Considering the extremely low residual probability, the comprehensive risk control measures applied, the alignment with the state of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the art for injectable procedures, and the fact that the benefit of the device can only be realized through injection, the benefit of the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">device is judged to outweigh this specific residual risk.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Conclusion: The residual risk is accepted based on the benefit-risk analysis provided.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Step 2 - Document your Benefit-Risk Analysis (justification example below)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">The residual risk of death from septic shock remains NOT-ACC per the risk acceptability criteria (Ref 1). A benefit-risk analysis is</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              The residual risk of death from septic shock remains NOT-ACC per the risk acceptability criteria (Ref 1). A benefit-risk analysis is is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `ISO14971 §3.28 defines`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">state of the art</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"developed stage of technical capability at a given time as regards products, processes and services,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">based on the relevant consolidated findings of science, technology and experience"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">NOTE    The state of the art embodies what is currently and generally accepted as good practice in technology and medicine .</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The state of the art does not necessarily imply the most technologically advanced solution. The state of the art described he re</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">is sometimes referred to as the "generally acknowledged state of the art".</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>) "State of the art" must be considered per EU MDR GSPR 1</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"State of the art" ?</p>
          <p class="mb-4 text-xs text-on-surface-variant">Toggle the justification arguments on the right to weigh the benefits against the risk.</p>
          <div class="space-y-3 bg-surface-container-high p-4 rounded border border-outline-variant mt-2">
            <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
              <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="30">
              No alternative delivery route exists for volume restoration.
            </label>
            <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
              <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="25">
              Clinically documented aesthetic & psychological benefits.
            </label>
            <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
              <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="20">
              Sterile barrier integrity & aseptic technique guidance.
            </label>
            <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
              <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="20">
              Aligned with State of the Art (comparable CE-marked equivalents).
            </label>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 scale-container">
            <h4 class="font-mono text-primary text-xs uppercase mb-8">Benefit-Risk Balance Scale</h4>
            
            <svg viewBox="0 0 300 200" class="w-full max-w-[260px] h-auto">
              <!-- Stand -->
              <line x1="150" y1="180" x2="150" y2="70" stroke="#859490" stroke-width="4"></line>
              <polygon points="120,180 180,180 160,195 140,195" fill="#3c4a46"></polygon>
              <circle cx="150" cy="70" r="6" fill="#57f1db"></circle>
              
              <!-- Scale Beam -->
              <g class="scale-beam" id="scale-beam-group">
                <line x1="50" y1="70" x2="250" y2="70" stroke="#859490" stroke-width="4"></line>
                
                <!-- Left Pan (Risk) -->
                <g class="scale-pan" id="scale-pan-left">
                  <line x1="50" y1="70" x2="20" y2="130" stroke="#3c4a46" stroke-width="2"></line>
                  <line x1="50" y1="70" x2="80" y2="130" stroke="#3c4a46" stroke-width="2"></line>
                  <polygon points="10,130 90,130 80,140 20,140" fill="#93000a"></polygon>
                  <text x="50" y="120" text-anchor="middle" fill="#ffdad6" font-size="10" font-family="Space Grotesk">RISK (S5)</text>
                </g>
                
                <!-- Right Pan (Benefit) -->
                <g class="scale-pan" id="scale-pan-right">
                  <line x1="250" y1="70" x2="220" y2="130" stroke="#3c4a46" stroke-width="2"></line>
                  <line x1="250" y1="70" x2="280" y2="130" stroke="#3c4a46" stroke-width="2"></line>
                  <polygon points="210,130 290,130 280,140 220,140" fill="#00574d"></polygon>
                  <text x="250" y="120" text-anchor="middle" fill="#57f1db" font-size="10" font-family="Space Grotesk">BENEFIT</text>
                </g>
              </g>
            </svg>
            
            <div class="mt-4 px-4 py-2 rounded text-xs font-mono text-center" id="scale-outcome-badge" style="background-color: var(--surface-container-high); border: 1px solid var(--outline-variant);">
              RISK OUTWEIGHS BENEFITS
            </div>
          </div>
        `
      },
      {
        title: `Key elements that make our Benefit -Risk Analysis defensible:`,
        content: `<ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The "state of the art" and similar device argument is critical:</li>
          <li>Every dermal filler, every injectable, every surgical procedure carries this same residual risk.</li>
          <li>If a notified body rejected this rationale, they'd logically have to reject every non-medical</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">purpose dermal filler already on the market</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The "no alternative delivery mechanism" point closes the door on the obvious challenge: "why not</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">make it non-injectable?", the answer is that the intended purpose is impossible without injection, so</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">removing the injection route eliminates the device entirely rather than reducing risk.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The causal chain argument shows that death isn't a single-point failure, but requires multiple</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">independent failures, which supports the "Improbable" P-estimate  (ideally supported by CER and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">PMS data).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Reflection on our Benefit-Risk Analysis</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Key elements that make our Benefit -Risk Analysis defensible:</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Key elements that make our Benefit -Risk Analysis defensible: is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `For non-medical purposes devices, the EU Common Specifications (Regulation 2022/2346), raises the bar on risk management,`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">as the benefit-side of the equation is weaker (no life-saving, or therapeutic benefit).</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Regulation 2022/2346, Annex I §3.3:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Flashback to the EU Common Specification</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"... the manufacturer shall</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">provide a justification …"</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">For non-medical purposes devices, the EU Common Specifications (Regulation 2022/2346), raises the bar on risk management,</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              For non-medical purposes devices, the EU Common Specifications (Regulation 2022/2346), raises the bar on risk management, is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `CLAUSES 8 & 9`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Evaluation of Overall Residual Risk &</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Management Review</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The big-picture assessment and completion check</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSES 8 & 9</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSES 8 & 9 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Evaluation of Overall Residual Risk (§8)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">After all individual risk controls are implemented and verified, the manufacturer shall evaluate the overall residual risk po sed by the device.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What does this mean in practice?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Consider cumulative effects  →  Multiple individually acceptable risks may combine into an unacceptable overall risk profile.</li>
          <li>Use the method defined in the Risk Management Plan (this must be pre-defined, not ad hoc), e.g., a combination of</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">a) residual risk plotting (quantitative),</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">b) medical expert judgement (qualitative), and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">c) comparison to similar medical devices (qualitative).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Information for Safety Disclosure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">If overall residual risk is deemed acceptable, the manufacturer must disclose any remaining residual risks in the accompanying information (IFU).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">This ensures that users and patients are informed about the limits of risk reduction achieved by the device.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Evaluation of Overall Residual Risk (§8)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Evaluation of Overall Residual Risk (§8) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Evaluation of Overall Residual Risk (§8)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual risk plot - Device A</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">P                     S 1: Negligible 2: Minor 3: Serious 4: Critical 5: Catastrophic</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5: Frequent</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">4: Probable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3: Occasional</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2: Remote</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1: Improbable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Acceptable "Tolerable" Unacceptable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual risk plot - Device B</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">P                     S 1: Negligible 2: Minor 3: Serious 4: Critical 5: Catastrophic</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5: Frequent</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">4: Probable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3: Occasional</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2: Remote</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1: Improbable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Acceptable "Tolerable" Unacceptable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual risk plotting - an effective way to visualize the device's overall risk profile.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Evaluation of Overall Residual Risk (§8)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Evaluation of Overall Residual Risk (§8) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Risk Management Review (§9)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Prior to release for commercial distribution of the medical device, the manufacturer shall review the execution of the risk m anagement plan.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">This review shall at least ensure that:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The risk management plan has been appropriately implemented</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The overall residual risk is acceptable</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Appropriate methods are in place to collect and review production and post-production information</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The responsibility for review shall be assigned in the Risk Management plan to persons having the appropriate authority</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The results of the Risk Management Review shall be recorded and maintained as the Risk Management Report</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">DeliverableActivity</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Updating the RMR</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">There can be a need to update</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the Risk Management Report</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>if new information becomes</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">available (e.g., in PMS), or</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>with major design changes.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The manufacturer decides.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk Management Review (§9)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk Management Review (§9) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `CLAUSE 10`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Production & Post-production</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The feedback loop that keeps risk management alive</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">bookmark</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">CLAUSE 10</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              CLAUSE 10 is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Production & Post-production activities (§10)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">20</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The manufacturer shall establish, document, implement, and maintain a system to actively collect and review information</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">about the medical device in production and post -production phases.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Information collection (10.2)</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Information generated:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>During production and monitoring (e.g., deviations)</li>
          <li>From complaints and customer feedback</li>
          <li>Reason for complaint, date, hazard, P/S of any</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">harm, place of use, component involved, UDI,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">person identifying the problem, etc.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>By those accountable the installation and maintenance</li>
          <li>By the supply chain</li>
          <li>Publicly available information about similar devices</li>
          <li>Information related to state-of-the-art</li>
          <li>Post-market surveillance reports (PMSR/PSUR)</li>
          <li>Clinical follow-up data (PMCF)</li>
          <li>Trend analysis results</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Information review & Actions (10.3-10.4)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Review collected information for relevance to safety</li>
          <li>Determine if previously unrecognized hazards or</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazardous situations exist</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Determine if estimated risks are no longer acceptable</li>
          <li>Feed the information back into the RMF and take</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">appropriate action</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Evaluate impact on previously implemented risk control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">measures</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→  ISO/TR 24971 provides a helpful list of questions to ask</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Production & Post-production activities (§10)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Production & Post-production activities (§10) is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `When the Feedback Loop Breaks`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">BSI Audit Finding: NC outcomes not integrated into risk management files  →  CAPA 008-25</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What Happened</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Internal nonconformities identified real-world risks (e.g.,</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">process deviations during manufacturing/testing, etc).</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Corrective actions for the NCs were properly implemented.</li>
          <li>However, the risks identified were NOT reflected in the</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">product risk analysis or QMS risk analysis.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>The NC form marked risk review as "completed" - but the</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">risk files were never actually updated.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Root Cause & Lesson Learned</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Root cause: The NC procedure lacked a "hard stop" - a</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">mandatory, verifiable checkpoint requiring documented evidence</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">that risk files were updated before NC closure.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Lesson learned: Risk management integration requires traceable,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">verifiable records - document ID, version, and specific risk ID(s).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Takeaway</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Your NC/CAPA process must have a closed-loop connection to your risk management files. Every nonconformity with potential risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">implications must be traceable to a documented risk assessment update - or a documented rationale for why no update was needed.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">warning</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">When the Feedback Loop Breaks</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              When the Feedback Loop Breaks is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `Trend Analysis & EU/UK MDR`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Trend Analysis in Risk Management</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Based on information collected from production and PMS.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Purpose in risk management context:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Detect early risk signals to support the implementation</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">of preventive actions (CAPA), eliminating the causes of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">potential NCs (e.g., in production)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Identify emerging hazards not captured in the original</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">risk analysis</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Provide objective evidence that risk controls remain</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">effective over time</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Challenge your risk estimations: are the probabilities you</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">assumed still valid? (PMS data may indicate otherwise)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Trigger risk management file updates when trends</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">indicate a change</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">EU & UK MDR - Trend Reporting</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">EU MDR Article 88 / UK MDR 44ZN requires manufacturers to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">report to competent authorities any statistically significant</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">increase in the frequency or severity of incidents* or expected</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">undesirable side-effects.</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">This directly links to risk management:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>A detected trend may challenge the validity of your</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">probability estimates in the risk analysis</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Trend reporting puts regulatory pressure on maintaining</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">accurate, up-to-date risk estimations</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Your trend analysis method must be robust enough to</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">detect real signals, not just noise (utilize moving average,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">plotting, etc.)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>) Per UK MDR, all incidents. Per EU MDR, non -serious incidents only.</li>
          </ul>`,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant">
            <h3 class="font-serif text-headline-lg mb-6 text-center text-on-surface">Corrective Action Closed Loop</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between text-xs font-mono border-b border-outline-variant pb-2">
                <span class="text-on-surface-variant">Incident / NC Identified</span>
                <span class="text-error">Trigger</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono border-b border-outline-variant pb-2">
                <span class="text-on-surface-variant">CAPA Investigation</span>
                <span class="text-secondary">Analysis</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono border-b border-outline-variant pb-2 text-primary">
                <span>Hard Stop: Risk File Updated?</span>
                <span class="font-bold">Required Check</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono pb-2">
                <span class="text-on-surface-variant">Close NC Form</span>
                <span class="text-on-surface-variant">Closure</span>
              </div>
            </div>
            <p class="text-[10px] text-on-surface-variant mt-6 text-center italic">Without the Risk File step, the feedback loop is broken, leading to audit citations.</p>
          </div>
        `
      },
      {
        title: `Key Takeaways`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk management is a lifecycle activity - it starts before design and continues forever (PMS/NC/CAPAs feed back into the RMF)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The Risk Management Plan defines your approach before you begin - criteria for risk acceptability, methods, responsibilities</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Reasonably foreseeable misuse is in scope of ISO14971 - do not limit your analysis to the IFU alone</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verify both implementation AND effectiveness of every risk control measure (RCM). Define RCMs as requirements.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">"NOT ACC" per your risk acceptability criteria is not the end of the story. Benefit-Risk Analysis is your secret weapon.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Trend analysis under EU/UK MDR puts pressure on maintaining accurate risk estimations</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Key Takeaways</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Key Takeaways is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      },
      {
        title: `What's Next?`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Techniques to support risk analysis + Hands-on exercise</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Thank you - Questions & Discussion</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">What's Next?</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              What's Next? is part of the ISO 14971 Risk Management Training (Part A). Focus on key compliance elements.
            </p>
          </div>
    `
      }
    ];

    // Mark current slide as viewed
    state.slidesViewed.partA[state.partASlide] = true;
    saveProgress();

    const slide = slides[state.partASlide];

    // Render Slide Shell
    container.innerHTML = `
      <div class="max-w-[1100px] mx-auto">
        <!-- Top Navigator -->
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center gap-3">
            <span class="font-label-sm text-label-sm text-primary tracking-widest uppercase">Module A</span>
            <span class="w-8 h-[1px] bg-outline-variant"></span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">${state.partASlide + 1} of ${slides.length}</span>
          </div>
          <span class="font-label-sm text-label-sm text-on-surface-variant">Standard Overview & Requirements</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <!-- Text/Control Column -->
          <div class="lg:col-span-6 flex flex-col justify-between min-h-[460px] pr-0 lg:pr-8 border-r-0 lg:border-r border-outline-variant">
            <div>
              <h2 class="font-serif text-headline-xl mb-6">${slide.title}</h2>
              <div class="font-body-md text-body-md text-on-surface-variant text-balance">
                ${slide.content}
              </div>
            </div>
            <!-- Bottom Slide Navigation -->
            <div class="flex justify-between items-center pt-8 border-t border-outline-variant mt-8">
              <button class="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-sm font-mono uppercase transition-colors" id="prev-slide-btn" ${state.partASlide === 0 ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-sm">arrow_back</span> Prev
              </button>
              <button class="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-mono text-sm uppercase transition-all duration-300 rounded" id="next-slide-btn">
                ${state.partASlide === slides.length - 1 ? 'Mark Complete' : 'Next'} <span class="material-symbols-outlined text-sm ml-1 align-middle">arrow_forward</span>
              </button>
            </div>
          </div>

          <!-- Infographic Column -->
          <div class="lg:col-span-6 flex items-center justify-center min-h-[380px] bg-surface-container/30 rounded border border-outline-variant p-6">
            <div class="w-full h-full flex flex-col justify-center" id="infographic-stage">
              ${slide.infographic}
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook slide navigation buttons
    document.getElementById("prev-slide-btn").onclick = () => {
      if (state.partASlide > 0) {
        state.partASlide--;
        renderPartA(container);
        updateProgress();
      }
    };

    document.getElementById("next-slide-btn").onclick = () => {
      if (state.partASlide < slides.length - 1) {
        state.partASlide++;
        renderPartA(container);
        updateProgress();
      } else {
        navigateTo("dashboard");
      }
    };

    // Attach Interactivity handlers based on current slide
    if (state.partASlide === 10) {
      setupTermsInteractivity();
    } else if (state.partASlide === 20) {
      setupMatrixInteractivity();
    } else if (state.partASlide === 36) {
      setupDelphiInteractivity();
    } else if (state.partASlide === 46) {
      setupMatchGame();
    } else if (state.partASlide === 56) {
      setupScaleInteractivity();
    }
  }

  // Interactivity: Key Definitions Selector
  function setupTermsInteractivity() {
    const selectorButtons = document.querySelectorAll("#definitions-selector button");
    const titleEl = document.getElementById("def-title");
    const bodyEl = document.getElementById("def-body");
    const exampleEl = document.getElementById("def-example");

    const definitions = {
      risk: {
        title: "Risk",
        body: "Combination of the probability of occurrence of harm and the severity of that harm (S × P).",
        example: "The overall clinical risk profile of a PLLA dermal filler including both nodule formation and vascular occlusions."
      },
      hazard: {
        title: "Hazard",
        body: "Potential source of harm. Represents the physical source of risk before exposure occurs.",
        example: "A sharp syringe needle (mechanical hazard), bioburden on a device vial (biological hazard), or degrading chemical carriers (chemical hazard)."
      },
      sequence: {
        title: "Sequence of Events",
        body: "A series of foreseeable events or operational steps that links a hazard to exposure, eventually leading to a hazardous situation.",
        example: "1) Practitioner injects too superficially into the dermis. 2) PLLA microspheres deposit in the upper dermal layer. 3) Spheres aggregate."
      },
      situation: {
        title: "Hazardous Situation",
        body: "Circumstance in which people, property, or the environment are exposed to one or more hazards. (Hazard + Exposure).",
        example: "The PLLA microspheres are physically present in the superficial dermis of the patient's face."
      },
      harm: {
        title: "Harm",
        body: "Physical injury or damage to the health of people, or damage to property or the environment.",
        example: "The formation of a visible nodule on the face, requiring corticosteroid therapy or surgical excision."
      },
      misuse: {
        title: "Reasonably Foreseeable Misuse",
        body: "Use of a product or system in a way not intended by the manufacturer, but which can result from readily predictable human behavior.",
        example: "A practitioner injecting the dermal filler into a non-indicated facial area (e.g. tear troughs) because it is common clinical practice."
      }
    };

    selectorButtons.forEach(btn => {
      btn.onclick = () => {
        selectorButtons.forEach(b => b.classList.remove("active", "border-primary", "text-primary"));
        btn.classList.add("active", "border-primary", "text-primary");
        const key = btn.getAttribute("data-def");
        const def = definitions[key];

        titleEl.textContent = def.title;
        bodyEl.innerHTML = def.body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        exampleEl.textContent = def.example;
      };
    });
  }

  // Interactivity: Acceptability Matrix
  function setupMatrixInteractivity() {
    const cells = document.querySelectorAll(".matrix-cell");
    const statusText = document.getElementById("matrix-status-text");

    cells.forEach(cell => {
      cell.addEventListener("mouseenter", () => {
        const r = cell.getAttribute("data-r");
        const c = cell.getAttribute("data-c");
        const zone = cell.getAttribute("data-zone");
        
        let desc = "";
        if (zone === "Acceptable") {
          desc = "Acceptable. Risk is negligible or minor; standard controls are verified, no further action is required.";
        } else {
          desc = "Unacceptable. Requires design changes or a formal Benefit-Risk Analysis (§7.4) demonstrating that clinical benefits outweigh this risk.";
        }

        statusText.innerHTML = `
          <strong>Probability level P${c}, Severity level S${r}</strong><br>
          <span class="text-xs uppercase tracking-wider font-mono text-primary font-bold">${zone}</span><br>
          <span class="text-xs">${desc}</span>
        `;
      });
    });
  }

  // Interactivity: Delphi Consensus Simulator
  function setupDelphiInteractivity() {
    const nextBtn = document.getElementById("delphi-next-btn");
    const stepLabel = document.getElementById("delphi-step-label");
    const votesContainer = document.getElementById("delphi-votes-container");
    const insightBox = document.getElementById("delphi-insight-box");

    let delphiStep = 0;

    nextBtn.onclick = () => {
      delphiStep++;
      if (delphiStep === 1) {
        // Round 1
        stepLabel.textContent = "Current: Round 1 (Spread)";
        nextBtn.textContent = "Start Round 2";
        votesContainer.innerHTML = `
          <div class="space-y-2">
            <div class="text-xs font-semibold uppercase text-on-surface-variant font-mono">Expert Votes (Spread)</div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div class="p-2 bg-surface-container border border-outline-variant rounded">Occasional<br><span class="text-primary text-sm font-bold">2 Votes</span></div>
              <div class="p-2 bg-surface-container border border-outline-variant rounded">Uncommon<br><span class="text-primary text-sm font-bold">2 Votes</span></div>
              <div class="p-2 bg-surface-container border border-outline-variant rounded">Remote<br><span class="text-primary text-sm font-bold">1 Vote</span></div>
            </div>
            <div class="text-[11px] text-on-surface-variant leading-relaxed mt-2 space-y-1">
              <p><strong>Expert A (Clinician):</strong> "Injections are quick, so misuse happens occasionally."</p>
              <p><strong>Expert B (Trainer):</strong> "No, our specific training program restricts this. It is uncommon."</p>
            </div>
          </div>
        `;
        insightBox.textContent = "Round 1 shows a high variance. The facilitator compiles the rationales and redistributes them anonymously.";
      } else if (delphiStep === 2) {
        // Round 2
        stepLabel.textContent = "Current: Round 2 (Convergence)";
        nextBtn.textContent = "Generate Report";
        votesContainer.innerHTML = `
          <div class="space-y-2">
            <div class="text-xs font-semibold uppercase text-on-surface-variant font-mono">Expert Votes (Redistributed)</div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div class="p-2 bg-surface-container border border-outline-variant rounded opacity-50">Occasional<br><span class="text-sm">0 Votes</span></div>
              <div class="p-2 bg-surface-container border border-primary/40 rounded">Uncommon<br><span class="text-primary text-sm font-bold">4 Votes</span></div>
              <div class="p-2 bg-surface-container border border-outline-variant rounded">Remote<br><span class="text-primary text-sm font-bold">1 Vote</span></div>
            </div>
            <div class="text-[11px] text-on-surface-variant leading-relaxed mt-2 space-y-1">
              <p><strong>Expert A (Clinician):</strong> "Reviewing the training metrics, I agree the training mitigates this. I shift to Uncommon."</p>
              <p><strong>Expert C (Quality):</strong> "I also shift to Uncommon based on typical field complaints."</p>
            </div>
          </div>
        `;
        insightBox.textContent = "With the shared rationales, the experts' opinions converge toward a consensus of 'Uncommon'.";
      } else if (delphiStep === 3) {
        // Round 3 (Consensus)
        stepLabel.textContent = "Final Consensus Achieved";
        nextBtn.classList.add("opacity-50");
        nextBtn.disabled = true;
        nextBtn.textContent = "Completed";
        votesContainer.innerHTML = `
          <div class="space-y-2 text-center py-4">
            <span class="material-symbols-outlined text-primary text-[48px] animate-pulse">check_circle</span>
            <h4 class="text-md font-bold mt-2">Consensus: Uncommon (P3)</h4>
            <p class="text-xs text-on-surface-variant px-4">
              All experts agree on 'Uncommon' (P3) with a documented anatomical and training-based justification in the Risk Management File.
            </p>
          </div>
        `;
        insightBox.textContent = "Delphi complete. You now have a solid, auditable expert consensus to enter in your risk assessment.";
      }
    };
  }

  // Interactivity: VOI vs VOE Match Game (TEC-14 — real drag-and-drop)
  function setupMatchGame() {
    const cardsContainer = document.getElementById("match-cards-container");
    const voiZone = document.getElementById("voi-drop");
    const voeZone = document.getElementById("voe-drop");
    const voiList = document.getElementById("voi-list");
    const voeList = document.getElementById("voe-list");
    const feedbackEl = document.getElementById("game-feedback");

    const items = [
      { id: "c1", text: "Injection depth needle marking matches design drawing (DVR-045)", type: "voi", hint: "Did you implement it?" },
      { id: "c2", text: "15-practitioner usability study confirms correct depth (RPT-061)", type: "voe", hint: "Does it actually work?" },
      { id: "c3", text: "Tamper-evident seal geometry matches BOM drawing spec", type: "voi", hint: "Did you implement it?" },
      { id: "c4", text: "Bioburden sampling study shows <10 CFU/device (RPT-058)", type: "voe", hint: "Does it actually work?" }
    ];

    // Render cards with drag instructions
    cardsContainer.innerHTML = `
      <p class="text-xs text-on-surface-variant mb-3 italic">Drag each card into the correct column — <strong class="text-primary">VOI</strong> (did you implement it?) or <strong class="text-on-surface">VOE</strong> (does it work?).</p>
      <div class="grid grid-cols-1 gap-2">
        ${items.map(item => `
          <div class="match-card bg-surface-container-high p-3 rounded border border-outline-variant text-xs text-on-surface font-sans hover:border-primary cursor-grab" id="${item.id}" draggable="true">
            <span class="block font-semibold text-on-surface">${item.text}</span>
            <span class="block text-on-surface-variant mt-1 italic text-[10px]">${item.hint}</span>
          </div>
        `).join('')}
      </div>
    `;

    let dragId = null;
    let matchedCount = 0;

    // Drag events on cards
    document.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        dragId = card.id;
        e.dataTransfer.effectAllowed = 'move';
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '';
      });
      // Click fallback: click card to select, then click zone
      card.addEventListener('click', () => {
        document.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        dragId = card.id;
        feedbackEl.textContent = 'Now click VOI or VOE to place this card.';
      });
    });

    // Drop zone setup
    [voiZone, voeZone].forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const targetType = zone.id === 'voi-drop' ? 'voi' : 'voe';
        handleMatchAttempt(targetType);
      });
      // Click fallback
      zone.addEventListener('click', () => {
        if (!dragId) return;
        const targetType = zone.id === 'voi-drop' ? 'voi' : 'voe';
        handleMatchAttempt(targetType);
      });
    });

    function handleMatchAttempt(targetType) {
      if (!dragId) return;
      const item = items.find(i => i.id === dragId);
      const cardEl = document.getElementById(dragId);
      if (!item || !cardEl || cardEl.classList.contains('matched')) return;

      const list = targetType === 'voi' ? voiList : voeList;

      if (item.type === targetType) {
        // Correct
        cardEl.classList.add('matched', 'pointer-events-none');
        cardEl.classList.remove('selected');
        const entry = document.createElement('div');
        entry.className = 'p-2 rounded mb-1 text-[11px] font-sans';
        entry.style.cssText = 'background: rgba(122,184,154,0.12); border: 1px solid rgba(122,184,154,0.4); color: #7ab89a;';
        entry.innerHTML = `<span class="font-bold">&#10003;</span> ${item.text}`;
        list.appendChild(entry);
        dragId = null;
        matchedCount++;
        if (matchedCount === items.length) {
          feedbackEl.innerHTML = `<span style="color:#7ab89a;font-weight:bold">🎉 All verifications correctly matched! VOI confirms implementation; VOE confirms effectiveness.</span>`;
        } else {
          feedbackEl.innerHTML = `<span style="color:#7ab89a">✓ Correct! Keep going.</span>`;
        }
      } else {
        feedbackEl.innerHTML = `<span style="color:#f28b82">✗ Not quite — think: does this card confirm the measure was <em>implemented</em> (VOI) or that it actually <em>works</em> (VOE)?</span>`;
        cardEl.classList.add('animate-pulse');
        setTimeout(() => {
          cardEl.classList.remove('animate-pulse', 'selected');
          dragId = null;
        }, 700);
      }
    }
  }

  // Interactivity: Benefit-Risk Scale (TEC-15 — fixed gravity animation)
  function setupScaleInteractivity() {
    const scaleBeam = document.getElementById("scale-beam-group");
    const panLeft = document.getElementById("scale-pan-left");
    const panRight = document.getElementById("scale-pan-right");
    const outcomeBadge = document.getElementById("scale-outcome-badge");
    const checkboxes = document.querySelectorAll(".bra-toggle");

    function updateScale() {
      let totalBenefitWeight = 0;
      checkboxes.forEach(cb => {
        if (cb.checked) {
          totalBenefitWeight += parseInt(cb.getAttribute("data-weight"));
        }
      });

      // Risk side is fixed at weight 50; benefits accumulate on the right
      const riskWeight = 50;
      const netDiff = totalBenefitWeight - riskWeight; // negative means risk heavier

      // Angle: clamp between -18 (risk heavy) and +18 (benefits heavy)
      const maxAngle = 18;
      const angle = Math.max(-maxAngle, Math.min(maxAngle, (netDiff / riskWeight) * maxAngle));

      // Apply transforms — pans counter-rotate to stay horizontal (gravity effect)
      if (scaleBeam) scaleBeam.style.transform = `rotate(${angle}deg)`;
      if (panLeft) panLeft.style.transform = `translateY(${angle > 0 ? Math.abs(angle) * 1.5 : 0}px)`;
      if (panRight) panRight.style.transform = `translateY(${angle < 0 ? Math.abs(angle) * 1.5 : 0}px)`;

      if (!outcomeBadge) return;
      if (angle > 1) {
        outcomeBadge.textContent = "BENEFITS OUTWEIGH RESIDUAL RISK — Accepted per §7.4";
        outcomeBadge.style.color = "#7ab89a";
        outcomeBadge.style.borderColor = "#7ab89a";
        outcomeBadge.style.backgroundColor = "rgba(122, 184, 154, 0.06)";
      } else if (angle < -1) {
        outcomeBadge.textContent = "RISK OUTWEIGHS BENEFITS — Still UNACCEPTABLE";
        outcomeBadge.style.color = "var(--error)";
        outcomeBadge.style.borderColor = "var(--error)";
        outcomeBadge.style.backgroundColor = "rgba(242, 139, 130, 0.06)";
      } else {
        outcomeBadge.textContent = "BALANCED — Borderline — additional evidence needed";
        outcomeBadge.style.color = "var(--tertiary)";
        outcomeBadge.style.borderColor = "var(--tertiary)";
        outcomeBadge.style.backgroundColor = "rgba(212, 184, 150, 0.06)";
      }
    }

    checkboxes.forEach(cb => { cb.onchange = updateScale; });
    updateScale(); // initialize
  }

  // Module B: Analysis Workshop Rendering
  function renderPartB(container) {
    const slides = [
      {
        title: `ISO 14971:2019 +A11:2021`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Analysis Workshop</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">ISO 14971:2019 +A11:2021</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              ISO 14971:2019 +A11:2021 is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Session Overview`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">~40 min</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Phase 1: Examples and Techniques</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk analysis examples + Techniques to support risk analysis</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">~20 min</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Phase 2: Hands-on Exercise (Breakout rooms)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Complete the risk analysis matrix.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">~20 min</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Phase 3: Review & Discussion</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Present results, discuss challenges, and review learnings.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Session Overview</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Session Overview is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Quick Recap: Risk Assessment and Control`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Identification</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard, Sequence of Events,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazardous Situation, Harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→ Risk Estimation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">+ Evaluation</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">P, S,</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Acceptable?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→ Risk Control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Measures</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Control Measures (RCM),</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Implementation,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Effectiveness</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">→ Residual Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Assessment</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual P & S,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Residual Risk Acceptable?,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Benefit-Risk, New Risks?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key Reminders</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard ≠ Harm. A hazard is a potential source of harm. The harm is the actual injury or damage (to people, property, or environment)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk control measures (RCM): Always consider the 3-tier hierarchy (Safety by design; Protective measures; Information for safety)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of Risk Control Measures: Implementation (did you DO it?), is different from effectiveness (does it WORK?)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Quick Recap: Risk Assessment and Control</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Quick Recap: Risk Assessment and Control is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `What it can look like in practice →`,
        content: ``,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">What it can look like in practice →</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              What it can look like in practice → is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Risk Analysis Matrix (1/2)`,
        content: `
          <p class="mb-4">Here is the initial risk assessment for the <strong>PLLA dermal filler</strong> before implementing risk controls. Scroll and review the rows below.</p>
          <div class="overflow-x-auto border border-outline-variant rounded mb-4 max-h-[300px]">
            <table class="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr class="bg-surface-container-high border-b border-outline-variant font-bold text-primary">
                  <th class="p-3">Ref ID</th>
                  <th class="p-3">Sequence of Events / Hazard</th>
                  <th class="p-3">Harm</th>
                  <th class="p-3">Initial Risk (S × P)</th>
                  <th class="p-3">Acceptability</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-001</td>
                  <td class="p-3">Superficial injection → Microsphere aggregation in upper dermis</td>
                  <td class="p-3">Late-onset nodule formation (visible bumps)</td>
                  <td class="p-3 text-error">S3 / P4</td>
                  <td class="p-3 text-error font-bold">NOT-ACC</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-002</td>
                  <td class="p-3">Vessel puncture during injection → Microspheres enter facial artery</td>
                  <td class="p-3">Vascular occlusion (tissue necrosis or blindness)</td>
                  <td class="p-3 text-error">S4 / P3</td>
                  <td class="p-3 text-error font-bold">NOT-ACC</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-003</td>
                  <td class="p-3">Reconstitution volume confusion → Concentration error</td>
                  <td class="p-3">Adverse tissue reaction</td>
                  <td class="p-3 text-error">S3 / P3</td>
                  <td class="p-3 text-error font-bold">NOT-ACC</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-004</td>
                  <td class="p-3">Aseptic technique failure → Bacterial bioburden</td>
                  <td class="p-3">Injection-site infection / Septic shock</td>
                  <td class="p-3 text-error">S5 / P3</td>
                  <td class="p-3 text-error font-bold">NOT-ACC</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-005</td>
                  <td class="p-3">Use beyond 72h window → CMC Carrier degradation</td>
                  <td class="p-3">Reduced efficacy (faster product absorption)</td>
                  <td class="p-3 text-on-surface-variant">S2 / P3</td>
                  <td class="p-3 text-primary font-bold">ACC</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
        infographic: ``,
        isWide: true
      },
      {
        title: `Risk Analysis Matrix (2/2)`,
        content: `
          <p class="mb-4">Now, risk controls (RCMs) are applied and verified. Review the residual risks and references.</p>
          <div class="overflow-x-auto border border-outline-variant rounded mb-4 max-h-[350px]">
            <table class="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr class="bg-surface-container-high border-b border-outline-variant font-bold text-primary">
                  <th class="p-3">Ref ID</th>
                  <th class="p-3">Risk Control Measure (RCM)</th>
                  <th class="p-3">Verification Details</th>
                  <th class="p-3">Residual Risk (S × P)</th>
                  <th class="p-3">Acceptability</th>
                  <th class="p-3">B-R / SOTA Ref</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-001</td>
                  <td class="p-3">IFU depth limits, training module, cannula indication</td>
                  <td class="p-3">VOI: DVR-045 Drawing<br>VOE: RPT-061 Usability Study</td>
                  <td class="p-3 text-primary">S3 / P2</td>
                  <td class="p-3 text-primary font-bold">ACC</td>
                  <td class="p-3">N/A (Reduced to ACC)</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-002</td>
                  <td class="p-3">Aspiration guidance in IFU, restriction to medical experts</td>
                  <td class="p-3">VOI: IFU Spec DVR-050<br>VOE: RPT-065 Clinical Study</td>
                  <td class="p-3 text-primary">S4 / P1</td>
                  <td class="p-3 text-primary font-bold">ACC</td>
                  <td class="p-3">N/A (Reduced to ACC)</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-003</td>
                  <td class="p-3">Color-coded vial label, unique syringe size configuration</td>
                  <td class="p-3">VOI: BOM Specification DVR-051<br>VOE: RPT-067 Label Usability</td>
                  <td class="p-3 text-primary">S3 / P1</td>
                  <td class="p-3 text-primary font-bold">ACC</td>
                  <td class="p-3">N/A (Reduced to ACC)</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-004</td>
                  <td class="p-3">Single-use vial, aseptic process controls, sterile filter</td>
                  <td class="p-3">VOI: Drawing DVR-048<br>VOE: RPT-058 Bioburden Study</td>
                  <td class="p-3 text-error">S5 / P1</td>
                  <td class="p-3 text-error font-bold">NOT-ACC</td>
                  <td class="p-3 text-tertiary font-bold underline cursor-pointer" onclick="navigateTo('partA'); state.partASlide = 56; updateProgress();">BRA-004 (Weighed in BRA)</td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-3 text-primary">R-005</td>
                  <td class="p-3">IFU discard instructions, vial use-by print</td>
                  <td class="p-3">VOI: Label spec DVR-055<br>VOE: RPT-070 Usability study</td>
                  <td class="p-3 text-primary">S2 / P1</td>
                  <td class="p-3 text-primary font-bold">ACC</td>
                  <td class="p-3">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
        infographic: ``,
        isWide: true
      },
      {
        title: `ISO/TR 24971 Annex B`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Analysis techniques</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Methods to support risk analysis</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">ISO/TR 24971 Annex B</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              ISO/TR 24971 Annex B is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Risk analysis techniques`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971 dives deeper into various techniques to support risk analysis, including the following:</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Early development stage</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>PHA - Preliminary Hazard Analysis</li>
          <li>FT A - Fault Tree Analysis</li>
          <li>ETA - Event Tree Analysis</li>
          <li>HAZOP - Hazard and Operability Study</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Late development stage</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>FMEA - Failure Mode and Effects Analysis (FMEA)</li>
          <li>HACCP - Hazard Analysis and Critical Control Point</li>
          </ul>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk analysis techniques</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk analysis techniques is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Preliminary Hazard Analysis (PHA)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971:2020, Annex B.2  | Best for: Early design phase</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What is it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The traditional ISO14971 risk analysis workflow;</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>identify hazards,</li>
          <li>events,</li>
          <li>hazardous situations, and</li>
          <li>potential harms.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When and why use it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When: At the very START of development, when detailed design information is</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">limited, and prior to establishing Design Input requirements (Risk Controls).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why: To establish a baseline of all known and foreseeable hazards before</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">investing in detailed design. PHA outputs feed directly into your ISO 14971 risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">analysis and guide where to focus engineering effort.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How to use it?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Assemble a cross-functional team (engineering, quality, clinical, regulatory)</li>
          <li>Define intended use and reasonably foreseeable misuse</li>
          <li>Identify hazards - Considering materials, components, interfaces, operating</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">principles, and use environment, etc.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>For each identified hazard, describe sequence of events, hazardous situation,</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">and harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Estimate initial risk (P and S) and identify potential risk controls</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Record in a tabular format - update iteratively as design matures</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Refer to next slide  →</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Preliminary Hazard Analysis (PHA)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Preliminary Hazard Analysis (PHA) is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `PHA Example: Implantable Cardiac Pacemaker`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Preliminary Hazard Analysis - identifying hazards, hazardous situations, and harms in early design phase</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard Sequence of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Events</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazardous</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Situation Harm P S Initial Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Control Ideas</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Biocompatibility Lead insulation material degrades over</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">time; toxic compounds lea ch into</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">surrounding tissue</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Patient's cardiac tissue is exposed to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">toxic degradation products from the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">device lead</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Chronic inflammation P3 S4 Biocompatible material selection</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">per ISO 10993; accelerated ageing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">testing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Electromagnetic</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazard</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Patient enters MRI environment;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">pacema ker a ntenna effect causes lead</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">tip heating</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Excessive thermal energy is delivered to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">the myocardium (heart muscle) at the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">lead tip</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Myocardial damage P3 S5 MR-conditional design;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">filtered lead; IFU warnings about</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">MRI exposure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Electrical</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazard</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Battery approaches end -of-life; voltage</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">drops below minimum pacing threshold</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Pacemaker -dependent patient does not</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">receive pacing stimulus when needed</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Cardiac  arrest P2 S5 Elective Replacement Indicator</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(ERI); remote monitoring alert; IFU</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">replacement schedule</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key characteristics of a PHA table:  The PHA captures the complete chain from hazard to harm, with initial risk estimates and early control ideas. It is deliberately high-level</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>you refine it as the design matures. The team should include clinical, engineering, quality, and regulatory perspectives. Each row represents one hazard-to-harm pathway.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">A single hazard can appear in multiple rows with different sequences leading to different harms.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">edit_document</span>
            <h3 class="font-serif text-headline-lg mb-2 text-on-surface">Early-stage Baseline</h3>
            <p class="text-xs text-on-surface-variant mb-4 leading-relaxed">
              PHA serves as a baseline spreadsheet before detailed system engineering begins. It defines what safety requirements the design team must implement.
            </p>
            <div class="p-3 bg-surface-container rounded border border-outline-variant text-xs font-mono text-primary">
              PHA → Design Inputs → FMEA
            </div>
          </div>
        `,
        isWide: false
      },
      {
        title: `Fault Tree Analysis (FTA) IEC 61025`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971:2020, Annex B.3  | Best for: Finding causes of a known undesired consequence/harm (or hazardous situation)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What is it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">A deductive (top-down) technique that starts with a known undesired</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">consequence - the 'top event' (e.g. a specific harm or hazardous situation) - and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">works backwards to find all possible combinations of causes.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The result is a tree-shaped diagram using logic gates (AND / OR) showing how</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">lower-level events combine to cause the top event.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When and why use it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When: Use when you need to deeply investigate a specific critical consequence</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>particularly one with high severity (e.g., patient death, blindness).</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why: Finding all causes of a single selected harm / undesired consequence.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">FTA can illustrate when two or more events must occur together to create the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">consequence. Also great for PMS investigations (root cause analysis).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How to use it?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Define the top event precisely (e.g. 'patient receives overdose')</li>
          <li>Ask: 'What could cause this?' - identify immediate causes</li>
          <li>Connect causes with logic gates: OR (any single cause sufficient) or AND</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(multiple causes required together)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Continue decomposing each cause until you reach basic events (component</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">failures, human errors, environmental conditions)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Identify critical paths for risk control focus</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Top event: 'Patient receives drug overdose from infusion pump.'</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The tree reveals this requires EITHER a software dosing error OR a flow sensor</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">failure AND a missing alarm. The AND gate shows two independent safeguards</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">must both fail - this insight helps justify the residual risk level and guides testing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">priorities.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Fault Tree Analysis (FTA) IEC 61025</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Fault Tree Analysis (FTA) IEC 61025 is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `FTA Example: Infusion Pump Drug Overdose`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Fault Tree Analysis - working backwards from a top event through AND/OR logic gates to find root causes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Patient receives drug overdose (Harm)</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">OR</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Software calculates</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">incorrect dose</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Excessive flow rate</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">delivered to patient</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">AND</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Flow sensor</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">fails</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Occlusion alarm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">does not trigger</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">OR</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Programming</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">error</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Drug library</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">database error</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">OR Any single cause is sufficient AND All causes must occur together</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key insight: The AND gate on the right branch means BOTH the flow sensor AND the alarm must fail for an overdose via that path. This is wh y redundant safeguards reduce risk - the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">probability is P(sensor) x P(alarm), which is much lower than either alone. The OR gate means any single software error path is sufficient to cause the overdose - a higher-priority area</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">for risk control.</p>
          <p class="text-xs text-primary font-mono uppercase mb-2">Interactive Simulator: Infusion Pump Overdose</p>
          <p class="text-xs text-on-surface-variant mb-4">Toggle the failure switches below to see how they impact the top event.</p>
          
          <div class="space-y-2 bg-surface-container-high p-4 rounded border border-outline-variant">
            <label class="flex items-center justify-between text-xs cursor-pointer">
              <span class="text-on-surface-variant">Flow Sensor Fails</span>
              <input type="checkbox" id="fta-sensor" class="fta-toggle form-checkbox rounded text-primary">
            </label>
            <label class="flex items-center justify-between text-xs cursor-pointer">
              <span class="text-on-surface-variant">Occlusion Alarm Fails</span>
              <input type="checkbox" id="fta-alarm" class="fta-toggle form-checkbox rounded text-primary">
            </label>
            <label class="flex items-center justify-between text-xs cursor-pointer">
              <span class="text-on-surface-variant">Software Dosing calculation bug</span>
              <input type="checkbox" id="fta-software" class="fta-toggle form-checkbox rounded text-primary">
            </label>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-4">
            <h4 class="font-mono text-primary text-xs uppercase mb-4">FTA Interactive Tree</h4>
            <svg viewBox="0 0 300 220" class="w-full max-w-[260px] h-auto">
              <!-- Top Event -->
              <rect x="90" y="10" width="120" height="35" rx="2" fill="#2a2a2a" stroke="#859490" stroke-width="1.5" id="fta-top-rect"></rect>
              <text x="150" y="25" text-anchor="middle" fill="#ffb4ab" font-size="8" font-family="Space Grotesk" id="fta-top-text">OVERDOSE DELIVERED</text>
              
              <!-- Connection Lines -->
              <line x1="150" y1="45" x2="150" y2="70" stroke="#859490" stroke-width="1.5"></line>
              <line x1="150" y1="70" x2="60" y2="70" stroke="#859490" stroke-width="1.5"></line>
              <line x1="150" y1="70" x2="240" y2="70" stroke="#859490" stroke-width="1.5"></line>
              
              <line x1="60" y1="70" x2="60" y2="120" stroke="#859490" stroke-width="1.5"></line>
              <line x1="240" y1="70" x2="240" y2="100" stroke="#859490" stroke-width="1.5"></line>
              <line x1="240" y1="120" x2="200" y2="120" stroke="#859490" stroke-width="1.5"></line>
              <line x1="240" y1="120" x2="280" y2="120" stroke="#859490" stroke-width="1.5"></line>
              <line x1="200" y1="120" x2="200" y2="160" stroke="#859490" stroke-width="1.5"></line>
              <line x1="280" y1="120" x2="280" y2="160" stroke="#859490" stroke-width="1.5"></line>
 
              <!-- OR Gate (Left Branch) -->
              <polygon points="45,95 75,95 60,78" fill="#3cddc7" id="fta-or-gate"></polygon>
              <text x="60" y="110" text-anchor="middle" fill="#bacac5" font-size="8" font-family="Space Grotesk">OR</text>
 
              <!-- AND Gate (Right Branch) -->
              <rect x="225" y="90" width="30" height="20" rx="2" fill="#57f1db" id="fta-and-gate"></rect>
              <text x="240" y="102" text-anchor="middle" fill="#003731" font-size="8" font-family="Space Grotesk">AND</text>
 
              <!-- Node Boxes -->
              <!-- Software error -->
              <rect x="15" y="145" width="90" height="30" rx="2" fill="#1c1b1b" stroke="#3c4a46" id="box-software"></rect>
              <text x="60" y="163" text-anchor="middle" fill="#bacac5" font-size="7">Software Bug</text>
 
              <!-- Flow Sensor Fails -->
              <rect x="155" y="145" width="90" height="30" rx="2" fill="#1c1b1b" stroke="#3c4a46" id="box-sensor"></rect>
              <text x="200" y="163" text-anchor="middle" fill="#bacac5" font-size="7">Sensor Fails</text>
 
              <!-- Alarm fails -->
              <rect x="250" y="145" width="45" height="30" rx="2" fill="#1c1b1b" stroke="#3c4a46" id="box-alarm"></rect>
              <text x="272" y="163" text-anchor="middle" fill="#bacac5" font-size="7">Alarm Fails</text>
            </svg>
            <div class="mt-4 text-xs font-mono text-on-surface" id="fta-status-text">
              Status: Safe (No failures active)
            </div>
          </div>
        `,
        isWide: false
      },
      {
        title: `Event Tree Analysis (ETA) IEC 62502`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971:2020, Annex B.4  |  Best for: Tracing various outcomes of an initiating event (and calculating their probabilities)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What is it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">An inductive (bottom-up) technique that starts with an initiating event (e.g., a</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">device malfunction or use error) and traces all possible outcomes forward</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">through a branching tree.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When and why use it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When: Use when you want to understand ALL the possible consequences of a</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">specific triggering event, including how existing safeguards change the</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">outcome.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why: ETA maps the 'what happens next' chain. It is the natural complement to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">FTA: FTA answers 'what causes this event?', ETA answers 'what happens after</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">this event?' Together they provide a complete picture.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How to use it?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Identify the initiating event (device malfunction, use error, external event)</li>
          <li>List the subsequent events (e.g., safeguards) in chronological order</li>
          <li>For each event, branch into 'works' (top) and 'fails' (bottom)</li>
          <li>Trace each path to its end outcome</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Assign probabilities to each branch if data is available</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Calculate end-state probabilities by multiplying along each path</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">7. Identify which events/safeguard failures lead to the most severe outcomes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Initiating event: 'Ventilator pressure sensor fails' (possible lung damage)</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Safeguards:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">1) Software alarm triggers?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">2) Clinician responds?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3) Backup pressure relief valve opens?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Tracing all yes/no combinations gives various outcomes. This shows which</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">safeguards are most critical to maintain.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Event Tree Analysis (ETA) IEC 62502</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Event Tree Analysis (ETA) IEC 62502 is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `ETA Example: Ventilator Pressure Sensor Failure`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">3</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Event Tree Analysis - tracing forward from an initiating event through events (e.g., safety barriers) to all possible outcomes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Initiating</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Event</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Software</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">High-Pressure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Alarm?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Clinician</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Responds</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">in Time?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Mechanical</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Pressure Relief</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Valve Opens?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Outcome</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Pressure sensor</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">fails</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Yes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">No</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Yes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">No harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(alarm + response)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">No Yes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Minor harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(brief overpressure)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">No Serious harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(barotrauma, damage to lungs)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Yes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Moderate harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(undetected overpressure)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">No Critical harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(barotrauma)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Reading the tree: Follow each path from left to right. Every 'Yes' (barrier works) moves the outcome towards safety; every 'No' (barrier fails) moves towards harm. The</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">worst case (bottom right) requires ALL three barriers to fail simultaneously. If you can show each barrier has independent reliability, the combined probability of the worst</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">case is extremely low. ETA reveals which barriers contribute most to safety and where redundancy is valuable.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Serious harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(barotrauma, damage to lungs)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Yes</p>
          <p class="text-xs text-primary font-mono uppercase mb-2">Interactive Path Tracer: Ventilator Pressure Failure</p>
          <p class="text-xs text-on-surface-variant mb-4">Click "Yes" or "No" to decide if the safeguard barriers work, and see the clinical outcome.</p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
            <button class="p-2 bg-surface-container-high rounded border border-primary/20 text-primary" id="eta-btn-alarm">Alarm works?</button>
            <button class="p-2 bg-surface-container-high rounded border border-primary/20 text-primary" id="eta-btn-response">Clinician responds?</button>
            <button class="p-2 bg-surface-container-high rounded border border-primary/20 text-primary" id="eta-btn-valve">Valve opens?</button>
          </div>
          <div class="p-3 bg-surface-container rounded border border-outline-variant text-xs text-on-surface" id="eta-choice-summary">
            Current Path: Sensor Fails → Alarm (Yes) → Clinician (Yes) → Valve (Yes)
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-4">
            <h4 class="font-mono text-primary text-xs uppercase mb-4">ETA Branching Diagram</h4>
            <div class="w-full bg-surface-container p-4 rounded border border-outline-variant text-xs space-y-3 font-mono">
              <div class="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-on-surface">
                <span>1. Alarm triggers?</span>
                <span class="text-primary font-bold" id="eta-status-alarm">YES</span>
              </div>
              <div class="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-on-surface">
                <span>2. Clinician responds?</span>
                <span class="text-primary font-bold" id="eta-status-response">YES</span>
              </div>
              <div class="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-on-surface">
                <span>3. Pressure valve opens?</span>
                <span class="text-primary font-bold" id="eta-status-valve">YES</span>
              </div>
              <div class="flex justify-between items-center pt-2 text-sm text-on-surface">
                <span>Outcome:</span>
                <span class="text-primary font-bold font-serif" id="eta-outcome-text">NO HARM</span>
              </div>
            </div>
            <p class="text-[10px] text-on-surface-variant mt-4 text-center">Failing multiple barriers in sequence leads to barotrauma lung damage.</p>
          </div>
        `,
        isWide: false
      },
      {
        title: `ETA Example: Probability of Various Harms`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Event Tree Analysis is especially powerful when you can assign <strong>failure probabilities</strong> to each safeguard barrier. Multiplying probabilities along each path gives you the quantified risk for each outcome.</p>
          <p class="text-xs text-primary font-sans font-semibold uppercase mb-2">Ventilator Pressure Sensor Failure — Quantified ETA</p>
          <p class="text-xs text-on-surface-variant mb-3">Assumptions: P(alarm fails) = 0.10 | P(clinician non-response) = 0.20 | P(valve fails) = 0.05</p>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-surface-container-high text-primary font-sans font-semibold">
                  <th class="p-2 border border-outline-variant">Alarm?</th>
                  <th class="p-2 border border-outline-variant">Clinician?</th>
                  <th class="p-2 border border-outline-variant">Valve?</th>
                  <th class="p-2 border border-outline-variant">Outcome</th>
                  <th class="p-2 border border-outline-variant">Path Probability</th>
                </tr>
              </thead>
              <tbody class="text-on-surface-variant">
                <tr class="border-b border-outline-variant/30">
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">YES (0.90)</td>
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">YES (0.80)</td>
                  <td class="p-2 border border-outline-variant">—</td>
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">No Harm</td>
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">0.90 × 0.80 = <strong>72.0%</strong></td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">YES (0.90)</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">NO (0.20)</td>
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">YES (0.95)</td>
                  <td class="p-2 border border-outline-variant" style="color:var(--tertiary)">Minor Harm</td>
                  <td class="p-2 border border-outline-variant" style="color:var(--tertiary)">0.90 × 0.20 × 0.95 = <strong>17.1%</strong></td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">YES (0.90)</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">NO (0.20)</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">NO (0.05)</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">Serious Harm</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">0.90 × 0.20 × 0.05 = <strong>0.9%</strong></td>
                </tr>
                <tr class="border-b border-outline-variant/30">
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">NO (0.10)</td>
                  <td class="p-2 border border-outline-variant">—</td>
                  <td class="p-2 border border-outline-variant" style="color:#7ab89a">YES (0.95)</td>
                  <td class="p-2 border border-outline-variant" style="color:var(--tertiary)">Moderate Harm</td>
                  <td class="p-2 border border-outline-variant" style="color:var(--tertiary)">0.10 × 0.95 = <strong>9.5%</strong></td>
                </tr>
                <tr>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">NO (0.10)</td>
                  <td class="p-2 border border-outline-variant">—</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82">NO (0.05)</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82;font-weight:bold">Critical Harm</td>
                  <td class="p-2 border border-outline-variant" style="color:#f28b82;font-weight:bold">0.10 × 0.05 = <strong>0.5%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-[10px] text-on-surface-variant italic">Key insight: The worst-case path (critical harm) requires the sensor <em>and</em> alarm <em>and</em> valve to all fail — reducing to just 0.5%. The most common residual risk is minor harm (17.1%) when the clinician misses the alarm but the valve saves the day.</p>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant">
            <h4 class="font-sans text-xs font-bold text-primary uppercase mb-4 tracking-wider">Outcome Probability Distribution</h4>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs font-sans mb-1"><span style="color:#7ab89a">No Harm</span><span style="color:#7ab89a">72.0%</span></div>
                <div class="h-3 rounded" style="background:rgba(131,152,150,0.15)"><div class="h-3 rounded" style="background:#7ab89a;width:72%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-sans mb-1"><span style="color:var(--tertiary)">Minor Harm</span><span style="color:var(--tertiary)">17.1%</span></div>
                <div class="h-3 rounded" style="background:rgba(131,152,150,0.15)"><div class="h-3 rounded" style="background:var(--tertiary);width:17.1%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-sans mb-1"><span style="color:var(--tertiary)">Moderate Harm</span><span style="color:var(--tertiary)">9.5%</span></div>
                <div class="h-3 rounded" style="background:rgba(131,152,150,0.15)"><div class="h-3 rounded" style="background:var(--tertiary);opacity:0.7;width:9.5%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-sans mb-1"><span style="color:#f28b82">Serious Harm</span><span style="color:#f28b82">0.9%</span></div>
                <div class="h-3 rounded" style="background:rgba(131,152,150,0.15)"><div class="h-3 rounded" style="background:#f28b82;width:0.9%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-sans mb-1"><span style="color:#f28b82;font-weight:bold">Critical Harm</span><span style="color:#f28b82;font-weight:bold">0.5%</span></div>
                <div class="h-3 rounded" style="background:rgba(131,152,150,0.15)"><div class="h-3 rounded" style="background:#f28b82;width:0.5%"></div></div>
              </div>
            </div>
            <p class="text-[10px] text-on-surface-variant mt-4 italic">Probabilities sum to ~100%. This quantified view helps prioritize which barrier to improve first.</p>
          </div>
        `,
        isWide: true
      },
      {
        title: `Failure Mode and Effects Analysis (FMEA)   IEC 60812`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">4</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971:2020, Annex B.5  |  Best for: Systematic component/process failure analysis. How can this component fail, and what are the effects?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What is it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">A system reliability technique that examines components or process steps and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">asks: 'How could this fail, and what are the effects?'</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">For each failure mode, the causes, effects, and severity are documented.</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Design FMEA (dFMEA) for product design</li>
          <li>Process FMEA (pFMEA), e.g., for manufacturing process or other QMS</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">processes.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When and why use it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When: Use during mature development phase when you have enough design</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">detail to analyse individual components (or process steps).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why: FMEA is excellent at catching single-fault conditions systematically.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">However, FMEA alone is NOT sufficient for ISO 14971 compliance - it analyses</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">fault conditions only, not normal-use hazards.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How to use it?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Define the scope: Design FMEA (components) or Process FMEA</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(manufacturing steps)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>For each item, list all potential failure modes</li>
          <li>For each failure mode, identify: cause(s), effect(s), Severity (S)</li>
          <li>Estimate Probability of occurrence (P) and Detectability (D)</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Estimate risks by established criteria, or RPN = S*P*D (temporarily for FMEA)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Define risk control measures</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">7. Transfer findings to ISO14971 risk analysis records</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">pFMEA for catheter tip bonding:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Failure mode = 'incomplete bond.'</li>
          <li>Cause = insufficient dwell time in heat station.</li>
          <li>Effect = tip separation during use.</li>
          <li>Severity = critical (vessel perforation).</li>
          <li>Controls: validated bonding parameters + 100% pull-test.</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The pFMEA ensures every manufacturing step has been challenged for failure.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Failure Mode and Effects Analysis (FMEA)   IEC 60812</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Failure Mode and Effects Analysis (FMEA)   IEC 60812 is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `FMEA Example: Design FMEA for Catheter Assembly`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Failure Mode and Effects Analysis - systematically examining each component for failure modes, causes, and effects</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Component Function Failure Mode Cause of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Failure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Effect of</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Failure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">S P Risk</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Acc?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk Control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Balloon Dilate vessel lumen to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">target diameter</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Balloon rupture during</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">inflation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Material defect;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">over-inflation beyond burst</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">pressure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Vessel wall injury;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">retained fragments</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">S4 P2 NOT</h4>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">ACC</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Burst pressure testing per lot; max</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">inflation pressure in IFU; material</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">incoming inspection</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Tip bond Secure distal tip to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">catheter shaft</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Incomplete bond (tip</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">separation)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Insufficient heat dwell time</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">in bonding process</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Tip embolisation;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">vessel occlusion</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">S5 P2 NOT</h4>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">ACC</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Validated bonding parameters;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">100% pull-test; X-ray inspection</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Guidewire</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">lumen</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Allow guidewire passage</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">for navigation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Lumen kink or collapse Excessive bending beyond</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">min. radius during procedure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Inability to advance or</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">withdraw guidewire</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">S3 P3 NOT</h4>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">ACC</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Kink resistance testing; braided</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">shaft reinforcement; minimum</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">bend radius in IFU</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">FMEA vs ISO 14971 risk analysis:  Notice the FMEA focuses on component failures. These are fault conditions only. A device can work perfectly and still pose hazards during</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">normal use (e.g. vessel perforation during normal catheter navigation). That is why FMEA alone does not satisfy ISO 14971 - you need PHA or equivalent to capture normal-</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">use hazards. Use FMEA as a complementary tool feeding into your overall risk analysis.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant">
            <h3 class="font-serif text-headline-lg text-primary mb-3">Catheter FMEA Examples</h3>
            <div class="space-y-3">
              <div class="p-3 bg-surface-container rounded border border-outline-variant text-xs text-on-surface">
                <span class="font-bold block text-tertiary">Balloon Rupture (Material Defect)</span>
                <p class="text-on-surface-variant text-[11px] mt-1">Severity: S4 (Vessel Injury). Control: Burst pressure lot testing.</p>
              </div>
              <div class="p-3 bg-surface-container rounded border border-outline-variant text-xs text-on-surface">
                <span class="font-bold block text-tertiary">Tip Separation (Bonding Fault)</span>
                <p class="text-on-surface-variant text-[11px] mt-1">Severity: S5 (Embolization). Control: Validated heat dwell time & pull-test.</p>
              </div>
            </div>
          </div>
        `,
        isWide: false
      },
      {
        title: `Hazard and Operability Study (HAZOP) IEC 61882`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971:2020, Annex B.6  |  Best for: multi-step processes with defined design intent. Can also be applied to the operation of a medical device.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What is it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">A structured technique that systematically identifies deviations from design</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">intent using 'guide words' applied to process parameters. HAZOP assumes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">hazardous situations are caused by design deviations or operational variations.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Guide words (More, Less, Early, Late, etc) are combined with parameters (flow,</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">temperature, concentration, time, etc) to generate 'what if'-scenarios.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Each credible deviation is then assessed for consequences.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When and why use it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When: To analyze multi-step processes where each step has a defined design</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">intent (e.g., manufacturing), or to analyze e.g., methods used for the diagnosis</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">or treatment of disease. Can be performed early in development, but requires</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">established design requirements (design intent).</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why: Forces structured 'what if' thinking that catches deviations that might not</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">otherwise be considered. It is particularly strong at identifying operability</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">problems and use errors that arise from process parameter variations.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How to use it?</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Define the nodes to analyze (distinct process steps or device functions)</li>
          <li>For each node, identify the design intent and key parameters</li>
          <li>Apply guide words to each parameter (e.g. 'No flow', 'More temperature')</li>
          <li>For each credible deviation: identify causes, consequences, and existing</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">safeguards</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Assess risk level and identify risk controls</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Transfer relevant findings to ISO14971 risk analysis records</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example - HAZOP on a sterile filling process</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Node (a distinct step in a process): "Transfer solution to vials"</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Parameter: Temperature.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Guide word: 'More.'</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Deviation: 'Solution temperature too high during fill.'</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Consequence: Protein degradation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Cause: Heat exchanger malfunction.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Control: Inline temperature sensor with automatic fill-stop.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Hazard and Operability Study (HAZOP) IEC 61882</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Hazard and Operability Study (HAZOP) IEC 61882 is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `HAZOP Example: Sterile Filling Process`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard and Operability Study - applying guide words to process parameters to find deviations from design intent</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Node (distinct process step): Transfer sterile solution from bulk tank to vials   →   Design Intent: Deliver 5.0 mL ± 0.1 mL per vial at 20°C ± 2°C</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Parameter Guide</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Word</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Deviation Possible Cause Consequence Existing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Safeguard</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Action</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Required?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Volume More Fill volume</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">> 5.1 mL</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Pump calibration drift; valve sticking</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">open</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Overfill: product waste; potential</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">vial overflow contamination</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">In-line volume check; reject</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">station</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Validate check</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">weight limits</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Volume Less Fill volume</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">< 4.9 mL</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Pump wear; air bubble in line; partial</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">blockage</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Underfill: sub-therapeutic dose to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">patient</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">In-line volume check; reject</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">station</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Add bubble</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">detector</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Volume No No fill</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">delivered</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Pump failure; upstream valve closed;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">tank empty</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Empty vial reaches patient; no</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">treatment</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Weight check rejects empty</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">vials</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Add tank level</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">alarm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Temperature More Solution</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">> 22°C</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Heat exchanger fault; ambient</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">temperature rise</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Material degradation In-line temperature sensor Auto-stop if</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">temperature exceeded</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Temperature Less Solution</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">< 18°C</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Chiller over-cooling; w inter conditions Viscosity change; fill accuracy</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">affected</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">In-line temperature sensor Low temp.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">alarm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The guide word system:  By systematically combining each parameter (volume, temperature, time, pressure, etc) with each guide word (No, More, Less, Reverse, Other</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Than, Early, Late), the team ensures no deviation is overlooked. The highlighted guide words force structured thinking.</p>
          <p class="mb-4">Apply guide words to parameters to find deviations.</p>
          <div class="grid grid-cols-3 gap-2" id="hazop-selector">
            <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono active text-primary" data-p="Volume" data-gw="Less">Less Volume</button>
            <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono" data-p="Volume" data-gw="More">More Volume</button>
            <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono" data-p="Temperature" data-gw="More">More Temp</button>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant" id="hazop-details-panel">
            <h3 class="font-serif text-headline-lg text-primary mb-2" id="hazop-title">Deviation: Less Volume</h3>
            <div class="space-y-2 text-xs text-on-surface-variant">
              <p><strong>Possible Cause:</strong> Pump wear, air bubble in line, partial blockage.</p>
              <p><strong>Consequence:</strong> Underfill vial, resulting in a sub-therapeutic dose to the patient.</p>
              <p><strong>Safeguard:</strong> In-line checkweigher, automatic reject station.</p>
              <p class="text-primary"><strong>Action Required:</strong> Add bubble detector to inlet line.</p>
            </div>
          </div>
        `,
        isWide: false
      },
      {
        title: `Hazard Analysis & Critical Control Points (HACCP)`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO/TR 24971:2020, Annex B.7  |  Systematic, process-focused  |  Best for: critical process control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">What is it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">A 7-step systematic approach that identifies hazards in a process, determines</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Critical Control Points (CCPs) where control is essential, and establishes</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">monitoring systems to ensure ongoing safety.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Originally developed for food safety, HACCP focuses on prevention through</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">process control rather than reliance on end-product testing alone.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When and why use it?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">When: Use for manufacturing processes where specific steps are critical to</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">product safety and must be continuously monitored and controlled.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Why: HACCP goes beyond identifying hazards - it establishes the ongoing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">monitoring, limits, and actions needed to maintain control.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">How to use it?</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">The 7 HACCP principles:</h4>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Conduct a hazard analysis for each process step (identify hazards & haz. sit.)</li>
          <li>Determine Critical Control Points (CCPs)</li>
          <li>Establish appropriate limits for each CCP</li>
          <li>Establish monitoring procedures for each CCP</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Establish corrective and preventive actions when limits are exceeded (RCM)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. Establish verification procedures</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">7. Establish documentation and record keeping</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Example</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">HACCP for freeze-drying process</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">CCP #1: Chamber temperature during drying. Critical limit: -25°C to -20°C.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Monitoring: Continuous temperature logging.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Corrective action: If temperature exceeds limit, quarantine batch and</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">investigate.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification: Monthly calibration.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">This ensures product safety is built into the process, not just tested at the end.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Hazard Analysis & Critical Control Points (HACCP)</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Hazard Analysis & Critical Control Points (HACCP) is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `HACCP Example: Sterile Medical Device Manufacturing`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard Analysis & Critical Control Points - identifying CCPs in a manufacturing process and establishing monitoring</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Raw Material</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Receiving</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Compounding</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">& Mixing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Sterile</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Filtration</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">CCP-1</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Aseptic</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Filling</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">CCP-2</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Freeze drying</p>
          <h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">CCP-3</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Stoppering</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">& Capping</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">CCP-1: Sterile Filtration</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard: Bioburden / sterility</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Critical Limit: 0.22 µm filter integrity test ≥ 3,450 mbar</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Monitoring: Pre- and post-use filter integrity test</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Corrective Action: Quarantine batch; re-filter through</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">new validated filter</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification: Annual filter validation; trend of integrity</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">test results</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">CCP-2: Aseptic Filling</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard: Particulate contamination</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Critical Limit: ISO 5 environment; < 3,520 particles/m³ (≥</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">0.5µm)</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Monitoring: Continuous particle counter</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Corrective Action: Stop fill; investigate source; repeat</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">media fill qualification</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification: Semi-annual media fill; environmental</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">monitoring trends</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">CCP-3: Freeze drying</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Hazard: Chemical/physical instability</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Critical Limit: Shelf temp: -25°C to -20°C primary;</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">chamber pressure < XXX</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Monitoring: Continuous temperature sensor + Pressure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">sensor</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Corrective Action: Quarantine batch; stability testing</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">before release</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification: Monthly calibration; product stability</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">programme</p>
          <p class="text-xs text-on-surface-variant mb-4">Click the Critical Control Points (CCPs) in the process step pipeline below to inspect limits.</p>
          <div class="flex flex-col gap-2 font-mono text-xs">
            <div class="p-2 bg-surface-container rounded border border-outline-variant cursor-pointer hover:border-primary text-on-surface" onclick="window.showHaccp(1)">
              Step 2: Sterile Filtration <span class="float-right text-primary text-[10px]">CCP-1</span>
            </div>
            <div class="p-2 bg-surface-container rounded border border-outline-variant cursor-pointer hover:border-primary text-on-surface" onclick="window.showHaccp(2)">
              Step 3: Aseptic Filling <span class="float-right text-primary text-[10px]">CCP-2</span>
            </div>
            <div class="p-2 bg-surface-container rounded border border-outline-variant cursor-pointer hover:border-primary text-on-surface" onclick="window.showHaccp(3)">
              Step 4: Freeze Drying <span class="float-right text-primary text-[10px]">CCP-3</span>
            </div>
          </div>
        `,
        infographic: `
          <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant" id="haccp-details">
            <h3 class="font-serif text-headline-lg text-primary mb-3">Sterile Filtration (CCP-1)</h3>
            <div class="space-y-2 text-xs text-on-surface-variant">
              <p><strong>Hazard:</strong> Bacterial bioburden / product contamination.</p>
              <p><strong>Critical Limit:</strong> Integrity test bubble point ≥ 3,450 mbar.</p>
              <p><strong>Monitoring:</strong> Pre- and post-use filter integrity test.</p>
              <p><strong>Corrective Action:</strong> Quarantine batch, re-filter through a new sterile membrane.</p>
            </div>
          </div>
        `,
        isWide: false
      },
      {
        title: `There's at least one more effective risk analysis tool…`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">(ISO/TR 24971 does not mention it)</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">There's at least one more effective risk analysis tool…</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              There's at least one more effective risk analysis tool… is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Brainstorming with AI`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">( but keep confidential information to yourselves )</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Brainstorming with AI</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Brainstorming with AI is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Hands-on exercise`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Breakout rooms - Complete the Risk analysis matrix</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Hands-on exercise</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Hands-on exercise is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Phase 2: Hands-on Exercise`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">20 minutes  |  Download a copy of the Excel shared in the Teams chat</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Complete the risk analysis matrix</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Task (in groups of 3-5 persons)</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>For each pre-populated hazard, complete ALL remaining columns in the matrix</li>
          <li>Write out: Hazard → Sequence of Events → Hazardous Situation → Harm</li>
          <li>OPTIONAL (or skip, considering time limit): Estimate P and S using the scales provided, then determine if the initial risk is acceptable</li>
          <li>Define risk control measures using the RCM priority order</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">5. Document verification of BOTH implementation and effectiveness for each control</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">6. OPTIONAL (or skip, considering time limit): Estimate residual risk (P and S) after controls are applied</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">7. If residual risk is still not acceptable, note the benefit-risk reference</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">8. Always check: Does your risk control introduce any NEW risks?</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Phase 2: Hands-on Exercise</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Phase 2: Hands-on Exercise is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Phase 3: Review & Discussion`,
        content: `<h4 class="font-mono text-primary text-xs uppercase mt-4 mb-2">Let's review your risk analyses. Key questions to consider:</h4>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Is the hazardous situation distinct from the harm?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Common mistake: Conflating these. The situation is the exposure; the harm is the consequence.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Is the sequence of events specific and realistic?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Vague sequences like 'device fails' miss the point. Describe the actual chain of events.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Did you consider all 3 tiers of risk control?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Jumping to IFU warnings without documenting why design solutions were infeasible is an audit finding.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Did you verify both implementation AND effectiveness?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">The most common gap - verifying that a control exists is not the same as verifying it works.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Did any of your controls introduce new risks?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">This is easy to miss. Even minor new risks should be documented and assessed.</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Where residual risk is NOT acceptable - did you document the benefit-risk analysis?</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">For Annex XVI devices, benefit-risk arguments require extra care since the purpose is non-medical.</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Phase 3: Review & Discussion</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Phase 3: Review & Discussion is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Key Learnings`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Risk analysis is systematic - follow the sequence of events from hazard through to harm</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Always consider the risk control hierarchy - Prioritize inherent safety by design or manufacture</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Verification of implementation  and effectiveness are two separate required activities</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Post-market data continuously feed back into risk management - your risk analysis is a living document</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">EU 2022/2346 common specifications provide the specific risk catalogue for Annex XVI devices</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Key Learnings</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Key Learnings is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      },
      {
        title: `Questions & Feedback`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Part A + B Complete</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Please share your feedback on the training:    jonas.jagerback@orderlypeople.se</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Thank you!</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[64px] mb-4">school</span>
            <h3 class="font-serif text-headline-lg mb-2 text-on-surface">Module B Complete</h3>
            <p class="text-xs text-on-surface-variant mb-6">You have completed both training modules. Proceed to the Exams to verify your knowledge and earn your certificate.</p>
            <button class="px-6 py-3 bg-primary text-background font-mono text-xs uppercase font-bold rounded hover:bg-primary-container transition-all" onclick="window.goToQuizzes()">Go to Quizzes</button>
          </div>
        `,
        isWide: false
      },
      {
        title: `Risk Management & Clinical Investigation`,
        content: `<p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO 14155:2020 Clinical investigation of medical devices for</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">human subjects - Good Clinical Practice</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Product risk management</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">A complete version</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Benefit risk analysis established</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Input from other than real use</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Information</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Investigator's brochure</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Instructions for use</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Clinical investigation plan</p>
          <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Clinical investigation process risks</li>
          </ul>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Other than device risks</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Predefine risk acceptability threshold</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Plan for risk management during investigation</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">Key Principle</p>
          <p class="mb-3 text-sm text-on-surface-variant leading-relaxed">ISO 14155:2020 - Annex H</p>`,
        infographic: `
          <div class="h-full flex flex-col justify-center items-center p-6 text-center">
            <span class="material-symbols-outlined text-primary text-[48px] mb-4">school</span>
            <h3 class="font-serif text-lg mb-2 text-on-surface">Risk Management & Clinical Investigation</h3>
            <p class="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
              Risk Management & Clinical Investigation is part of the ISO 14971 Risk Management Training (Part B). Focus on key compliance elements.
            </p>
          </div>
    `,
        isWide: false
      }
    ];

    // Mark current slide as viewed
    state.slidesViewed.partB[state.partBSlide] = true;
    saveProgress();

    const slide = slides[state.partBSlide];
    const isWide = slide.isWide;

    if (isWide) {
      container.innerHTML = `
        <div class="max-w-[1100px] mx-auto">
          <div class="flex justify-between items-center mb-8">
            <div class="flex items-center gap-3">
              <span class="font-label-sm text-label-sm text-primary tracking-widest uppercase">Module B</span>
              <span class="w-8 h-[1px] bg-outline-variant"></span>
              <span class="font-label-sm text-label-sm text-on-surface-variant">${state.partBSlide + 1} of ${slides.length}</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Worked Dermal Filler Matrix</span>
          </div>

          <div class="bg-surface-container-high/30 rounded border border-outline-variant p-8 mb-8">
            <h2 class="font-serif text-headline-xl mb-4">${slide.title}</h2>
            <div class="text-balance">
              ${slide.content}
            </div>
          </div>

          <!-- Bottom Navigation -->
          <div class="flex justify-between items-center pt-8 border-t border-outline-variant mt-8">
            <button class="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-sm font-mono uppercase transition-colors" id="prev-slide-btn-b" ${state.partBSlide === 0 ? 'disabled' : ''}>
              <span class="material-symbols-outlined text-sm">arrow_back</span> Prev
            </button>
            <button class="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-mono text-sm uppercase transition-all duration-300 rounded" id="next-slide-btn-b">
              Next <span class="material-symbols-outlined text-sm ml-1 align-middle">arrow_forward</span>
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="max-w-[1100px] mx-auto">
          <!-- Top Navigator -->
          <div class="flex justify-between items-center mb-8">
            <div class="flex items-center gap-3">
              <span class="font-label-sm text-label-sm text-primary tracking-widest uppercase">Module B</span>
              <span class="w-8 h-[1px] bg-outline-variant"></span>
              <span class="font-label-sm text-label-sm text-on-surface-variant">${state.partBSlide + 1} of ${slides.length}</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Risk Analysis Techniques</span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <!-- Text/Control Column -->
            <div class="lg:col-span-6 flex flex-col justify-between min-h-[460px] pr-0 lg:pr-8 border-r-0 lg:border-r border-outline-variant">
              <div>
                <h2 class="font-serif text-headline-xl mb-6">${slide.title}</h2>
                <div class="font-body-md text-body-md text-on-surface-variant text-balance">
                  ${slide.content}
                </div>
              </div>
              <!-- Bottom Slide Navigation -->
              <div class="flex justify-between items-center pt-8 border-t border-outline-variant mt-8">
                <button class="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-sm font-mono uppercase transition-colors" id="prev-slide-btn-b" ${state.partBSlide === 0 ? 'disabled' : ''}>
                  <span class="material-symbols-outlined text-sm">arrow_back</span> Prev
                </button>
                <button class="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-mono text-sm uppercase transition-all duration-300 rounded" id="next-slide-btn-b">
                  ${state.partBSlide === slides.length - 1 ? 'Mark Complete' : 'Next'} <span class="material-symbols-outlined text-sm ml-1 align-middle">arrow_forward</span>
                </button>
              </div>
            </div>

            <!-- Infographic Column -->
            <div class="lg:col-span-6 flex items-center justify-center min-h-[380px] bg-surface-container/30 rounded border border-outline-variant p-6">
              <div class="w-full h-full flex flex-col justify-center" id="infographic-stage-b">
                ${slide.infographic}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Bindings
    document.getElementById("prev-slide-btn-b").onclick = () => {
      if (state.partBSlide > 0) {
        state.partBSlide--;
        renderPartB(container);
        updateProgress();
      }
    };

    document.getElementById("next-slide-btn-b").onclick = () => {
      if (state.partBSlide < slides.length - 1) {
        state.partBSlide++;
        renderPartB(container);
        updateProgress();
      } else {
        navigateTo("dashboard");
      }
    };

    // Attach interactivity scripts
    if (state.partBSlide === 11) {
      setupFtaInteractivity();
    } else if (state.partBSlide === 13) {
      setupEtaInteractivity();
    } else if (state.partBSlide === 18) {
      setupHazopInteractivity();
    }

    window.goToQuizzes = () => navigateTo("quizzes");
  }

  // Interactivity: FTA Switches (TEC-17 — SVG nodes directly clickable)
  function setupFtaInteractivity() {
    const swSensor = document.getElementById("fta-sensor");
    const swAlarm = document.getElementById("fta-alarm");
    const swSoftware = document.getElementById("fta-software");

    const topRect = document.getElementById("fta-top-rect");
    const topText = document.getElementById("fta-top-text");
    const statusText = document.getElementById("fta-status-text");

    const andGate = document.getElementById("fta-and-gate");
    const orGate = document.getElementById("fta-or-gate");

    const boxSoftware = document.getElementById("box-software");
    const boxSensor = document.getElementById("box-sensor");
    const boxAlarm = document.getElementById("box-alarm");

    // Make SVG node boxes directly clickable to toggle (TEC-17)
    if (boxSoftware) {
      boxSoftware.style.cursor = 'pointer';
      boxSoftware.addEventListener('click', () => {
        if (swSoftware) { swSoftware.checked = !swSoftware.checked; updateFta(); }
      });
    }
    if (boxSensor) {
      boxSensor.style.cursor = 'pointer';
      boxSensor.addEventListener('click', () => {
        if (swSensor) { swSensor.checked = !swSensor.checked; updateFta(); }
      });
    }
    if (boxAlarm) {
      boxAlarm.style.cursor = 'pointer';
      boxAlarm.addEventListener('click', () => {
        if (swAlarm) { swAlarm.checked = !swAlarm.checked; updateFta(); }
      });
    }

    function updateFta() {
      const sensorFailed = swSensor && swSensor.checked;
      const alarmFailed = swAlarm && swAlarm.checked;
      const softwareFailed = swSoftware && swSoftware.checked;

      // Update node boxes colors
      if (boxSoftware) boxSoftware.style.stroke = softwareFailed ? "#f28b82" : "var(--outline-variant)";
      if (boxSensor) boxSensor.style.stroke = sensorFailed ? "#f28b82" : "var(--outline-variant)";
      if (boxAlarm) boxAlarm.style.stroke = alarmFailed ? "#f28b82" : "var(--outline-variant)";

      if (boxSoftware) boxSoftware.style.fill = softwareFailed ? "rgba(242,139,130,0.18)" : "";
      if (boxSensor) boxSensor.style.fill = sensorFailed ? "rgba(242,139,130,0.18)" : "";
      if (boxAlarm) boxAlarm.style.fill = alarmFailed ? "rgba(242,139,130,0.18)" : "";

      // AND gate logic
      const andActive = sensorFailed && alarmFailed;
      if (andGate) andGate.style.fill = andActive ? "#f28b82" : "var(--primary)";

      // OR gate logic (software fails OR AND-gate active)
      const topActive = softwareFailed || andActive;
      if (orGate) orGate.style.fill = topActive ? "#f28b82" : "var(--primary-container)";

      if (topActive) {
        if (topRect) { topRect.style.stroke = "#f28b82"; topRect.style.fill = "rgba(122,0,10,0.2)"; }
        if (topText) topText.textContent = "OVERDOSE DELIVERED!";
        if (statusText) statusText.innerHTML = `<span style="color:#f28b82;font-weight:bold">⚠️ HAZARD ACTIVE: ${softwareFailed ? 'Software Bug' : 'Dual Sensor+Alarm Failure'} triggered the overdose.</span>`;
      } else {
        if (topRect) { topRect.style.stroke = "var(--outline)"; topRect.style.fill = "var(--surface-container-high)"; }
        if (topText) topText.textContent = "SAFE OPERATION";
        let subText = "Safe. ";
        if (sensorFailed && !alarmFailed) {
          subText += "Flow sensor failed, but Occlusion Alarm blocked the overdose (AND gate protection).";
        } else if (!sensorFailed && alarmFailed) {
          subText += "Alarm failed, but Flow Sensor remains active — AND gate safe.";
        } else {
          subText += "No failures active. Click the node boxes above or use the toggles to simulate failures.";
        }
        if (statusText) statusText.innerHTML = `<span style="color:var(--primary)">${subText}</span>`;
      }
    }

    if (swSensor) swSensor.onchange = updateFta;
    if (swAlarm) swAlarm.onchange = updateFta;
    if (swSoftware) swSoftware.onchange = updateFta;

    updateFta();
  }

  // Interactivity: ETA pathfinder
  function setupEtaInteractivity() {
    const btnAlarm = document.getElementById("eta-btn-alarm");
    const btnResponse = document.getElementById("eta-btn-response");
    const btnValve = document.getElementById("eta-btn-valve");

    const stAlarm = document.getElementById("eta-status-alarm");
    const stResponse = document.getElementById("eta-status-response");
    const stValve = document.getElementById("eta-status-valve");

    const outcomeText = document.getElementById("eta-outcome-text");
    const summaryText = document.getElementById("eta-choice-summary");

    let valAlarm = true;
    let valResponse = true;
    let valValve = true;

    function toggleBtn(btn, val) {
      if (val) {
        btn.textContent = "YES (Working)";
        btn.style.color = "var(--primary)";
        btn.style.borderColor = "var(--primary-container)";
      } else {
        btn.textContent = "NO (Fails)";
        btn.style.color = "var(--error)";
        btn.style.borderColor = "var(--error-container)";
      }
    }

    function calculateEta() {
      stAlarm.textContent = valAlarm ? "YES" : "NO";
      stAlarm.className = valAlarm ? "text-primary font-bold" : "text-error font-bold";

      stResponse.textContent = valResponse ? "YES" : "NO";
      stResponse.className = valResponse ? "text-primary font-bold" : "text-error font-bold";

      stValve.textContent = valValve ? "YES" : "NO";
      stValve.className = valValve ? "text-primary font-bold" : "text-error font-bold";

      // Determine outcome
      let outcome = "";
      let colorClass = "text-primary";
      
      if (valAlarm && valResponse) {
        outcome = "NO HARM (Alarm triggered response)";
        colorClass = "text-primary";
      } else if (valAlarm && !valResponse && valValve) {
        outcome = "MINOR HARM (Valve opened, alarm ignored)";
        colorClass = "text-tertiary";
      } else if (valAlarm && !valResponse && !valValve) {
        outcome = "SERIOUS HARM (Barotrauma, alarm ignored + valve failed)";
        colorClass = "text-error";
      } else if (!valAlarm && valValve) {
        outcome = "MODERATE HARM (Valve opened, no alarm)";
        colorClass = "text-tertiary font-bold";
      } else {
        outcome = "CRITICAL HARM (Barotrauma, all barriers failed)";
        colorClass = "text-error font-bold animate-pulse";
      }

      outcomeText.textContent = outcome;
      outcomeText.className = `${colorClass} font-bold font-serif`;

      summaryText.textContent = `Path: Sensor fails → Alarm (${valAlarm?'Yes':'No'}) → Clinician (${valResponse?'Yes':'No'}) → Valve (${valValve?'Yes':'No'})`;
    }

    btnAlarm.onclick = () => { valAlarm = !valAlarm; toggleBtn(btnAlarm, valAlarm); calculateEta(); };
    btnResponse.onclick = () => { valResponse = !valResponse; toggleBtn(btnResponse, valResponse); calculateEta(); };
    btnValve.onclick = () => { valValve = !valValve; toggleBtn(btnValve, valValve); calculateEta(); };

    // Initial load
    toggleBtn(btnAlarm, valAlarm);
    toggleBtn(btnResponse, valResponse);
    toggleBtn(btnValve, valValve);
    calculateEta();
  }

  // Interactivity: HAZOP matrix
  function setupHazopInteractivity() {
    const selectorButtons = document.querySelectorAll("#hazop-selector button");
    const panelEl = document.getElementById("hazop-details-panel");

    const deviations = {
      "Volume_Less": {
        title: "Deviation: Less Volume (< 4.9 mL)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Pump wear, air bubble in feed line, partial nozzle blockage.</p>
          <p class="mb-2"><strong>Consequence:</strong> Underfill, leading to a sub-therapeutic dose being delivered to the patient.</p>
          <p class="mb-2"><strong>Safeguard:</strong> In-line checkweigher, automatic checkweight reject station.</p>
          <p class="text-primary"><strong>Action Required:</strong> Add bubble detector to inlet line to halt fill on bubbles.</p>
        `
      },
      "Volume_More": {
        title: "Deviation: More Volume (> 5.1 mL)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Pump calibration drift, fill valve sticking open.</p>
          <p class="mb-2"><strong>Consequence:</strong> Overfill, resulting in raw material waste and potential container overflow / sealing contamination.</p>
          <p class="mb-2"><strong>Safeguard:</strong> In-line checkweigher, reject station.</p>
          <p class="text-primary"><strong>Action Required:</strong> Validate checkweigher reject limit margins.</p>
        `
      },
      "Temperature_More": {
        title: "Deviation: More Temperature (> 22°C)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Heat exchanger fault, high ambient cleanroom temperature.</p>
          <p class="mb-2"><strong>Consequence:</strong> Active product degradation (denaturing of PLLA suspension carrier).</p>
          <p class="mb-2"><strong>Safeguard:</strong> Continuous inline temperature sensor.</p>
          <p class="text-primary"><strong>Action Required:</strong> Program automatic loop shutdown if temperature is exceeded for > 30 seconds.</p>
        `
      }
    };

    selectorButtons.forEach(btn => {
      btn.onclick = () => {
        selectorButtons.forEach(b => b.classList.remove("active", "border-primary", "text-primary"));
        btn.classList.add("active", "border-primary", "text-primary");
        const gw = btn.getAttribute("data-gw");
        const p = btn.getAttribute("data-p");
        
        const dev = deviations[`${p}_${gw}`];
        panelEl.innerHTML = `
          <h3 class="font-serif text-headline-lg text-primary mb-2">${dev.title}</h3>
          <div class="space-y-2 text-xs text-on-surface-variant">
            ${dev.body}
          </div>
        `;
      };
    });
  }

  // HACCP Stepper Globals
  window.showHaccp = (step) => {
    const details = document.getElementById("haccp-details");
    if (step === 1) {
      details.innerHTML = `
        <h3 class="font-serif text-headline-lg text-primary mb-3">Sterile Filtration (CCP-1)</h3>
        <div class="space-y-2 text-xs text-on-surface-variant">
          <p><strong>Hazard:</strong> Bacterial bioburden / product contamination.</p>
          <p><strong>Critical Limit:</strong> Integrity test bubble point ≥ 3,450 mbar.</p>
          <p><strong>Monitoring:</strong> Pre- and post-use filter integrity test.</p>
          <p><strong>Corrective Action:</strong> Quarantine batch, re-filter through a new sterile membrane.</p>
        </div>
      `;
    } else if (step === 2) {
      details.innerHTML = `
        <h3 class="font-serif text-headline-lg text-primary mb-3">Aseptic Filling (CCP-2)</h3>
        <div class="space-y-2 text-xs text-on-surface-variant">
          <p><strong>Hazard:</strong> Particulate / environmental contamination.</p>
          <p><strong>Critical Limit:</strong> ISO 5 environment; < 3,520 particles/m³ (≥ 0.5µm).</p>
          <p><strong>Monitoring:</strong> Continuous particle counter.</p>
          <p><strong>Corrective Action:</strong> Stop fill line, quarantine vials, perform media fill qualification.</p>
        </div>
      `;
    } else if (step === 3) {
      details.innerHTML = `
        <h3 class="font-serif text-headline-lg text-primary mb-3">Freeze Drying (CCP-3)</h3>
        <div class="space-y-2 text-xs text-on-surface-variant">
          <p><strong>Hazard:</strong> Chemical / physical instability of reconstitution carrier.</p>
          <p><strong>Critical Limit:</strong> Shelf temperature: -25°C to -20°C during primary drying.</p>
          <p><strong>Monitoring:</strong> Continuous calibrated RTD sensors.</p>
          <p><strong>Corrective Action:</strong> Quarantine batch, run stability verification before release.</p>
        </div>
      `;
    }
  };

  // Render Quizzes Module
  function renderQuizzes(container) {
    const passedA = state.quizState.quizAScore >= PASS_THRESHOLD;
    const passedB = state.quizState.quizBScore >= PASS_THRESHOLD;

    container.innerHTML = `
      <header class="max-w-[800px] mx-auto mb-12">
        <div class="flex items-center gap-3 mb-6">
          <span class="font-label-sm text-label-sm text-primary tracking-widest uppercase">Competence Check</span>
          <span class="w-8 h-[1px] bg-outline-variant"></span>
          <span class="font-label-sm text-label-sm text-on-surface-variant">Module Tests</span>
        </div>
        <h1 class="font-serif text-headline-xl text-on-surface mb-6">Verify Your Knowledge</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant">
          Complete both multiple-choice exams. You must score at least <strong>4 out of 5 on Quiz A (80%)</strong> and <strong>4 out of 6 on Quiz B (67%)</strong> to unlock the Certified ISO 14971 Practitioner certificate.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
        <!-- Quiz A Box -->
        <div class="bg-surface-container p-6 rounded ghost-border flex flex-col justify-between min-h-[220px]">
          <div>
            <span class="text-xs text-primary font-mono block mb-2 uppercase">Quiz A</span>
            <h2 class="font-serif text-headline-lg mb-3">Part A: Standard Requirements</h2>
            <p class="text-on-surface-variant text-sm mb-4">
              5 questions testing definitions, regulatory alignment (MDR/QMSR), acceptability policy, and lifecycle steps.
            </p>
          </div>
          <div class="flex justify-between items-center border-t border-outline-variant pt-4">
            <span class="text-xs font-mono text-on-surface-variant">
              Score: ${state.quizState.quizAScore !== null ? `${state.quizState.quizAScore}/5 (${passedA ? 'PASSED' : 'FAILED'})` : 'Not Started'}
            </span>
            <button class="px-5 py-2 bg-primary text-background font-mono text-xs uppercase font-bold rounded hover:bg-primary-container" onclick="window.launchExam('A')">
              ${state.quizState.quizAScore !== null ? 'Retake Exam' : 'Start Exam'}
            </button>
          </div>
        </div>

        <!-- Quiz B Box -->
        <div class="bg-surface-container p-6 rounded ghost-border flex flex-col justify-between min-h-[220px]">
          <div>
            <span class="text-xs text-primary font-mono block mb-2 uppercase">Quiz B</span>
            <h2 class="font-serif text-headline-lg mb-3">Part B: Analysis & Techniques</h2>
            <p class="text-on-surface-variant text-sm mb-4">
              6 questions testing FMEA limits, PHA baseline, FTA logic gates, HAZOP parameter deviations, HACCP limits, and benefit-risk analysis.
            </p>
          </div>
          <div class="flex justify-between items-center border-t border-outline-variant pt-4">
            <span class="text-xs font-mono text-on-surface-variant">
              Score: ${state.quizState.quizBScore !== null ? `${state.quizState.quizBScore}/6 (${passedB ? 'PASSED' : 'FAILED'})` : 'Not Started'}
            </span>
            <button class="px-5 py-2 bg-primary text-background font-mono text-xs uppercase font-bold rounded hover:bg-primary-container" onclick="window.launchExam('B')">
              ${state.quizState.quizBScore !== null ? 'Retake Exam' : 'Start Exam'}
            </button>
          </div>
        </div>
      </div>
    `;

    window.launchExam = (type) => {
      renderExamStage(container, type);
    };
  }

  // Render Live Exam Interface
  function renderExamStage(container, type) {
    const data = type === 'A' ? quizAData : quizBData;
    let activeQIndex = 0;
    const userAnswers = Array(data.length).fill(null);

    function renderQuestion() {
      const qObj = data[activeQIndex];
      container.innerHTML = `
        <div class="max-w-[700px] mx-auto bg-surface-container p-8 rounded ghost-border">
          <div class="flex justify-between items-center mb-6 pb-2 border-b border-outline-variant">
            <span class="text-xs text-primary font-mono uppercase font-bold">Exam ${type} — Question ${activeQIndex + 1} of ${data.length}</span>
            <span class="text-xs text-on-surface-variant font-mono">Progress: ${Math.round((activeQIndex / data.length) * 100)}%</span>
          </div>

          <h3 class="font-serif text-lg text-on-surface mb-6 leading-relaxed">${qObj.q}</h3>

          <div class="space-y-3 mb-8">
            ${qObj.options.map((opt, i) => `
              <label class="flex items-center gap-4 p-4 rounded border border-outline-variant hover:border-primary/50 cursor-pointer transition-colors ${userAnswers[activeQIndex] === i ? 'border-primary bg-primary/5' : ''}">
                <input type="radio" name="exam-opt" value="${i}" ${userAnswers[activeQIndex] === i ? 'checked' : ''} class="form-radio text-primary">
                <span class="text-xs text-on-surface-variant font-mono">${opt}</span>
              </label>
            `).join("")}
          </div>

          <div class="flex justify-between items-center border-t border-outline-variant pt-6">
            <button class="px-4 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs font-mono uppercase rounded" id="exam-prev" ${activeQIndex === 0 ? 'disabled' : ''}>Back</button>
            <button class="px-6 py-2 bg-primary text-background font-mono text-xs uppercase font-bold rounded hover:bg-primary-container" id="exam-next">
              ${activeQIndex === data.length - 1 ? 'Submit Exam' : 'Next'}
            </button>
          </div>
        </div>
      `;

      // Track selection
      const radios = container.querySelectorAll("input[name='exam-opt']");
      radios.forEach(r => {
        r.onchange = () => {
          userAnswers[activeQIndex] = parseInt(r.value);
          renderQuestion(); // Re-render to show active styling
        };
      });

      // Nav listeners
      document.getElementById("exam-prev").onclick = () => {
        if (activeQIndex > 0) {
          activeQIndex--;
          renderQuestion();
        }
      };

      document.getElementById("exam-next").onclick = () => {
        if (userAnswers[activeQIndex] === null) {
          alert("Please select an answer before proceeding.");
          return;
        }

        if (activeQIndex < data.length - 1) {
          activeQIndex++;
          renderQuestion();
        } else {
          gradeExam(userAnswers, type, container);
        }
      };
    }

    renderQuestion();
  }

  // Grade the Exam & show feedback
  function gradeExam(answers, type, container) {
    const data = type === 'A' ? quizAData : quizBData;
    let score = 0;
    
    data.forEach((q, i) => {
      if (answers[i] === q.correct) {
        score++;
      }
    });

    if (type === 'A') {
      state.quizState.quizAScore = score;
      state.quizState.completedA = true;
    } else {
      state.quizState.quizBScore = score;
      state.quizState.completedB = true;
    }

    saveProgress();
    updateProgress();

    const passed = score >= PASS_THRESHOLD;

    container.innerHTML = `
      <div class="max-w-[750px] mx-auto bg-surface-container p-8 rounded ghost-border text-center">
        <span class="material-symbols-outlined text-[64px] mb-4 ${passed ? 'text-primary' : 'text-error'}">
          ${passed ? 'check_circle' : 'cancel'}
        </span>
        <h2 class="font-serif text-headline-xl mb-2">${passed ? 'Exam Passed!' : 'Exam Failed'}</h2>
        <p class="font-mono text-lg mb-6">Your Score: <span class="text-primary font-bold">${score} / ${data.length}</span> (${Math.round((score/data.length)*100)}%)</p>
        <p class="text-xs text-on-surface-variant mb-8 max-w-[500px] mx-auto">
          ${passed ? 'Excellent work. You have met the compliance requirement for this module.' : 'You did not meet the passing threshold. Review the modules and try again.'}
        </p>

        <h3 class="text-left font-serif text-headline-lg border-b border-outline-variant pb-2 mb-6">Question Review</h3>
        <div class="space-y-6 text-left max-h-[350px] overflow-y-auto mb-8 pr-2">
          ${data.map((q, idx) => {
            const isCorrect = answers[idx] === q.correct;
            return `
              <div class="p-4 rounded border ${isCorrect ? 'border-primary/20 bg-primary/5' : 'border-error/20 bg-error/5'}">
                <span class="text-[10px] font-mono uppercase block mb-1 font-bold ${isCorrect ? 'text-primary' : 'text-error'}">Question ${idx + 1} — ${isCorrect ? 'Correct' : 'Incorrect'}</span>
                <p class="text-xs font-semibold mb-3">${q.q}</p>
                <div class="text-xs space-y-1 text-on-surface-variant mb-3">
                  <p>• Your Answer: <span class="font-mono">${q.options[answers[idx]]}</span></p>
                  ${!isCorrect ? `<p>• Correct Answer: <span class="font-mono text-primary">${q.options[q.correct]}</span></p>` : ''}
                </div>
                <div class="p-2.5 bg-surface-container rounded border border-outline-variant text-[11px] text-on-surface-variant leading-relaxed">
                  <strong>Rationale:</strong> ${q.rationale}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="flex gap-4 justify-center border-t border-outline-variant pt-6">
          <button class="px-6 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-mono text-xs uppercase rounded" onclick="window.backToQuizzes()">Back to Exams</button>
          ${!passed ? `<button class="px-6 py-2.5 bg-primary text-background font-mono text-xs uppercase font-bold rounded hover:bg-primary-container" onclick="window.retryExam('${type}')">Retry Exam</button>` : ''}
        </div>
      </div>
    `;

    // Always bind these for the Back / Retry buttons in case celebration doesn't fire
    window.backToQuizzes = () => navigateTo("quizzes");
    window.retryExam = (t) => renderExamStage(container, t);

    // Show congratulations overlay when BOTH exams have now been passed
    const nowPassedA = state.quizState.quizAScore >= PASS_THRESHOLD;
    const nowPassedB = state.quizState.quizBScore >= PASS_THRESHOLD;

    if (nowPassedA && nowPassedB) {
      // Let user see their score for 2.5s, then show celebration
      setTimeout(() => showCelebration(container, type), 2500);
    }
  }

  // Celebration overlay (TEC-26)
  function showCelebration(container, examType) {
    // Spawn confetti
    const colors = ['#839896','#f8f5eb','#7ab89a','#d4b896','#b8c4c2'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.cssText = `
        left: ${Math.random()*100}vw;
        top: -10px;
        width: ${6 + Math.random()*10}px;
        height: ${6 + Math.random()*10}px;
        background: ${colors[Math.floor(Math.random()*colors.length)]};
        animation-duration: ${2 + Math.random()*3}s;
        animation-delay: ${Math.random()*2}s;
        border-radius: ${Math.random()>0.5?'50%':'2px'};
      `;
      document.body.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    }

    container.innerHTML = `
      <div class="max-w-[600px] mx-auto text-center">
        <div class="celebration-modal bg-surface-container p-10 rounded ghost-border">
          <div class="text-[72px] mb-4">🎉</div>
          <h2 class="font-serif text-3xl font-bold mb-3" style="color:#7ab89a">Both Exams Passed!</h2>
          <p class="text-on-surface-variant mb-2 text-sm">Congratulations! You have demonstrated competence in ISO 14971:2019 Risk Management — both the Standard Overview and Analysis Techniques modules.</p>
          <p class="text-on-surface-variant mb-8 text-sm">Your <strong>Certificate of Competency</strong> is now ready to generate.</p>
          <div class="flex gap-4 justify-center">
            <button class="px-6 py-3 bg-primary text-background font-sans text-sm uppercase font-bold rounded hover:opacity-90 transition-all" onclick="window.backToQuizzes()">View Score Details</button>
            <button class="px-6 py-3 border border-primary text-primary font-sans text-sm uppercase font-semibold rounded hover:bg-primary hover:text-background transition-all" onclick="window.goCertificate()">Get Certificate →</button>
          </div>
        </div>
      </div>
    `;

    window.backToQuizzes = () => navigateTo("quizzes");
    window.goCertificate = () => navigateTo("certificate");
  }

  // Render Certificate View (TEC-27/28 — Orderly People logo + branding)
  function renderCertificate(container) {
    const passedA = state.quizState.quizAScore >= PASS_THRESHOLD;
    const passedB = state.quizState.quizBScore >= PASS_THRESHOLD;

    if (!passedA || !passedB) {
      container.innerHTML = `
        <div class="max-w-[600px] mx-auto text-center py-12">
          <span class="material-symbols-outlined text-[64px] text-on-surface-variant opacity-40 mb-4">lock</span>
          <h2 class="font-serif text-3xl font-bold mb-2">Certificate Locked</h2>
          <p class="text-sm text-on-surface-variant leading-relaxed mb-6">
            You must pass Exam A (at least 4/5) and Exam B (at least 4/6) before you can generate your certificate.
          </p>
          <button class="px-6 py-2.5 bg-primary text-background font-sans text-xs uppercase font-bold rounded" onclick="navigateTo('quizzes')">Open Exams</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="max-w-[700px] mx-auto text-center no-print">
        <header class="mb-8">
          <span class="material-symbols-outlined text-primary text-[48px] mb-2">workspace_premium</span>
          <h2 class="font-serif text-3xl font-bold">Claim Your Certificate</h2>
          <p class="text-xs text-on-surface-variant mt-2">Enter your name as you would like it to appear on the official certificate.</p>
        </header>

        <div class="bg-surface-container p-6 rounded ghost-border mb-8 max-w-[450px] mx-auto">
          <div class="flex gap-3">
            <input type="text" id="cert-name-input" value="${state.userName}" placeholder="E.g. Erika Sundgren" class="flex-1 bg-surface-container-high border border-outline-variant text-on-surface px-4 py-2 text-sm rounded focus:border-primary focus:outline-none font-sans">
            <button class="px-6 py-2 bg-primary text-background font-sans text-xs uppercase font-bold rounded hover:opacity-90" id="cert-update-btn">Save Name</button>
          </div>
        </div>

        <div class="flex gap-4 justify-center">
          <button class="px-6 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-sans text-xs uppercase rounded" onclick="window.printCertificate()">Print / Save PDF</button>
        </div>
      </div>

      <!-- Printable Certificate with Orderly People branding -->
      <div class="max-w-[800px] mx-auto mt-12 p-12 bg-white text-slate-900 border-[16px] border-double border-[#121615] flex flex-col justify-center items-center text-center relative shadow-2xl" id="print-certificate-container">
        <!-- Corner decorations -->
        <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#121615]"></div>
        <div class="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#121615]"></div>
        <div class="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#121615]"></div>
        <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#121615]"></div>

        <!-- Orderly People Logo -->
        <img src="orderly_logo.png" alt="Orderly People" class="h-14 mb-6 opacity-80" style="filter: invert(1) brightness(0);" onerror="this.style.display='none'">

        <h4 style="font-family:'Georgia',serif; font-size:11px; letter-spacing:0.25em; color:#6a7a76; text-transform:uppercase; margin-bottom:28px;">Certificate of Completion</h4>
        <h1 style="font-family:'Georgia',serif; font-size:38px; font-weight:bold; color:#121615; margin-bottom:6px;">ISO 14971 Compliance</h1>
        <h3 style="font-family:'Georgia',serif; font-size:12px; letter-spacing:0.12em; color:#6a7a76; text-transform:uppercase; margin-bottom:28px;">Risk Management of Medical Devices</h3>
        
        <p style="font-family:'Georgia',serif; font-style:italic; font-size:14px; color:#4a5a56; margin-bottom:14px;">This document certifies that</p>
        <h2 style="font-family:'Georgia',serif; font-size:30px; font-weight:bold; color:#121615; border-bottom:2px solid #c8d4d2; padding:0 32px 8px; margin-bottom:22px;" id="cert-display-name">${state.userName || '[YOUR NAME]'}</h2>
        
        <p style="font-family:'Georgia',serif; color:#4a5a56; max-width:500px; line-height:1.7; font-size:13px; margin-bottom:36px;">
          has successfully completed the interactive training curriculum and passed all examination requirements for <strong>Certified ISO 14971 Practitioner</strong>, demonstrating competence in applying <strong>ISO 14971:2019</strong> standard workflows and risk analysis techniques under the Orderly People Risk Management Training Programme.
        </p>

        <div style="width:100%; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #c8d4d2; padding-top:24px; font-family:monospace; font-size:10px; color:#6a7a76; padding-left:24px; padding-right:24px;">
          <div style="text-align:left;">
            <div>Date: ${new Date().toLocaleDateString('sv-SE')}</div>
            <div style="margin-top:4px;">Orderly People Risk Tutor</div>
          </div>
          <div style="text-align:center; padding-bottom:4px;">
            <div style="font-size:20px; color:#839896; margin-bottom:2px;">&#10003;&#10003;</div>
            <div style="font-size:9px; letter-spacing:0.15em;">VERIFIED</div>
          </div>
          <div style="text-align:right;">
            <div>ID: RM-${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            <div style="margin-top:4px;">ISO 14971:2019 Compliant</div>
          </div>
        </div>
      </div>
    `;

    // Hook buttons
    const nameInput = document.getElementById("cert-name-input");
    const nameDisplay = document.getElementById("cert-display-name");
    const updateBtn = document.getElementById("cert-update-btn");

    updateBtn.onclick = () => {
      const val = nameInput.value.trim();
      if (val) {
        state.userName = val;
        localStorage.setItem("rm_tutor_username", val);
        nameDisplay.textContent = val;
      }
    };

    window.printCertificate = () => window.print();
  }

  // Load initial view
  navigateTo("dashboard");
});
