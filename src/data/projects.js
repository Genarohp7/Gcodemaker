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
      "Plataforma web creada para organizar información, conectar usuarios con proveedores y sostener un flujo digital más completo que una página informativa tradicional.",
    summary:
      "Es el proyecto más completo del portafolio porque demuestra capacidad para construir una solución web escalable, con lógica de producto, backend, base de datos y evolución continua.",
    notes: [
      "Proyecto real en línea y en evolución constante",
      "Ejemplo de solución web completa con crecimiento progresivo",
      "Muestra capacidad para desarrollar plataformas, no solo páginas informativas",
    ],
    stack: ["React", "Vite", "Node", "PostgreSQL"],
    url: "https://kelom.com.mx/",
    cta: "Ver proyecto",
    featured: true,
    logoSrc: "/marcas/Kelom.png",
    logoAlt: "Logo de Kelom",
    imageSrc: createProjectPreview({
      title: "Kelom",
      subtitle: "Plataforma web escalable",
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
      "Sitio web orientado a presentar servicios de forma clara, visual y profesional, con una estructura pensada para comunicar valor desde el primer vistazo.",
    summary:
      "Demuestra cómo una marca de servicios puede usar su página para explicar mejor su propuesta, transmitir confianza y facilitar que un posible cliente entienda qué ofrece.",
    notes: [
      "Proyecto real disponible en línea",
      "Enfoque fuerte en presentación comercial",
      "Ejemplo de sitio profesional para vender servicios con mayor claridad",
    ],
    stack: ["React", "CSS", "JavaScript"],
    url: "https://marketingmakers.com.mx/",
    cta: "Ver proyecto",
    featured: false,
    logoSrc: "/marcas/MMakers.png",
    logoAlt: "Logo de Marketing Makers",
    imageSrc: createProjectPreview({
      title: "Marketing Makers",
      subtitle: "Sitio comercial para servicios",
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
      "Landing page enfocada en mostrar productos, promociones y contacto rápido mediante una experiencia visual directa, atractiva y fácil de recorrer.",
    summary:
      "Funciona como ejemplo de una landing comercial para negocios que necesitan presentar una oferta concreta, provocar interés y guiar al visitante hacia una acción.",
    notes: [
      "Proyecto finalizado y funcional",
      "Diseñado para generar interés visual y acción rápida",
      "Ejemplo de landing page enfocada en conversión",
    ],
    stack: ["HTML", "CSS", "JavaScript"],
    url: "https://genarohp7.github.io/pizza/",
    cta: "Ver proyecto",
    featured: false,
    logoSrc: "/marcas/Pizza.png",
    logoAlt: "Logo del proyecto Pizza",
    imageSrc: createProjectPreview({
      title: "Pizza",
      subtitle: "Landing page comercial",
      accent: "#ff8a5b",
      accent2: "#ffd166",
      dark: "#1a0f10",
    }),
    imageAlt: "Vista conceptual del proyecto Pizza",
  },
  {
    id: "gcodemaker",
    name: "GCodemaker",
    category: "Landing comercial",
    status: "Proyecto publicado",
    description:
      "Sitio propio de GCodemaker, enfocado en presentar servicios de desarrollo web, SEO inicial, presencia digital y soluciones para negocios o proyectos digitales.",
    summary:
      "Además de mostrar proyectos, funciona como ejemplo vivo de mejora continua: mensaje comercial, estructura para conversión, analítica, SEO, rendimiento y evolución visual.",
    notes: [
      "Proyecto real disponible en línea",
      "Ejemplo directo de rediseño, estrategia comercial y mejora continua",
      "Muestra que también se pueden optimizar sitios existentes para vender mejor",
    ],
    stack: ["React", "Vite", "CSS"],
    url: "https://gcodemaker.com.mx/",
    cta: "Ver proyecto",
    featured: false,
    logoSrc: "/marcas/gcodemaker.png",
    logoAlt: "Logo de GCodemaker",
    imageSrc: createProjectPreview({
      title: "GCodemaker",
      subtitle: "Landing comercial optimizada",
      accent: "#58a6ff",
      accent2: "#ffd166",
      dark: "#08121f",
    }),
    imageAlt: "Vista conceptual del sitio GCodemaker",
  },
];

export default projects;