import React from "react";
import ExcelJS from "exceljs";

export default function DownloadAttemptCardExcel({ athlete }) {
  const downloadExcel = async () => {
    try {
      const response = await fetch('/templates/attempt_card_template.xlsx');
      if (!response.ok) throw new Error("Template not found");
      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];

      // Helper for reusability
      const setCell = (cell, value) => {
        worksheet.getCell(cell).value = value || "";
        worksheet.getCell(cell).font = { color: { argb: 'FF000000' }, size: 12 };
        worksheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle', shrinkToFit: true };
      };

      setCell('B4', athlete.lotn);
      setCell('D4', athlete.name);
      setCell('F4', athlete.team);
      setCell('H4', athlete.dob);
      setCell('B5', athlete.category);
      setCell('D5', athlete.bodyWeight);
      setCell('F5', athlete.rack);
      setCell('H5', athlete.ageGroup);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attempt_card_${athlete.name || "athlete"}.xlsx`;
      link.click();
    } catch (err) {
      alert("Error generating Excel: " + err.message);
      console.error(err);
    }
  };

  return (
    <button onClick={downloadExcel}>
      Download Attempt Card as Excel
    </button>
  );
}