const axios = require("axios");
const pdf = require("pdf-parse");

// Configuración inicial
const DEEPSEEK_API_KEY = "tu_api_key";
const COMPANY_NAME = "Alphabet Inc.";
const REPORT_YEAR = 2024;

// 1. Búsqueda del 10-K con DeepSeek API
async function find10K() {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/search",
      {
        query: `${COMPANY_NAME} 10-K ${REPORT_YEAR} filetype:pdf`,
        domain: "sec.gov",
        limit: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );

    return response.data.results[0].url;
  } catch (error) {
    console.error("Error en búsqueda:", error.response.data);
  }
}

// 2. Descarga y procesamiento del PDF
async function process10K(pdfUrl) {
  try {
    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    const pdfData = await pdf(Buffer.from(response.data));

    return pdfData.text;
  } catch (error) {
    console.error("Error procesando PDF:", error);
  }
}

// 3. Resumen con IA
async function generateSummary(text) {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/summarize",
      {
        text: text,
        instructions:
          "Resumir en 10 puntos clave en español incluyendo: desempeño financiero, estrategias crecimiento, factores riesgo, innovaciones tecnológicas y desafíos legales",
        format: "markdown",
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );

    return response.data.summary;
  } catch (error) {
    console.error("Error generando resumen:", error.response.data);
  }
}

// 4. Extracción estructurada de datos
async function extractStructuredData(text) {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/extract",
      {
        text: text,
        schema: {
          financial_performance: {
            total_revenue: "number",
            revenue_growth: "percentage",
            net_income: "number",
          },
          risk_factors: ["string"],
          key_projects: [
            {
              name: "string",
              capex: "number",
              description: "string",
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error extrayendo datos:", error.response.data);
  }
}

// Flujo principal
async function main() {
  // Paso 1: Encontrar el documento
  const pdfUrl = await find10K();
  console.log("Documento encontrado:", pdfUrl);

  // Paso 2: Procesar PDF
  const pdfText = await process10K(pdfUrl);

  // Paso 3: Generar resumen
  const summary = await generateSummary(pdfText.substring(0, 100000)); // Limitar tamaño
  console.log("Resumen generado:\n", summary);

  // Paso 4: Extraer datos estructurados
  const structuredData = await extractStructuredData(pdfText);
  console.log("Datos financieros:", structuredData.financial_performance);
  console.log("Proyectos clave:", structuredData.key_projects);
}

main();
