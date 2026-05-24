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
      partA: Array(12).fill(false),
      partB: Array(8).fill(false)
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
        if (Array.isArray(parsed.slidesViewed.partA) && parsed.slidesViewed.partA.length === 12) {
          state.slidesViewed.partA = parsed.slidesViewed.partA;
        }
        if (Array.isArray(parsed.slidesViewed.partB) && parsed.slidesViewed.partB.length === 8) {
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

  function updateSectionHighlight(module, activeSection) {
    const sectionsContainer = document.getElementById(`${module}-sections`);
    if (!sectionsContainer) return;
    const links = sectionsContainer.querySelectorAll("[data-section-link]");
    links.forEach(link => {
      if (link.getAttribute("data-section-link") === activeSection) {
        link.classList.remove("text-on-surface-variant");
        link.classList.add("text-primary", "font-bold");
      } else {
        link.classList.add("text-on-surface-variant");
        link.classList.remove("text-primary", "font-bold");
      }
    });
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
      isDragOrder: true,
      q: "Place the following ISO 14971 risk control measures in the correct priority order (highest priority first): [1] Provide a warning label in the Instructions for Use (IFU). [2] Design out the hazard by selecting non-toxic materials. [3] Add a protective guard on the device housing. Which answer lists them from highest to lowest priority?",
      options: [
        "A) IFU Warning (1) \u2192 Protective guard (3) \u2192 Design out (2)",
        "B) Protective guard (3) \u2192 IFU Warning (1) \u2192 Design out (2)",
        "C) Design out (2) \u2192 Protective guard (3) \u2192 IFU Warning (1)",
        "D) Design out (2) \u2192 IFU Warning (1) \u2192 Protective guard (3)",
        "E) Protective guard (3) \u2192 Design out (2) \u2192 IFU Warning (1)"
      ],
      correct: 2, // C
      rationale: "ISO 14971 Clause 6.2 mandates a strict 3-tier priority: 1st \u2014 Inherent safety by design (designing out the hazard), 2nd \u2014 Protective measures in the device or manufacturing process (the guard), 3rd \u2014 Information for safety (IFU warnings). This hierarchy reflects the principle that eliminating hazards is always preferred over mitigating or warning about them."
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
      schematic: `
        <svg viewBox="0 0 200 100" width="100%" height="80" xmlns="http://www.w3.org/2000/svg" class="font-sans">
          <rect x="50" y="5" width="100" height="25" rx="2" fill="none" stroke="var(--primary)" stroke-width="1.5"/>
          <text x="100" y="20" text-anchor="middle" fill="var(--on-surface)" font-size="10" font-weight="bold">Overdose Delivered</text>
          <line x1="100" y1="30" x2="100" y2="45" stroke="var(--outline)" stroke-width="1.5"/>
          <rect x="85" y="45" width="30" height="15" rx="2" fill="var(--primary-container)" stroke="var(--primary)"/>
          <text x="100" y="55" text-anchor="middle" fill="var(--primary)" font-size="10" font-weight="bold">AND</text>
          <line x1="100" y1="60" x2="60" y2="60" stroke="var(--outline)" stroke-width="1.5"/>
          <line x1="100" y1="60" x2="140" y2="60" stroke="var(--outline)" stroke-width="1.5"/>
          <line x1="60" y1="60" x2="60" y2="75" stroke="var(--outline)" stroke-width="1.5"/>
          <line x1="140" y1="60" x2="140" y2="75" stroke="var(--outline)" stroke-width="1.5"/>
          <rect x="25" y="75" width="70" height="20" rx="2" fill="none" stroke="var(--outline)" stroke-width="1"/>
          <text x="60" y="87" text-anchor="middle" fill="var(--on-surface-variant)" font-size="9">Sensor Fails</text>
          <rect x="105" y="75" width="70" height="20" rx="2" fill="none" stroke="var(--outline)" stroke-width="1"/>
          <text x="140" y="87" text-anchor="middle" fill="var(--on-surface-variant)" font-size="9">Alarm Fails</text>
        </svg>
      `,
      
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
      schematic: `
        <svg viewBox="0 0 200 80" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" class="font-sans">
          <rect x="5" y="25" width="50" height="30" rx="2" fill="none" stroke="var(--outline)" stroke-width="1"/>
          <text x="30" y="42" text-anchor="middle" fill="var(--on-surface-variant)" font-size="9">Prep Line</text>
          <line x1="55" y1="40" x2="70" y2="40" stroke="var(--outline)" stroke-width="1"/>
          
          <rect x="70" y="25" width="60" height="30" rx="2" fill="var(--primary-container)" stroke="var(--primary)" stroke-width="1.5"/>
          <text x="100" y="38" text-anchor="middle" fill="var(--primary)" font-size="9" font-weight="bold">Autoclave Chamber</text>
          <text x="100" y="48" text-anchor="middle" fill="var(--secondary)" font-size="8" font-weight="bold">CCP-1</text>
          <line x1="130" y1="40" x2="145" y2="40" stroke="var(--outline)" stroke-width="1"/>
          
          <rect x="145" y="25" width="50" height="30" rx="2" fill="none" stroke="var(--outline)" stroke-width="1"/>
          <text x="170" y="42" text-anchor="middle" fill="var(--on-surface-variant)" font-size="9">Sterile Pack</text>
          
          <text x="100" y="70" text-anchor="middle" fill="var(--tertiary)" font-size="9" font-weight="bold">Critical Limit: Temp &amp; Time?</text>
        </svg>
      `,
      
      q: "In a manufacturing facility for a sterile catheter, the steam sterilization stage (autoclave) is established as a Critical Control Point (CCP-1) to eliminate biological hazards. Which of the following defines a valid Critical Limit and its associated monitoring procedure for this CCP?",
      options: [
        "A) Limit: Operator gown status; Monitoring: Annual supplier audit of the cleanroom garment vendor.",
        "B) Limit: Chamber temperature &ge; 121.1&deg;C for at least 15 minutes; Monitoring: Continuous sensor recording for each sterilization batch.",
        "C) Limit: Cleanroom relative humidity is 50%; Monitoring: Monthly manual checking of cleanroom logs.",
        "D) Limit: Use of non-toxic pouch materials; Monitoring: Visual inspection of incoming raw packaging reels.",
        "E) Limit: Low-risk patient complaint rate; Monitoring: Post-market complaint file reviews."
      ],
      correct: 1, // B
      rationale: "HACCP principles require a Critical Limit to be a measurable parameter that separates safe operation from unsafe (e.g., autoclave temperature ≥ 121.1°C for 15 minutes). Monitoring must check each batch in real time, making Option B the correct answer."
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

  // Section Navigation click handling
  const sectionLinks = document.querySelectorAll("[data-section-link]");
  sectionLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionName = link.getAttribute("data-section-link");
      const isPartA = link.closest("#partA-sections") !== null;
      
      if (isPartA) {
        const idx = partASlides.findIndex(s => s.section === sectionName);
        if (idx !== -1) {
          state.partASlide = idx;
          navigateTo("partA");
        }
      } else {
        const idx = partBSlides.findIndex(s => s.section === sectionName);
        if (idx !== -1) {
          state.partBSlide = idx;
          navigateTo("partB");
        }
      }
      
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
  window.navigateTo = navigateTo;
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

    // Toggle collapsible sidebar sections
    const partASections = document.getElementById("partA-sections");
    const partBSections = document.getElementById("partB-sections");
    if (view === "partA") {
      partASections?.classList.remove("hidden");
      partBSections?.classList.add("hidden");
    } else if (view === "partB") {
      partBSections?.classList.remove("hidden");
      partASections?.classList.add("hidden");
    } else {
      partASections?.classList.add("hidden");
      partBSections?.classList.add("hidden");
    }

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
  
const partASlides = [
    {
      title: `What is ISO 14971?`,
      section: `intro`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The Standard</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          ISO 14971 is the internationally recognised standard that specifies a process for manufacturers
          to identify the hazards associated with medical devices, estimate and evaluate the risks,
          control those risks, and monitor the effectiveness of the controls.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Current Edition</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          The current edition is <strong>ISO 14971:2019 + A11:2021</strong>, published in 2019
          with a European harmonisation amendment added in 2021. Its companion guidance document is
          <strong>ISO/TR 24971:2020</strong>, which provides worked examples and explanations.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The Fundamental Principle</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Risk management is not a one-time design activity — it is an integral part of the
          <em>entire lifecycle</em> of a medical device, from initial concept through design, production,
          and post-market surveillance. New real-world data must continuously feed back into
          the risk assessment.
        </p>
        <div class="p-3 bg-surface-container-high rounded border border-outline-variant mb-3">
          <span class="text-xs text-primary font-mono uppercase block mb-1">Why It Matters</span>
          <p class="text-xs text-on-surface-variant">
            Without a systematic process, hazards get missed, risks get underestimated, and
            patients get hurt. ISO 14971 provides the structured framework that regulators worldwide
            require as evidence of due diligence.
          </p>
        </div>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">The Device Lifecycle Loop</h4>
          <svg viewBox="0 0 280 220" width="100%" height="210" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arr-a" markerWidth="7" markerHeight="7" refX="3" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="#839896"/>
              </marker>
              <marker id="arr-g" markerWidth="7" markerHeight="7" refX="3" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="var(--success)"/>
              </marker>
            </defs>
            <rect x="95" y="8" width="90" height="28" rx="4" fill="var(--surface-container-highest)" stroke="var(--success)" stroke-width="1.5"/>
            <text x="140" y="25" text-anchor="middle" fill="var(--success)" font-size="12" font-family="sans-serif" font-weight="bold">CONCEPT &amp; DESIGN</text>

            <rect x="190" y="80" width="80" height="28" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="230" y="97" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">PRODUCTION</text>

            <rect x="95" y="152" width="90" height="28" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="140" y="169" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">POST-MARKET</text>

            <rect x="10" y="80" width="80" height="28" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="50" y="97" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">DISTRIBUTION</text>

            <text x="140" y="98" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif" font-style="italic">ISO 14971</text>
            <text x="140" y="112" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif" font-style="italic">Lifecycle Risk</text>
            <text x="140" y="126" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif" font-style="italic">Management</text>

            <path d="M185 22 Q230 22 230 80" fill="none" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-a)"/>
            <path d="M230 108 Q230 166 185 166" fill="none" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-a)"/>
            <path d="M95 166 Q50 166 50 108" fill="none" stroke="var(--success)" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#arr-g)"/>
            <path d="M50 80 Q50 22 95 22" fill="none" stroke="var(--success)" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#arr-g)"/>

            <text x="18" y="135" fill="var(--success)" font-size="11" font-family="sans-serif" transform="rotate(-90 18 135)">PMS Feedback</text>
          </svg>
          <p class="text-[10px] text-on-surface-variant text-center mt-2">Risk management applies at every stage — never just once</p>
        </div>
      `
    },
    {
      title: `The Regulatory Landscape`,
      section: `intro`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Where ISO 14971 Fits</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          ISO 14971 does not exist in isolation — it is the linchpin that connects a family of
          regulatory requirements. Understanding where it sits helps you build a compliant Quality
          Management System efficiently.
        </p>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li><strong>EU MDR 2017/745</strong> — Annex I GSPRs 1–9 and Article 10(2) require a
            documented risk management system. ISO 14971 is the primary compliance pathway.</li>
          <li><strong>ISO 13485:2016</strong> — The QMS standard explicitly links to ISO 14971
            in §7.1 (planning of product realisation).</li>
          <li><strong>IEC 62366-1</strong> — Usability engineering feeds directly into risk analysis;
            use-errors and misuse scenarios identified here become inputs to ISO 14971.</li>
          <li><strong>US FDA QMSR (21 CFR 820)</strong> — The QMSR incorporates
            ISO 13485:2016 by reference, making ISO 14971 the expected risk management method for
            the US market too.</li>
        </ul>
        <div class="p-3 bg-surface-container-high rounded border border-outline-variant mb-3">
          <span class="text-xs text-primary font-mono uppercase block mb-1">Key GSPRs to Know</span>
          <p class="text-xs text-on-surface-variant">
            GSPR 1: risks must be acceptable vs. benefits &nbsp;|&nbsp;
            GSPR 2: reduce risks as far as possible &nbsp;|&nbsp;
            GSPR 3: risk management system required &nbsp;|&nbsp;
            GSPR 4: design first, then guards, then IFU warnings.
          </p>
        </div>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">Regulatory Ecosystem</h4>
          <svg viewBox="0 0 280 230" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arr-b" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="var(--success)"/>
              </marker>
            </defs>
            <ellipse cx="140" cy="115" rx="50" ry="30" fill="var(--primary-container)" stroke="var(--success)" stroke-width="2"/>
            <text x="140" y="111" text-anchor="middle" fill="var(--success)" font-size="11" font-family="sans-serif" font-weight="bold">ISO 14971</text>
            <text x="140" y="124" text-anchor="middle" fill="var(--success)" font-size="11" font-family="sans-serif">Risk Management</text>

            <rect x="8" y="8" width="84" height="32" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="50" y="23" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">EU MDR 2017/745</text>
            <text x="50" y="34" text-anchor="middle" fill="#839896" font-size="10.5" font-family="sans-serif">GSPRs + Art. 10</text>
            <line x1="80" y1="40" x2="104" y2="90" stroke="var(--success)" stroke-width="1.2" marker-end="url(#arr-b)"/>

            <rect x="188" y="8" width="84" height="32" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="230" y="23" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">ISO 13485:2016</text>
            <text x="230" y="34" text-anchor="middle" fill="#839896" font-size="10.5" font-family="sans-serif">QMS §7.1</text>
            <line x1="200" y1="40" x2="176" y2="90" stroke="var(--success)" stroke-width="1.2" marker-end="url(#arr-b)"/>

            <rect x="8" y="182" width="84" height="32" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="50" y="197" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">IEC 62366-1</text>
            <text x="50" y="208" text-anchor="middle" fill="#839896" font-size="10.5" font-family="sans-serif">Usability Eng.</text>
            <line x1="80" y1="182" x2="104" y2="143" stroke="var(--success)" stroke-width="1.2" marker-end="url(#arr-b)"/>

            <rect x="188" y="182" width="84" height="32" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="230" y="197" text-anchor="middle" fill="var(--on-surface)" font-size="12" font-family="sans-serif">US FDA QMSR</text>
            <text x="230" y="208" text-anchor="middle" fill="#839896" font-size="10.5" font-family="sans-serif">21 CFR 820</text>
            <line x1="200" y1="182" x2="176" y2="143" stroke="var(--success)" stroke-width="1.2" marker-end="url(#arr-b)"/>

            <rect x="102" y="160" width="76" height="28" rx="4" fill="var(--primary-container)" stroke="var(--outline)" stroke-width="1"/>
            <text x="140" y="177" text-anchor="middle" fill="#839896" font-size="11.5" font-family="sans-serif">ISO/TR 24971</text>
            <text x="140" y="185" text-anchor="middle" fill="var(--on-surface-variant)" font-size="12" font-family="sans-serif">Guidance &amp; examples</text>
            <line x1="140" y1="160" x2="140" y2="145" stroke="var(--outline)" stroke-width="1" stroke-dasharray="3,2"/>
          </svg>
        </div>
      `
    },
    {
      title: `Key Terms & Definitions`,
      section: `terms`,
      content: `
        <p class="mb-6 text-sm text-on-surface-variant leading-relaxed">Understanding the terminology is critical for auditing and compliance. ISO 14971 establishes precise boundaries between hazards, sequences of events, situations, and harm.</p>
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
      title: `General Requirements (§4)`,
      section: `general`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The Risk Management Plan (§4.4)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Before any risk analysis begins, the manufacturer must produce a <strong>Risk Management Plan</strong> — a document that governs the entire process. Think of it as the rulebook you agree on before the game starts.
        </p>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Scope and description of the device</li>
          <li>Criteria for risk acceptability (the risk policy)</li>
          <li>Methods and tools to be used for each phase</li>
          <li>Activities for verification of risk control measures (VOI &amp; VOE)</li>
          <li>Activities for gathering post-production information</li>
        </ul>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The Risk Management File (§4.5)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          The RMF is the central repository for all records produced during the risk management process. It provides the traceability and documented evidence that auditors and notified bodies look for.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Top Management &amp; Competence (§4.2–4.3)</h4>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Top management must allocate adequate resources and appoint qualified personnel</li>
          <li>They must define and document a policy for risk acceptability criteria</li>
          <li>Personnel performing risk management must be demonstrably competent — records of education, training, skills, and experience are required</li>
        </ul>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-3 text-center">Risk Management File — Document Stack</h4>
          <div class="space-y-2">
            <div class="flex items-center gap-3 p-2 rounded border" style="border-color:#7ab89a;background:rgba(122,184,154,0.08)">
              <span class="material-symbols-outlined text-primary text-[20px]">assignment</span>
              <div>
                <div class="text-xs font-bold text-on-surface">Risk Management Plan</div>
                <div class="text-[10px] text-on-surface-variant">Scope, criteria, responsibilities (§4.4)</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2 rounded border" style="border-color:#839896;background:rgba(131,152,150,0.07)">
              <span class="material-symbols-outlined text-primary text-[20px]">search</span>
              <div>
                <div class="text-xs font-bold text-on-surface">Risk Analysis Records</div>
                <div class="text-[10px] text-on-surface-variant">Hazards, hazardous situations, estimation (§5)</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2 rounded border" style="border-color:#6b807e;background:rgba(107,128,126,0.06)">
              <span class="material-symbols-outlined text-primary text-[20px]">balance</span>
              <div>
                <div class="text-xs font-bold text-on-surface">Risk Evaluation Records</div>
                <div class="text-[10px] text-on-surface-variant">Acceptability decisions + rationale (§6)</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2 rounded border" style="border-color:#5a7070;background:rgba(90,112,112,0.05)">
              <span class="material-symbols-outlined text-primary text-[20px]">shield</span>
              <div>
                <div class="text-xs font-bold text-on-surface">Risk Control Records</div>
                <div class="text-[10px] text-on-surface-variant">Measures, VOI/VOE verification (§7)</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2 rounded border" style="border-color:#7ab89a;background:rgba(122,184,154,0.07)">
              <span class="material-symbols-outlined" style="color:#7ab89a;font-size:20px">verified</span>
              <div>
                <div class="text-xs font-bold" style="color:#7ab89a">RM Review Report</div>
                <div class="text-[10px] text-on-surface-variant">Completeness check before release (§9)</div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      title: `Risk Policy &amp; Acceptability Criteria`,
      section: `general`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Defining Acceptability Criteria</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Top management must define a policy for establishing criteria for risk acceptability. This policy guides whether a risk is acceptable or unacceptable.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Risk Evaluation Matrix</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          A visual mapping tool where the estimated risk (S × P) is cross-referenced. The matrix is divided into acceptable regions (ACC) and unacceptable regions (NOT-ACC) requiring risk control.
        </p>
        <div class="p-3 bg-surface-container-high rounded border border-outline-variant mt-2">
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
      title: `Risk Analysis (§5) — Identifying Hazards`,
      section: `analysis`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 1: Define Intended Use &amp; Foreseeable Misuse</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Risk analysis starts with a clear description of what the device is intended to do
          and in what clinical context. Crucially, ISO 14971 requires you to also consider
          <strong>reasonably foreseeable misuse</strong> — uses that are not intended but that
          a competent regulator or clinical expert would recognise as predictable human behaviour.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 2: Safety-Related Characteristics (§5.3)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          ISO 14971 Annex C provides a comprehensive checklist of safety-related characteristics
          to consider: intended use, energy hazards, biological hazards, usability issues, software
          interactions, single-use status, sterility, etc.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 3: Identify Hazards &amp; Hazardous Situations</h4>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>List each hazard (potential source of harm)</li>
          <li>Describe the sequence of events that leads a hazard to exposure</li>
          <li>Define the resulting hazardous situation (hazard + exposure)</li>
          <li>Identify the harm(s) that could result if the situation continues</li>
        </ul>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">Hazard → Harm Chain</h4>
          <svg viewBox="0 0 260 230" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arr-c" markerWidth="7" markerHeight="7" refX="3" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="#839896"/>
              </marker>
            </defs>
            <rect x="60" y="8" width="140" height="32" rx="4" fill="var(--surface-container-highest)" stroke="var(--tertiary)" stroke-width="1.5"/>
            <text x="130" y="22" text-anchor="middle" fill="var(--tertiary)" font-size="11" font-family="sans-serif" font-weight="bold">HAZARD</text>
            <text x="130" y="34" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">e.g. sharp needle, bioburden</text>
            <line x1="130" y1="40" x2="130" y2="60" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-c)"/>

            <rect x="40" y="60" width="180" height="36" rx="4" fill="var(--primary-container)" stroke="var(--outline)" stroke-width="1"/>
            <text x="130" y="75" text-anchor="middle" fill="#839896" font-size="12" font-family="sans-serif">SEQUENCE OF EVENTS</text>
            <text x="130" y="88" text-anchor="middle" fill="var(--on-surface-variant)" font-size="10.5" font-family="sans-serif">Foreseeable steps linking hazard to exposure</text>
            <line x1="130" y1="96" x2="130" y2="116" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-c)"/>

            <rect x="40" y="116" width="180" height="32" rx="4" fill="var(--surface-container-highest)" stroke="var(--tertiary)" stroke-width="1.5"/>
            <text x="130" y="130" text-anchor="middle" fill="var(--tertiary)" font-size="11" font-family="sans-serif" font-weight="bold">HAZARDOUS SITUATION</text>
            <text x="130" y="142" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Person/property exposed to hazard</text>
            <line x1="130" y1="148" x2="130" y2="168" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-c)"/>

            <rect x="60" y="168" width="140" height="32" rx="4" fill="#1a2820" stroke="var(--error)" stroke-width="1.5"/>
            <text x="130" y="182" text-anchor="middle" fill="var(--error)" font-size="11" font-family="sans-serif" font-weight="bold">HARM</text>
            <text x="130" y="194" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Injury / damage to health or property</text>

            <text x="148" y="52" fill="var(--success)" font-size="11" font-family="sans-serif">P1: Prob. to hazardous sit.</text>
            <text x="148" y="160" fill="var(--success)" font-size="11" font-family="sans-serif">P2: Prob. to harm from sit.</text>
          </svg>
          <p class="text-[10px] text-on-surface-variant text-center">ISO 14971 uses a two-probability model: P1 (reaching the hazardous situation) and P2 (harm from that situation)</p>
        </div>
      `
    },
    {
      title: `Risk Estimation — Probability × Severity`,
      section: `analysis`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Subjectivity in Risk Estimation</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Estimating probabilities and severities is often subjective, especially for novel devices without historical clinical data. To avoid individual bias, teams use consensus methods.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The Delphi Consensus Method</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          A structured, iterative communication technique where a panel of experts answers questionnaires in two or more rounds. After each round, a facilitator provides an anonymous summary. This encourages experts to revise their earlier answers and converges toward consensus.
        </p>
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
      title: `Risk Evaluation (§6) &amp; Risk Control (§7)`,
      section: `evaluation`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Risk Evaluation (§6)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Once a risk is estimated (P × S), it is evaluated against the criteria defined in the Risk
          Management Plan. The outcome is a decision: <em>Acceptable</em> or <em>Not Acceptable</em>. Unacceptable risks must be controlled.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The Three-Tier Priority for Risk Control (§7)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-2">
          ISO 14971 §7.1 mandates that risk controls be applied in strict priority order:
        </p>
        <ol class="list-decimal pl-5 mb-4 text-on-surface-variant text-sm space-y-2">
          <li><strong>Inherent safety by design</strong> — Eliminate or reduce the hazard at source. This is always preferred. Example: select non-toxic materials; design out the sharp edge.</li>
          <li><strong>Protective measures</strong> — If the hazard cannot be designed out, add guards, alarms, or interlocks. Example: needle retraction mechanism; automatic shut-off.</li>
          <li><strong>Information for safety</strong> — Warnings, contraindications, and training instructions in the IFU. This is the last resort — labels do not substitute for design safety.</li>
        </ol>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">3-Tier Risk Control Hierarchy</h4>
          <svg viewBox="0 0 260 200" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">
            <polygon points="10,40 250,40 220,80 40,80" fill="var(--primary-container)" stroke="var(--success)" stroke-width="1.5"/>
            <text x="130" y="57" text-anchor="middle" fill="var(--success)" font-size="11" font-family="sans-serif" font-weight="bold">1. INHERENT SAFETY BY DESIGN</text>
            <text x="130" y="70" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Eliminate or reduce the hazard at source</text>
            <text x="8" y="62" fill="var(--success)" font-size="12" font-family="sans-serif">★ BEST</text>

            <polygon points="40,84 220,84 200,124 60,124" fill="var(--primary-container)" stroke="var(--tertiary)" stroke-width="1.5"/>
            <text x="130" y="101" text-anchor="middle" fill="var(--tertiary)" font-size="11" font-family="sans-serif" font-weight="bold">2. PROTECTIVE MEASURES</text>
            <text x="130" y="114" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Guards, alarms, interlocks in device or process</text>

            <polygon points="60,128 200,128 190,168 70,168" fill="var(--error-container)" stroke="var(--error)" stroke-width="1.5"/>
            <text x="130" y="145" text-anchor="middle" fill="var(--error)" font-size="11" font-family="sans-serif" font-weight="bold">3. INFORMATION FOR SAFETY</text>
            <text x="130" y="158" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Warnings, contraindications, IFU — last resort</text>
            <text x="206" y="152" fill="var(--error)" font-size="11" font-family="sans-serif">⚠</text>

            <line x1="10" y1="5" x2="10" y2="175" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-a)"/>
            <text x="12" y="95" fill="#839896" font-size="11" font-family="sans-serif" transform="rotate(90 12 95)">PRIORITY (highest first)</text>
          </svg>
        </div>
      `
    },
    {
      title: `Risk Control Verification: VOI &amp; VOE`,
      section: `control`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Verification of Implementation (VOI)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          VOI gathers evidence that the risk control measure has been physically built, programmed, or integrated as designed.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Verification of Effectiveness (VOE)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          VOE gathers clinical or testing evidence demonstrating that the control measure successfully reduces the probability of occurrence of harm or the severity of that harm.
        </p>
        <p class="text-xs text-primary font-mono uppercase mb-2">Interactive Match Game</p>
        <p class="text-xs text-on-surface-variant mb-4">Drag each verification record card from the right and drop it into the correct container (VOI or VOE) on the left, or click a card to select it and then click the container.</p>
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
      title: `New Hazards from Risk Controls (§7.2/7.5)`,
      section: `control`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Analyzing Control Side Effects</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Under ISO 14971 §7.2 and §7.5, you must evaluate whether any risk control measure introduces <strong>new hazards</strong> or affects previously estimated risks.
        </p>
        <div class="p-3 bg-surface-container-high rounded border border-outline-variant mb-3">
          <span class="text-xs text-primary font-mono uppercase block mb-1">Real-World Analogy (The Speed Bump)</span>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            <strong>Initial Hazard:</strong> Fast-moving cars at a pedestrian crosswalk (hazardous situation).<br>
            <strong>Risk Mitigation:</strong> Install speed bumps (control measure) to force drivers to slow down.<br>
            <strong>Side Effect Hazard:</strong> Speed bumps can damage car suspensions, cause sudden swerving, or delay emergency vehicles (new hazard/risk).
          </p>
        </div>
        <p class="text-xs text-on-surface-variant leading-relaxed">
          In medical devices, a software warning box (control) might cause alarm fatigue (new hazard), or a protective mechanical shield might pinch a user's finger. You must re-analyze these controls using the same risk management process.
        </p>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">Speed Bump Risk Analogy</h4>
          <svg viewBox="0 0 280 200" width="100%" height="180" xmlns="http://www.w3.org/2000/svg">
            <!-- Road background -->
            <rect x="5" y="5" width="270" height="190" fill="#f1f3f5" rx="6" stroke="var(--outline-variant)" stroke-width="1.5"/>
            <!-- Road Lane Lines -->
            <line x1="5" y1="100" x2="275" y2="100" stroke="#cbd5e1" stroke-dasharray="10, 8" stroke-width="2"/>
            
            <!-- Pedestrian Crosswalk (Zebra Crossing) -->
            <rect x="120" y="5" width="40" height="190" fill="#cbd5e1"/>
            <rect x="125" y="15" width="30" height="15" fill="#ffffff"/>
            <rect x="125" y="45" width="30" height="15" fill="#ffffff"/>
            <rect x="125" y="75" width="30" height="15" fill="#ffffff"/>
            <rect x="125" y="105" width="30" height="15" fill="#ffffff"/>
            <rect x="125" y="135" width="30" height="15" fill="#ffffff"/>
            <rect x="125" y="165" width="30" height="15" fill="#ffffff"/>
            <text x="140" y="185" text-anchor="middle" fill="#64748b" font-size="8" font-weight="bold">Crosswalk</text>

            <!-- Speed Bumps (Risk Mitigations) -->
            <!-- Left Speed Bump -->
            <rect x="60" y="10" width="25" height="80" rx="3" fill="#991b1b" stroke="#7f1d1d" stroke-width="1"/>
            <path d="M 65 20 L 80 30 M 65 40 L 80 50 M 65 60 L 80 70" stroke="#ffffff" stroke-width="1.5"/>
            <text x="72.5" y="96" text-anchor="middle" fill="#991b1b" font-size="7" font-weight="bold">Speed Bump</text>
            <text x="72.5" y="104" text-anchor="middle" fill="#64748b" font-size="6" font-style="italic">(Mitigation)</text>

            <!-- Right Speed Bump -->
            <rect x="195" y="110" width="25" height="80" rx="3" fill="#991b1b" stroke="#7f1d1d" stroke-width="1"/>
            <path d="M 200 120 L 215 130 M 200 140 L 215 150 M 200 160 L 215 170" stroke="#ffffff" stroke-width="1.5"/>
            <text x="207.5" y="101" text-anchor="middle" fill="#991b1b" font-size="7" font-weight="bold">Speed Bump</text>
            <text x="207.5" y="109" text-anchor="middle" fill="#64748b" font-size="6" font-style="italic">(Mitigation)</text>

            <!-- Car -->
            <g id="svg-car" transform="translate(10, 40)">
              <rect x="0" y="5" width="40" height="20" rx="3" fill="var(--primary)" stroke="var(--primary-container)" stroke-width="1"/>
              <rect x="25" y="8" width="10" height="14" rx="1" fill="#e2e8f0"/>
              <rect x="5" y="2" width="8" height="3" fill="#000000" rx="1"/>
              <rect x="27" y="2" width="8" height="3" fill="#000000" rx="1"/>
              <rect x="5" y="25" width="8" height="3" fill="#000000" rx="1"/>
              <rect x="27" y="25" width="8" height="3" fill="#000000" rx="1"/>
              <line x1="45" y1="15" x2="60" y2="15" stroke="var(--tertiary)" stroke-width="1.5" marker-end="url(#arr-f)"/>
            </g>

            <!-- Labels -->
            <rect x="30" y="152" width="85" height="35" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="72.5" y="163" text-anchor="middle" fill="var(--on-surface)" font-size="7" font-weight="bold">Hazardous Situation</text>
            <text x="72.5" y="172" text-anchor="middle" fill="var(--on-surface-variant)" font-size="6">Car approaching crosswalk</text>
            <text x="72.5" y="181" text-anchor="middle" fill="var(--on-surface-variant)" font-size="6">with pedestrian crossing</text>

            <rect x="175" y="10" width="90" height="38" rx="3" fill="var(--error-container)" stroke="var(--error)" stroke-width="1"/>
            <text x="220" y="21" text-anchor="middle" fill="var(--error)" font-size="7" font-weight="bold">New Hazards Introduced</text>
            <text x="220" y="30" text-anchor="middle" fill="var(--on-error-container)" font-size="6">• Vehicle suspension damage</text>
            <text x="220" y="38" text-anchor="middle" fill="var(--on-error-container)" font-size="6">• Sudden braking / swerving</text>
            <text x="220" y="46" text-anchor="middle" fill="var(--on-error-container)" font-size="6">• Emergency vehicle delays</text>
            
            <defs>
              <marker id="arr-f" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="var(--tertiary)"/>
              </marker>
            </defs>
          </svg>
        </div>
      `
    },
    {
      title: `Benefit-Risk Analysis (§7.4)`,
      section: `residual`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Weighing Benefits Against Risks</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          When individual risks remain 'unacceptable' despite all controls, or when evaluating overall residual risk, a benefit-risk analysis is performed. Gather clinical literature to justify if clinical benefits outweigh the residual risks.
        </p>
        <p class="mb-4 text-xs text-on-surface-variant">Toggle the justification arguments on the right to weigh the benefits against the risk.</p>
        <div class="space-y-3 bg-surface-container-high p-4 rounded border border-outline-variant mt-2">
          <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
            <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="30">
            No alternative delivery route exists for volume restoration.
          </label>
          <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
            <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="25">
            Clinically documented aesthetic &amp; psychological benefits.
          </label>
          <label class="flex items-center gap-3 text-xs text-on-surface-variant cursor-pointer">
            <input type="checkbox" class="bra-toggle form-checkbox rounded text-primary" data-weight="20">
            Sterile barrier integrity &amp; aseptic technique guidance.
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
            <line x1="150" y1="180" x2="150" y2="70" stroke="var(--secondary)" stroke-width="4"></line>
            <polygon points="120,180 180,180 160,195 140,195" fill="var(--outline)"></polygon>
            <circle cx="150" cy="70" r="6" fill="var(--primary)"></circle>
            <!-- Scale Beam -->
            <g class="scale-beam" id="scale-beam-group">
              <line x1="50" y1="70" x2="250" y2="70" stroke="var(--secondary)" stroke-width="4"></line>
              <!-- Left Pan (Risk) -->
              <g class="scale-pan" id="scale-pan-left">
                <line x1="50" y1="70" x2="20" y2="130" stroke="var(--outline)" stroke-width="2"></line>
                <line x1="50" y1="70" x2="80" y2="130" stroke="var(--outline)" stroke-width="2"></line>
                <polygon points="10,130 90,130 80,140 20,140" fill="var(--error)"></polygon>
                <text x="50" y="120" text-anchor="middle" fill="var(--on-error-container)" font-size="12" font-family="Space Grotesk">RISK (S5)</text>
              </g>
              <!-- Right Pan (Benefit) -->
              <g class="scale-pan" id="scale-pan-right">
                <line x1="250" y1="70" x2="220" y2="130" stroke="var(--outline)" stroke-width="2"></line>
                <line x1="250" y1="70" x2="280" y2="130" stroke="var(--outline)" stroke-width="2"></line>
                <polygon points="210,130 290,130 280,140 220,140" fill="var(--success)"></polygon>
                <text x="250" y="120" text-anchor="middle" fill="var(--primary)" font-size="12" font-family="Space Grotesk">BENEFIT</text>
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
      title: `Post-Market Surveillance &amp; Feedback (§10)`,
      section: `postmarket`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">The §10 Requirement</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Risk management does not stop when the device is released. ISO 14971 §10 requires
          manufacturers to establish a system for actively collecting and reviewing post-production
          information — and feeding it back into the Risk Management File.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Information Sources (§10.2)</h4>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li>Complaints, adverse events, vigilance reports</li>
          <li>PMSR (Periodic Safety Update Report) and PMCF data</li>
          <li>NC/CAPA findings from manufacturing and quality systems</li>
          <li>Published literature and competitor device data</li>
          <li>Trend analysis results (moving averages, control charts)</li>
        </ul>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">When the Feedback Loop Matters (§10.3–10.4)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          If new information reveals a previously unrecognised hazard, or if estimated
          probabilities are shown to be wrong by real-world data, the Risk Management File must
          be updated and risk controls reassessed.
        </p>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">PMS → Risk Management Feedback Loop</h4>
          <svg viewBox="0 0 260 240" width="100%" height="230" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arr-d" markerWidth="7" markerHeight="7" refX="3" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="var(--success)"/>
              </marker>
              <marker id="arr-e" markerWidth="7" markerHeight="7" refX="3" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="#839896"/>
              </marker>
            </defs>
            <rect x="30" y="8" width="200" height="30" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="130" y="22" text-anchor="middle" fill="var(--on-surface)" font-size="11" font-family="sans-serif" font-weight="bold">PMS DATA COLLECTION (§10.2)</text>
            <text x="130" y="33" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Complaints · PMCF · NCs · Literature</text>
            <line x1="130" y1="38" x2="130" y2="58" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-e)"/>

            <rect x="50" y="58" width="160" height="28" rx="4" fill="var(--primary-container)" stroke="var(--tertiary)" stroke-width="1"/>
            <text x="130" y="73" text-anchor="middle" fill="var(--tertiary)" font-size="11" font-family="sans-serif" font-weight="bold">TREND ANALYSIS</text>
            <text x="130" y="82" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">MDR Art.88 reporting trigger</text>
            <line x1="130" y1="86" x2="130" y2="106" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-e)"/>

            <rect x="30" y="106" width="200" height="28" rx="4" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="130" y="121" text-anchor="middle" fill="var(--on-surface)" font-size="11" font-family="sans-serif" font-weight="bold">INFORMATION REVIEW (§10.3)</text>
            <text x="130" y="130" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">New hazard? Changed probability?</text>
            <line x1="130" y1="134" x2="130" y2="154" stroke="var(--outline)" stroke-width="1.5" marker-end="url(#arr-e)"/>

            <polygon points="130,154 180,175 130,196 80,175" fill="var(--primary-container)" stroke="var(--success)" stroke-width="1.5"/>
            <text x="130" y="171" text-anchor="middle" fill="var(--success)" font-size="12" font-family="sans-serif" font-weight="bold">Risk changed?</text>
            <text x="130" y="182" text-anchor="middle" fill="#839896" font-size="10.5" font-family="sans-serif">YES / NO</text>

            <line x1="80" y1="175" x2="20" y2="175" stroke="var(--success)" stroke-width="1.5" marker-end="url(#arr-d)"/>
            <text x="50" y="170" text-anchor="middle" fill="var(--success)" font-size="11" font-family="sans-serif">YES</text>
            <rect x="0" y="185" width="40" height="20" rx="3" fill="var(--primary-container)" stroke="var(--success)" stroke-width="1"/>
            <text x="20" y="199" text-anchor="middle" fill="var(--success)" font-size="10.5" font-family="sans-serif">Update RMF</text>

            <line x1="180" y1="175" x2="240" y2="175" stroke="var(--outline)" stroke-width="1.5"/>
            <text x="210" y="170" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">NO</text>
            <text x="240" y="179" fill="#839896" font-size="11" font-family="sans-serif">✓ OK</text>

            <path d="M 0 185 Q -20 100 30 38" fill="none" stroke="var(--success)" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#arr-d)"/>
          </svg>
          <p class="text-[10px] text-on-surface-variant text-center mt-1">Closing the loop is a legal obligation — not optional</p>
        </div>
      `
    }
  ];

const partBSlides = [
    {
      title: `Overview of Risk Analysis Techniques`,
      section: `overview`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Module B: Risk Analysis Workshop</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          In this module, we explore how various qualitative and quantitative techniques are used to identify hazards and estimate risk in medical device design and manufacturing.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Choosing the Right Tool</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          ISO 14971 does not mandate a single technique. Instead, it refers to standard reliability engineering methods described in ISO/TR 24971 Annex B. Choosing the right tool depends on the phase of development and the nature of the hazard.
        </p>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li><strong>PHA</strong> for early-stage baseline hazard identification.</li>
          <li><strong>FMEA</strong> for bottom-up component failure reliability.</li>
          <li><strong>FTA</strong> for top-down system fault combination logic.</li>
          <li><strong>ETA</strong> for forward safety barrier event path tracing.</li>
          <li><strong>HAZOP</strong> for process parameter deviation studies.</li>
          <li><strong>HACCP</strong> for sterile manufacturing process control points.</li>
        </ul>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">Tool Box Comparison</h4>
          <svg viewBox="0 0 280 200" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="120" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="70" y="40" text-anchor="middle" fill="var(--on-surface)" font-size="11" font-family="sans-serif" font-weight="bold">PHA</text>
            <text x="70" y="52" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Early Concept baseline</text>

            <rect x="150" y="20" width="120" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="210" y="40" text-anchor="middle" fill="var(--on-surface)" font-size="11" font-family="sans-serif" font-weight="bold">FMEA</text>
            <text x="210" y="52" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Bottom-up components</text>

            <rect x="10" y="80" width="120" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="70" y="100" text-anchor="middle" fill="var(--on-surface)" font-size="11" font-family="sans-serif" font-weight="bold">FTA / ETA</text>
            <text x="70" y="112" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">System Logic &amp; Sequences</text>

            <rect x="150" y="80" width="120" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="210" y="100" text-anchor="middle" fill="var(--on-surface)" font-size="11" font-family="sans-serif" font-weight="bold">HAZOP</text>
            <text x="210" y="112" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Process Guide-words</text>

            <rect x="80" y="140" width="120" height="40" rx="3" fill="var(--primary-container)" stroke="var(--success)" stroke-width="1.5"/>
            <text x="140" y="160" text-anchor="middle" fill="var(--success)" font-size="11" font-family="sans-serif" font-weight="bold">HACCP</text>
            <text x="140" y="172" text-anchor="middle" fill="#839896" font-size="11" font-family="sans-serif">Sterile line monitoring</text>
          </svg>
        </div>
      `,
      isWide: false
    },
    {
      title: `Preliminary Hazard Analysis (PHA)`,
      section: `pha`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Early Design Stage Baseline</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          PHA is a qualitative technique used at the very beginning of the design phase (before detailed schematics exist). It helps establish a baseline of known hazards, guided by historical data, standards, and competitor complaints.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Pacemaker PHA Example</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          A PHA is conducted on a new implantable pacemaker to identify high-level hazards (e.g., electromagnetic interference, lead migration, battery depletion) and define baseline safety requirements before mechanical drawings are drafted.
        </p>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li><strong>Hazard:</strong> Bleeding / pocket haematoma during insertion.</li>
          <li><strong>Hazard:</strong> Inadequate battery longevity leading to sudden failure.</li>
          <li><strong>Hazard:</strong> Pacemaker pocket infection.</li>
          <li><strong>Hazard:</strong> Incompatibility with MRI magnetic fields.</li>
        </ul>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">PHA Pacemaker Baseline</h4>
          <svg viewBox="0 0 280 200" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="240" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--tertiary)" stroke-width="1.2"/>
            <text x="30" y="44" fill="var(--on-surface)" font-size="10.5" font-family="sans-serif" font-weight="bold">1. MRI RF Field Exposure</text>
            <text x="250" y="44" text-anchor="end" fill="var(--error)" font-size="12" font-family="sans-serif" font-weight="bold">Severity: Critical</text>

            <rect x="20" y="80" width="240" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--tertiary)" stroke-width="1.2"/>
            <text x="30" y="104" fill="var(--on-surface)" font-size="10.5" font-family="sans-serif" font-weight="bold">2. Lithium Battery Depletion</text>
            <text x="250" y="104" text-anchor="end" fill="var(--error)" font-size="12" font-family="sans-serif" font-weight="bold">Severity: Critical</text>

            <rect x="20" y="140" width="240" height="40" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="30" y="164" fill="var(--on-surface)" font-size="10.5" font-family="sans-serif" font-weight="bold">3. Hermetic Seal Leakage</text>
            <text x="250" y="164" text-anchor="end" fill="var(--error)" font-size="12" font-family="sans-serif" font-weight="bold">Severity: Catastrophic</text>
          </svg>
        </div>
      `,
      isWide: false
    },
    {
      title: `Failure Mode and Effects Analysis (FMEA)`,
      section: `fmea`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Bottom-Up Reliability Analysis</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          FMEA is a structured, inductive (bottom-up) technique that analyzes component failure modes, their causes, and their effects on device function. FMEA is highly effective at finding design and process reliability weaknesses.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Design FMEA for Catheter Assembly</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          FMEA is performed on a steerable catheter to analyze catheter tip detachment during deployment in the femoral artery. Adhesive bonding failure (Cause) results in arterial embolisation (Effect).
        </p>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li><strong>Failure Mode:</strong> Catheter distal tip detachment.</li>
          <li><strong>Local Effect:</strong> Tip remains in blood vessel (embolisation).</li>
          <li><strong>Clinical Consequence:</strong> Vascular occlusion or stroke (Severity: S4).</li>
          <li><strong>Risk Control:</strong> Add 100% mechanical pull-testing in production.</li>
        </ul>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">FMEA Worksheet Snippet</h4>
          <svg viewBox="0 0 280 200" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="15" width="260" height="170" rx="3" fill="var(--surface)" stroke="var(--outline)" stroke-width="1"/>
            <line x1="10" y1="50" x2="270" y2="50" stroke="var(--outline)" stroke-width="1"/>

            <text x="20" y="36" fill="var(--success)" font-size="10.5" font-family="sans-serif" font-weight="bold">Item / Function</text>
            <text x="110" y="36" fill="var(--success)" font-size="10.5" font-family="sans-serif" font-weight="bold">Failure Mode</text>
            <text x="210" y="36" fill="var(--success)" font-size="10.5" font-family="sans-serif" font-weight="bold">Severity</text>

            <text x="20" y="80" fill="var(--on-surface)" font-size="12" font-family="sans-serif">Catheter Tip</text>
            <text x="110" y="80" fill="var(--on-surface)" font-size="12" font-family="sans-serif">Tip detachment</text>
            <text x="210" y="80" fill="var(--error)" font-size="12" font-family="sans-serif">S4 Critical</text>

            <text x="20" y="120" fill="var(--on-surface)" font-size="12" font-family="sans-serif">Sheath Tube</text>
            <text x="110" y="120" fill="var(--on-surface)" font-size="12" font-family="sans-serif">Kinking during use</text>
            <text x="210" y="120" fill="var(--tertiary)" font-size="12" font-family="sans-serif">S2 Minor</text>

            <text x="20" y="160" fill="var(--on-surface)" font-size="12" font-family="sans-serif">Handle Lock</text>
            <text x="110" y="160" fill="var(--on-surface)" font-size="12" font-family="sans-serif">Fails to engage</text>
            <text x="210" y="160" fill="var(--tertiary)" font-size="12" font-family="sans-serif">S2 Minor</text>
          </svg>
        </div>
      `,
      isWide: false
    },
    {
      title: `Fault Tree Analysis (FTA) — Top-Down Logic`,
      section: `fta`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Top-Down Systemic Risk Logic</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          FTA is a deductive (top-down) system analysis technique that starts with an undesired 'Top Event' (e.g., drug overdose) and traces backward through logical AND/OR gates to identify the combinations of component failures or user errors that could cause it.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Logical Gates &amp; Risk Estimation</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          An AND gate indicates that all input events must occur for the output to happen. An OR gate indicates that any single input event is sufficient. This helps identify single points of failure (OR gates) versus redundant protections (AND gates).
        </p>
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
            <rect x="90" y="10" width="120" height="35" rx="2" fill="var(--surface-container-highest)" stroke="var(--secondary)" stroke-width="1.5" id="fta-top-rect"></rect>
            <text x="150" y="25" text-anchor="middle" fill="var(--error)" font-size="12" font-family="Space Grotesk" id="fta-top-text">OVERDOSE DELIVERED</text>
            
            <!-- Connection Lines -->
            <line x1="150" y1="45" x2="150" y2="70" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="150" y1="70" x2="60" y2="70" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="150" y1="70" x2="240" y2="70" stroke="var(--secondary)" stroke-width="1.5"></line>
            
            <line x1="60" y1="70" x2="60" y2="120" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="240" y1="70" x2="240" y2="100" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="240" y1="120" x2="200" y2="120" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="240" y1="120" x2="280" y2="120" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="200" y1="120" x2="200" y2="160" stroke="var(--secondary)" stroke-width="1.5"></line>
            <line x1="280" y1="120" x2="280" y2="160" stroke="var(--secondary)" stroke-width="1.5"></line>

            <!-- OR Gate (Left Branch) -->
            <polygon points="45,95 75,95 60,78" fill="var(--primary)" id="fta-or-gate"></polygon>
            <text x="60" y="110" text-anchor="middle" fill="var(--on-surface-variant)" font-size="12" font-family="Space Grotesk">OR</text>

            <!-- AND Gate (Right Branch) -->
            <rect x="225" y="90" width="30" height="20" rx="2" fill="var(--primary)" id="fta-and-gate"></rect>
            <text x="240" y="102" text-anchor="middle" fill="#003731" font-size="12" font-family="Space Grotesk">AND</text>

            <!-- Node Boxes -->
            <!-- Software error -->
            <rect x="15" y="145" width="90" height="30" rx="2" fill="var(--surface-container-highest)" stroke="var(--outline)" id="box-software"></rect>
            <text x="60" y="163" text-anchor="middle" fill="var(--on-surface-variant)" font-size="11">Software Bug</text>

            <!-- Flow Sensor Fails -->
            <rect x="155" y="145" width="90" height="30" rx="2" fill="var(--surface-container-highest)" stroke="var(--outline)" id="box-sensor"></rect>
            <text x="200" y="163" text-anchor="middle" fill="var(--on-surface-variant)" font-size="11">Sensor Fails</text>

            <!-- Alarm fails -->
            <rect x="250" y="145" width="45" height="30" rx="2" fill="var(--surface-container-highest)" stroke="var(--outline)" id="box-alarm"></rect>
            <text x="272" y="163" text-anchor="middle" fill="var(--on-surface-variant)" font-size="11">Alarm Fails</text>
          </svg>
          <div class="mt-4 text-xs font-mono text-on-surface" id="fta-status-text">
            Status: Safe (No failures active)
          </div>
        </div>
      `,
      isWide: false
    },
    {
      title: `Event Tree Analysis (ETA) — Pathfinder`,
      section: `eta`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Tracing Safety Barrier Sequences</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          ETA is an inductive (forward-looking) technique that starts with an initiating event (e.g., pressure sensor failure) and branches forward through the success or failure of subsequent safety barriers to determine the final clinical outcomes.
        </p>
        <p class="text-xs text-primary font-mono uppercase mb-2">Select Clinical Example</p>
        <div class="grid grid-cols-3 gap-2 mb-4" id="eta-example-selector">
          <button class="p-2 bg-surface-container-high border border-primary text-primary font-sans text-xs uppercase font-semibold rounded active" data-ex="ventilator">Ventilator</button>
          <button class="p-2 bg-surface-container-high border border-outline-variant text-on-surface-variant font-sans text-xs uppercase rounded" data-ex="pump">Syringe Pump</button>
          <button class="p-2 bg-surface-container-high border border-outline-variant text-on-surface-variant font-sans text-xs uppercase rounded" data-ex="defib">AED Shock</button>
        </div>
        <p class="text-xs text-primary font-mono uppercase mb-2">Interactive Path Tracer</p>
        <p class="text-xs text-on-surface-variant mb-4">Click the safeguard barrier buttons below to toggle whether they work (YES) or fail (NO), and trace the clinical outcome.</p>
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
          <button class="p-2 bg-surface-container-high rounded border border-outline-variant text-on-surface" id="eta-btn-alarm">Barrier 1</button>
          <button class="p-2 bg-surface-container-high rounded border border-outline-variant text-on-surface" id="eta-btn-response">Barrier 2</button>
          <button class="p-2 bg-surface-container-high rounded border border-outline-variant text-on-surface" id="eta-btn-valve">Barrier 3</button>
        </div>
        <div class="p-3 bg-surface-container rounded border border-outline-variant text-xs text-on-surface" id="eta-choice-summary">
          Current Path: Initiating Event → Barrier 1 (Yes) → Barrier 2 (Yes) → Barrier 3 (Yes)
        </div>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center items-center p-4">
          <h4 class="font-mono text-primary text-xs uppercase mb-4" id="eta-diagram-title">ETA Branching Diagram</h4>
          <div class="w-full bg-surface-container p-4 rounded border border-outline-variant text-xs space-y-3 font-mono">
            <div class="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-on-surface">
              <span id="eta-label-alarm">1. Barrier 1?</span>
              <span class="text-primary font-bold" id="eta-status-alarm">YES</span>
            </div>
            <div class="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-on-surface">
              <span id="eta-label-response">2. Barrier 2?</span>
              <span class="text-primary font-bold" id="eta-status-response">YES</span>
            </div>
            <div class="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-on-surface">
              <span id="eta-label-valve">3. Barrier 3?</span>
              <span class="text-primary font-bold" id="eta-status-valve">YES</span>
            </div>
            <div class="flex flex-col gap-1 pt-2 border-t border-outline-variant/30">
              <span class="text-xs text-on-surface-variant">Outcome:</span>
              <span class="text-primary font-bold font-serif text-sm leading-tight" id="eta-outcome-text">NO HARM</span>
            </div>
          </div>
          <p class="text-[10px] text-on-surface-variant mt-4 text-center" id="eta-footer-text">Failing multiple barriers in sequence leads to clinical harm.</p>
        </div>
      `,
      isWide: false
    },
    {
      title: `HAZOP Example: Insulin Infusion Pump`,
      section: `hazop`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Guide-Word Deviation Analysis</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          HAZOP is a systematic, team-based technique that uses standardized guide words (More, Less, No, Reverse) applied to process parameters (Flow, Pressure, Temperature) to identify deviations from design intent.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Clinical Example: Insulin Infusion Pump</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          The node analyzed is the "Insulin delivery line". We apply guide words to see the deviations and identify safety requirements.
        </p>
        <p class="mb-4 text-xs text-on-surface-variant">Click the deviation buttons below to analyze the HAZOP study records.</p>
        <div class="grid grid-cols-2 gap-2" id="hazop-selector">
          <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono active text-primary" data-p="Flow" data-gw="More">More Flow (Overdose)</button>
          <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono" data-p="Flow" data-gw="Less">Less Flow (Underfill)</button>
          <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono" data-p="Flow" data-gw="No">No Flow (Blockage)</button>
          <button class="p-2.5 bg-surface-container-high border border-outline-variant rounded text-xs font-mono" data-p="Pressure" data-gw="More">More Pressure (Occlusion)</button>
        </div>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant" id="hazop-details-panel">
          <h3 class="font-serif text-headline-lg text-primary mb-2">Deviation Analysis</h3>
          <p class="text-xs text-on-surface-variant">Click one of the buttons on the left to display possible causes, consequences, safeguards, and required actions.</p>
        </div>
      `,
      isWide: false
    },
    {
      title: `HACCP Example: Catheter Steam Sterilization`,
      section: `haccp`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Critical Control Points (CCPs)</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          HACCP is a preventive system developed to control hazards at critical points in a manufacturing process. It establishes Critical Limits (measurable values), monitoring procedures, and corrective actions to prevent, eliminate, or reduce hazards to acceptable levels.
        </p>
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">HACCP in Catheter Sterilization</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          Applying HACCP to catheter manufacturing establishes limits for critical sterilization, assembly, and packaging steps.
        </p>
        <p class="text-xs text-on-surface-variant mb-4 font-semibold text-primary">Click each CCP in the process pipeline below to inspect limits:</p>
        <div class="flex flex-col gap-2 font-mono text-xs" id="haccp-stepper-list">
          <div class="p-3 bg-surface-container rounded border border-outline-variant cursor-pointer hover:border-primary text-on-surface transition-all haccp-step active border-primary bg-primary/5 text-primary" data-step="1" onclick="window.showHaccp(1)">
            Step 1: Steam Sterilization <span class="float-right text-primary text-[10px] font-bold">CCP-1</span>
          </div>
          <div class="p-3 bg-surface-container rounded border border-outline-variant cursor-pointer hover:border-primary text-on-surface transition-all haccp-step" data-step="2" onclick="window.showHaccp(2)">
            Step 2: Aseptic Assembly <span class="float-right text-primary text-[10px] font-bold">CCP-2</span>
          </div>
          <div class="p-3 bg-surface-container rounded border border-outline-variant cursor-pointer hover:border-primary text-on-surface transition-all haccp-step" data-step="3" onclick="window.showHaccp(3)">
            Step 3: Sterile Sealing <span class="float-right text-primary text-[10px] font-bold">CCP-3</span>
          </div>
        </div>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-6 bg-surface-container-high rounded border border-outline-variant" id="haccp-details">
          <h3 class="font-serif text-headline-lg text-primary mb-3">Autoclave Sterilization (CCP-1)</h3>
          <div class="space-y-2 text-xs text-on-surface-variant">
            <p><strong>Biological Hazard:</strong> Bacterial spores survival, compromising sterile barrier.</p>
            <p><strong>Critical Limit:</strong> Chamber temperature ≥ 121.1°C for at least 15 minutes.</p>
            <p><strong>Monitoring:</strong> Continuous calibrated thermocouple probe and pressure sensor recording for each autoclave batch.</p>
            <p class="text-primary"><strong>Corrective Action:</strong> Quarantine the batch, run biological indicator strip analysis, and repeat autoclave cycle with corrected steam parameters.</p>
          </div>
        </div>
      `,
      isWide: false
    },
    {
      title: `Workshop Wrap-Up &amp; Hands-On Exercise`,
      section: `wrapup`,
      content: `
        <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2">Integrating Analysis Techniques</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
          A robust risk management file rarely relies on a single technique. In practice, medical device manufacturers combine these methods to achieve complete coverage:
        </p>
        <ul class="list-disc pl-5 mb-4 text-on-surface-variant text-sm space-y-1">
          <li><strong>PHA</strong> provides the early baseline of hazards during conceptual design.</li>
          <li><strong>FMEA</strong> systematically analyzes component failure modes and reliability.</li>
          <li><strong>FTA</strong> traces multiple failures to top-level hazardous events.</li>
          <li><strong>HAZOP</strong> identifies deviations in complex process nodes and fluid lines.</li>
          <li><strong>HACCP</strong> establishes control points and monitoring on the production floor.</li>
        </ul>
        <div class="p-3 bg-surface-container-high rounded border border-outline-variant flex flex-col gap-3">
          <p class="text-xs text-on-surface-variant">When you are ready to complete your competence assessment, click the button below to open the exams.</p>
          <button class="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-mono text-xs uppercase font-semibold rounded transition-colors w-full" onclick="window.goToQuizzes()">Open Competence Exams</button>
        </div>
      `,
      infographic: `
        <div class="h-full flex flex-col justify-center p-4">
          <h4 class="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-4 text-center">Integrated Risk Analysis Strategy</h4>
          <svg viewBox="0 0 280 200" width="100%" height="180" xmlns="http://www.w3.org/2000/svg" class="font-mono">
            <!-- Grid connectors -->
            <path d="M 50 45 L 50 145 M 50 145 L 230 145 M 230 145 L 230 45 M 50 95 L 230 95" stroke="var(--outline-variant)" stroke-width="1.5" stroke-dasharray="3,3" fill="none"/>
            
            <!-- PHA Node -->
            <rect x="15" y="15" width="70" height="30" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="50" y="28" text-anchor="middle" fill="var(--on-surface)" font-size="9" font-weight="bold">1. PHA</text>
            <text x="50" y="39" text-anchor="middle" fill="var(--on-surface-variant)" font-size="6">Early hazards list</text>

            <!-- FMEA Node -->
            <rect x="195" y="15" width="70" height="30" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="230" y="28" text-anchor="middle" fill="var(--on-surface)" font-size="9" font-weight="bold">2. FMEA</text>
            <text x="230" y="39" text-anchor="middle" fill="var(--on-surface-variant)" font-size="6">Reliability & faults</text>

            <!-- FTA Node -->
            <rect x="15" y="80" width="70" height="30" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="50" y="93" text-anchor="middle" fill="var(--on-surface)" font-size="9" font-weight="bold">3. FTA</text>
            <text x="50" y="104" text-anchor="middle" fill="var(--on-surface-variant)" font-size="6">Root cause logic</text>

            <!-- HAZOP Node -->
            <rect x="195" y="80" width="70" height="30" rx="3" fill="var(--surface-container-highest)" stroke="var(--outline)" stroke-width="1"/>
            <text x="230" y="93" text-anchor="middle" fill="var(--on-surface)" font-size="9" font-weight="bold">4. HAZOP</text>
            <text x="230" y="104" text-anchor="middle" fill="var(--on-surface-variant)" font-size="6">Process dev. study</text>

            <!-- HACCP Node -->
            <rect x="105" y="130" width="70" height="30" rx="3" fill="var(--primary-container)" stroke="var(--primary)" stroke-width="1"/>
            <text x="140" y="143" text-anchor="middle" fill="var(--primary)" font-size="9" font-weight="bold">5. HACCP</text>
            <text x="140" y="154" text-anchor="middle" fill="var(--secondary)" font-size="6">CCP monitoring</text>

            <!-- Center arrow workflow -->
            <path d="M 90 30 L 190 30 M 230 50 L 230 75 M 190 95 L 90 95 M 50 115 L 50 140" stroke="var(--primary)" stroke-width="1.5" fill="none" marker-end="url(#arr-blue)"/>
            
            <defs>
              <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="var(--primary)"/>
              </marker>
            </defs>
          </svg>
        </div>
      `
    }
  ];

