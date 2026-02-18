// Five unique SVG satellites that float around the globe in the research slide

const satellites = [
  {
    cls: 'fsat-1',
    style: { top: '8%', left: '4%', '--fdur': '7s', '--fr': '-12deg', '--frt': '4deg', '--fglow': 'rgba(79,143,255,0.95)', '--fscale': '1.9' },
    svg: (
      <svg width="90" height="70" viewBox="0 0 90 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="28" width="26" height="14" rx="2" fill="rgba(50,120,230,1)" stroke="rgba(140,200,255,0.95)" strokeWidth="1"/>
        <line x1="8" y1="28" x2="8" y2="42" stroke="rgba(120,200,255,0.5)" strokeWidth="0.7"/>
        <line x1="15" y1="28" x2="15" y2="42" stroke="rgba(120,200,255,0.5)" strokeWidth="0.7"/>
        <line x1="22" y1="28" x2="22" y2="42" stroke="rgba(120,200,255,0.5)" strokeWidth="0.7"/>
        <rect x="28" y="33" width="10" height="3" rx="1" fill="rgba(180,210,255,0.7)"/>
        <rect x="38" y="26" width="14" height="18" rx="3" fill="rgba(30,60,180,1)" stroke="rgba(120,190,255,0.9)" strokeWidth="1.2"/>
        <rect x="40" y="29" width="10" height="5" rx="1" fill="rgba(80,150,255,0.9)"/>
        <circle cx="45" cy="39" r="2.5" fill="rgba(120,200,255,0.9)"/>
        <rect x="52" y="33" width="10" height="3" rx="1" fill="rgba(180,210,255,0.7)"/>
        <rect x="62" y="28" width="26" height="14" rx="2" fill="rgba(50,120,230,1)" stroke="rgba(140,200,255,0.95)" strokeWidth="1"/>
        <line x1="68" y1="28" x2="68" y2="42" stroke="rgba(120,200,255,0.5)" strokeWidth="0.7"/>
        <line x1="75" y1="28" x2="75" y2="42" stroke="rgba(120,200,255,0.5)" strokeWidth="0.7"/>
        <line x1="82" y1="28" x2="82" y2="42" stroke="rgba(120,200,255,0.5)" strokeWidth="0.7"/>
        <ellipse cx="45" cy="20" rx="7" ry="4" fill="none" stroke="rgba(150,210,255,0.8)" strokeWidth="1"/>
        <line x1="45" y1="20" x2="45" y2="26" stroke="rgba(150,210,255,0.7)" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    cls: 'fsat-2',
    style: { top: '5%', right: '20%', '--fdur': '5.5s', '--fr': '8deg', '--frt': '22deg', '--fglow': 'rgba(56,217,169,0.95)', '--fscale': '1.7' },
    svg: (
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="21" width="20" height="12" rx="2" fill="rgba(18,160,110,1)" stroke="rgba(56,217,169,1)" strokeWidth="0.8"/>
        <line x1="7" y1="21" x2="7" y2="33" stroke="rgba(56,217,169,0.45)" strokeWidth="0.7"/>
        <line x1="14" y1="21" x2="14" y2="33" stroke="rgba(56,217,169,0.45)" strokeWidth="0.7"/>
        <rect x="21" y="25" width="8" height="2.5" rx="1" fill="rgba(100,240,200,0.7)"/>
        <rect x="29" y="19" width="14" height="16" rx="3" fill="rgba(8,90,65,1)" stroke="rgba(56,217,169,1)" strokeWidth="1.3"/>
        <rect x="31" y="22" width="10" height="4" rx="1" fill="rgba(30,160,110,0.7)"/>
        <circle cx="36" cy="31" r="2" fill="rgba(80,240,180,0.9)"/>
        <rect x="43" y="25" width="8" height="2.5" rx="1" fill="rgba(100,240,200,0.7)"/>
        <rect x="51" y="21" width="20" height="12" rx="2" fill="rgba(18,160,110,1)" stroke="rgba(56,217,169,1)" strokeWidth="0.8"/>
        <line x1="57" y1="21" x2="57" y2="33" stroke="rgba(56,217,169,0.45)" strokeWidth="0.7"/>
        <line x1="64" y1="21" x2="64" y2="33" stroke="rgba(56,217,169,0.45)" strokeWidth="0.7"/>
        <ellipse cx="36" cy="13" rx="5" ry="3" fill="none" stroke="rgba(100,240,180,0.8)" strokeWidth="1"/>
        <line x1="36" y1="13" x2="36" y2="19" stroke="rgba(100,240,180,0.7)" strokeWidth="0.9"/>
      </svg>
    ),
  },
  {
    cls: 'fsat-3',
    style: { top: '15%', right: '3%', '--fdur': '9s', '--fr': '-5deg', '--frt': '10deg', '--fglow': 'rgba(167,139,250,0.95)', '--fscale': '2.0' },
    svg: (
      <svg width="100" height="64" viewBox="0 0 100 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="18" width="16" height="10" rx="1.5" fill="rgba(90,30,160,1)" stroke="rgba(190,160,255,1)" strokeWidth="1"/>
        <line x1="6" y1="18" x2="6" y2="28" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <line x1="11" y1="18" x2="11" y2="28" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <rect x="1" y="32" width="16" height="10" rx="1.5" fill="rgba(80,30,140,0.85)" stroke="rgba(167,139,250,0.6)" strokeWidth="0.8"/>
        <line x1="6" y1="32" x2="6" y2="42" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <line x1="11" y1="32" x2="11" y2="42" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <rect x="17" y="27" width="66" height="4" rx="1" fill="rgba(150,130,200,0.6)"/>
        <rect x="30" y="22" width="14" height="18" rx="4" fill="rgba(55,20,110,1)" stroke="rgba(167,139,250,1)" strokeWidth="1.2"/>
        <rect x="47" y="20" width="16" height="22" rx="4" fill="rgba(55,20,110,1)" stroke="rgba(167,139,250,1)" strokeWidth="1.2"/>
        <rect x="32" y="25" width="10" height="4" rx="1" fill="rgba(120,80,220,0.6)"/>
        <rect x="83" y="18" width="16" height="10" rx="1.5" fill="rgba(80,30,140,0.85)" stroke="rgba(167,139,250,0.6)" strokeWidth="0.8"/>
        <line x1="88" y1="18" x2="88" y2="28" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <line x1="93" y1="18" x2="93" y2="28" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <rect x="83" y="32" width="16" height="10" rx="1.5" fill="rgba(80,30,140,0.85)" stroke="rgba(167,139,250,0.6)" strokeWidth="0.8"/>
        <line x1="88" y1="32" x2="88" y2="42" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <line x1="93" y1="32" x2="93" y2="42" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6"/>
        <circle cx="55" cy="14" r="3" fill="rgba(180,150,255,0.8)" stroke="rgba(200,180,255,0.6)" strokeWidth="0.8"/>
        <line x1="55" y1="14" x2="55" y2="20" stroke="rgba(180,150,255,0.6)" strokeWidth="0.8"/>
      </svg>
    ),
  },
  {
    cls: 'fsat-4',
    style: { top: '27%', left: '19%', '--fdur': '4.5s', '--fr': '15deg', '--frt': '-5deg', '--fglow': 'rgba(255,180,80,0.95)', '--fscale': '1.6' },
    svg: (
      <svg width="54" height="44" viewBox="0 0 54 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="16" width="14" height="10" rx="1.5" fill="rgba(140,80,10,0.85)" stroke="rgba(196,122,53,0.7)" strokeWidth="0.8"/>
        <line x1="5" y1="16" x2="5" y2="26" stroke="rgba(220,160,80,0.5)" strokeWidth="0.6"/>
        <line x1="10" y1="16" x2="10" y2="26" stroke="rgba(220,160,80,0.5)" strokeWidth="0.6"/>
        <rect x="15" y="19" width="6" height="2" rx="0.8" fill="rgba(220,160,80,0.7)"/>
        <rect x="21" y="14" width="12" height="14" rx="2" fill="rgba(90,45,8,1)" stroke="rgba(220,140,60,1)" strokeWidth="1.3"/>
        <rect x="23" y="17" width="8" height="4" rx="1" fill="rgba(160,90,20,0.7)"/>
        <circle cx="27" cy="26" r="1.8" fill="rgba(240,180,80,0.9)"/>
        <rect x="33" y="19" width="6" height="2" rx="0.8" fill="rgba(220,160,80,0.7)"/>
        <rect x="39" y="16" width="14" height="10" rx="1.5" fill="rgba(140,80,10,0.85)" stroke="rgba(196,122,53,0.7)" strokeWidth="0.8"/>
        <line x1="43" y1="16" x2="43" y2="26" stroke="rgba(220,160,80,0.5)" strokeWidth="0.6"/>
        <line x1="49" y1="16" x2="49" y2="26" stroke="rgba(220,160,80,0.5)" strokeWidth="0.6"/>
        <line x1="27" y1="14" x2="27" y2="8" stroke="rgba(240,180,80,0.7)" strokeWidth="0.8"/>
        <circle cx="27" cy="7" r="1.2" fill="rgba(240,180,80,0.8)"/>
      </svg>
    ),
  },
  {
    cls: 'fsat-5',
    style: { bottom: '28%', right: '13%', '--fdur': '8s', '--fr': '-8deg', '--frt': '12deg', '--fglow': 'rgba(192,84,184,0.95)', '--fscale': '1.8' },
    svg: (
      <svg width="78" height="58" viewBox="0 0 78 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="22" width="22" height="12" rx="2" fill="rgba(120,20,110,0.85)" stroke="rgba(192,84,184,0.65)" strokeWidth="0.8"/>
        <line x1="7" y1="22" x2="7" y2="34" stroke="rgba(210,100,200,0.45)" strokeWidth="0.6"/>
        <line x1="14" y1="22" x2="14" y2="34" stroke="rgba(210,100,200,0.45)" strokeWidth="0.6"/>
        <line x1="19" y1="22" x2="19" y2="34" stroke="rgba(210,100,200,0.45)" strokeWidth="0.6"/>
        <rect x="23" y="26" width="8" height="2.5" rx="1" fill="rgba(200,120,190,0.7)"/>
        <rect x="31" y="18" width="16" height="20" rx="3" fill="rgba(80,10,75,1)" stroke="rgba(220,100,210,1)" strokeWidth="1.3"/>
        <rect x="33" y="21" width="12" height="5" rx="1" fill="rgba(140,40,130,0.7)"/>
        <ellipse cx="39" cy="33" rx="4" ry="3" fill="rgba(200,80,190,0.5)" stroke="rgba(220,120,210,0.6)" strokeWidth="0.7"/>
        <rect x="47" y="26" width="8" height="2.5" rx="1" fill="rgba(200,120,190,0.7)"/>
        <rect x="55" y="22" width="22" height="12" rx="2" fill="rgba(120,20,110,0.85)" stroke="rgba(192,84,184,0.65)" strokeWidth="0.8"/>
        <line x1="61" y1="22" x2="61" y2="34" stroke="rgba(210,100,200,0.45)" strokeWidth="0.6"/>
        <line x1="68" y1="22" x2="68" y2="34" stroke="rgba(210,100,200,0.45)" strokeWidth="0.6"/>
        <line x1="73" y1="22" x2="73" y2="34" stroke="rgba(210,100,200,0.45)" strokeWidth="0.6"/>
        <ellipse cx="39" cy="11" rx="6" ry="3.5" fill="none" stroke="rgba(220,120,210,0.8)" strokeWidth="1"/>
        <line x1="39" y1="11" x2="39" y2="18" stroke="rgba(220,120,210,0.7)" strokeWidth="0.9"/>
        <circle cx="39" cy="10" r="1.2" fill="rgba(240,140,230,0.9)"/>
      </svg>
    ),
  },
];

export default function FloatingSatellites() {
  return (
    <>
      {satellites.map((sat) => (
        <div key={sat.cls} className="fsat" style={sat.style}>
          {sat.svg}
        </div>
      ))}
    </>
  );
}
