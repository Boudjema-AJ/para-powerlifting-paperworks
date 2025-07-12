import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Download, Scale, ArrowUpDown } from 'lucide-react';
import ExcelJS from 'exceljs';

// Utility function to calculate rankings based on a value field within a category
const calculateRank = (athletes, valueField, category, ageGroup) => {
  const categoryAthletes = athletes.filter(a => a.category === category && a.activeAgeGroup === ageGroup);
  const sorted = [...categoryAthletes]
    .filter(a => a[valueField] && !isNaN(parseFloat(a[valueField])))
    .sort((a, b) => parseFloat(b[valueField]) - parseFloat(a[valueField]));
  return athletes.map(athlete => {
    if (athlete.category !== category || athlete.activeAgeGroup !== ageGroup || !athlete[valueField] || isNaN(parseFloat(athlete[valueField]))) return 0;
    return sorted.findIndex(a => a.id === athlete.id) + 1;
  });
};

// Initialize attempts for an athlete
const initializeAttempts = (athleteId, existingAttempt1 = '') => ({
  attempt1: { value: existingAttempt1, status: 'number' },
  attempt2: { value: '', status: 'number' },
  attempt3: { value: '', status: 'number' },
  pl: { value: '', status: 'number' },
});

// Function to sort attempts from lowest to heaviest
const sortAttemptsByWeight = (attempts) => {
  const attemptKeys = ['attempt1', 'attempt2', 'attempt3', 'pl'];
  const validAttempts = [];
  
  attemptKeys.forEach(key => {
    const attempt = attempts[key];
    if (attempt && (attempt.status === 'number' || attempt.status === 'G') && 
        attempt.value && !isNaN(parseFloat(attempt.value)) && parseFloat(attempt.value) > 0) {
      validAttempts.push({
        key,
        value: parseFloat(attempt.value),
        status: attempt.status,
        originalValue: attempt.value
      });
    } else if (attempt && attempt.status !== 'number' && attempt.status !== 'G') {
      validAttempts.push({
        key,
        value: 0,
        status: attempt.status,
        originalValue: attempt.value || attempt.status
      });
    }
  });
  
  // Sort by weight value, with non-numeric attempts at the end
  return validAttempts.sort((a, b) => {
    if (a.value === 0 && b.value === 0) return 0;
    if (a.value === 0) return 1;
    if (b.value === 0) return -1;
    return a.value - b.value;
  });
};

