import React from "react";
import { PDFDocument } from "pdf-lib";

export default function DownloadAttemptCardPDF({ athlete }) {
  const fillPdfTemplate = async () => {
    try {
      // Fetch the PDF template from the public folder
      const response = await fetch('/templates/attempt_card_template.pdf');
      if (!response.ok) throw new Error(`File not found: ${response.statusText}`);
      const pdfBytes = await response.arrayBuffer();

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Fill out form fields (replace with your actual field names)
      form.getTextField("LotNo").setText(athlete.lotn || "");
      form.getTextField("Name").setText(athlete.name || "");
      // ...add other fields as needed

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `attempt_card_${athlete.name || "athlete"}.pdf`;
      link.click();
    } catch (err) {
      alert("Error generating PDF: " + err.message);
      console.error(err);
    }
  };

  return (
    <button onClick={fillPdfTemplate}>
      Download Attempt Card as PDF
    </button>
  );
}