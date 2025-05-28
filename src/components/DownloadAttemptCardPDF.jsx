import React from 'react';
import html2pdf from 'html2pdf.js';

const DownloadAttemptCardPDF = ({ athletes = [] }) => {
  const generatePDF = () => {
    console.log('Generate PDF clicked');
    console.log('Athletes:', athletes);

    // Check if athletes is valid
    if (!Array.isArray(athletes) || athletes.length === 0) {
      console.error('No athletes data provided or invalid data');
      alert('No athletes data available to generate PDF. Please ensure athletes are loaded.');
      return;
    }

    const cardsPerPage = 4;
    const pageWidth = 210;
    const pageHeight = 297;
    const cardWidth = pageWidth / 2;
    const cardHeight = pageHeight / 2;

    // Group athletes by session
    const sessions = {};
    athletes.forEach(athlete => {
      const session = athlete.session || 'DefaultSession';
      if (!sessions[session]) sessions[session] = [];
      sessions[session].push(athlete);
    });

    console.log('Sessions:', sessions);

    if (Object.keys(sessions).length === 0) {
      console.error('No sessions to process');
      alert('No sessions available to generate PDF.');
      return;
    }

    Object.keys(sessions).forEach(session => {
      console.log(`Processing session: ${session}`);
      const sessionAthletes = sessions[session];
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.width = `${pageWidth}mm`;
      container.style.height = `${pageHeight}mm`;

      sessionAthletes.forEach((athlete, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const card = document.createElement('div');
        card.style.position = 'absolute';
        card.style.left = `${col * cardWidth}mm`;
        card.style.top = `${row * cardHeight}mm`;
        card.style.width = `${cardWidth}mm`;
        card.style.height = `${cardHeight}mm`;
        card.style.border = '1px solid black';
        card.style.boxSizing = 'border-box';
        card.style.padding = '5mm';
        card.style.fontSize = '10px';
        card.innerHTML = `
          <h3>Attempt Card</h3>
          <p>Lot No: ${athlete.lotNo || ''}</p>
          <p>Name: ${athlete.nom || ''}</p>
          <p>NPC: ${athlete.npc || ''}</p>
          <p>Date of Birth: ${athlete.dateOfBirth || ''}</p>
          <p>Cat./Grp.: ${athlete.category || ''}</p>
          <p>Body Weight: ${athlete.poids || ''}</p>
          <p>Rack Height: ${athlete.rackHeight || ''}</p>
          <p>Age Group: ${athlete.ageGroup || ''}</p>
          <p>1st Attempt: ${athlete.attempt1 || ''}</p>
          <p>2nd Attempt: ${athlete.attempt2 || ''}</p>
          <p>3rd Attempt: ${athlete.attempt3 || ''}</p>
        `;
        container.appendChild(card);
      });

      document.body.appendChild(container);
      console.log('Container created with cards:', container.children.length);

      const opt = {
        margin: 0,
        filename: `athlete-cards-${session}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      html2pdf().set(opt).from(container).save().then(() => {
        console.log(`PDF generated for session: ${session}`);
        document.body.removeChild(container);
      }).catch(error => {
        console.error(`Error generating PDF for session ${session}:`, error);
        alert(`Failed to generate PDF for session ${session}. Check console for details.`);
        document.body.removeChild(container);
      });
    });
  };

  return (
    <button onClick={generatePDF}>Download Athlete Cards</button>
  );
};

export default DownloadAttemptCardPDF;