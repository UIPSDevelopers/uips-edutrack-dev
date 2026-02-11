import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatHeaderName(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export async function generatePDFTemplate({
  title,
  subtitle,
  tableData,
  tableHeaders,
  totals,
  from,
  to,
}) {
  const doc = new jsPDF("l", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const headerHeight = 80;
  const headerBottomTextY = headerHeight + 18;

  // 🏫 Load UIPS Logo
  const logoUrl = "https://i.postimg.cc/DWkx44nh/uips-logo.png";
  let logoBase64 = null;

  try {
    const logoResponse = await fetch(logoUrl);
    const logoBlob = await logoResponse.blob();
    const reader = new FileReader();
    logoBase64 = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(logoBlob);
    });
  } catch {
    console.warn("⚠️ Logo not loaded, continuing without image.");
  }

  // 📅 Date Range
  let rangeText = "All Data";

  if (from || to) {
    const fromText = from
      ? new Date(from).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Start";

    const toText = to
      ? new Date(to).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Today";

    rangeText = `${fromText} - ${toText}`;
  }

  const generatedText = new Date().toLocaleString();

  // 🎨 Draw Header (for each page)
  const drawHeader = () => {
    // Maroon Bar
    doc.setFillColor(128, 0, 0);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 25, -2, 80, 80);
    }

    // School Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("United International Private School", pageWidth / 2, 30, {
      align: "center",
    });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(subtitle || title || "EduTrack Report", pageWidth / 2, 50, {
      align: "center",
    });

    // 🔹 BELOW the maroon bar
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    // Date Range (left)
    doc.text(`Date Range: ${rangeText}`, 40, headerBottomTextY);

    // Generated On (right)
    doc.text(
      `Generated on: ${generatedText}`,
      pageWidth - 180,
      headerBottomTextY
    );
  };

  // 📋 Table
  autoTable(doc, {
    startY: headerBottomTextY + 20,
    margin: { top: headerBottomTextY + 20, left: 40, right: 40, bottom: 40 },
    head: [tableHeaders.map((h) => formatHeaderName(h))],
    body: tableData,
    showHead: "everyPage",
    styles: { fontSize: 8, halign: "center", cellPadding: 4 },
    headStyles: {
      fillColor: [128, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },

    didDrawPage: (data) => {
      drawHeader();

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "UIPS EduTrack — Inventory Management System",
        pageWidth / 2,
        pageHeight - 20,
        { align: "center" }
      );

      // Page number
      doc.text(`Page ${data.pageNumber}`, pageWidth - 80, pageHeight - 20);
    },
  });

  // 📊 Totals (bottom of last page)
  if (totals) {
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    Object.entries(totals).forEach(([key, value], idx) => {
      doc.text(`${formatHeaderName(key)}: ${value}`, 40, finalY + idx * 15);
    });
  }

  return doc;
}
