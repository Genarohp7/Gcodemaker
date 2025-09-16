// =============================
// TU SITIO WEB - INTERACTIVIDAD
// =============================

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  // --- Navegación de tabs ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // desactivar todos
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));

      // activar seleccionado
      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab);
      target.classList.add("active");

      // acciones según tab
      if (tab.dataset.tab === "beneficios") startCounters();
      if (tab.dataset.tab === "datos") renderChart();
    });
  });

  // --- Contadores dinámicos ---
  let countersStarted = false;
  function startCounters() {
    if (countersStarted) return; // evitar reinicio
    const counters = document.querySelectorAll(".counter");
    counters.forEach((counter) => {
      counter.innerText = "0";
      const target = +counter.getAttribute("data-target");
      const increment = target / 100; // velocidad de animación

      function updateCounter() {
        const current = +counter.innerText;
        if (current < target) {
          counter.innerText = Math.ceil(current + increment);
          setTimeout(updateCounter, 40);
        } else {
          counter.innerText = target;
        }
      }
      updateCounter();
    });
    countersStarted = true;
  }

  // --- Gráfica con Chart.js ---
  let chartRendered = false;
  function renderChart() {
    if (chartRendered) return; // solo una vez
    const ctx = document.getElementById("chart");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Crecimiento",
          "Credibilidad",
          "Alcance",
          "Disponibilidad",
          "Control",
        ],
        datasets: [
          {
            label: "Con sitio web",
            data: [2, 75, 90, 100, 100],
            backgroundColor: "#0055c5",
          },
          {
            label: "Sin sitio web",
            data: [1, 20, 30, 20, 40],
            backgroundColor: "#99bfff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
    chartRendered = true;
  }

  // --- Ejecutar contadores al cargar si Beneficios está activo ---
  const beneficiosTab = document.querySelector('.tab[data-tab="beneficios"]');
  if (beneficiosTab && beneficiosTab.classList.contains("active")) {
    startCounters();
  }
});
