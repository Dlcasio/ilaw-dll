import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageOrientation,
} from "docx";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import type { DllInput, DllOutput } from "./dll.functions";

const DAY_LABELS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];

function rowsForExport(dll: DllOutput) {
  return [
    { label: "Objectives", values: dll.days.map((d) => d.objective) },
    { label: "Pre-Lesson", values: dll.days.map((d) => d.preLesson) },
    { label: "Learning Flow (5E)", values: dll.days.map((d) => d.flow) },
    { label: "Activities", values: dll.days.map((d) => d.activities) },
    { label: "Resources", values: dll.days.map((d) => d.resources) },
    { label: "Assessment", values: dll.days.map((d) => d.assessment) },
    { label: "Ways Forward", values: dll.days.map((d) => d.waysForward) },
  ];
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ───────── DOCX ─────────
export async function exportDocx(input: DllInput, dll: DllOutput) {
  const headerCell = (txt: string, header = false) =>
    new TableCell({
      shading: header ? { type: ShadingType.CLEAR, fill: "064E3B", color: "auto" } : undefined,
      width: { size: header ? 1800 : 1900, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: txt,
              bold: header,
              color: header ? "F5F0E0" : "1A1A1A",
              size: 18,
            }),
          ],
        }),
      ],
    });

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Component", true),
      ...DAY_LABELS.map((d) => headerCell(d, true)),
    ],
  });

  const dataRows = rowsForExport(dll).map(
    (r) =>
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "F5F0E0", color: "auto" },
            width: { size: 1800, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: r.label, bold: true, size: 18 })] })],
          }),
          ...r.values.map(
            (v) =>
              new TableCell({
                width: { size: 1900, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: v, size: 18 })] })],
              }),
          ),
        ],
      }),
  );

  const para = (text: string, opts: { bold?: boolean; size?: number } = {}) =>
    new Paragraph({ children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 20 })] });

  const sectionHeading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, color: "064E3B", size: 26 })],
    });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        properties: {
          page: { size: { width: 15840, height: 12240, orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "DAILY LESSON LOG", bold: true, color: "064E3B", size: 32 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Republic of the Philippines — Department of Education", italics: true, size: 18 })],
          }),
          para(""),
          para(`Grade Level: ${input.gradeLevel}    Learning Area: ${input.learningArea}    Quarter: ${input.quarter}    Week: ${input.week}`, { bold: true }),
          para(`Teaching Dates: ${input.teachingDates}    Sessions: ${input.sessions}`),
          para(`Topic: ${input.topic}`, { bold: true }),
          para(""),
          sectionHeading("I. Intentions"),
          para(`Learning Competency: ${dll.competencyRestated}`),
          para(`Content Standard: ${input.contentStandard}`),
          para(`Performance Standard: ${input.performanceStandard}`),
          para(""),
          sectionHeading("II. 5-Day Plan"),
          new Table({
            width: { size: 14400, type: WidthType.DXA },
            columnWidths: [1800, 2520, 2520, 2520, 2520, 2520],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "064E3B" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "064E3B" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "064E3B" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "064E3B" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "C9A84C" },
              insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "C9A84C" },
            },
            rows: [headerRow, ...dataRows],
          }),
          para(""),
          sectionHeading("III. Learner Context"),
          para(`Prior Knowledge: ${dll.learnerContext.priorKnowledge}`),
          para(`Interests: ${dll.learnerContext.interests}`),
          para(`Strengths: ${dll.learnerContext.strengths}`),
          para(`Misconceptions: ${dll.learnerContext.misconceptions}`),
          para(`Learning Barriers: ${dll.learnerContext.learningBarriers}`),
          para(`Real-Life Experiences: ${dll.learnerContext.realLifeExperiences}`),
          sectionHeading("IV. Differentiated Instruction"),
          para(`Advanced Learners: ${dll.differentiatedInstruction.advanced}`),
          para(`Average Learners: ${dll.differentiatedInstruction.average}`),
          para(`Struggling Learners: ${dll.differentiatedInstruction.struggling}`),
          para(`Learners with Disabilities: ${dll.differentiatedInstruction.disabilities}`),
          sectionHeading("V. Opportunities for Integration"),
          para(dll.integration),
          sectionHeading("VI. Teacher Reflection"),
          para(dll.teacherReflection),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, `DLL_${input.learningArea}_W${input.week}.docx`);
}