const Results = ({ competitions, athletes, selectedCompetitionId, setAthletesGlobally }) => {
  const [attempts, setAttempts] = useState(() => {
    const savedAttempts = localStorage.getItem('competition_attempts');
    const initial = savedAttempts ? JSON.parse(savedAttempts) : {};
    // Ensure all athletes have initialized attempts
    athletes.forEach(a => {
      if (!initial[a.id]) {
        initial[a.id] = initializeAttempts(a.id, a.attempt1 || '');
      }
    });
    return initial;
  });

  const [competitionSessions, setCompetitionSessions] = useState(() => {
    const savedSessions = localStorage.getItem('competition_sessions');
    return savedSessions ? JSON.parse(savedSessions) : {};
  });

  const [filters, setFilters] = useState({
    session: '',
    category: '',
    ageGroup: ''
  });

  const [sortAttemptsBy, setSortAttemptsBy] = useState('weight'); // 'weight' or 'chronological'

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const selectedCompetition = competitions.find(c => c.id === selectedCompetitionId);
  const competitionName = selectedCompetition?.name || "No Competition Selected";

  // Update attempts state when athletes prop changes
  useEffect(() => {
    setAttempts(prev => {
      const updated = { ...prev };
      athletes.forEach(a => {
        if (!updated[a.id]) {
          updated[a.id] = initializeAttempts(a.id, a.attempt1 || '');
        }
      });
      return updated;
    });
  }, [athletes]);

  useEffect(() => {
    localStorage.setItem('competition_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('competition_sessions', JSON.stringify(competitionSessions));
  }, [competitionSessions]);

  const filteredAthletes = selectedCompetitionId
    ? athletes.filter(a =>
        a.competitionName === selectedCompetition?.name &&
        a.competitionLocation === selectedCompetition?.location &&
        a.competitionDate === selectedCompetition?.date &&
        a.competitionType === selectedCompetition?.type
      )
    : [];

  const sessions = [...new Set(filteredAthletes.map(a => a.session).filter(Boolean))];
  const categories = [...new Set(filteredAthletes.map(a => a.category).filter(Boolean))];
  const ageGroups = [...new Set(filteredAthletes.flatMap(a => a.ageGroup ? a.ageGroup.split(' ').filter(g => g) : ['Unknown']))];

  const sessionGroups = {};
  filteredAthletes.forEach(a => {
    const session = a.session || 'No Session';
    if (!sessionGroups[session]) sessionGroups[session] = [];
    sessionGroups[session].push(a);
  });

  const enrichedAthletes = Object.keys(sessionGroups).reduce((acc, session) => {
    const athletesInSession = sessionGroups[session].map(athlete => {
      const athleteAttempts = attempts[athlete.id] || initializeAttempts(athlete.id, athlete.attempt1 || '');
      const attemptValues = [
        athleteAttempts.attempt1?.status === 'number' || athleteAttempts.attempt1?.status === 'G' ? parseFloat(athleteAttempts.attempt1?.value || 0) : 0,
        athleteAttempts.attempt2?.status === 'number' || athleteAttempts.attempt2?.status === 'G' ? parseFloat(athleteAttempts.attempt2?.value || 0) : 0,
        athleteAttempts.attempt3?.status === 'number' || athleteAttempts.attempt3?.status === 'G' ? parseFloat(athleteAttempts.attempt3?.value || 0) : 0,
        athleteAttempts.pl?.status === 'number' || athleteAttempts.pl?.status === 'G' ? parseFloat(athleteAttempts.pl?.value || 0) : 0,
      ].filter(val => !isNaN(val) && val > 0);
      const bestLift = attemptValues.length > 0 ? Math.max(...attemptValues) : 0;
      const totalLift = [
        athleteAttempts.attempt1?.status === 'number' || athleteAttempts.attempt1?.status === 'G' ? parseFloat(athleteAttempts.attempt1?.value || 0) : 0,
        athleteAttempts.attempt2?.status === 'number' || athleteAttempts.attempt2?.status === 'G' ? parseFloat(athleteAttempts.attempt2?.value || 0) : 0,
        athleteAttempts.attempt3?.status === 'number' || athleteAttempts.attempt3?.status === 'G' ? parseFloat(athleteAttempts.attempt3?.value || 0) : 0,
      ].filter(val => !isNaN(val) && val > 0).reduce((sum, val) => sum + val, 0);
      return { ...athlete, bestLift, totalLift, attempts: athleteAttempts };
    });

    const ageGroupAthletes = {};
    athletesInSession.forEach(athlete => {
      const ageGroups = athlete.ageGroup ? athlete.ageGroup.split(' ').filter(g => g) : ['Unknown'];
      ageGroups.forEach(ageGroup => {
        if (!ageGroupAthletes[ageGroup]) ageGroupAthletes[ageGroup] = [];
        ageGroupAthletes[ageGroup].push({ ...athlete, activeAgeGroup: ageGroup });
      });
    });

    const rankedAthletes = {};
    Object.keys(ageGroupAthletes).forEach(ageGroup => {
      rankedAthletes[ageGroup] = ageGroupAthletes[ageGroup].map(athlete => {
        const bestLiftRank = calculateRank(ageGroupAthletes[ageGroup], 'bestLift', athlete.category, ageGroup)[ageGroupAthletes[ageGroup].findIndex(a => a.id === athlete.id)];
        const totalLiftRank = calculateRank(ageGroupAthletes[ageGroup], 'totalLift', athlete.category, ageGroup)[ageGroupAthletes[ageGroup].findIndex(a => a.id === athlete.id)];
        return { ...athlete, bestLiftRank, totalLiftRank };
      });
      rankedAthletes[ageGroup].sort((a, b) => (b.bestLift || 0) - (a.bestLift || 0));
    });

    return { ...acc, [session]: rankedAthletes };
  }, {});

  const filteredData = Object.keys(enrichedAthletes).flatMap(session =>
    Object.keys(enrichedAthletes[session]).flatMap(ageGroup =>
      enrichedAthletes[session][ageGroup].filter(athlete =>
        (!filters.session || athlete.session === filters.session) &&
        (!filters.category || athlete.category === filters.category) &&
        (!filters.ageGroup || athlete.activeAgeGroup === filters.ageGroup)
      ).map(athlete => ({
        ...athlete,
        session: `${athlete.session}_${athlete.activeAgeGroup}`
      }))
    )
  );

  const handleAttemptChange = (athleteId, attemptKey, value, status = 'number') => {
    if ((status === 'number' || status === 'G') && value && (parseFloat(value) > 99999 || value.length > 5)) {
      return;
    }

    setAttempts(prev => {
      const currentAttempt = prev[athleteId]?.[attemptKey] || { value: '', status: 'number' };
      const updatedValue = status === 'number' || status === 'G' ? value : currentAttempt.value;
      const updated = {
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] || initializeAttempts(athleteId)),
          [attemptKey]: { value: updatedValue, status },
        },
      };
      return updated;
    });

    if (attemptKey === 'attempt1' && (status === 'number' || status === 'G')) {
      setAthletesGlobally(prevAthletes =>
        prevAthletes.map(a =>
          a.id === athleteId ? { ...a, attempt1: value } : a
        )
      );
    }
  };

  const sortAthletesByCategory = (athletes) => {
    const categoryOrder = [
      '41kg', '45kg', '50kg', '55kg', '61kg', '67kg', '73kg', '79kg', '86kg', '+86kg',
      '49kg', '54kg', '59kg', '65kg', '72kg', '80kg', '88kg', '97kg', '107kg', '+107kg'
    ];
    return [...athletes].sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return (b.bestLift || 0) - (a.bestLift || 0);
    });
  };

  // Function to render attempt cell based on sorting preference
  const renderAttemptCell = (athlete, attemptIndex) => {
    const attemptKeys = ['attempt1', 'attempt2', 'attempt3', 'pl'];
    
    if (sortAttemptsBy === 'weight') {
      const sortedAttempts = sortAttemptsByWeight(athlete.attempts);
      const attempt = sortedAttempts[attemptIndex];
      
      if (!attempt) {
        return (
          <td className="px-2 py-2">
            <div className="flex flex-col items-center">
              <div className="mb-1 p-0.5 border border-gray-300 rounded-md w-12 text-sm bg-gray-100">
                -
              </div>
              <input
                type="text"
                value="-"
                readOnly
                className="w-12 p-0.5 border border-gray-300 rounded-md bg-gray-100 text-center text-sm"
              />
            </div>
          </td>
        );
      }
      
      return (
        <td className="px-2 py-2">
          <div className="flex flex-col items-center">
            <select
              value={attempt.status}
              onChange={e => {
                const status = e.target.value;
                const currentValue = attempt.originalValue || '';
                handleAttemptChange(athlete.id, attempt.key, status === 'number' || status === 'G' ? currentValue : status, status);
              }}
              className="mb-1 p-0.5 border border-gray-300 rounded-md w-12 text-sm"
            >
              <option value="number">Number</option>
              <option value="G">G</option>
              <option value="X">X</option>
              <option value="DNS">DNS</option>
              <option value="DNF">DNF</option>
            </select>
            {attempt.status === 'number' || attempt.status === 'G' ? (
              <input
                type="number"
                maxLength="5"
                value={attempt.originalValue || ''}
                onChange={e => handleAttemptChange(athlete.id, attempt.key, e.target.value, attempt.status)}
                className={
                  `w-12 p-0.5 border border-gray-300 rounded-md text-center appearance-none text-sm ` +
                  (attempt.status === 'number' && attempt.value > 0 ? 'bg-white' :
                  attempt.status === 'G' && attempt.value > 0 ? 'bg-green-100' : '')
                }
              />
            ) : (
              <input
                type="text"
                value={attempt.status === 'X' ? (attempt.originalValue || '-') : attempt.status || '-'}
                readOnly
                className="w-12 p-0.5 border border-gray-300 rounded-md bg-red-100 text-center text-sm"
              />
            )}
          </div>
        </td>
      );
    } else {
      // Chronological order
      const attemptKey = attemptKeys[attemptIndex];
      const attempt = athlete.attempts[attemptKey];
      
      return (
        <td className="px-2 py-2">
          <div className="flex flex-col items-center">
            <select
              value={attempt?.status || 'number'}
              onChange={e => {
                const status = e.target.value;
                const currentValue = attempt?.value || '';
                handleAttemptChange(athlete.id, attemptKey, status === 'number' || status === 'G' ? currentValue : status, status);
              }}
              className="mb-1 p-0.5 border border-gray-300 rounded-md w-12 text-sm"
            >
              <option value="number">Number</option>
              <option value="G">G</option>
              <option value="X">X</option>
              <option value="DNS">DNS</option>
              <option value="DNF">DNF</option>
            </select>
            {attempt?.status === 'number' || attempt?.status === 'G' ? (
              <input
                type="number"
                maxLength="5"
                value={attempt?.value || ''}
                onChange={e => handleAttemptChange(athlete.id, attemptKey, e.target.value, attempt?.status || 'number')}
                className={
                  `w-12 p-0.5 border border-gray-300 rounded-md text-center appearance-none text-sm ` +
                  (attempt?.status === 'number' && attempt?.value && !isNaN(parseFloat(attempt?.value)) ? 'bg-white' :
                  attempt?.status === 'G' && attempt?.value && !isNaN(parseFloat(attempt?.value)) ? 'bg-green-100' : '')
                }
              />
            ) : (
              <input
                type="text"
                value={attempt?.status === 'X' ? (attempt?.value || '-') : attempt?.status || '-'}
                readOnly
                className="w-12 p-0.5 border border-gray-300 rounded-md bg-red-100 text-center text-sm"
              />
            )}
          </div>
        </td>
      );
    }
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
        border: sourceCell.border
          ? {
              top: sourceCell.border.top ? { ...sourceCell.border.top } : undefined,
              left: sourceCell.border.left ? { ...sourceCell.border.left } : undefined,
              bottom: sourceCell.border.bottom ? { ...sourceCell.border.bottom } : undefined,
              right: sourceCell.border.right ? { ...sourceCell.border.right } : undefined,
              diagonal: sourceCell.border.diagonal ? { ...sourceCell.border.diagonal } : undefined,
            }
          : undefined,
        fill: sourceCell.fill ? { ...sourceCell.fill } : undefined,
        numFmt: sourceCell.numFmt,
        protection: sourceCell.protection ? { ...sourceCell.protection } : undefined,
      };
    }
    if (sourceCell.font) targetCell.font = { ...sourceCell.font };
    if (sourceCell.alignment) targetCell.alignment = { ...sourceCell.alignment };
    if (sourceCell.border) targetCell.border = { ...sourceCell.border };
    if (sourceCell.fill) targetCell.fill = { ...sourceCell.fill };
    if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt;
    if (sourceCell.protection) targetCell.protection = { ...sourceCell.protection };
  };

  const prepareWorkbook = async (data, isAll = false, ageGroup = null) => {
    try {
      const response = await fetch('/templates/Score_Sheet.xlsx');
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const templateWorkbook = new ExcelJS.Workbook();
      await templateWorkbook.xlsx.load(arrayBuffer);
      const templateSheet = templateWorkbook.worksheets[0];

      const workbook = new ExcelJS.Workbook();
      const worksheetName = isAll ? 'All_Results' : `Session_${data[0]?.session || 'Session'}_${ageGroup || ''}`;
      const worksheet = workbook.addWorksheet(worksheetName);

      if (templateSheet.properties) worksheet.properties = { ...templateSheet.properties };
      if (templateSheet.pageSetup) worksheet.pageSetup = { ...templateSheet.pageSetup };
      if (templateSheet.headerFooter) worksheet.headerFooter = { ...templateSheet.headerFooter };
      if (templateSheet.views) worksheet.views = templateSheet.views.map((view) => ({ ...view }));

      const templateDimensions = templateSheet.dimensions;
      let maxRow = templateDimensions ? templateDimensions.bottom : 100;
      let maxCol = templateDimensions ? templateDimensions.right : 17;

      if (!templateDimensions) {
        templateSheet.eachRow((row, rowNumber) => {
          maxRow = Math.max(maxRow, rowNumber);
          row.eachCell((cell, colNumber) => {
            maxCol = Math.max(maxCol, colNumber);
          });
        });
      }

      maxRow = Math.max(maxRow, 9 + data.length - 1);

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

      for (let colNum = 1; colNum <= maxCol; colNum++) {
        const templateCol = templateSheet.getColumn(colNum);
        const newCol = worksheet.getColumn(colNum);
        if (templateCol.width) newCol.width = templateCol.width;
        if (templateCol.hidden) newCol.hidden = templateCol.hidden;
        if (templateCol.outlineLevel) newCol.outlineLevel = templateCol.outlineLevel;
      }

      if (templateSheet.model?.merges) {
        templateSheet.model.merges.forEach((merge) => worksheet.mergeCells(merge));
      }

      templateSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          if (cell.isMerged && cell.master === cell && cell.model?.merge) {
            worksheet.mergeCells(cell.model.merge);
          }
        });
      });

      const updateCell = (cellAddress, value, fillColor = null, overrideColor = null) => {
        const cell = worksheet.getCell(cellAddress);
        cell.value = value;
        cell.alignment = {
          ...cell.alignment,
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.font = {
          ...cell.font,
          color: { argb: "FF000000" },
          bold: cellAddress.startsWith('C3') || cellAddress.startsWith('D3') || 
                cellAddress.startsWith('C4') || cellAddress.startsWith('D4') || 
                cellAddress.startsWith('C5') || cellAddress.startsWith('D5') || 
                cellAddress.match(/^[A-Q]8$/) ? true : cell.font?.bold || false,
        };
        if (overrideColor) {
          cell.fill = {
            type: 'pattern',
            pattern: "solid",
            fgColor: { argb: overrideColor },
          };
        } else if (fillColor && cellAddress.charAt(0) <= 'J') {
          cell.fill = {
            type: 'pattern',
            pattern: "solid",
            fgColor: { argb: fillColor },
          };
        }
        const columnLetter = cellAddress.replace(/[0-9]/g, "");
        if (!['A', 'D', 'G', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'].includes(columnLetter)) {
          const column = worksheet.getColumn(columnLetter);
          if (value && value.toString().length > 15) {
            column.width = Math.min(50, value.toString().length + 2);
            cell.font = {
              ...cell.font,
              size: Math.max(8, 12 - Math.floor(value.toString().length / 15)),
            };
          }
        }
      };

      const applyBorders = (rowNum, startCol, endCol) => {
        for (let col = startCol; col <= endCol; col++) {
          const cell = worksheet.getCell(rowNum, col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }
      };

      updateCell("C3", competitionName);
      updateCell("D3", competitionName);
      updateCell("C4", selectedCompetition?.date || "");
      updateCell("D4", selectedCompetition?.date || "");
      updateCell("C5", selectedCompetition?.type || "");
      updateCell("D5", selectedCompetition?.type || "");

      const womenCategories = ['41kg', '45kg', '50kg', '55kg', '61kg', '67kg', '73kg', '79kg', '86kg', '+86kg'];
      const menCategories = ['49kg', '54kg', '59kg', '65kg', '72kg', '80kg', '88kg', '97kg', '107kg', '+107kg'];

      const headers = [
        'Lot No', 'Name', 'SDMS ID', 'NPC', 'DoB', 'Age Group', 'Cat.', 'Grp.', 'Body Weight',
        'Rack Height', '1', '2', '3', 'PL', 'Best Lift', 'Rank', 'Total Lift', 'Rank'
      ];
      headers.forEach((header, index) => {
        updateCell(`${String.fromCharCode(65 + index)}8`, header);
        applyBorders(8, 1, 17);
      });

      const dataToProcess = isAll ? sortAthletesByCategory(data) : data;
      dataToProcess.forEach((athlete, index) => {
        const rowNumber = 9 + index;
        const isMen = menCategories.includes(athlete.category);
        const baseFillColor = isMen ? 'FF569EEF' : 'FFFFC0CB';

        updateCell(`A${rowNumber}`, athlete.lotn || "", baseFillColor);
        updateCell(`B${rowNumber}`, athlete.name || "", baseFillColor);
        updateCell(`C${rowNumber}`, athlete.sdms || "", baseFillColor);
        updateCell(`D${rowNumber}`, athlete.team || "", baseFillColor);
        updateCell(`E${rowNumber}`, athlete.dob || "", baseFillColor);
        updateCell(`F${rowNumber}`, athlete.activeAgeGroup || athlete.ageGroup || "", baseFillColor);
        updateCell(`G${rowNumber}`, athlete.category || "", baseFillColor);
        updateCell(`H${rowNumber}`, athlete.grp || "", baseFillColor);
        updateCell(`I${rowNumber}`, athlete.bodyWeight || "", baseFillColor);
        updateCell(`J${rowNumber}`, "", baseFillColor);

        const attemptColumns = ['K', 'L', 'M', 'N'];
        const attemptKeys = ['attempt1', 'attempt2', 'attempt3', 'pl'];
        attemptKeys.forEach((key, idx) => {
          const attempt = athlete.attempts[key] || { value: '', status: 'number' };
          const value = (attempt.status === 'number' || attempt.status === 'G') ? (attempt.value || '') : 
                        (attempt.status === 'X' ? (attempt.value || '') : attempt.status);
          const cellAddress = `${attemptColumns[idx]}${rowNumber}`;
          if (attempt.status === 'DNS' || attempt.status === 'DNF' || (attempt.status === 'X' && attempt.value)) {
            updateCell(cellAddress, value, null, 'FFFF0000');
          } else if (attempt.status === 'number' && attempt.value) {
            updateCell(cellAddress, value, null, 'FFFFFFFF');
          } else if (attempt.status === 'G' && attempt.value) {
            updateCell(cellAddress, value, null, 'FF00FF00');
          } else {
            updateCell(cellAddress, value);
          }
        });

        updateCell(`O${rowNumber}`, athlete.bestLift || 0);
        updateCell(`P${rowNumber}`, athlete.bestLiftRank || 0);
        updateCell(`Q${rowNumber}`, athlete.totalLift || 0);
        updateCell(`R${rowNumber}`, athlete.totalLiftRank || 0);

        applyBorders(rowNumber, 1, 18);
      });

      ['B', 'C', 'E', 'F', 'H', 'I', 'J'].forEach((col) => {
        const column = worksheet.getColumn(col);
        column.eachCell({ includeEmpty: true }, (cell) => {
          if (cell.value) {
            const valueLength = cell.value.toString().length;
            if (valueLength > (column.width || 8)) {
              column.width = Math.min(50, Math.max(8, valueLength + 2));
            }
          }
        });
      });

      return workbook;
    } catch (e) {
      console.error('Export to Excel failed:', e);
      setError(`Failed to export to Excel: ${e.message}`);
      throw e;
    }
  };

  const exportToExcel = async (data, isAll = false) => {
    try {
      setError(null);
      setSuccess(null);
      const workbook = await prepareWorkbook(data, isAll);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isAll ? `All_Results_${selectedCompetition?.name || 'competition'}_${new Date().toISOString().split('T')[0]}.xlsx` 
                        : `Results_${data[0]?.session || 'Session'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      setSuccess(`Excel file "${a.download}" has been downloaded successfully!`);
    } catch (e) {
      console.error('Export to Excel failed:', e);
      setError(`Failed to export to Excel: ${e.message}`);
    }
  };

  const exportResultsPDF = () => {
    if (!filteredData.length) return;

    try {
      const sessionGroups = {};
      filteredData.forEach(athlete => {
        const session = athlete.session || 'All Sessions';
        if (!sessionGroups[session]) {
          sessionGroups[session] = [];
        }
        sessionGroups[session].push(athlete);
      });

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Results - ${selectedCompetition.name}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              font-size: 11px;
            }
            .page {
              page-break-after: always;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              padding: 0.5cm;
              box-sizing: border-box;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .header {
              background: #2563eb;
              color: white;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              padding: 10px;
              margin-bottom: 20px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              border: none;
              padding: 8px;
              font-size: 12px;
            }
            .info-label {
              font-weight: bold;
              width: 200px;
              background: #f8f9fa;
            }
            .info-value {
              background: white;
              border-bottom: 1px solid #ddd;
            }
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
              font-size: 11px;
            }
            .main-table th, .main-table td {
              border: 1px solid #2563eb;
              padding: 4px;
              text-align: center;
              vertical-align: middle;
            }
            .main-table th {
              background: #2563eb;
              color: white;
              font-weight: bold;
              font-size: 11px;
            }
            .header-row-1 th {
              height: 30px;
            }
            .header-row-2 th {
              height: 25px;
            }
            .col-lot { width: 40px; }
            .col-name { width: 120px; }
            .col-sdms { width: 50px; }
            .col-team { width: 50px; }
            .col-dob { width: 70px; }
            .col-age { width: 50px; }
            .col-cat { width: 50px; }
            .col-session { width: 70px; }
            .col-body { width: 50px; }
            .col-rack { width: 40px; }
            .col-attempt { width: 35px; }
            .col-best { width: 50px; }
            .col-rank { width: 40px; }
            .data-row {
              height: 25px;
            }
            .data-row td {
              font-size: 12px;
            }
            .attempt-cell {
              background: #fff;
            }
            .attempt-cell.success {
              background: #00FF00;
            }
            .attempt-cell.fail {
              background: #FF0000;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              font-size: 14px;
              font-weight: bold;
            }
            @media print {
              .page {
                page-break-after: always;
              }
              .page:last-child {
                page-break-after: auto;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
      `;

      Object.keys(sessionGroups).forEach((session, sessionIndex) => {
        const sessionAthletes = sessionGroups[session];
        htmlContent += `
          <div class="page">
            <div class="header">Results</div>
            <table class="info-table">
              <tr>
                <td class="info-label">Competition</td>
                <td class="info-value">${selectedCompetition.name}</td>
              </tr>
              <tr>
                <td class="info-label">Date</td>
                <td class="info-value">${selectedCompetition.date}</td>
              </tr>
              <tr>
                <td class="info-label">Bodyweight Category</td>
                <td class="info-value">${filters.category || 'All Categories'}</td>
              </tr>
              <tr>
                <td class="info-label">Session</td>
                <td class="info-value">${session}</td>
              </tr>
            </table>
            <table class="main-table">
              <thead>
                <tr class="header-row-1">
                  <th rowspan="2" class="col-lot">Lot No</th>
                  <th rowspan="2" class="col-name">Name</th>
                  <th rowspan="2" class="col-sdms">SDMS</th>
                  <th rowspan="2" class="col-team">Team/Club</th>
                  <th rowspan="2" class="col-dob">DoB</th>
                  <th rowspan="2" class="col-age">Age Group</th>
                  <th rowspan="2" class="col-cat">Cat.</th>
                  <th rowspan="2" class="col-session">Session</th>
                  <th rowspan="2" class="col-body">Body W</th>
                  <th rowspan="2" class="col-rack">Rack</th>
                  <th colspan="4" style="width: 140px;">Attempts</th>
                  <th rowspan="2" class="col-best">Best Lift</th>
                  <th rowspan="2" class="col-rank">Rank</th>
                  <th rowspan="2" class="col-best">Total Lift</th>
                  <th rowspan="2" class="col-rank">Rank</th>
                </tr>
                <tr class="header-row-2">
                  <th class="col-attempt">1</th>
                  <th class="col-attempt">2</th>
                  <th class="col-attempt">3</th>
                  <th class="col-attempt">PL</th>
                </tr>
              </thead>
              <tbody>
        `;

        sessionAthletes.forEach((athlete, index) => {
          htmlContent += `
            <tr class="data-row">
              <td>${athlete.lotn || (index + 1)}</td>
              <td style="text-align: left; padding-left: 6px;">${athlete.name || ""}</td>
              <td>${athlete.sdms || ""}</td>
              <td style="text-align: left; padding-left: 6px;">${athlete.team || ""}</td>
              <td>${athlete.dob || ""}</td>
              <td>${athlete.activeAgeGroup || ""}</td>
              <td>${athlete.category || ""}</td>
              <td>${athlete.session || ""}</td>
              <td>${athlete.bodyWeight ? `${athlete.bodyWeight}kg` : ""}</td>
              <td>${athlete.rack || ""}</td>
              <td class="attempt-cell ${athlete.attempts.attempt1?.status === 'number' && athlete.attempts.attempt1?.value ? '' : (athlete.attempts.attempt1?.status === 'G' && athlete.attempts.attempt1?.value ? 'success' : (athlete.attempts.attempt1?.status === 'X' || athlete.attempts.attempt1?.status === 'DNS' || athlete.attempts.attempt1?.status === 'DNF') ? 'fail' : '')}">
                ${athlete.attempts.attempt1?.status === 'number' || athlete.attempts.attempt1?.status === 'G' ? (athlete.attempts.attempt1?.value || '-') : (athlete.attempts.attempt1?.status === 'X' ? (athlete.attempts.attempt1?.value || '-') : athlete.attempts.attempt1?.status || '-')}
              </td>
              <td class="attempt-cell ${athlete.attempts.attempt2?.status === 'number' && athlete.attempts.attempt2?.value ? '' : (athlete.attempts.attempt2?.status === 'G' && athlete.attempts.attempt2?.value ? 'success' : (athlete.attempts.attempt2?.status === 'X' || athlete.attempts.attempt2?.status === 'DNS' || athlete.attempts.attempt2?.status === 'DNF') ? 'fail' : '')}">
                ${athlete.attempts.attempt2?.status === 'number' || athlete.attempts.attempt2?.status === 'G' ? (athlete.attempts.attempt2?.value || '-') : (athlete.attempts.attempt2?.status === 'X' ? (athlete.attempts.attempt2?.value || '-') : athlete.attempts.attempt2?.status || '-')}
              </td>
              <td class="attempt-cell ${athlete.attempts.attempt3?.status === 'number' && athlete.attempts.attempt3?.value ? '' : (athlete.attempts.attempt3?.status === 'G' && athlete.attempts.attempt3?.value ? 'success' : (athlete.attempts.attempt3?.status === 'X' || athlete.attempts.attempt3?.status === 'DNS' || athlete.attempts.attempt3?.status === 'DNF') ? 'fail' : '')}">
                ${athlete.attempts.attempt3?.status === 'number' || athlete.attempts.attempt3?.status === 'G' ? (athlete.attempts.attempt3?.value || '-') : (athlete.attempts.attempt3?.status === 'X' ? (athlete.attempts.attempt3?.value || '-') : athlete.attempts.attempt3?.status || '-')}
              </td>
              <td class="attempt-cell ${athlete.attempts.pl?.status === 'number' && athlete.attempts.pl?.value ? '' : (athlete.attempts.pl?.status === 'G' && athlete.attempts.pl?.value ? 'success' : (athlete.attempts.pl?.status === 'X' || athlete.attempts.pl?.status === 'DNS' || athlete.attempts.pl?.status === 'DNF') ? 'fail' : '')}">
                ${athlete.attempts.pl?.status === 'number' || athlete.attempts.pl?.status === 'G' ? (athlete.attempts.pl?.value || '-') : (athlete.attempts.pl?.status === 'X' ? (athlete.attempts.pl?.value || '-') : athlete.attempts.pl?.status || '-')}
              </td>
              <td>${athlete.bestLift || '-'}</td>
              <td>${athlete.bestLiftRank || '-'}</td>
              <td>${athlete.totalLift || '-'}</td>
              <td>${athlete.totalLiftRank || '-'}</td>
            </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
            <div class="signature-section">
              <div>
                <div>Technical Official: _________________________</div>
                <div style="margin-top: 20px;">Signature: _________________________</div>
              </div>
            </div>
          </div>
        `;
      });

      htmlContent += `
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      setError('Error generating PDF: ' + error.message);
    }
  };

  const clearPersistedData = () => {
    localStorage.removeItem('competition_attempts');
    localStorage.removeItem('competition_sessions');
    setAttempts(() => {
      const initial = {};
      athletes.forEach(a => {
        initial[a.id] = initializeAttempts(a.id, a.attempt1 || '');
      });
      return initial;
    });
    setCompetitionSessions({});
    setSuccess('Persisted data has been cleared.');
  };

  if (!selectedCompetition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No competition selected</h3>
            <p className="text-gray-600">Please select a competition to view results</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Competition Results</h1>
            <p className="text-gray-600">Manage results for {selectedCompetition.name}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportResultsPDF}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Download size={20} />
              Export PDF
            </button>
            <button
              onClick={() => exportToExcel(filteredData, true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Download size={20} />
              Export Excel
            </button>
            <button
              onClick={clearPersistedData}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              Clear Data
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Competition Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Results</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Competition</p>
                <p className="font-semibold">{selectedCompetition.name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{selectedCompetition.date}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Athletes</p>
                <p className="font-semibold">{filteredAthletes.length}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Scale className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="font-semibold">{sessions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
              <select
                value={filters.session}
                onChange={(e) => setFilters(prev => ({ ...prev, session: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sessions</option>
                {sessions.map(session => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
              <select
                value={filters.ageGroup}
                onChange={(e) => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Age Groups</option>
                {ageGroups.map(ageGroup => (
                  <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Attempts</label>
              <button
                onClick={() => setSortAttemptsBy(prev => prev === 'weight' ? 'chronological' : 'weight')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpDown size={16} />
                {sortAttemptsBy === 'weight' ? 'By Weight (Low→High)' : 'Chronological (1→PL)'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Results - {filters.session || 'All Sessions'} {filters.category || 'All Categories'} {filters.ageGroup || 'All Age Groups'}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Attempts: {sortAttemptsBy === 'weight' ? 'Sorted by Weight' : 'Chronological Order'}
                </span>
                <span className="text-sm text-gray-600">
                  {filteredData.length} athletes
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Lot No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">SDMS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Team/Club</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">DoB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Age Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Body W</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rack</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" colSpan="4">
                    Attempts {sortAttemptsBy === 'weight' ? '(Low→High)' : '(1→PL)'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Best Lift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total Lift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rank</th>
                </tr>
                <tr className="bg-blue-600">
                  <th colSpan="10"></th>
                  {sortAttemptsBy === 'weight' ? (
                    <>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">L1</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">L2</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">L3</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">L4</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">1</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">2</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">3</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-white">PL</th>
                    </>
                  )}
                  <th colSpan="4"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortAthletesByCategory(filteredData).map((athlete, index) => {
                  const isMen = ['49kg', '54kg', '59kg', '65kg', '72kg', '80kg', '88kg', '97kg', '107kg', '+107kg'].includes(athlete.category);
                  const rowColor = isMen ? 'bg-blue-50' : 'bg-pink-50';
                  return (
                    <tr key={`${athlete.id}-${athlete.activeAgeGroup}`} className={`hover:bg-gray-100 ${rowColor}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.lotn || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{athlete.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.sdms || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.team || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.dob || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.activeAgeGroup || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.category || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.session || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.bodyWeight ? `${athlete.bodyWeight}kg` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.rack || '-'}</td>
                      {[0, 1, 2, 3].map(attemptIndex => renderAttemptCell(athlete, attemptIndex))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.bestLift || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.bestLiftRank || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.totalLift || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{athlete.totalLiftRank || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No athletes found</h3>
            <p className="text-gray-600">No athletes match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;