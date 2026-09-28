import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MONTHS, formatTime } from "./utils";

interface DTREntry {
  day: number;
  amArrival: string | null;
  amDeparture: string | null;
  pmArrival: string | null;
  pmDeparture: string | null;
  hoursWorked: number;
  remarks: string | null;
}

interface DTRRecord {
  month: number;
  year: number;
  periodFrom: string;
  periodTo: string;
  totalHours: number;
  entries: DTREntry[];
  user: {
    name: string | null;
    course: string | null;
    school: string | null;
    company: string | null;
    supervisor: string | null;
  };
}

type TableCell =
  | string
  | number
  | {
      content: string;
      colSpan: number;
      styles: {
        halign: "center";
        fontStyle: "italic";
        textColor: [number, number, number];
      };
    };

type TableRow = TableCell[];

function renderDTRHalf(doc: jsPDF, record: DTRRecord, startX: number) {
  const halfW = 105;
  const marginX = 10;
  const cx = startX + halfW / 2;
  const leftEnd = startX + marginX;
  const rightEnd = startX + halfW - marginX;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.text("Civil Service Form No. 48", leftEnd, 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DAILY TIME RECORD", cx, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("-------------------------------------------------------------------------", cx, 24, { align: "center" });

  const name = record.user.name || "";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(name, cx, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("-------------------------------------------------------------------------", cx, 32, { align: "center" });

  const infoY = 37;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("For the month of", leftEnd, infoY);

  // Center month in the underline
  const monthUnderlineStart = leftEnd + 20;
  const monthUnderlineEnd = rightEnd - 12;
  const monthUnderlineCenter = monthUnderlineStart + (monthUnderlineEnd - monthUnderlineStart) / 2;
  const monthText = `${MONTHS[record.month - 1]}`;
  doc.setFont("helvetica", "bold");
  doc.text(monthText, monthUnderlineCenter, infoY - 1, { align: "center" });
  doc.line(monthUnderlineStart, infoY, monthUnderlineEnd, infoY);

  doc.setFont("helvetica", "italic");
  doc.text(",", rightEnd - 11, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(`${record.year}`, rightEnd - 9, infoY - 1);
  doc.line(rightEnd - 10, infoY, rightEnd, infoY);

  doc.setFont("helvetica", "italic");
  doc.text("Official hours of arrival", leftEnd, infoY + 5);
  doc.text("Regular Days", cx - 3, infoY + 5);
  doc.setFont("helvetica", "bold");
  doc.text("7:30 AM - 4:30 PM", cx + 18, infoY + 4.5);
  doc.line(cx + 17, infoY + 6, rightEnd, infoY + 6);

  doc.setFont("helvetica", "italic");
  doc.text("and departure", leftEnd + 5, infoY + 9);

  // Table
  const tableStartY = infoY + 13;

  const entryMap = new Map<number, DTREntry>();
  record.entries.forEach((e) => entryMap.set(e.day, e));

  const rows: TableRow[] = [];
  const daysInMonth = new Date(record.year, record.month, 0).getDate();

  let totalMinsRendered = 0;

  for (let d = 1; d <= 31; d++) {
    const entry = entryMap.get(d);
    let hStr = "";
    let mStr = "";

    if (entry && entry.hoursWorked > 0) {
      const h = Math.floor(entry.hoursWorked);
      const m = Math.round((entry.hoursWorked % 1) * 60);
      if (h > 0 || m > 0) {
        hStr = h > 0 ? h.toString() : "";
        mStr = m > 0 ? m.toString() : "";
      }
      totalMinsRendered += entry.hoursWorked * 60;
    }

    if (d > daysInMonth) {
      rows.push(["", "", "", "", "", "", ""]);
    } else {
      const date = new Date(record.year, record.month - 1, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      if (isWeekend && (!entry || entry.hoursWorked === 0)) {
        rows.push([
          d,
          { content: "WEEKEND", colSpan: 6, styles: { halign: "center", fontStyle: "italic", textColor: [128, 128, 128] } }
        ]);
      } else if (entry) {
        const amIn = entry.amArrival ? formatTime(entry.amArrival).replace(" AM", "").replace(" PM", "") : "";
        const amOut = entry.amDeparture ? formatTime(entry.amDeparture).replace(" AM", "").replace(" PM", "") : "";
        const pmIn = entry.pmArrival ? formatTime(entry.pmArrival).replace(" AM", "").replace(" PM", "") : "";
        const pmOut = entry.pmDeparture ? formatTime(entry.pmDeparture).replace(" AM", "").replace(" PM", "") : "";

        rows.push([
          d,
          amIn,
          amOut,
          pmIn,
          pmOut,
          hStr,
          mStr,
        ]);
      } else {
        rows.push([d, "", "", "", "", "", ""]);
      }
    }
  }

  const grandTotalH = Math.floor(totalMinsRendered / 60);
  const grandTotalM = Math.round(totalMinsRendered % 60);

  autoTable(doc, {
    startY: tableStartY,
    head: [
      [
        { content: "Days", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "A. M.", colSpan: 2, styles: { halign: "center" } },
        { content: "P. M.", colSpan: 2, styles: { halign: "center" } },
        { content: "TOTAL TIME", colSpan: 2, styles: { halign: "center" } },
      ],
      [
        { content: "ARRIVAL", styles: { halign: "center" } },
        { content: "DEPARTURE", styles: { halign: "center" } },
        { content: "ARRIVAL", styles: { halign: "center" } },
        { content: "DEPARTURE", styles: { halign: "center" } },
        { content: "Hours", styles: { halign: "center" } },
        { content: "Minutes", styles: { halign: "center" } },
      ],
    ],
    body: rows,
    foot: [
      [
        { content: "TOTAL", colSpan: 5, styles: { halign: "center", fontStyle: "bold" } },
        { content: grandTotalH > 0 ? grandTotalH.toString() : "", styles: { halign: "center", fontStyle: "bold" } },
        { content: grandTotalM > 0 ? grandTotalM.toString() : "", styles: { halign: "center", fontStyle: "bold" } },
      ],
    ],
    margin: { left: leftEnd, right: 210 - rightEnd },
    styles: {
      fontSize: 6.5,
      cellPadding: 0.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "right", cellWidth: 8 },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "center", cellWidth: 16 },
      5: { halign: "center", cellWidth: 9 },
      6: { halign: "center", cellWidth: 11 },
    },
    didParseCell: () => {
      // Reserved for future cell styling hooks.
    }
  });

  const finalY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY) + 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");

  const certifyText = "I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.";

  doc.text(certifyText, leftEnd, finalY, {
    maxWidth: rightEnd - leftEnd,
    align: "justify"
  });

  const sigY = finalY + 18;
  // Right-aligned line for trainee
  doc.line(leftEnd + 15, sigY, rightEnd, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("(Signature of Trainee)", rightEnd, sigY + 4, { align: "right" });

  const sigY2 = sigY + 15;
  // Align In-Charge line to match the trainee signature line
  doc.line(leftEnd + 15, sigY2, rightEnd, sigY2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("In-Charge", rightEnd, sigY2 + 4, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("(See Instructions on back)", cx + 5, sigY2 + 8, { align: "center" });
}

export function generateDTRPdf(record: DTRRecord): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Render left half only (no duplication of the month)
  renderDTRHalf(doc, record, 0);

  const filename = `DTR_${record.user.name?.replace(/\\s+/g, "_") ?? "trainee"}_${MONTHS[record.month - 1]}_${record.year}.pdf`;
  doc.save(filename);
}

export function generateMultiMonthPdf(records: DTRRecord[]): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const validRecords = records.filter((record) => record.entries.some((entry) => entry.hoursWorked > 0));
  if (validRecords.length === 0) return;

  for (let i = 0; i < validRecords.length; i++) {
    if (i > 0 && i % 2 === 0) {
      doc.addPage();
    }
    const record = validRecords[i];
    const startX = (i % 2 === 0) ? 0 : 105;
    renderDTRHalf(doc, record, startX);
  }

  const firstRecord = validRecords[0];
  const filename = `DTR_${firstRecord.user.name?.replace(/\\s+/g, "_") ?? "trainee"}_MultiMonth.pdf`;
  doc.save(filename);
}
