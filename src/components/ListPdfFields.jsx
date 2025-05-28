import React from "react";
import { PDFDocument } from "pdf-lib";

export default function ListPdfFields() {
  const showFields = async () => {
    try {
      const response = await fetch("/templates/attempt_card_template.pdf");
      if (!response.ok) throw new Error("Failed to load PDF");
      const formPdfBytes = await response.arrayBuffer();

      // Debug: log first few bytes
      const byteArray = new Uint8Array(formPdfBytes);
      console.log("First bytes of PDF:", byteArray.slice(0, 8));

      const pdfDoc = await PDFDocument.load(formPdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const fieldNames = fields.map(f => f.getName());
      alert("PDF Field Names:\n" + fieldNames.join("\n"));
      console.log("PDF Field Names:", fieldNames);
    } catch (err) {
      alert("Error: " + err.message);
      console.error(err);
    }
  };

  return (
    <button onClick={showFields}>
      Show PDF Field Names
    </button>
  );
}