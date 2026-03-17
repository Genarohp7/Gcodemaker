function createProjectPreview({
  title,
  subtitle,
  accent = "#4da3ff",
  accent2 = "#ffcb4e",
  dark = "#091525",
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="760" gradientUnits="userSpaceOnUse">
          <stop stop-color="${dark}" />
          <stop offset="1" stop-color="#10213A" />
        </linearGradient>
        <linearGradient id="accent" x1="120" y1="120" x2="1080" y2="640" gradientUnits="userSpaceOnUse">
          <stop stop-color="${accent}" stop-opacity="0.35" />
          <stop offset="1" stop-color="${accent2}" stop-opacity="0.18" />
        </linearGradient>
      </defs>

      <rect width="1200" height="760" rx="36" fill="url(#bg)" />
      <rect x="28" y="28" width="1144" height="704" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />

      <circle cx="90" cy="82" r="10" fill="#FF5F57" />
      <circle cx="122" cy="82" r="10" fill="#FEBC2E" />
      <circle cx="154" cy="82" r="10" fill="#28C840" />

      <rect x="210" y="62" width="420" height="40" rx="20" fill="rgba(255,255,255,0.06)" />
      <rect x="770" y="62" width="160" height="40" rx="20" fill="rgba(255,255,255,0.06)" />
      <rect x="950" y="62" width="140" height="40" rx="20" fill="rgba(255,255,255,0.06)" />

      <rect x="70" y="148" width="1060" height="540" rx="28" fill="url(#accent)" />

      <rect x="112" y="192" width="260" height="412" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.08)" />
      <rect x="406" y="192" width="342" height="190" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.08)" />
      <rect x="780" y="192" width="308" height="190" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.08)" />
      <rect x="406" y="414" width="682" height="190" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.08)" />

      <rect x="144" y="234" width="150" height="18" rx="9" fill="rgba(255,255,255,0.18)" />
      <rect x="144" y="270" width="180" height="16" rx="8" fill="rgba(255,255,255,0.10)" />
      <rect x="144" y="302" width="130" height="16" rx="8" fill="rgba(255,255,255,0.10)" />

      <rect x="440" y="230" width="180" height="18" rx="9" fill="rgba(255,255,255,0.16)" />
      <rect x="440" y="264" width="250" height="16" rx="8" fill="rgba(255,255,255,0.10)" />
      <rect x="440" y="296" width="220" height="16" rx="8" fill="rgba(255,255,255,0.10)" />

      <rect x="814" y="230" width="170" height="18" rx="9" fill="rgba(255,255,255,0.16)" />
      <rect x="814" y="264" width="190" height="16" rx="8" fill="rgba(255,255,255,0.10)" />
      <rect x="814" y="296" width="140" height="16" rx="8" fill="rgba(255,255,255,0.10)" />

      <text x="112" y="658" fill="#EAF3FF" font-family="Montserrat, Arial, sans-serif" font-size="52" font-weight="700">
        ${title}
      </text>
      <text x="112" y="698" fill="#9DB0CB" font-family="Montserrat, Arial, sans-serif" font-size="24" font-weight="500">
        ${subtitle}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const projects = [
  {
    id: "kelom",
    name: "Kelom",
    category: "Plataforma web",
    status: "Proyecto destacado",
    description:
      "Sitio pensado para ayudar a las parejas a encontrar proveedores para su boda de una forma clara, ordenada y agradable de usar.",
    summary:
      "Es el proyecto más completo del portafolio porque demuestra organización de información, crecimiento del producto y visión a largo plazo.",
    notes: [
      "Proyecto real en línea y en evolución constante",
      "Organiza mucha información sin perder claridad",
      "Muestra capacidad para construir y mejorar una solución viva",
    ],
    stack: ["React", "Vite", "Node", "PostgreSQL"],
    url: "https://kelom.com.mx/",
    cta: "Ver proyecto",
    featured: true,
    imageSrc: createProjectPreview({
      title: "Kelom",
      subtitle: "Plataforma web para el sector de bodas",
      accent: "#4da3ff",
      accent2: "#ffcb4e",
      dark: "#07111f",
    }),
    imageAlt: "Vista conceptual del proyecto Kelom",
  },
  {
    id: "marketing-makers",
    name: "Marketing Makers",
    category: "Sitio comercial",
    status: "Proyecto publicado",
    description:
      "Página orientada a presentar servicios de marketing y diseño de una forma más visual, directa y profesional.",
    summary:
      "Ayuda a mostrar una propuesta comercial con más claridad y con una presentación que se siente actual.",
    notes: [
      "Proyecto real disponible en línea",
      "Enfoque fuerte en presentación comercial",
      "Pensado para comunicar valor desde el primer vistazo",
    ],
    stack: ["React", "CSS", "JavaScript"],
    url: "https://marketingmakers.com.mx/",
    cta: "Ver proyecto",
    featured: false,
    imageSrc: createProjectPreview({
      title: "Marketing Makers",
      subtitle: "Sitio comercial para marketing y diseño",
      accent: "#7bb8ff",
      accent2: "#f6b94d",
      dark: "#0a1627",
    }),
    imageAlt: "Vista conceptual del proyecto Marketing Makers",
  },
  {
    id: "pizza",
    name: "Pizza",
    category: "Landing page",
    status: "Proyecto terminado",
    description:
      "Landing page para una pizzería, pensada para mostrar productos, promociones y facilitar el contacto de forma rápida y visual.",
    summary:
      "Es un proyecto terminado que demuestra cómo construir una página atractiva para un negocio local, aunque no se haya publicado oficialmente para el cliente.",
    notes: [
      "Proyecto finalizado y funcional",
      "Diseñado para generar antojo visual y acción rápida",
      "Ejemplo claro de página de negocio enfocada en conversión",
    ],
    stack: ["HTML", "CSS", "JavaScript"],
    url: "https://genarohp7.github.io/pizza/",
    cta: "Ver proyecto",
    featured: false,
    imageSrc: createProjectPreview({
      title: "Pizza",
      subtitle: "Landing page para una pizzería",
      accent: "#ff8a5b",
      accent2: "#ffd166",
      dark: "#1a0f10",
    }),
    imageAlt: "Vista conceptual del proyecto Pizza",
  },
  {
    id: "gcodemaker",
    name: "GCodemaker",
    category: "Portafolio personal",
    status: "Proyecto publicado",
    description:
      "Mi portafolio personal en reconstrucción, enfocado en presentar mejor mi trabajo, mis servicios y la forma en la que desarrollo proyectos web.",
    summary:
      "Aquí no solo muestro proyectos; también demuestro cómo puedo mejorar una presentación digital para hacerla más clara y memorable.",
    notes: [
      "Proyecto real disponible en línea",
      "Ejemplo directo de rediseño y evolución visual",
      "Muestra que también trabajo sobre sitios ya existentes",
    ],
    stack: ["React", "Vite", "CSS"],
    url: "https://gcodemaker.com.mx/",
    cta: "Ver proyecto",
    featured: false,
    imageSrc: createProjectPreview({
      title: "GCodemaker",
      subtitle: "Portafolio personal en evolución",
      accent: "#58a6ff",
      accent2: "#ffd166",
      dark: "#08121f",
    }),
    imageAlt: "Vista conceptual del portafolio GCodemaker",
  },
];

export default projects;