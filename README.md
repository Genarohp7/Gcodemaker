# GCodemaker.com.mx

Landing principal de GCodemaker para `https://gcodemaker.com.mx/`.

## Alcance

- Sitio comercial publico de GCodemaker.
- Paginas informativas, paquetes, legales y demo IA embebido.
- Build de produccion para la raiz del dominio: `/`.

## No mezclar aqui

- Fabrica interna de demos: vive en `C:\dev\gcodemaker-demo-factory` y se publica bajo `/demo/`.
- Plataforma multiempresa de IA: vive en `C:\dev\gcodemaker-platform`.
- Documentacion maestra del ecosistema: vive en `C:\dev\gcodemaker-ecosystem`.

## Comandos

```bash
npm run dev
npm run build
npm run preview
```

El build correcto de este proyecto genera `dist/index.html` con titulo
`GCodemaker | Desarrollo web con IA integrada para negocios` y canonical
`https://gcodemaker.com.mx/`.

## Nota pendiente

La ruta `/gc-broadcast` y algunos clientes API siguen dentro de este proyecto.
Funcionan como herramienta heredada/interna, pero conviene migrarlos a
`gcodemaker-platform` cuando la plataforma ya tenga modulo administrativo listo.
