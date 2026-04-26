/**
 * Generates a high-resolution certificate image using the Canvas API.
 * This avoids the issues with html2canvas and modern CSS.
 */
export async function generateCertificateCanvas(certificate: any) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // High resolution: 2000x1414 (A4 Landscape aspect ratio)
    canvas.width = 2000;
    canvas.height = 1414;

    const { width, height } = canvas;

    // 1. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. Outer Border (20px equivalent at 2000px width)
    const outerBorderWidth = 40;
    ctx.lineWidth = outerBorderWidth;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(outerBorderWidth / 2, outerBorderWidth / 2, width - outerBorderWidth, height - outerBorderWidth);

    // 3. Inner Border (f1f5f9)
    const innerBorderMargin = 60;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f1f5f9';
    ctx.strokeRect(innerBorderMargin, innerBorderMargin, width - innerBorderMargin * 2, height - innerBorderMargin * 2);

    // 4. Decorative Corners
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.1)'; // Teal
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(innerBorderMargin, innerBorderMargin + 200);
    ctx.lineTo(innerBorderMargin, innerBorderMargin);
    ctx.lineTo(innerBorderMargin + 200, innerBorderMargin);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)'; // Purple
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - innerBorderMargin, height - innerBorderMargin - 200);
    ctx.lineTo(width - innerBorderMargin, height - innerBorderMargin);
    ctx.lineTo(width - innerBorderMargin - 200, height - innerBorderMargin);
    ctx.stroke();

    // 5. Aivra Logo
    // Draw gradient square
    const logoSize = 80;
    const logoX = width / 2 - 120;
    const logoY = 180;
    const gradient = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
    gradient.addColorStop(0, '#2dd4bf');
    gradient.addColorStop(1, '#a855f7');
    
    ctx.fillStyle = gradient;
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 20, true, false);

    // Draw Sparkles (Simplified)
    ctx.fillStyle = '#ffffff';
    ctx.font = '50px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', logoX + logoSize / 2, logoY + logoSize / 2);

    // Logo Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Aivra', logoX + logoSize + 20, logoY + logoSize / 2 + 10);

    // 6. Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 500 80px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', width / 2, 400);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 30px sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('THIS IS TO CERTIFY THAT', width / 2, 480);
    ctx.letterSpacing = '0px';

    // 7. Student Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText(certificate.userName || 'Valued Student', width / 2, 620);

    // Underline for name
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e2e8f0';
    const nameWidth = ctx.measureText(certificate.userName || 'Valued Student').width;
    ctx.beginPath();
    ctx.moveTo(width / 2 - nameWidth / 2 - 40, 650);
    ctx.lineTo(width / 2 + nameWidth / 2 + 40, 650);
    ctx.stroke();

    // 8. Course Context
    ctx.fillStyle = '#475569';
    ctx.font = '30px sans-serif';
    ctx.fillText('has successfully completed the official course', width / 2, 740);

    // Course Title
    ctx.fillStyle = '#2563eb';
    ctx.font = '900 60px sans-serif';
    const courseTitle = certificate.title?.replace('Course Completion: ', '') || 'Academic Excellence';
    ctx.fillText(courseTitle, width / 2, 830);

    // 9. Skills
    if (certificate.skills) {
        const skillsY = 950;
        ctx.fillStyle = '#f8fafc';
        const skillsWidth = 800;
        roundRect(ctx, width / 2 - skillsWidth / 2, skillsY - 50, skillsWidth, 100, 20, true, true);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('KEY SKILLS MASTERED', width / 2, skillsY - 15);
        ctx.letterSpacing = '0px';

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(certificate.skills, width / 2, skillsY + 25);
    }

    // 10. Footer Section
    const footerY = 1200;
    
    // Date
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText(getFormattedDate(certificate.issued_at), 400, footerY);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(250, footerY + 20);
    ctx.lineTo(550, footerY + 20);
    ctx.stroke();
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('DATE ISSUED', 400, footerY + 50);

    // Signature
    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 70px cursive'; // Fallback for Brush Script MT
    if (document.fonts.check('70px "Brush Script MT"')) {
        ctx.font = '70px "Brush Script MT"';
    }
    ctx.fillText(certificate.instructorName || 'Lead Instructor', width - 400, footerY - 20);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(width - 550, footerY + 20);
    ctx.lineTo(width - 250, footerY + 20);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(certificate.instructorName || 'Lead Instructor', width - 400, footerY + 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(certificate.designation?.toUpperCase() || 'AIVRA ACADEMY', width - 400, footerY + 80);

    // 11. Verification ID
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.globalAlpha = 0.4;
    ctx.fillText(`VERIFIED CERTIFICATE ID: ${certificate.id?.substring(0, 8).toUpperCase() || 'VAL-001'}`, width / 2, height - 100);
    ctx.globalAlpha = 1.0;

    return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function getFormattedDate(issuedAt: any) {
    if (!issuedAt) return 'Unknown Date';
    const date = new Date(issuedAt._seconds ? issuedAt._seconds * 1000 : issuedAt);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
