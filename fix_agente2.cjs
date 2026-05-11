const fs = require("fs");
const filePath = "C:\\Users\\carol\\Documents\\omnicrm\\src\\pages\\ClientWorkspace.tsx";
let src = fs.readFileSync(filePath, "utf8");

const hasCRLF = src.includes("\r\n");
if (hasCRLF) src = src.replace(/\r\n/g, "\n");

// Remove the third duplicate Agente block + orphaned )}
// Start: blank line + {/* Agente Autonomo */} at 22 spaces (after the new good block)
// End: orphaned )} at 20 spaces
const removeStart = "\n\n                      {/* Agente Autonomo */}";
const removeEnd   = "\n                    )}";

const startIdx = src.indexOf(removeStart);
if (startIdx < 0) { console.error("start not found"); process.exit(1); }

// Find the end AFTER the start
const endIdx = src.indexOf(removeEnd, startIdx);
if (endIdx < 0) { console.error("end not found"); process.exit(1); }

const endIdxFull = endIdx + removeEnd.length;

console.log("Removing from index", startIdx, "to", endIdxFull);
console.log("Removing:", JSON.stringify(src.substring(startIdx, endIdxFull)));

src = src.substring(0, startIdx) + src.substring(endIdxFull);

if (hasCRLF) src = src.replace(/\n/g, "\r\n");
fs.writeFileSync(filePath, src, "utf8");
console.log("Done!");