function renderPartA(container) {
    const slides = partASlides;

    // Mark current slide as viewed
    state.slidesViewed.partA[state.partASlide] = true;
    saveProgress();

    const slide = slides[state.partASlide];
    updateSectionHighlight("partA", slide.section);

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
          <div class="lg:col-span-5 flex flex-col justify-between min-h-[500px] pr-0 lg:pr-8 border-r-0 lg:border-r border-outline-variant">
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
          <div class="lg:col-span-7 flex items-center justify-center min-h-[480px] bg-surface-container/30 rounded border border-outline-variant p-6">
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
    if (state.partASlide === 2) {
      setupTermsInteractivity();
    } else if (state.partASlide === 4) {
      setupMatrixInteractivity();
    } else if (state.partASlide === 6) {
      setupDelphiInteractivity();
    } else if (state.partASlide === 8) {
      setupMatchGame();
    } else if (state.partASlide === 10) {
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
        cardEl.style.display = 'none'; // Hide matching card on successful match (TEC-14)
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

      // Apply transforms — beam rotates around center (150, 70)
      if (scaleBeam) {
        scaleBeam.setAttribute("transform", `rotate(${angle}, 150, 70)`);
      }
      // Counter-rotate pans around their respective pivot points to stay horizontal (gravity effect)
      if (panLeft) {
        panLeft.setAttribute("transform", `rotate(${-angle}, 50, 70)`);
      }
      if (panRight) {
        panRight.setAttribute("transform", `rotate(${-angle}, 250, 70)`);
      }

      if (!outcomeBadge) return;
      if (angle > 1) {
        outcomeBadge.textContent = "BENEFITS OUTWEIGH RESIDUAL RISK — Accepted per §7.4";
        outcomeBadge.style.color = "var(--success)";
        outcomeBadge.style.borderColor = "var(--success)";
        outcomeBadge.style.backgroundColor = "rgba(47, 133, 90, 0.06)";
      } else if (angle < -1) {
        outcomeBadge.textContent = "RISK OUTWEIGHS BENEFITS — Still UNACCEPTABLE";
        outcomeBadge.style.color = "var(--error)";
        outcomeBadge.style.borderColor = "var(--error)";
        outcomeBadge.style.backgroundColor = "rgba(197, 48, 48, 0.06)";
      } else {
        outcomeBadge.textContent = "BALANCED — Borderline — additional evidence needed";
        outcomeBadge.style.color = "var(--tertiary)";
        outcomeBadge.style.borderColor = "var(--tertiary)";
        outcomeBadge.style.backgroundColor = "rgba(183, 121, 31, 0.06)";
      }
    }

    checkboxes.forEach(cb => { cb.onchange = updateScale; });
    updateScale(); // initialize
  }

  // Module B: Analysis Workshop Rendering
  function renderPartB(container) {
    const slides = partBSlides;

    // Mark current slide as viewed
    state.slidesViewed.partB[state.partBSlide] = true;
    saveProgress();

    const slide = slides[state.partBSlide];
    updateSectionHighlight("partB", slide.section);
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
            <div class="lg:col-span-5 flex flex-col justify-between min-h-[500px] pr-0 lg:pr-8 border-r-0 lg:border-r border-outline-variant">
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
            <div class="lg:col-span-7 flex items-center justify-center min-h-[480px] bg-surface-container/30 rounded border border-outline-variant p-6">
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
    if (state.partBSlide === 3) {
      setupFtaInteractivity();
    } else if (state.partBSlide === 4) {
      setupEtaInteractivity();
    } else if (state.partBSlide === 5) {
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

    // Make SVG node boxes directly clickable to toggle (TEC-17) with hover highlights
    const ftaBoxes = [
      { el: boxSoftware, sw: swSoftware },
      { el: boxSensor, sw: swSensor },
      { el: boxAlarm, sw: swAlarm }
    ];
    ftaBoxes.forEach(b => {
      if (b.el) {
        b.el.style.cursor = 'pointer';
        b.el.addEventListener('click', () => {
          if (b.sw) { b.sw.checked = !b.sw.checked; updateFta(); }
        });
        b.el.addEventListener('mouseover', () => {
          b.el.style.strokeWidth = "2.5px";
          b.el.style.filter = "drop-shadow(0 2px 4px rgba(26,54,93,0.15))";
        });
        b.el.addEventListener('mouseout', () => {
          b.el.style.strokeWidth = "1.5px";
          b.el.style.filter = "";
        });
      }
    });

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
    let activeEx = "ventilator";

    const examples = {
      ventilator: {
        title: "ETA Branching: Ventilator Pressure",
        b1: "Alarm triggers?",
        b2: "Clinician responds?",
        b3: "Relief valve opens?",
        footer: "Failing multiple barriers in sequence leads to barotrauma lung damage.",
        calc: (v1, v2, v3) => {
          if (v1 && v2) return { text: "NO HARM (Alarm triggered clinician response)", color: "text-primary" };
          if (v1 && !v2 && v3) return { text: "MINOR HARM (Valve opened, alarm ignored)", color: "text-tertiary" };
          if (v1 && !v2 && !v3) return { text: "SERIOUS HARM (Barotrauma, valve failed)", color: "text-error" };
          if (!v1 && v3) return { text: "MODERATE HARM (Valve opened, no alarm)", color: "text-tertiary font-bold" };
          return { text: "CRITICAL HARM (Barotrauma, all barriers failed)", color: "text-error font-bold animate-pulse" };
        }
      },
      pump: {
        title: "ETA Branching: Pump Occlusion",
        b1: "Sensor alarms?",
        b2: "Software auto-pauses?",
        b3: "Nurse clears line?",
        footer: "If occlusion sensors and auto-pause fail, lines can burst or deliver massive drug boluses.",
        calc: (v1, v2, v3) => {
          if (v2) return { text: "NO HARM (Motor automatically stopped)", color: "text-primary" };
          if (v1 && v3) return { text: "MINOR HARM (Nurse intervened manually)", color: "text-tertiary" };
          if (v1 && !v3) return { text: "SERIOUS HARM (Alarm ignored; line burst)", color: "text-error" };
          return { text: "CRITICAL HARM (Bolus overdose delivered to patient)", color: "text-error font-bold animate-pulse" };
        }
      },
      defib: {
        title: "ETA Branching: AED Shock",
        b1: "Self-test warns?",
        b2: "Operator notes alert?",
        b3: "Backup AED available?",
        footer: "If AED fails self-test alerts and backup units aren't available, resuscitation fails.",
        calc: (v1, v2, v3) => {
          if (v1 && v2 && v3) return { text: "NO HARM (Operator gets backup AED)", color: "text-primary" };
          if (v1 && v2 && !v3) return { text: "CRITICAL HARM (AED failed, no backup available)", color: "text-error font-bold" };
          if (!v1 && v3) return { text: "MINOR HARM (AED failed silently, used backup AED)", color: "text-tertiary" };
          return { text: "FATAL HARM (Silent AED failure, patient dies)", color: "text-error font-bold animate-pulse" };
        }
      }
    };

    function toggleBtn(btn, val, label) {
      if (val) {
        btn.textContent = `YES: ${label.split(" ")[0]} (Working)`;
        btn.style.color = "var(--primary)";
        btn.style.borderColor = "var(--primary-container)";
      } else {
        btn.textContent = `NO: ${label.split(" ")[0]} (Fails)`;
        btn.style.color = "var(--error)";
        btn.style.borderColor = "var(--error-container)";
      }
    }

    function calculateEta() {
      const exData = examples[activeEx];
      const outcome = exData.calc(valAlarm, valResponse, valValve);

      stAlarm.textContent = valAlarm ? "YES" : "NO";
      stAlarm.className = valAlarm ? "text-primary font-bold" : "text-error font-bold";

      stResponse.textContent = valResponse ? "YES" : "NO";
      stResponse.className = valResponse ? "text-primary font-bold" : "text-error font-bold";

      stValve.textContent = valValve ? "YES" : "NO";
      stValve.className = valValve ? "text-primary font-bold" : "text-error font-bold";

      outcomeText.textContent = outcome.text;
      outcomeText.className = `${outcome.color} font-bold font-serif text-sm leading-tight`;

      summaryText.textContent = `Path: Init Event → ${exData.b1.split(" ")[0]} (${valAlarm?'Yes':'No'}) → ${exData.b2.split(" ")[0]} (${valResponse?'Yes':'No'}) → ${exData.b3.split(" ")[0]} (${valValve?'Yes':'No'})`;
      
      toggleBtn(btnAlarm, valAlarm, exData.b1);
      toggleBtn(btnResponse, valResponse, exData.b2);
      toggleBtn(btnValve, valValve, exData.b3);
    }

    // Set up example selectors
    const exampleBtns = document.querySelectorAll("#eta-example-selector button");
    exampleBtns.forEach(btn => {
      btn.onclick = () => {
        exampleBtns.forEach(b => {
          b.classList.remove("border-primary", "text-primary", "active");
          b.classList.add("border-outline-variant", "text-on-surface-variant");
        });
        btn.classList.remove("border-outline-variant", "text-on-surface-variant");
        btn.classList.add("border-primary", "text-primary", "active");

        activeEx = btn.getAttribute("data-ex");
        const exData = examples[activeEx];

        document.getElementById("eta-diagram-title").textContent = exData.title;
        document.getElementById("eta-label-alarm").textContent = `1. ${exData.b1}`;
        document.getElementById("eta-label-response").textContent = `2. ${exData.b2}`;
        document.getElementById("eta-label-valve").textContent = `3. ${exData.b3}`;
        document.getElementById("eta-footer-text").textContent = exData.footer;

        calculateEta();
      };
    });

    btnAlarm.onclick = () => { valAlarm = !valAlarm; calculateEta(); };
    btnResponse.onclick = () => { valResponse = !valResponse; calculateEta(); };
    btnValve.onclick = () => { valValve = !valValve; calculateEta(); };

    calculateEta();
  }



  // Interactivity: HAZOP matrix
    function setupHazopInteractivity() {
    const selectorButtons = document.querySelectorAll("#hazop-selector button");
    const panelEl = document.getElementById("hazop-details-panel");

    const deviations = {
      "Flow_More": {
        title: "Deviation: More Flow (Overdose)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Software bug in stepping motor driver, siphon effect, or valve failure.</p>
          <p class="mb-2"><strong>Consequence:</strong> Patient receives excessive insulin infusion, leading to severe clinical hypoglycemia (low blood sugar shock).</p>
          <p class="mb-2"><strong>Safeguard:</strong> Dual redundant CPU verification checks, independent flow-sensor shutoff.</p>
          <p class="text-primary"><strong>Action Required:</strong> Implement physical flow-limiting orifice in infusion catheter set.</p>
        `
      },
      "Flow_Less": {
        title: "Deviation: Less Flow (Under-infusion)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Battery voltage depletion, internal drive friction drag.</p>
          <p class="mb-2"><strong>Consequence:</strong> Under-infusion of insulin, leading to slow onset of hyperglycemia.</p>
          <p class="mb-2"><strong>Safeguard:</strong> Daily self-test cycle measuring motor drive current and battery capacity.</p>
          <p class="text-primary"><strong>Action Required:</strong> Code a low-voltage early warning battery alarm alert.</p>
        `
      },
      "Flow_No": {
        title: "Deviation: No Flow (Blockage)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Catheter tubing kinked, needle dislodged, or catheter tip occlusion.</p>
          <p class="mb-2"><strong>Consequence:</strong> Zero insulin delivered, causing rapid onset of diabetic ketoacidosis (DKA).</p>
          <p class="mb-2"><strong>Safeguard:</strong> High-precision inline occlusion pressure alarm sensor.</p>
          <p class="text-primary"><strong>Action Required:</strong> Redesign set connector collar to prevent accidental line compression.</p>
        `
      },
      "Pressure_More": {
        title: "Deviation: More Pressure (Occlusion build-up)",
        body: `
          <p class="mb-2"><strong>Possible Cause:</strong> Motor continues pushing against a blocked / kinked catheter line.</p>
          <p class="mb-2"><strong>Consequence:</strong> Pump strain, line rupture, or sudden bolus delivery upon occlusion release.</p>
          <p class="mb-2"><strong>Safeguard:</strong> Motor strain-gauge current sensor, high-pressure auto-halt software check.</p>
          <p class="text-primary"><strong>Action Required:</strong> Program motor driver to perform 2 reverse steps to relieve line pressure upon occlusion alarm detection.</p>
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
        if (panelEl && dev) {
          panelEl.innerHTML = `
            <h3 class="font-serif text-headline-lg text-primary mb-2">${dev.title}</h3>
            <div class="space-y-2 text-xs text-on-surface-variant">
              ${dev.body}
            </div>
          `;
        }
      };
    });

    if (selectorButtons[0]) selectorButtons[0].click();
  }



  // HACCP Stepper Globals
    window.showHaccp = (step) => {
    const details = document.getElementById("haccp-details");
    const steps = document.querySelectorAll(".haccp-step");
    
    steps.forEach(s => {
      s.classList.remove("border-primary", "bg-primary/5", "text-primary");
      const num = parseInt(s.getAttribute("data-step"));
      if (num === step) {
        s.classList.add("border-primary", "bg-primary/5", "text-primary");
      }
    });

    const data = {
      1: {
        title: "Steam Sterilization (Autoclave) (CCP-1)",
        content: `
          <p class="mb-2"><strong>Biological Hazard:</strong> Bacterial spores survival, compromising sterile barrier.</p>
          <p class="mb-2"><strong>Critical Limit:</strong> Chamber temperature &ge; 121.1&deg;C for at least 15 minutes.</p>
          <p class="mb-2"><strong>Monitoring:</strong> Continuous calibrated thermocouple probe and pressure sensor recording for each autoclave batch.</p>
          <p class="text-primary"><strong>Corrective Action:</strong> Quarantine the batch, run biological indicator strip analysis, and repeat autoclave cycle with corrected steam parameters.</p>
        `
      },
      2: {
        title: "Aseptic Assembly (CCP-2)",
        content: `
          <p class="mb-2"><strong>Particulate Hazard:</strong> Environmental contamination in cleanroom during component assembly.</p>
          <p class="mb-2"><strong>Critical Limit:</strong> ISO Class 5 air quality (&lt; 3,520 particles/m&sup3; of size &ge; 0.5&micro;m).</p>
          <p class="mb-2"><strong>Monitoring:</strong> Continuous real-time airborne particle counter probes placed at the filling line.</p>
          <p class="text-primary"><strong>Corrective Action:</strong> Immediately stop assembly line, evacuate cleanroom, perform HEPA filter inspection, and run line clearance before restart.</p>
        `
      },
      3: {
        title: "Sterile Sealing (CCP-3)",
        content: `
          <p class="mb-2"><strong>Package Integrity Hazard:</strong> Incomplete sterile barrier seals, allowing microbial ingress.</p>
          <p class="mb-2"><strong>Critical Limit:</strong> Seal width &ge; 6mm and seal peel strength &ge; 1.5 N/15mm.</p>
          <p class="mb-2"><strong>Monitoring:</strong> Visual inspection of every pouch, and destructive peel test on 5 samples per batch.</p>
          <p class="text-primary"><strong>Corrective Action:</strong> Halt packaging, quarantine affected pouches since last passed test, verify heating element temperature calibration, and re-pouch parts.</p>
        `
      }
    };

    const activeData = data[step];
    if (details && activeData) {
      details.innerHTML = `
        <h3 class="font-serif text-headline-lg text-primary mb-3">${activeData.title}</h3>
        <div class="space-y-2 text-xs text-on-surface-variant font-sans">
          ${activeData.content}
        </div>
      `;
    }
  };

