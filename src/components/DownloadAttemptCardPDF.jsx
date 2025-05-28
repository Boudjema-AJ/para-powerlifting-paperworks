import React from 'react';
import { PDFDocument } from 'pdf-lib';

const DownloadAttemptCardPDF = ({ athletes }) => {
  const generatePDF = async () => {
    try {
      // Debug: Test if the PDF is accessible
      const response = await fetch('/template/attempt_card_template.pdf');
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      const pdfBytes = await response.arrayBuffer();
      const testDoc = await PDFDocument.load(pdfBytes); // Test load
      console.log('PDF loaded successfully:', testDoc.getPageCount(), 'pages');

      // Group athletes by session (assuming 'session' field)
      const sessions = {};
      athletes.forEach(athlete => {
        const session = athlete.session || 'DefaultSession'; // Fallback if session is undefined
        if (!sessions[session]) sessions[session] = [];
        sessions[session].push(athlete);
      });

      // Generate one PDF per session
      for (const session of Object.keys(sessions)) {
        const sessionAthletes = sessions[session];
        const pdfDoc = await PDFDocument.create();

        // Process each athlete (one per page for now)
        for (const athlete of sessionAthletes) {
          const pdfBytes = await fetch('/template/attempt_card_template.pdf').then(res => {
            if (!res.ok) throw new Error('Template not found');
            return res.arrayBuffer();
          });
          const templateDoc = await PDFDocument.load(pdfBytes);
          const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
          pdfDoc.addPage(templatePage);

          // Fill form fields (assumed field names)
          const form = pdfDoc.getForm();
          form.getTextField('Name').setText(athlete.nom || '');
          form.getTextField('NPC').setText(athlete.npc || '');
          form.getTextField('DateOfBirth').setText(athlete.dateOfBirth || '');
          form.getTextField('BodyWeight').setText(athlete.poids || '');
          form.getTextField('RackHeight').setText(athlete.rackHeight || '');
          form.getTextField('AgeGroup').setText(athlete.ageGroup || '');
          form.getTextField('Attempt1').setText(athlete.attempt1 || '');
          form.getTextField('Attempt2').setText(athlete.attempt2 || '');
          form.getTextField('Attempt3').setText(athlete.attempt3 || '');
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `athlete-cards-${session}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}. Check console for details.`);
    }
  };

  return (
    <button onClick={generatePDF}>Download Athlete Cards</button>
  );
};

export default DownloadAttemptCardPDF;