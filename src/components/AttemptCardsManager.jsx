import React, { useState } from "react";
import ExcelJS from "exceljs";

function AttemptCardsManager({ athletes }) {
  const sessions = Array.from(new Set(athletes.map(a => a.session).filter(Boolean)));
  const [selectedSession, setSelectedSession] = useState(null);

  const athletesInSession = selectedSession
    ? athletes.filter((a) => a.session === selectedSession)
    : [];

  const formatUTCDateTime = () => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  };

  const copyCompleteCell = (sourceCell, targetCell) => {
    if (sourceCell.value !== null && sourceCell.value !== undefined) {
      targetCell.value = sourceCell.value;
    }

    if (sourceCell.style) {
      targetCell.style = {
        ...sourceCell.style,
        font: sourceCell.font ? { ...sourceCell.font } : undefined,
        alignment: sourceCell.alignment ? { ...sourceCell.alignment } : undefined,
        border: sourceCell.border ? {
          top: sourceCell.border.top ? { ...sourceCell.border.top } : undefined,
          left: sourceCell.border.left ? { ...sourceCell.border.left } : undefined,
          bottom: sourceCell.border.bottom ? { ...sourceCell.border.bottom } : undefined,
          right: sourceCell.border.right ? { ...sourceCell.border.right } : undefined,
          diagonal: sourceCell.border.diagonal ? { ...sourceCell.border.diagonal } : undefined
        } : undefined,
        fill: sourceCell.fill ? { ...sourceCell.fill } : undefined,
        numFmt: sourceCell.numFmt,
        protection: sourceCell.protection ? { ...sourceCell.protection } : undefined
      };
    }

    if (sourceCell.font) targetCell.font = { ...sourceCell.font };
    if (sourceCell.alignment) targetCell.alignment = { ...sourceCell.alignment };
    if (sourceCell.border) targetCell.border = { ...sourceCell.border };
    if (sourceCell.fill) targetCell.fill = { ...sourceCell.fill };
    if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt;
    if (sourceCell.protection) targetCell.protection = { ...sourceCell.protection };
  };

  const downloadWorkbook = async () => {
    if (!athletesInSession.length) return;

    try {
      const response = await fetch('/templates/attempt_card_template.xlsx');
      if (!response.ok) throw new Error('Template not found');
      const templateBuffer = await response.arrayBuffer();

      const templateWorkbook = new ExcelJS.Workbook();
      await templateWorkbook.xlsx.load(templateBuffer);
      const templateSheet = templateWorkbook.worksheets[0];

      const workbook = new ExcelJS.Workbook();

      for (let i = 0; i < athletesInSession.length; i++) {
        const athlete = athletesInSession[i];
        const worksheet = workbook.addWorksheet(`AttemptCard${i + 1}`);

        // Copy all template properties and formatting
        if (templateSheet.properties) worksheet.properties = { ...templateSheet.properties };
        if (templateSheet.pageSetup) worksheet.pageSetup = { ...templateSheet.pageSetup };
        if (templateSheet.headerFooter) worksheet.headerFooter = { ...templateSheet.headerFooter };
        if (templateSheet.views) worksheet.views = templateSheet.views.map(view => ({ ...view }));

        // Copy all rows and cells
        const templateDimensions = templateSheet.dimensions;
        let maxRow = templateDimensions ? templateDimensions.bottom : 100;
        let maxCol = templateDimensions ? templateDimensions.right : 20;

        if (!templateDimensions) {
          templateSheet.eachRow((row, rowNumber) => {
            maxRow = Math.max(maxRow, rowNumber);
            row.eachCell((cell, colNumber) => {
              maxCol = Math.max(maxCol, colNumber);
            });
          });
        }

        for (let rowNum = 1; rowNum <= maxRow; rowNum++) {
          const templateRow = templateSheet.getRow(rowNum);
          const newRow = worksheet.getRow(rowNum);
          
          if (templateRow.height) newRow.height = templateRow.height;
          if (templateRow.hidden) newRow.hidden = templateRow.hidden;
          if (templateRow.outlineLevel) newRow.outlineLevel = templateRow.outlineLevel;

          for (let colNum = 1; colNum <= maxCol; colNum++) {
            const templateCell = templateRow.getCell(colNum);
            const newCell = newRow.getCell(colNum);
            copyCompleteCell(templateCell, newCell);
          }
        }

        // Copy column properties
        for (let colNum = 1; colNum <= maxCol; colNum++) {
          const templateCol = templateSheet.getColumn(colNum);
          const newCol = worksheet.getColumn(colNum);
          
          if (templateCol.width) newCol.width = templateCol.width;
          if (templateCol.hidden) newCol.hidden = templateCol.hidden;
          if (templateCol.outlineLevel) newCol.outlineLevel = templateCol.outlineLevel;
        }

        // Copy merged cells
        if (templateSheet.model?.merges) {
          templateSheet.model.merges.forEach(merge => worksheet.mergeCells(merge));
        }

        templateSheet.eachRow((row, rowNumber) => {
          row.eachCell((cell, colNumber) => {
            if (cell.isMerged && cell.master === cell && cell.model?.merge) {
              worksheet.mergeCells(cell.model.merge);
            }
          });
        });

        // Update cells with athlete data
        const utcDateTime = formatUTCDateTime();
        const updateCell = (cellAddress, value) => {
          const cell = worksheet.getCell(cellAddress);
          cell.value = value;
          
          // Apply centered alignment and black text
          cell.alignment = { 
            ...cell.alignment,
            vertical: 'middle',
            horizontal: 'center'
          };
          
          cell.font = {
            ...cell.font,
            color: { argb: 'FF000000' }, // Black text
          };
          
          // Enable text wrapping for long text
          cell.alignment.wrapText = true;
          
          // Auto-fit column width for name and team cells
          if (cellAddress === 'D4' || cellAddress === 'F4') {
            const column = worksheet.getColumn(cellAddress.charAt(0));
            if (value && value.length > 15) {
              // Reduce font size for very long text
              cell.font = {
                ...cell.font,
                size: Math.max(8, 12 - Math.floor(value.length / 15))
              };
            }
          }
        };

        // Header information
        updateCell('A1', 'Attempt Card');
        updateCell('C1', `Session ${athlete.session}`);
        updateCell('E1', utcDateTime);
        updateCell('G1', 'Attempt Card');

        // Athlete data with specified formatting
        updateCell('B4', athlete.lotn || '');
        updateCell('D4', athlete.name || '');
        updateCell('F4', athlete.team || '');
        updateCell('H4', athlete.dob || '');

        updateCell('B5', athlete.category || '');
        updateCell('D5', athlete.bodyWeight || '');
        updateCell('F5', athlete.rack || '');
        updateCell('H5', athlete.ageGroup || '');

        // Auto-size columns for better fit
        ['B', 'D', 'F', 'H'].forEach(col => {
          const column = worksheet.getColumn(col);
          column.eachCell({ includeEmpty: true }, cell => {
            if (cell.value) {
              const valueLength = cell.value.toString().length;
              if (valueLength > (column.width || 8)) {
                column.width = Math.min(30, Math.max(8, valueLength + 2));
              }
            }
          });
        });

        worksheet.getSheetValues();
      }

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attempt_cards_session_${selectedSession}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      console.error('Error details:', error);
      alert('Error generating workbook. Please try again.');
    }
  };

  // ... rest of the component (UI part) remains exactly the same ...
  return (
    <div>
      <h2>Attempt Cards</h2>
      <div style={{ marginBottom: 20 }}>
        <b>Select Session:</b>
        {sessions.map(session => (
          <button
            key={session}
            onClick={() => setSelectedSession(session)}
            style={{
              marginLeft: 10,
              background: selectedSession === session ? "#1976d2" : "#eee",
              color: selectedSession === session ? "#fff" : "#222",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Session {session}
          </button>
        ))}
        {selectedSession && (
          <button
            onClick={downloadWorkbook}
            style={{
              marginLeft: 10,
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Download Attempt Cards
          </button>
        )}
      </div>
      {selectedSession && (
        <div>
          <h3>
            Attempt Cards for Session {selectedSession} (
            {athletesInSession.length} athletes)
          </h3>
        </div>
      )}
      {!selectedSession && (
        <div style={{ marginTop: 32, color: "#444" }}>
          Please select a session to view attempt cards.
        </div>
      )}
    </div>
  );
}

export default AttemptCardsManager;