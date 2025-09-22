// Preloader

window.addEventListener("load", function () {
  document.querySelector(".preloader").classList.add("opacity-0");
  setTimeout(function () {
    document.querySelector(".preloader").style.display = "none";
  }, 1000);
});

// iTyped

window.ityped.init(document.querySelector(".iTyped"), {
  strings: [
    "Machine Learning Engineer",
    "AI & Trading Projects",
    "Web Development",
    "Mobile Development",
    "Systems & Backend",
  ],
  loop: true,
});

// Portfolio Item Filter

const filterContainer = document.querySelector(".portfolio-filter"),
  filterBtns = filterContainer.children,
  totalFilterBtn = filterBtns.length,
  portfolioItems = document.querySelectorAll(".portfolio-item"),
  totalPortfolioItem = portfolioItems.length;

for (let i = 0; i < totalFilterBtn; i++) {
  filterBtns[i].addEventListener("click", function () {
    // Remove active class from all buttons
    filterContainer.querySelector(".active").classList.remove("active");
    this.classList.add("active");

    const filterValue = this.getAttribute("data-filter");

    // Filter portfolio items
    for (let k = 0; k < totalPortfolioItem; k++) {
      const itemCategory = portfolioItems[k].getAttribute("data-category");

      if (filterValue === "all" || filterValue === itemCategory) {
        portfolioItems[k].classList.remove("hide");
        portfolioItems[k].classList.add("show");
      } else {
        portfolioItems[k].classList.remove("show");
        portfolioItems[k].classList.add("hide");
      }
    }
  });
}

// Portfolio click functionality removed - no lightbox needed

// Aside Navbar

const nav = document.querySelector(".nav"),
  navList = nav.querySelectorAll("li"),
  totalNavList = navList.length,
  allSection = document.querySelectorAll(".section"),
  totalSection = allSection.length;

for (let i = 0; i < totalNavList; i++) {
  const a = navList[i].querySelector("a");
  a.addEventListener("click", function (e) {
    e.preventDefault();

    // Don't switch if already active
    if (this.classList.contains("active")) {
      return;
    }

    // Remove active class from all nav items
    for (let j = 0; j < totalNavList; j++) {
      navList[j].querySelector("a").classList.remove("active");
    }

    // Add active class to clicked item
    this.classList.add("active");

    // Show the target section
    showSection(this);

    // Close mobile menu if open
    if (window.innerWidth < 1200) {
      asideSectionTogglerBtn();
    }
  });
}

function addBackSectionClass(num) {
  allSection[num].classList.add("back-section");
}

function removeBackSectionClass() {
  for (let i = 0; i < totalSection; i++) {
    allSection[i].classList.remove("back-section");
  }
}

function updateNav(element) {
  for (let i = 0; i < totalNavList; i++) {
    navList[i].querySelector("a").classList.remove("active");
    const target = element.getAttribute("href").split("#")[1];
    if (
      target ===
      navList[i].querySelector("a").getAttribute("href").split("#")[1]
    ) {
      navList[i].querySelector("a").classList.add("active");
    }
  }
}

document.querySelector(".hire-me").addEventListener("click", function () {
  const sectionIndex = this.getAttribute("data-section-index");
  addBackSectionClass(sectionIndex);
  showSection(this);
  updateNav(this);
  removeBackSectionClass();
});

function showSection(element) {
  // Get the target section
  const target = element.getAttribute("href").split("#")[1];
  const targetSection = document.querySelector("#" + target);

  // Pause Tetris game if it's running
  if (window.tetrisGame && window.tetrisGame.isRunning) {
    window.tetrisGame.togglePause();
  }

  // Pause Trading Chart if it's running
  if (window.tradingChart && window.tradingChart.isRunning) {
    window.tradingChart.pauseTrading();
  }

  // Hide all sections with smooth transition
  for (let i = 0; i < totalSection; i++) {
    const section = allSection[i];
    if (section.classList.contains("active")) {
      // Add exit animation
      section.style.animation = "slideOutToLeft 0.3s ease-in forwards";
      setTimeout(() => {
        section.classList.remove("active");
        section.style.animation = "";
      }, 300);
    } else {
      section.classList.remove("active");
    }
  }

  // Show target section with delay for smooth transition
  setTimeout(() => {
    targetSection.classList.add("active");
  }, 300);
}

const navTogglerBtn = document.querySelector(".nav-toggler"),
  aside = document.querySelector(".aside");

navTogglerBtn.addEventListener("click", asideSectionTogglerBtn);

function asideSectionTogglerBtn() {
  aside.classList.toggle("open");
  navTogglerBtn.classList.toggle("open");
  for (let i = 0; i < totalSection; i++) {
    allSection[i].classList.toggle("open");
  }
}
