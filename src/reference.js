export function initReference() {
  const referenceBody = document.getElementById('reference-body');
  const referenceBtn = document.getElementById('reference-btn');
  const referenceModal = document.getElementById('reference-modal');
  const closeBtn = document.getElementById('close-reference-modal');
  
  if (!referenceBody || !referenceBtn || !referenceModal || !closeBtn) return;
  
  referenceBody.innerHTML = `
    <div class="reference-sheet">
      <div class="formulas-section">
        <div class="formula-group">
          <svg width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/><line x1="50" y1="50" x2="90" y2="50" stroke="black" stroke-width="2"/><text x="65" y="45" font-family="serif" font-style="italic">r</text></svg>
          <div class="math-text">A = &pi;r&sup2;<br>C = 2&pi;r</div>
        </div>
        <div class="formula-group">
          <svg width="80" height="50" viewBox="0 0 100 60"><rect x="10" y="10" width="80" height="40" fill="none" stroke="black" stroke-width="2"/><text x="45" y="65" font-family="serif" font-style="italic">l</text><text x="95" y="35" font-family="serif" font-style="italic">w</text></svg>
          <div class="math-text">A = lw</div>
        </div>
        <div class="formula-group">
          <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="10,90 90,90 50,10" fill="none" stroke="black" stroke-width="2"/><line x1="50" y1="10" x2="50" y2="90" stroke="black" stroke-dasharray="4"/><text x="40" y="55" font-family="serif" font-style="italic">h</text><text x="70" y="95" font-family="serif" font-style="italic">b</text><rect x="50" y="80" width="10" height="10" fill="none" stroke="black"/></svg>
          <div class="math-text">A = &frac12;bh</div>
        </div>
        <div class="formula-group">
          <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="10,90 90,90 90,10" fill="none" stroke="black" stroke-width="2"/><text x="40" y="95" font-family="serif" font-style="italic">a</text><text x="95" y="55" font-family="serif" font-style="italic">b</text><text x="40" y="40" font-family="serif" font-style="italic">c</text><rect x="80" y="80" width="10" height="10" fill="none" stroke="black"/></svg>
          <div class="math-text">a&sup2; + b&sup2; = c&sup2;</div>
        </div>
      </div>
      <div class="formulas-section special-triangles">
        <h4 style="text-align: center; margin-bottom: 10px;">Special Right Triangles</h4>
        <div style="display: flex; justify-content: space-around; align-items: center;">
          <div class="formula-group" style="flex-direction: column;">
            <svg width="80" height="80" viewBox="0 0 100 100"><polygon points="10,90 90,90 10,40" fill="none" stroke="black" stroke-width="2"/><rect x="10" y="80" width="10" height="10" fill="none" stroke="black"/><text x="25" y="85">60&deg;</text><text x="15" y="55">30&deg;</text><text x="40" y="100" font-family="serif" font-style="italic">x</text><text x="50" y="55" font-family="serif" font-style="italic">2x</text><text x="2" y="65" font-family="serif" font-style="italic">x&radic;3</text></svg>
          </div>
          <div class="formula-group" style="flex-direction: column;">
            <svg width="80" height="80" viewBox="0 0 100 100"><polygon points="10,90 90,90 10,10" fill="none" stroke="black" stroke-width="2"/><rect x="10" y="80" width="10" height="10" fill="none" stroke="black"/><text x="25" y="85">45&deg;</text><text x="15" y="35">45&deg;</text><text x="45" y="100" font-family="serif" font-style="italic">s</text><text x="50" y="45" font-family="serif" font-style="italic">s&radic;2</text><text x="0" y="55" font-family="serif" font-style="italic">s</text></svg>
          </div>
        </div>
      </div>
      <div class="formulas-section volume-section">
        <div class="formula-group">
          <div class="math-text">V = &lwh</div>
          <div class="math-subtext">Rectangular Prism</div>
        </div>
        <div class="formula-group">
          <div class="math-text">V = &pi;r&sup2;h</div>
          <div class="math-subtext">Cylinder</div>
        </div>
        <div class="formula-group">
          <div class="math-text">V = &frac43;&pi;r&sup3;</div>
          <div class="math-subtext">Sphere</div>
        </div>
        <div class="formula-group">
          <div class="math-text">V = &frac13;&pi;r&sup2;h</div>
          <div class="math-subtext">Cone</div>
        </div>
        <div class="formula-group">
          <div class="math-text">V = &frac13;lwh</div>
          <div class="math-subtext">Pyramid</div>
        </div>
      </div>
      <div class="formulas-notes" style="margin-top: 15px; font-size: 14px; line-height: 1.5;">
        <p>The number of degrees of arc in a circle is 360.</p>
        <p>The number of radians of arc in a circle is 2&pi;.</p>
        <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
      </div>
    </div>
  `;
  
  referenceBtn.addEventListener('click', () => {
    referenceModal.style.display = 'flex';
  });
  
  closeBtn.addEventListener('click', () => {
    referenceModal.style.display = 'none';
  });
  
  // Close on background click
  referenceModal.addEventListener('click', (e) => {
    if (e.target === referenceModal) {
      referenceModal.style.display = 'none';
    }
  });
}