// ───────── PDF ─────────
export function exportPdf(input: DllInput, dll: DllOutput) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 32;
  let y = margin;

  pdf.setFont("times", "bold");
  pdf.setTextColor(6, 78, 59);
  pdf.setFontSize(18);
  pdf.text("DAILY LESSON LOG — DepEd ILAW Format", pageW / 2, y, { align: "center" });
  y += 18;
  pdf.setFontSize(10);
  pdf.setFont("times", "italic");
  pdf.text("Republic of the Philippines • Department of Education", pageW / 2, y, { align: "center" });
  y += 18;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(10);
  const meta = `Grade ${input.gradeLevel}  |  ${input.learningArea}  |  Q${input.quarter}  W${input.week}  |  ${input.teachingDates}  |  Topic: ${input.topic}`;
  pdf.text(meta, margin, y);
  y += 16;

  // Table
  const colLabelW = 90;
  const colW = (pageW - margin * 2 - colLabelW) / 5;
  const rows = rowsForExport(dll);

  const drawCell = (text: string, x: number, yy: number, w: number, h: number, opts: { fill?: [number, number, number]; color?: [number, number, number]; bold?: boolean } = {}) => {
    if (opts.fill) {
      pdf.setFillColor(opts.fill[0], opts.fill[1], opts.fill[2]);
      pdf.rect(x, yy, w, h, "F");
    }
    pdf.setDrawColor(201, 168, 76);
    pdf.rect(x, yy, w, h);
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
    const c = opts.color ?? [20, 20, 20];
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(text || "—", w - 6);
    pdf.text(lines, x + 3, yy + 10);
  };

  // Header
  const headerH = 22;
  drawCell("COMPONENT", margin, y, colLabelW, headerH, { fill: [6, 78, 59], color: [245, 240, 224], bold: true });
  DAY_LABELS.forEach((d, i) => {
    drawCell(d, margin + colLabelW + i * colW, y, colW, headerH, { fill: [6, 78, 59], color: [245, 240, 224], bold: true });
  });
  y += headerH;

  rows.forEach((r) => {
    // Compute row height by longest cell
    pdf.setFontSize(8);
    const heights = [r.label, ...r.values].map((txt, i) => {
      const w = i === 0 ? colLabelW : colW;
      return pdf.splitTextToSize(txt || "—", w - 6).length;
    });
    const rowH = Math.max(...heights) * 10 + 8;

    if (y + rowH > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
    drawCell(r.label, margin, y, colLabelW, rowH, { fill: [245, 240, 224], bold: true });
    r.values.forEach((v, i) => drawCell(v, margin + colLabelW + i * colW, y, colW, rowH));
    y += rowH;
  });

  // Appendix page
  pdf.addPage();
  y = margin;
  const writeSection = (title: string, body: string) => {
    if (y > pageH - 80) { pdf.addPage(); y = margin; }
    pdf.setFont("times", "bold");
    pdf.setTextColor(6, 78, 59);
    pdf.setFontSize(13);
    pdf.text(title, margin, y);
    y += 14;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(body, pageW - margin * 2);
    pdf.text(lines, margin, y);
    y += lines.length * 12 + 8;
  };

  writeSection("Learning Competency", dll.competencyRestated);
  writeSection("Learner Context",
    `Prior Knowledge: ${dll.learnerContext.priorKnowledge}\nInterests: ${dll.learnerContext.interests}\nStrengths: ${dll.learnerContext.strengths}\nMisconceptions: ${dll.learnerContext.misconceptions}\nLearning Barriers: ${dll.learnerContext.learningBarriers}\nReal-Life Experiences: ${dll.learnerContext.realLifeExperiences}`);
  writeSection("Differentiated Instruction",
    `Advanced: ${dll.differentiatedInstruction.advanced}\nAverage: ${dll.differentiatedInstruction.average}\nStruggling: ${dll.differentiatedInstruction.struggling}\nWith Disabilities: ${dll.differentiatedInstruction.disabilities}`);
  writeSection("Opportunities for Integration", dll.integration);
  writeSection("Teacher Reflection", dll.teacherReflection);

  pdf.save(`DLL_${input.learningArea}_W${input.week}.pdf`);
}

// ───────── XLSX ─────────
export function exportXlsx(input: DllInput, dll: DllOutput) {
  const rows = rowsForExport(dll);
  const aoa: (string)[][] = [];
  aoa.push(["DepEd ILAW — Daily Lesson Log"]);
  aoa.push([`Grade ${input.gradeLevel}`, input.learningArea, `Q${input.quarter}`, `W${input.week}`, input.teachingDates]);
  aoa.push([`Topic: ${input.topic}`]);
  aoa.push([]);
  aoa.push(["Component", ...DAY_LABELS]);
  rows.forEach((r) => aoa.push([r.label, ...r.values]));
  aoa.push([]);
  aoa.push(["Learning Competency", dll.competencyRestated]);
  aoa.push(["Integration", dll.integration]);
  aoa.push(["Teacher Reflection", dll.teacherReflection]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 22 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DLL");
  XLSX.writeFile(wb, `DLL_${input.learningArea}_W${input.week}.xlsx`);
}
