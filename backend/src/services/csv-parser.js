const fs = require('fs');

const csvFile = "C:/MIRZA/Downloads/TRAI Citizen Hub (3)/employee(5).xlsx - employee(5).xls.csv";
const lines = fs.readFileSync(csvFile, 'utf8').split('\n');

const users = [];

// Skip header
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Basic CSV split handling (not perfect if commas in quotes, but the dataset is simple)
  const parts = line.split(',');
  if (parts.length < 9) continue;
  
  let [name, designation, division, ext, mobile, email, dob, status, id, location] = parts;
  
  if (status !== 'Current') continue;
  if (!id) id = `TRAI-GEN-${i}`;
  if (!email) email = `${id.toLowerCase()}@trai.gov.in`;
  if (!division) division = 'ALL';
  
  let role = "USER";
  let subRole = null;
  let rank = 7;
  
  const des = (designation || "").toLowerCase();
  
  // 1 - Adv / Pr. Advisor / Member / Chairman / Secretary
  if (des.includes("chairman") || des.includes("member") || des.includes("advisor") && !des.includes("jt") && !des.includes("dy") || des.includes("secy") || des.includes("secretary")) {
      rank = 1; role = "ADMIN"; subRole = "Adv";
  } 
  // 2 - JAdv
  else if (des.includes("jt advisor") || des.includes("jt. advisor")) {
      rank = 2; role = "L3"; subRole = "J.Adv";
  } 
  // 3 - DAdv
  else if (des.includes("dy advisor") || des.includes("dy. advisor")) {
      rank = 3; role = "L3"; subRole = "D.Adv";
  } 
  // 4 - SRO
  else if (des.includes("sro")) {
      rank = 4; role = "L3"; subRole = "SRO";
  } 
  // 5 - TO
  else if (des === "to") {
      rank = 5; role = "L3"; subRole = "TO";
  } 
  // 6 - SO
  else if (des === "so") {
      rank = 6; role = "L3"; subRole = "SO";
  } 
  // 8 - L2 Developers
  else if (des.includes("developer") || des.includes("analyst") || des.includes("system engineer") || des.includes("desktop support") || des.includes("project") || des.includes("facilitator")) {
      rank = 8; role = "L2"; subRole = "Developer";
  } 
  // 9 - L2 Infra
  else if (des.includes("server") || des.includes("cloud")) {
      rank = 9; role = "L2"; subRole = "Infra";
  } 
  // 10 - L2 Network
  else if (des.includes("network")) {
      rank = 10; role = "L2"; subRole = "Network";
  } 
  // 7 - Others (Assistant, PA, PS, LDC, Attendant, Consultants, Drivers, YP, RA, etc.)
  else {
      rank = 7; role = "USER"; subRole = null;
  }
  
  // Make sure admin gets ALL division
  if (role === "ADMIN") {
      division = "ALL";
  }
  
  users.push({
    empId: id,
    name,
    email: email.toLowerCase(),
    role,
    subRole,
    division,
    designation,
    floor: "N/A",
    orderRank: rank,
    mustChangePassword: true,
    isActive: true
  });
}

fs.writeFileSync("C:/MIRZA/Downloads/TRAI Citizen Hub (3)/backend/src/services/employees.json", JSON.stringify(users, null, 2));
console.log(`Parsed ${users.length} current users successfully!`);