;

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
    // Render Live Exam Interface
  function renderExamStage(container, type) {
    const data = type === 'A' ? quizAData : quizBData;
    let activeQIndex = 0;
    const userAnswers = Array(data.length).fill(null);

    function renderQuestion() {
      const qObj = data[activeQIndex];
      
      if (qObj.isDragOrder) {
        if (userAnswers[activeQIndex] === null) {
          userAnswers[activeQIndex] = 0; // default initial choice
        }
        const currentChoice = userAnswers[activeQIndex];
        const orders = {
          0: [0, 2, 1], // Warning -> Guard -> Design
          1: [2, 0, 1], // Guard -> Warning -> Design
          2: [1, 2, 0], // Design -> Guard -> Warning (CORRECT)
          3: [1, 0, 2], // Design -> Warning -> Guard
          4: [2, 1, 0]  // Guard -> Design -> Warning
        };
        const currentOrder = orders[currentChoice] || [0, 2, 1];
        
        const labels = [
          "Provide a warning label in the Instructions for Use (IFU)",
          "Design out the hazard by selecting non-toxic materials",
          "Add a protective guard on the device housing"
        ];
        
        container.innerHTML = `
          <div class="max-w-[700px] mx-auto bg-surface-container p-8 rounded ghost-border">
            <div class="flex justify-between items-center mb-6 pb-2 border-b border-outline-variant">
              <span class="text-xs text-primary font-mono uppercase font-bold">Exam ${type} — Question ${activeQIndex + 1} of ${data.length}</span>
              <span class="text-xs text-on-surface-variant font-mono">Progress: ${Math.round((activeQIndex / data.length) * 100)}%</span>
            </div>

            <h3 class="font-serif text-lg text-on-surface mb-3 leading-relaxed">${qObj.q}</h3>
            
            ${qObj.schematic ? `<div class="mb-6 p-4 bg-surface-container-high rounded border border-outline-variant flex justify-center">${qObj.schematic}</div>` : ''}

            <p class="text-xs text-on-surface-variant mb-6 italic">Drag and drop the blocks below to arrange them from HIGHEST priority (top) to LOWEST priority (bottom).</p>

            <div class="space-y-3 mb-8" id="sortable-list">
              ${currentOrder.map((itemIdx, seqIdx) => `
                <div class="sort-item p-4 bg-surface-container-high rounded border border-outline-variant hover:border-primary/50 cursor-grab flex items-center gap-4 text-xs font-mono text-on-surface" draggable="true" data-id="${itemIdx}">
                  <span class="text-primary font-bold text-sm">${seqIdx + 1}</span>
                  <span class="flex-grow">${labels[itemIdx]}</span>
                  <span class="material-symbols-outlined text-on-surface-variant cursor-ns-resize">unfold_more</span>
                </div>
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
        
        const list = container.querySelector("#sortable-list");
        const itemsList = Array.from(list.querySelectorAll(".sort-item"));
        let draggedItem = null;
        
        itemsList.forEach(item => {
          item.addEventListener("dragstart", () => {
            draggedItem = item;
            item.style.opacity = "0.5";
          });
          item.addEventListener("dragend", () => {
            draggedItem = null;
            item.style.opacity = "";
            
            const newOrder = Array.from(list.querySelectorAll(".sort-item")).map(el => parseInt(el.getAttribute("data-id")));
            let choiceVal = 99; // default wrong
            for (const [ch, ord] of Object.entries(orders)) {
              if (JSON.stringify(ord) === JSON.stringify(newOrder)) {
                choiceVal = parseInt(ch);
                break;
              }
            }
            userAnswers[activeQIndex] = choiceVal;
          });
          item.addEventListener("dragover", (e) => {
            e.preventDefault();
            const bounding = item.getBoundingClientRect();
            const offset = e.clientY - bounding.top - bounding.height / 2;
            if (offset < 0) {
              item.parentNode.insertBefore(draggedItem, item);
            } else {
              item.parentNode.insertBefore(draggedItem, item.nextSibling);
            }
          });
        });

      } else {
        container.innerHTML = `
          <div class="max-w-[700px] mx-auto bg-surface-container p-8 rounded ghost-border">
            <div class="flex justify-between items-center mb-6 pb-2 border-b border-outline-variant">
              <span class="text-xs text-primary font-mono uppercase font-bold">Exam ${type} — Question ${activeQIndex + 1} of ${data.length}</span>
              <span class="text-xs text-on-surface-variant font-mono">Progress: ${Math.round((activeQIndex / data.length) * 100)}%</span>
            </div>

            <h3 class="font-serif text-lg text-on-surface mb-6 leading-relaxed">${qObj.q}</h3>

            ${qObj.schematic ? `<div class="mb-6 p-4 bg-surface-container-high rounded border border-outline-variant flex justify-center">${qObj.schematic}</div>` : ''}

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
      }

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
            <button class="px-6 py-3 bg-primary text-background font-sans text-sm uppercase font-bold rounded hover:opacity-90 transition-all" onclick="window.goDashboard()">Back to Dashboard</button>
            <button class="px-6 py-3 border border-primary text-primary font-sans text-sm uppercase font-semibold rounded hover:bg-primary hover:text-background transition-all" onclick="window.goCertificate()">Get Certificate →</button>
          </div>
        </div>
      </div>
    `;

    window.goDashboard = () => navigateTo("dashboard");
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
      <div class="max-w-[800px] mx-auto mt-12 p-12 bg-white text-slate-900 border-[16px] border-double border-[var(--primary)] flex flex-col justify-center items-center text-center relative shadow-2xl" id="print-certificate-container">
        <!-- Corner decorations -->
        <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[var(--primary)]"></div>
        <div class="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[var(--primary)]"></div>
        <div class="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[var(--primary)]"></div>
        <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[var(--primary)]"></div>

        <!-- Orderly People Logo -->
        <img src="orderly_logo.png" alt="Orderly People" class="h-14 mb-6 opacity-80" style="filter: invert(1) brightness(0);" onerror="this.style.display='none'">

        <h4 style="font-family:'Georgia',serif; font-size:11px; letter-spacing:0.25em; color:#6a7a76; text-transform:uppercase; margin-bottom:28px;">Certificate of Completion</h4>
        <h1 style="font-family:'Georgia',serif; font-size:38px; font-weight:bold; color:var(--primary); margin-bottom:6px;">ISO 14971 Compliance</h1>
        <h3 style="font-family:'Georgia',serif; font-size:12px; letter-spacing:0.12em; color:#6a7a76; text-transform:uppercase; margin-bottom:28px;">Risk Management of Medical Devices</h3>
        
        <p style="font-family:'Georgia',serif; font-style:italic; font-size:14px; color:#4a5a56; margin-bottom:14px;">This document certifies that</p>
        <h2 style="font-family:'Georgia',serif; font-size:30px; font-weight:bold; color:var(--primary); border-bottom:2px solid #c8d4d2; padding:0 32px 8px; margin-bottom:22px;" id="cert-display-name">${state.userName || '[YOUR NAME]'}</h2>
        
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
